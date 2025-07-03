/* eslint-disable */
import { NextRequest, NextResponse } from 'next/server';
import { createWalletClient, http, publicActions, PrivateKeyAccount } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { DARR_CONTRACT_ADDRESS, DARR_ABI } from '@/lib/constants';

export async function POST(req: NextRequest) {
  // 1. Parse the request body sent from the JudgeDareCard component
  const { dareId, wasCompleted } = await req.json();

  // Basic validation
  if (dareId === undefined || wasCompleted === undefined) {
    return NextResponse.json({ message: 'Missing dareId or wasCompleted status' }, { status: 400 });
  }

  // 2. Securely load the Judge's private key from environment variables on the server
  const judgePrivateKey = process.env.JUDGE_PRIVATE_KEY as `0x${string}` | undefined;

  if (!judgePrivateKey) {
    console.error('CRITICAL: JUDGE_PRIVATE_KEY is not set in environment variables.');
    return NextResponse.json({ message: 'Server configuration error. Cannot perform judge duties.' }, { status: 500 });
  }

  try {
    // 3. Create a server-side "wallet" instance using the Judge's private key.
    // This client will sign the transaction.
    const judgeAccount = privateKeyToAccount(judgePrivateKey);
    const client = createWalletClient({
      account: judgeAccount,
      chain: base,
      transport: http(), // Connects to a default public RPC for the Base chain
    }).extend(publicActions);

    // 4. Execute the `setCompletionStatus` function on the smart contract
    console.log(`Judge submitting status for Dare ID ${dareId}: ${wasCompleted}`);
    const hash = await client.writeContract({
      address: DARR_CONTRACT_ADDRESS,
      abi: DARR_ABI,
      functionName: 'setCompletionStatus',
      args: [BigInt(dareId), wasCompleted],
      account: judgeAccount,
    });

    // 5. (Optional but recommended) Wait for the transaction to be mined to confirm success
    const receipt = await client.waitForTransactionReceipt({ hash });

    if (receipt.status === 'success') {
      console.log(`Successfully updated Dare ID ${dareId}. TxHash: ${receipt.transactionHash}`);
      return NextResponse.json({ message: 'Dare status updated successfully!', hash: receipt.transactionHash }, { status: 200 });
    } else {
      console.error(`Transaction failed for Dare ID ${dareId}. TxHash: ${receipt.transactionHash}`);
      return NextResponse.json({ message: 'On-chain transaction failed.', hash: receipt.transactionHash }, { status: 500 });
    }

  } catch (error: any) {
    console.error(`Error in /verify-dare endpoint for Dare ID ${dareId}:`, error);
    return NextResponse.json({ message: 'An error occurred while updating the dare status.', error: error.message }, { status: 500 });
  }
}