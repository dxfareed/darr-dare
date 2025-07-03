/* eslint-disable */

'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import {
  DEGEN_TOKEN_ADDRESS,
  DEGEN_TOKEN_ABI,
  DEGEN_TOKEN_DECIMALS,
  DARR_CONTRACT_ADDRESS,
  DARR_ABI,
} from '@/lib/constants';
import { useDebounce } from 'use-debounce';

const PRIZE_AMOUNT = 100; // 100 $DEGEN prize

export function CreateDareView() {
  const { address } = useAccount();
  // We use Wagmi's writeContract and useWaitForTransactionReceipt for the entire flow
  const { data: hash, writeContract, isPending: isWritePending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const [targetUsername, setTargetUsername] = useState('');
  const [debouncedUsername] = useDebounce(targetUsername, 500);
  const [targetAddress, setTargetAddress] = useState<`0x${string}` | null>(null);
  const [description, setDescription] = useState('');
  const [isResolvingUser, setIsResolvingUser] = useState(false);
  const [userNotFoundError, setUserNotFoundError] = useState('');
  const [txStep, setTxStep] = useState<'idle' | 'approving' | 'creating'>('idle');

  // Check allowance
  const { data: allowance, refetch } = useReadContract({
    address: DEGEN_TOKEN_ADDRESS,
    abi: DEGEN_TOKEN_ABI,
    functionName: 'allowance',
    args: [address!, DARR_CONTRACT_ADDRESS],
    query: { enabled: !!address },
  });
  //@ts-ignore
  const hasSufficientAllowance = allowance ? allowance >= parseUnits(PRIZE_AMOUNT.toString(), DEGEN_TOKEN_DECIMALS) : false;

  // Refetch allowance after a transaction is confirmed
  useEffect(() => {
    if (isConfirmed && txStep === 'approving') {
      refetch();
      setTxStep('idle');
    }
  }, [isConfirmed, txStep, refetch]);

  // Handle User Resolution
  useEffect(() => {
    if (debouncedUsername) {
      setIsResolvingUser(true);
      setUserNotFoundError('');
      fetch(`/api/resolve-user?username=${debouncedUsername}`)
        .then(res => res.json())
        .then(data => {
          if (data.address) {
            setTargetAddress(data.address);
          } else {
            setTargetAddress(null);
            setUserNotFoundError(data.message || 'User not found.');
          }
        })
        .finally(() => setIsResolvingUser(false));
    } else {
      setTargetAddress(null);
      setUserNotFoundError('');
    }
  }, [debouncedUsername]);

  const handleApprove = () => {
    setTxStep('approving');
    writeContract({
      address: DEGEN_TOKEN_ADDRESS,
      abi: DEGEN_TOKEN_ABI,
      functionName: 'approve',
      args: [DARR_CONTRACT_ADDRESS, parseUnits('1000', DEGEN_TOKEN_DECIMALS)], // Approve a larger amount
    });
  };

  const handleCreateDare = () => {
    setTxStep('creating');
    writeContract({
      address: DARR_CONTRACT_ADDRESS,
      abi: DARR_ABI,
      functionName: 'createDare',
      args: [targetAddress!, DEGEN_TOKEN_ADDRESS, parseUnits(PRIZE_AMOUNT.toString(), DEGEN_TOKEN_DECIMALS), description],
    });
  };
  
  // Main Render Logic
  if (!address) {
    return <div className="text-center text-white">Please connect your wallet to continue.</div>;
  }

  // Step 1: Approval
  if (!hasSufficientAllowance) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-white text-center">First, approve the Darr contract to use your $DEGEN.</p>
        <button
          onClick={handleApprove}
          disabled={isWritePending}
          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-500"
        >
          {isWritePending ? 'Check Wallet...' : 'Approve 1000 $DEGEN'}
        </button>
        {isConfirming && <p className="text-sm text-gray-400">Waiting for confirmation...</p>}
        {isConfirmed && txStep === 'approving' && <p className="text-sm text-green-400">Approval successful!</p>}
      </div>
    );
  }

  // Step 2: Create Dare
  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2">
        <label htmlFor="username" className="text-sm font-medium text-gray-300">Who do you want to dare?</label>
        <input
          id="username"
          placeholder="@username"
          value={targetUsername}
          onChange={(e) => setTargetUsername(e.target.value.replace('@', ''))}
          className="w-full rounded-md border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-blue-500 focus:ring-blue-500"
        />
        {isResolvingUser && <p className="text-xs text-gray-400">Checking user...</p>}
        {userNotFoundError && <p className="text-xs text-red-500">{userNotFoundError}</p>}
        {targetAddress && <p className="text-xs text-green-400">User found!</p>}
      </div>
      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium text-gray-300">What is the dare?</label>
        <textarea
          id="description"
          placeholder="I dare you to..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full min-h-[100px] rounded-md border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <button
        onClick={handleCreateDare}
        disabled={!targetAddress || !description || isWritePending}
        className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-500"
      >
        {isWritePending ? 'Check Wallet...' : `Send Dare for ${PRIZE_AMOUNT} $DEGEN`}
      </button>
      {isConfirming && <p className="text-sm text-center text-gray-400">Waiting for dare to be recorded onchain...</p>}
      {isConfirmed && txStep === 'creating' && <p className="text-sm text-center text-green-400">Dare successfully created!</p>}
    </div>
  );
}