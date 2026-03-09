import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia, polygon } from 'wagmi/chains';

export const wagmiConfig = getDefaultConfig({
  appName:     'On-chain Security Guardian',
  projectId:   import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?? 'guardian_demo_id',
  chains:      [sepolia, mainnet, polygon],
  ssr:         false,
});
