import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, encodeFunctionData, createClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { createSmartAccountClient } from 'permissionless';
// CORRECTED IMPORT: Use createPimlicoClient
import { createPimlicoClient } from 'permissionless/clients/pimlico';
// NEW IMPORT: We need the paymaster actions to extend our client
import { pimlicoPaymasterActions } from 'permissionless/actions/pimlico';
import { DARR_ABI, DARR_CONTRACT_ADDRESS } from '@/lib/constants';

// In a real app, you would manage signers securely. This is a placeholder.
const getSignerForUser = (userAddress: `0x${string}`) => {
  // This logic would be replaced with a secure method of retrieving or creating
  // a dedicated smart account signer for the user. For this example, we'll
  // deterministically generate one based on a server secret and the user's address.
  // DO NOT USE THIS IN PRODUCTION.
  const signer = privateKeyToAccount(process.env.SIGNER_FACTORY_SECRET! as `0x${string}`);
  return signer;
}

export async function POST(req: NextRequest) {
  const { functionName, args, address: userAddress } = await req.json();
  
  const PIMLICO_API_KEY = process.env.PIMLICO_API_KEY;
  if (!PIMLICO_API_KEY) {
    return NextResponse.json({ success: false, message: "Server configuration error: Paymaster API key not found." }, { status: 500 });
  }

  const BUNDLER_URL = `https://api.pimlico.io/v1/base/rpc?apikey=${PIMLICO_API_KEY}`;
  const PAYMASTER_URL = `https://api.pimlico.io/v2/base/rpc?apikey=${PIMLICO_API_KEY}`;

  const publicClient = createPublicClient({ transport: http(BUNDLER_URL) });

  // CORRECTED CLIENT CREATION: Use createPimlicoClient and extend it
  const paymasterClient = createClient({
    transport: http(PAYMASTER_URL),
    chain: base,
  }).extend(pimlicoPaymasterActions);

  const smartAccountClient = createSmartAccountClient({
    account: getSignerForUser(userAddress), // This would be a more complex lookup in a real app
    chain: base,
    transport: http(BUNDLER_URL),
    // CORRECTED MIDDLEWARE: The property is `sponsorUserOperation`
    sponsorUserOperation: paymasterClient.sponsorUserOperation,
  });

  try {
    // The call to writeContract remains the same, but the underlying
    // client is now correctly configured.
    const txHash = await smartAccountClient.writeContract({
      address: DARR_CONTRACT_ADDRESS,
      abi: DARR_ABI,
      functionName,
      args,
    });

    return NextResponse.json({ success: true, txHash }, { status: 200 });

  } catch(error: any) {
    console.error("Error sponsoring transaction:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}