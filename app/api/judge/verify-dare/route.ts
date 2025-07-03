import { NextRequest, NextResponse } from 'next/server';
import { createWalletClient, http, publicActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { DARR_CONTRACT_ADDRESS, DARR_ABI } from '@/lib/constants';

export async function POST(req: NextRequest) {
  const { dareId, wasCompleted } = await req.json();

  if (dareId === undefined || wasCompleted === undefined) {
    return NextResponse.json({ message: 'Missing dareId or wasCompleted status' }, { status: 400 });
  }

  const judgePrivateKey = process.env.JUDGE_PRIVATE_KEY as `0x${string}` | undefined;

  if (!judgePrivateKey) {
    console.error('JUDGE_PRIVATE_KEY is not set in environment variables.');
    return NextResponse.json({ message: 'Server configuration error.' }, { status: 500 });
  }

  // 1. Create a server-side wallet client using the Judge's private key
  const judgeAccount = privateKeyToAccount(judgePrivateKey);
  const client = createWalletClient({
    account: judgeAccount,
    chain: base,
    transport: http(),
  }).extend(publicActions);

  try {
    // 2. Call the setCompletionStatus function on the smart contract
    const hash = await client.writeContract({
      address: DARR_CONTRACT_ADDRESS,
      abi: DARR_ABI,
      functionName: 'setCompletionStatus',
      args: [BigInt(dareId), wasCompleted],
      account: judgeAccount,
    });

    // 3. Wait for the transaction to be mined and get the receipt
    const receipt = await client.waitForTransactionReceipt({ hash });

    if (receipt.status === 'success') {
      return NextResponse.json({ message: 'Dare status updated successfully!', hash: receipt.transactionHash }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Transaction failed.', hash: receipt.transactionHash }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error calling setCompletionStatus:', error);
    return NextResponse.json({ message: 'An error occurred while updating the dare status.', error: error.message }, { status: 500 });
  }
}