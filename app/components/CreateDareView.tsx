'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { Transaction } from '@coinbase/onchainkit/transaction';
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
  const { writeContractAsync, data: hash, isPending: isWritePending } = useWriteContract();

  const [targetUsername, setTargetUsername] = useState('');
  const [debouncedUsername] = useDebounce(targetUsername, 500);
  const [targetAddress, setTargetAddress] = useState<`0x${string}` | null>(null);
  const [description, setDescription] = useState('');
  const [isResolvingUser, setIsResolvingUser] = useState(false);
  const [userNotFoundError, setUserNotFoundError] = useState('');

  // Check allowance
  const { data: allowance, refetch } = useReadContract({
    address: DEGEN_TOKEN_ADDRESS,
    abi: DEGEN_TOKEN_ABI,
    functionName: 'allowance',
    args: [address!, DARR_CONTRACT_ADDRESS],
    query: { enabled: !!address },
  });

  const hasSufficientAllowance = allowance ? allowance >= parseUnits(PRIZE_AMOUNT.toString(), DEGEN_TOKEN_DECIMALS) : false;

  // Handle Approval
  const { isPending: isApprovePending, data: approveHash } = useWaitForTransactionReceipt({ hash });
  useEffect(() => {
    if (!isApprovePending && approveHash) {
      refetch(); // Refetch allowance after approval tx is confirmed
    }
  }, [isApprovePending, approveHash, refetch]);

  async function handleApprove() {
    await writeContractAsync({
      address: DEGEN_TOKEN_ADDRESS,
      abi: DEGEN_TOKEN_ABI,
      functionName: 'approve',
      args: [DARR_CONTRACT_ADDRESS, parseUnits('1000', DEGEN_TOKEN_DECIMALS)], // Approve a larger amount
    });
  }

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

  // Render Logic
  if (!address) {
    return <div className="text-center text-white">Please connect your wallet.</div>;
  }

  if (!hasSufficientAllowance) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-white text-center">You need to approve the Darr contract to spend $DEGEN on your behalf.</p>
        <Transaction
          hash={hash}
          isPending={isWritePending}
          onSuccess={refetch}
          buttonText="Approve 1000 $DEGEN"
          onClick={handleApprove}
        />
      </div>
    );
  }

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
        {targetAddress && <p className="text-xs text-green-400">User found: {targetAddress}</p>}
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
      <Transaction
        hash={hash}
        isPending={isWritePending}
        buttonText={`Send Dare for ${PRIZE_AMOUNT} $DEGEN`}
        onClick={async () =>
          await writeContractAsync({
            address: DARR_CONTRACT_ADDRESS,
            abi: DARR_ABI,
            functionName: 'createDare',
            args: [targetAddress, DEGEN_TOKEN_ADDRESS, parseUnits(PRIZE_AMOUNT.toString(), DEGEN_TOKEN_DECIMALS), description],
          })
        }
        disabled={!targetAddress || !description || isWritePending}
      />
    </div>
  );
}