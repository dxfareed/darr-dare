/* eslint-disable */

'use client';

import { useAccount } from 'wagmi';
import { useDares } from '@/app/hooks/useDares';
import { DareManagementCard } from '@/app/components/DareManagementCard';
import { Dare } from '@/app/components/DareCard';

export default function MyDaresPage() {
  const { address } = useAccount();
  // We get the refetch function from our useDares hook to update the list after an action
  const { dares, isLoading, error, refetch } = useDares();

  if (!address) {
    return <div className="text-center text-white mt-10">Please connect your wallet to see your dares.</div>;
  }

  if (isLoading) {
    return <div className="text-center text-white mt-10">Loading your onchain dares...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 mt-10">Error fetching dares: {error.message}</div>;
  }

  const sentDares = dares.filter(d => d.darer === address);
  const receivedDares = dares.filter(d => d.target === address);

  const renderDareList = (title: string, dareList: Dare[]) => (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
      {dareList.length > 0 ? (
        <div className="space-y-4">
          {dareList.map(dare => (
            <DareManagementCard key={dare.id.toString()} dare={dare} refetchDares={refetch} />
          ))}
        </div>
      ) : (
        <p className="text-gray-400">You have no {title.toLowerCase()}.</p>
      )}
    </div>
  );

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12 bg-gray-950">
      <div className="z-10 w-full max-w-3xl">
        <h1 className="text-4xl font-bold text-center text-white mb-10">
          My Dares
        </h1>
        <div className="space-y-10">
          {renderDareList("Dares I've Sent", sentDares)}
          {renderDareList("Dares I've Received", receivedDares)}
        </div>
      </div>
    </main>
  );
}