'use client';

import { useDares } from '@/app/hooks/useDares';
import { DareCard } from '@/app/components/DareCard';

export default function Home() {
  const { dares, isLoading, error } = useDares();

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12 bg-gray-50 dark:bg-black">
      <div className="z-10 w-full max-w-3xl items-center justify-between font-mono text-sm">
        <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
          Darr: The Onchain Dare Game
        </h1>
      </div>

      <div className="w-full max-w-3xl space-y-6">
        {isLoading && <p className="text-center text-gray-500 dark:text-gray-400">Loading onchain dares...</p>}
        {error && <p className="text-center text-red-500">Error fetching dares: {error.message}</p>}
        
        {!isLoading && !error && (
          dares.length > 0 ? (
            dares.map((dare) => <DareCard key={dare.id.toString()} dare={dare} />)
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 p-8 border-2 border-dashed rounded-lg">
              <p>No dares have been created yet.</p>
              <p>Be the first to start the game!</p>
            </div>
          )
        )}
      </div>
    </main>
  );
}