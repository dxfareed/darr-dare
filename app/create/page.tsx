import { CreateDareView } from '@/app/components/CreateDareView';

export default function CreatePage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12 bg-gray-900 dark:bg-black">
      <div className="z-10 w-full max-w-3xl items-center justify-between font-mono text-sm">
        <h1 className="text-3xl font-bold text-center text-white mb-8">
          Create a New Dare
        </h1>
      </div>
      <CreateDareView />
    </main>
  );
}