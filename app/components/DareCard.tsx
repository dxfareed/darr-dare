/* eslint-disable */

import { Avatar } from '@coinbase/onchainkit/identity';

// Define the structure of a Dare object, mirroring the smart contract
export type Dare = {
  id: bigint;
  darer: `0x${string}`;
  target: `0x${string}`;
  token: `0x${string}`;
  prizeAmount: bigint;
  description: string;
  state: number; // 0: Created, 1: Succeeded, 2: Failed, 3: Claimed, 4: Canceled
};

// Define props for the DareCard component
type DareCardProps = {
  dare: Dare;
};

// Map the numeric state to a human-readable string and tailwindcss color
const stateInfo: { [key: number]: { text: string; color: string } } = {
  0: { text: 'Active', color: 'bg-blue-500' },
  1: { text: 'Succeeded', color: 'bg-green-500' },
  2: { text: 'Failed', color: 'bg-red-500' },
  3: { text: 'Claimed', color: 'bg-purple-500' },
  4: { text: 'Canceled', color: 'bg-gray-500' },
};

export function DareCard({ dare }: DareCardProps) {
  const { darer, target, description, prizeAmount, state } = dare;
  const status = stateInfo[state] || { text: 'Unknown', color: 'bg-yellow-500' };

  return (
    <div className="flex flex-col space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Avatar address={darer} className="h-8 w-8" />
          <span className="text-gray-500 dark:text-gray-400">dared</span>
          <Avatar address={target} className="h-8 w-8" />
        </div>
        <div className={`px-2 py-1 text-xs font-medium text-white rounded-full ${status.color}`}>
          {status.text}
        </div>
      </div>

      <p className="text-lg text-gray-900 dark:text-gray-100">
        "{description}"
      </p>

      <div className="flex items-center justify-end">
        <span className="font-semibold text-gray-800 dark:text-gray-200">
          Prize: {Number(prizeAmount) / 10**6} $DEGEN
        </span>
      </div>
    </div>
  );
}