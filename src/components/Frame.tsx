"use client";

import { useEffect, useCallback, useState, useMemo } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Input } from "~/components/ui/input";
import sdk, {
  AddFrame,
  SignIn as SignInCore,
  type Context,
} from "@farcaster/frame-sdk";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "~/components/ui/card";
import { createPublicClient, http, formatGwei } from 'viem';
import { mainnet, optimism, base, arbitrum } from 'viem/chains';
import { ALL_CHAINS, DEFAULT_CHAINS, GAS_UNITS } from "~/lib/constants";
import { createStore } from "mipd";
import { PROJECT_TITLE } from "~/lib/constants";

function GasPriceCard() {
  const [gasPrices, setGasPrices] = useState<Record<number, string>>({});
  const [ethPrices, setEthPrices] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedChains, setSelectedChains] = useState<number[]>(() => {
    // Load from localStorage if available, otherwise use defaults
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('selectedChains');
      return stored ? JSON.parse(stored) : DEFAULT_CHAINS;
    }
    return DEFAULT_CHAINS;
  });
  const [customChainId, setCustomChainId] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function fetchGasPrices() {
      const clients: Record<number, any> = {
        1: createPublicClient({ chain: mainnet, transport: http() }),
        10: createPublicClient({ chain: optimism, transport: http() }),
        8453: createPublicClient({ chain: base, transport: http() }),
        42161: createPublicClient({ chain: arbitrum, transport: http() }),
        137: createPublicClient({
          chain: {
            id: 137,
            name: 'Polygon',
            nativeCurrency: {
              decimals: 18,
              name: 'MATIC',
              symbol: 'MATIC'
            },
            rpcUrls: {
              default: { http: ['https://polygon-rpc.com'] },
              public: { http: ['https://polygon-rpc.com'] }
            }
          },
          transport: http()
        }),
      };

      // Add custom clients for selected chains
      selectedChains.forEach(chainId => {
        if (!clients[chainId]) {
          clients[chainId] = createPublicClient({
            chain: {
              id: chainId,
              name: ALL_CHAINS.find(c => c.id === chainId)?.name || `Chain ${chainId}`,
              nativeCurrency: {
                decimals: 18,
                name: 'Ether',
                symbol: 'ETH',
              },
              rpcUrls: {
                default: { 
                  http: [`https://rpc.ankr.com/${chainId}`]
                },
                public: {
                  http: [`https://rpc.ankr.com/${chainId}`]
                }
              }
            },
            transport: http()
          });
        }
      });

      const prices: Record<number, string> = {};
      const ethPricesRecord: Record<number, number> = {};
      
      // Import getEthUsdPrice from constants
      const { getEthUsdPrice } = await import('~/lib/constants');
      const ethUsdPrice = await getEthUsdPrice();

      await Promise.all(
        selectedChains.map(async (id) => {
          try {
            const gasPrice = await clients[id].getGasPrice();
            prices[id] = formatGwei(gasPrice);
            ethPricesRecord[id] = ethUsdPrice;
          } catch (error) {
            console.error(`Error fetching gas price for chain ${id}:`, error);
            prices[id] = 'Error';
          }
        })
      );

      setGasPrices(prices);
      setEthPrices(ethPricesRecord);
      setLoading(false);
    }

    fetchGasPrices();
    // Refresh every second
    const interval = setInterval(fetchGasPrices, 1000);
    return () => clearInterval(interval);
  }, [selectedChains]); // Add selectedChains as dependency

  return (
    <Card className="border-neutral-200 bg-white dark:bg-neutral-900 dark:border-neutral-700">
      <CardHeader>
        <CardTitle className="text-neutral-900 dark:text-neutral-100">Current Gas Prices</CardTitle>
        <CardDescription className="text-neutral-600 dark:text-neutral-200">
          Real-time gas prices across major networks (in Gwei) for {GAS_UNITS.toLocaleString()} gas units
        </CardDescription>
      </CardHeader>
      <CardContent className="text-neutral-800">
        {loading ? (
          <p className="text-center">Loading gas prices...</p>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="justify-between"
                  >
                    Select chains
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Search chain..." />
                    <CommandEmpty>No chain found.</CommandEmpty>
                    <CommandGroup heading="Available Chains">
                      {ALL_CHAINS.map(({ id, name }) => (
                        <CommandItem
                          key={id}
                          value={name.toLowerCase()}
                          onSelect={(currentValue) => {
                            const chainId = id;
                            setSelectedChains(prev => {
                              const newChains = prev.includes(chainId)
                                ? prev.filter(x => x !== chainId)
                                : [...prev, chainId];
                              localStorage.setItem('selectedChains', JSON.stringify(newChains));
                              return newChains;
                            });
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedChains.includes(id) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Chain ID or RPC URL"
                  value={customChainId}
                  onChange={(e) => setCustomChainId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customChainId) {
                      if (customChainId.startsWith('http')) {
                        // Extract chain ID from RPC URL if possible
                        const match = customChainId.match(/\/(\d+)$/);
                        const chainId = match ? parseInt(match[1]) : null;
                        if (chainId && !selectedChains.includes(chainId)) {
                          setSelectedChains(prev => {
                            const newChains = [...prev, chainId];
                            localStorage.setItem('selectedChains', JSON.stringify(newChains));
                            return newChains;
                          });
                        }
                      } else {
                        const chainId = parseInt(customChainId);
                        if (!isNaN(chainId) && !selectedChains.includes(chainId)) {
                          setSelectedChains(prev => {
                            const newChains = [...prev, chainId];
                            localStorage.setItem('selectedChains', JSON.stringify(newChains));
                            return newChains;
                          });
                        }
                      }
                      setCustomChainId("");
                    }
                  }}
                  className="w-48"
                />
              </div>
            </div>

            <div className="space-y-2">
              {selectedChains
                .sort((a, b) => {
                  const priceA = parseFloat(gasPrices[a] || '999999');
                  const priceB = parseFloat(gasPrices[b] || '999999');
                  return priceA - priceB;
                })
                .map((id) => {
                const chain = ALL_CHAINS.find(c => c.id === id) || { name: `Chain ${id}` };
                const gasPrice = gasPrices[id];
                const gasCost = gasPrice ? parseFloat(gasPrice) * GAS_UNITS / 1e9 : null;
                const usdCost = gasCost && ethPrices[id] ? gasCost * ethPrices[id] : null;
                
                return (
                  <div key={id} className="flex justify-between items-center gap-2 px-4 py-2 rounded-lg border bg-white dark:bg-neutral-800 dark:border-neutral-700 border-neutral-200">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 dark:text-neutral-100 dark:hover:bg-neutral-700"
                      onClick={() => {
                        setSelectedChains(prev => {
                          const newChains = prev.filter(x => x !== id);
                          localStorage.setItem('selectedChains', JSON.stringify(newChains));
                          return newChains;
                        });
                      }}
                    >
                      ×
                    </Button>
                    <span className="font-medium dark:text-neutral-100">{chain.name}:</span>
                    <div className="text-right ml-auto">
                      <div className="font-mono text-right">
                        {gasPrice ? <span className="tabular-nums dark:text-neutral-100">{parseFloat(gasPrice).toFixed(3).padStart(7, ' ')}</span> : 'N/A'} Gwei
                      </div>
                      {gasCost && (
                        <div className="text-xs text-gray-600 dark:text-neutral-400">
                          ≈ {gasCost.toFixed(6)} ETH
                          {usdCost && ` ($${usdCost.toFixed(2)})`}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Frame(
  { title }: { title?: string } = { title: PROJECT_TITLE }
) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();

  const [added, setAdded] = useState(false);

  const [addFrameResult, setAddFrameResult] = useState("");

  const addFrame = useCallback(async () => {
    try {
      await sdk.actions.addFrame();
    } catch (error) {
      if (error instanceof AddFrame.RejectedByUser) {
        setAddFrameResult(`Not added: ${error.message}`);
      }

      if (error instanceof AddFrame.InvalidDomainManifest) {
        setAddFrameResult(`Not added: ${error.message}`);
      }

      setAddFrameResult(`Error: ${error}`);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      if (!context) {
        return;
      }

      setContext(context);
      setAdded(context.client.added);

      // If frame isn't already added, prompt user to add it
      if (!context.client.added) {
        addFrame();
      }

      sdk.on("frameAdded", ({ notificationDetails }) => {
        setAdded(true);
      });

      sdk.on("frameAddRejected", ({ reason }) => {
        console.log("frameAddRejected", reason);
      });

      sdk.on("frameRemoved", () => {
        console.log("frameRemoved");
        setAdded(false);
      });

      sdk.on("notificationsEnabled", ({ notificationDetails }) => {
        console.log("notificationsEnabled", notificationDetails);
      });
      sdk.on("notificationsDisabled", () => {
        console.log("notificationsDisabled");
      });

      sdk.on("primaryButtonClicked", () => {
        console.log("primaryButtonClicked");
      });

      console.log("Calling ready");
      sdk.actions.ready({});

      // Set up a MIPD Store, and request Providers.
      const store = createStore();

      // Subscribe to the MIPD Store.
      store.subscribe((providerDetails) => {
        console.log("PROVIDER DETAILS", providerDetails);
        // => [EIP6963ProviderDetail, EIP6963ProviderDetail, ...]
      });
    };
    if (sdk && !isSDKLoaded) {
      console.log("Calling load");
      setIsSDKLoaded(true);
      load();
      return () => {
        sdk.removeAllListeners();
      };
    }
  }, [isSDKLoaded, addFrame]);

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div
      style={{
        paddingTop: context?.client.safeAreaInsets?.top ?? 0,
        paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
        paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
        paddingRight: context?.client.safeAreaInsets?.right ?? 0,
      }}
    >
      <div className="w-full sm:w-[300px] sm:mx-auto">
        <h1 className="text-2xl font-bold text-center mb-4 text-neutral-900 dark:text-white">{title}</h1>
        <GasPriceCard />
      </div>
    </div>
  );
}
