/* eslint-disable */

'use client';

import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { DareCard, Dare } from '@/app/components/DareCard'; // Re-using the display part
import { DARR_CONTRACT_ADDRESS, DARR_ABI } from '@/lib/constants';
import { useEffect } from 'react';

type DareManagementCardProps = {
  dare: Dare;
  refetchDares: () => void; // Function to refetch data after an action
};

export function DareManagementCard({ dare, refetchDares }: DareManagementCardProps) {
  const { address } = useAccount();
  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Refetch the dares list once a transaction is confirmed
  useEffect(() => {
    if (isConfirmed) {
      refetchDares();
    }
  }, [isConfirmed, refetchDares]);

  const handleCancel = () => {
    writeContract({
      address: DARR_CONTRACT_ADDRESS,
      abi: DARR_ABI,
      functionName: 'cancelDare',
      args: [dare.id],
    });
  };

  const handleClaim = () => {
    writeContract({
      address: DARR_CONTRACT_ADDRESS,
      abi: DARR_ABI,
      functionName: 'claimPrize',
      args: [dare.id],
    });
  };

  const canCancel = address === dare.darer && dare.state === 0; // State.Created
  const canClaim = address === dare.target && dare.state === 1; // State.Succeeded

  return (
    <div className="bg-gray-900 p-1 rounded-lg">
      <DareCard dare={dare} />
      {(canCancel || canClaim) && (
        <div className="mt-2 p-2 flex justify-end">
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={isPending || isConfirming}
              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-600"
            >
              {isPending || isConfirming ? 'Canceling...' : 'Cancel Dare'}
            </button>
          )}
          {canClaim && (
            <button
              onClick={handleClaim}
              disabled={isPending || isConfirming}
              className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-600"
            >
              {isPending || isConfirming ? 'Claiming...' : 'Claim Prize'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}