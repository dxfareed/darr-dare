/* eslint-disable */

import { useReadContract, useReadContracts } from 'wagmi';
import { DARR_CONTRACT_ADDRESS, DARR_ABI } from '@/lib/constants';
import { Dare } from '@/app/components/DareCard';

export function useDares() {
  // 1. Fetch the total number of dares created (nextDareId)
  // We also get the refetch function for this call, which can be part of a larger refetch.
  const { data: nextDareId, isLoading: isLoadingId, refetch: refetchId } = useReadContract({
    address: DARR_CONTRACT_ADDRESS,
    abi: DARR_ABI,
    functionName: 'nextDareId',
  });

  // 2. Create an array of dare IDs to fetch. Dares start from ID 1.
  const dareIds = nextDareId ? Array.from({ length: Number(nextDareId) - 1 }, (_, i) => BigInt(i + 1)) : [];

  // 3. Prepare the contract call objects for the batch read
  const dareContracts = dareIds.map(id => ({
    address: DARR_CONTRACT_ADDRESS,
    abi: DARR_ABI,
    functionName: 'dares',
    args: [id],
  }));

  // 4. Execute the batch read using useReadContracts
  // **CORRECTION**: Capture the `refetch` function from this hook. This is the main data source.
  const { data: daresData, isLoading: isLoadingDares, error, isSuccess, refetch: refetchDares } = useReadContracts({
    //@ts-ignore
    contracts: dareContracts,
  });

  // 5. Format the results into our Dare type
  const dares: Dare[] = isSuccess && daresData ? daresData.map(d => d.result as Dare).filter(Boolean) : [];
  
  // A comprehensive refetch function that re-fetches both the ID and the dare data.
  const handleRefetch = () => {
    refetchId();
    refetchDares();
  }

  // **CORRECTION**: Return the `refetch` function so components can use it.
  return {
    dares: dares.sort((a, b) => Number(b.id) - Number(a.id)), // Show newest first
    isLoading: isLoadingId || isLoadingDares,
    error,
    refetch: handleRefetch, // Expose the refetch function
  };
}