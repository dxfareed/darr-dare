'use client';

import { useEffect, useState } from 'react';
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { parseEther } from 'viem';
import { Avatar, Name } from '@coinbase/onchainkit/identity';
import {
  DARR_CONTRACT_ADDRESS,
  DARR_ABI,
  DEGEN_TOKEN_ADDRESS,
  DEGEN_TOKEN_ABI,
} from '../lib/constants';
import { sdk } from '@farcaster/miniapp-sdk';

// A clear type definition for the Farcaster user object from the SDK context
type FarcasterUser = {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
};

export default function Home() {
  // --- STATE MANAGEMENT ---
  // Get the reliable wallet address and connection status from wagmi
  const { address, isConnected } = useAccount(); 
  
  // State specifically for Farcaster user data (FID, username, etc.)
  const [farcasterUser, setFarcasterUser] = useState<FarcasterUser | null>(null);

  // State for the form inputs
  const [description, setDescription] = useState<string>('');
  const [prizeAmount, setPrizeAmount] = useState<string>('100');
  const [targetUser, setTargetUser] = useState<string>('');

  // --- WAGMI HOOKS for contract interaction ---
  const { writeContract: approve, data: approveHash } = useWriteContract();
  const { writeContract: createDare, data: createDareHash } = useWriteContract();

  const { isLoading: isApproving, isSuccess: isApproved } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isLoading: isCreatingDare, isSuccess: didCreateDare } = useWaitForTransactionReceipt({ hash: createDareHash });

  // --- APP INITIALIZATION ---
  useEffect(() => {
    // CORRECTED: Access sdk.context as a promise directly.
    sdk.context
      .then(ctx => {
        setFarcasterUser(ctx.user);
        // CRITICAL: Call ready() AFTER context is fetched.
        sdk.actions.ready();
      })
      .catch(err => {
        console.error("Error loading Farcaster context:", err);
        // Still call ready() on error to prevent being stuck on the splash screen.
        sdk.actions.ready();
      });
  }, []); // The empty dependency array ensures this runs only once.

  // --- HANDLER FUNCTIONS ---
  const handleApprove = () => {
    if (!prizeAmount) return alert('Please enter a prize amount.');
    const amountToApprove = parseEther(prizeAmount);
    approve({
      address: DEGEN_TOKEN_ADDRESS,
      abi: DEGEN_TOKEN_ABI,
      functionName: 'approve',
      args: [DARR_CONTRACT_ADDRESS, amountToApprove],
    });
  };

  const handleCreateDare = () => {
    if (!description || !targetUser || !prizeAmount) return alert('Please fill out all fields.');
    const prizeAmountInWei = parseEther(prizeAmount);
    createDare({
      address: DARR_CONTRACT_ADDRESS,
      abi: DARR_ABI,
      functionName: 'createDare',
      args: [targetUser, DEGEN_TOKEN_ADDRESS, prizeAmountInWei, description],
    });
  };

  // --- RENDER LOGIC ---
  // Display a loading/connecting message until wagmi confirms the wallet is connected.
  if (!isConnected || !address) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-900 text-white">
        <div className="w-full max-w-md text-center">
            <p>Connecting to your Farcaster Wallet...</p>
        </div>
      </main>
    );
  }

  // Once connected, render the main application UI.
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-900 text-white">
      <div className="w-full max-w-md bg-gray-800 rounded-2xl p-6 shadow-lg space-y-6">
        <h1 className="text-2xl font-bold text-center">Onchain Dares</h1>

        <div className="flex items-center space-x-3 bg-gray-700 p-3 rounded-lg">
          <Avatar address={address} className="w-12 h-12" />
          <div className="flex flex-col">
            <span className="text-sm text-gray-400">Darer (FID: {farcasterUser?.fid ?? '...'})</span>
            <Name address={address} />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Dare Description</label>
            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="I dare @dwr to..." className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-purple-500" rows={3}/>
          </div>
          <div>
            <label htmlFor="target" className="block text-sm font-medium text-gray-300 mb-1">Target Address</label>
            <input id="target" type="text" value={targetUser} onChange={(e) => setTargetUser(e.target.value)} placeholder="0x..." className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-purple-500"/>
          </div>
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-1">Prize Amount ($DEGEN)</label>
            <input id="amount" type="number" value={prizeAmount} onChange={(e) => setPrizeAmount(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-purple-500"/>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={handleApprove} disabled={!isConnected || isApproved || isApproving} className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-all bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed">
            {isApproving ? 'Approving...' : isApproved ? '✓ Approved' : '1. Approve'}
          </button>
          
          <button onClick={handleCreateDare} disabled={!isConnected || !isApproved || isCreatingDare} className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-all bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed">
            {isCreatingDare ? 'Sending...' : didCreateDare ? 'Dare Sent!' : '2. Send Dare'}
          </button>
        </div>

        {(approveHash || createDareHash) && (
          <div className="text-center text-xs space-y-2 pt-4">
            {approveHash && <p>Approval Tx: <a href={`https://sepolia.basescan.org/tx/${approveHash}`} target="_blank" rel="noopener noreferrer" className="underline truncate">{approveHash.slice(0,15)}...</a></p>}
            {createDareHash && <p>Dare Tx: <a href={`https://sepolia.basescan.org/tx/${createDareHash}`} target="_blank" rel="noopener noreferrer" className="underline truncate">{createDareHash.slice(0,15)}...</a></p>}
          </div>
        )}
      </div>
    </main>
  );
}