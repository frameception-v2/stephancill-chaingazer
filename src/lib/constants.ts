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

import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

/**
 * Looks up the current price of ETH in USD via Chainlink's ETH/USDC price feed.
 * @returns The current price of ETH in USD.
 */
export async function getEthUsdPrice(): Promise<number> {
  const client = createPublicClient({
    transport: http(),
    chain: mainnet,
  });

  const [, answer] = await client.readContract({
    abi: [
      {
        inputs: [],
        name: "latestRoundData",
        outputs: [
          { internalType: "uint80", name: "roundId", type: "uint80" },
          { internalType: "int256", name: "answer", type: "int256" },
          { internalType: "uint256", name: "startedAt", type: "uint256" },
          { internalType: "uint256", name: "updatedAt", type: "uint256" },
          { internalType: "uint80", name: "answeredInRound", type: "uint80" },
        ],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "latestRoundData",
    // ETH/USD Chainlink price feed on mainnet
    address: "0x986b5E1e1755e3C2440e960477f25201B0a8bbD4",
  });

  const ethPriceUsd = 1e18 / Number(answer);

  return ethPriceUsd;
}
