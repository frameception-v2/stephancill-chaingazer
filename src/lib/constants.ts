export const PROJECT_ID = 'chaingazer';
export const PROJECT_TITLE = "chaingazer";
export const PROJECT_DESCRIPTION = "Track and analyze on-chain activity across multiple networks";

export const ALL_CHAINS = [
  { id: 1, name: 'Ethereum' },
  { id: 10, name: 'Optimism' },
  { id: 8453, name: 'Base' },
  { id: 42161, name: 'Arbitrum' },
  { id: 137, name: 'Polygon' },
  { id: 43114, name: 'Avalanche' },
  { id: 56, name: 'BNB Chain' },
  { id: 250, name: 'Fantom' },
  { id: 42220, name: 'Celo' },
  { id: 1284, name: 'Moonbeam' }
] as const;

export const DEFAULT_CHAINS = [1, 10, 8453, 42161];

export const GAS_UNITS = 50000;
