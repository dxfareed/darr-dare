"use client";

import { WagmiProvider, createConfig, http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MiniKitProvider } from '@coinbase/onchainkit/minikit';
import { coinbaseWallet } from 'wagmi/connectors';
import { ReactNode } from 'react';


const config = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(),
  },
  connectors: [
    coinbaseWallet()
  ],
});

const queryClient = new QueryClient();

export function Providers(props: { children: ReactNode }) {
  return (/* 
    <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}> */
    <MiniKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
      chain={baseSepolia}
      config={{
        appearance: {
          mode: "auto",
          theme: "mini-app-theme",
          name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
          logo: process.env.NEXT_PUBLIC_ICON_URL,
        },
      }}
    >
      {props.children}
    </MiniKitProvider>
/*     </QueryClientProvider>
    </WagmiProvider> */
  );
}
