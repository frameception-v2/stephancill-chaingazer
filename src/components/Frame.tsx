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
  const [selectedChains, setSelectedChains] = useState<number[]>(DEFAULT_CHAINS);
  const [customChainId, setCustomChainId] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function fetchGasPrices() {
      const clients: Record<number, any> = {
        1: createPublicClient({ chain: mainnet, transport: http() }),
        10: createPublicClient({ chain: optimism, transport: http() }),
        8453: createPublicClient({ chain: base, transport: http() }),
        42161: createPublicClient({ chain: arbitrum, transport: http() }),
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
      
      // Fetch ETH prices
      const ethUsdPrice = await getEthUsdPrice();

      await Promise.all(
        selectedChains.map(async (id) => {
          try {
            const gasPrice = await clients[id].getGasPrice();
            prices[id] = formatGwei(gasPrice);
          } catch (error) {
            console.error(`Error fetching gas price for chain ${id}:`, error);
            prices[id] = 'Error';
          }
        })
      );

      setGasPrices(prices);
      setLoading(false);
    }

    fetchGasPrices();
    // Refresh every second
    const interval = setInterval(fetchGasPrices, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="border-neutral-200 bg-white">
      <CardHeader>
        <CardTitle className="text-neutral-900">Current Gas Prices</CardTitle>
        <CardDescription className="text-neutral-600">
          Real-time gas prices across major networks (in Gwei)
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
                    <CommandGroup>
                      {ALL_CHAINS.map(({ id, name }) => (
                        <CommandItem
                          key={id}
                          value={name}
                          onSelect={() => {
                            setSelectedChains(prev => 
                              prev.includes(id) 
                                ? prev.filter(x => x !== id)
                                : [...prev, id]
                            );
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
              
              <Input
                type="number"
                placeholder="Add chain ID"
                value={customChainId}
                onChange={(e) => setCustomChainId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customChainId) {
                    const chainId = parseInt(customChainId);
                    if (!selectedChains.includes(chainId)) {
                      setSelectedChains(prev => [...prev, chainId]);
                    }
                    setCustomChainId("");
                  }
                }}
                className="w-32"
              />
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
                  <div key={id} className="flex justify-between items-center">
                    <span className="font-medium">{chain.name}:</span>
                    <div className="text-right">
                      <div className="font-mono">{gasPrice || 'N/A'} Gwei</div>
                      {gasCost && (
                        <div className="text-xs text-gray-600">
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
      <div className="w-[300px] mx-auto py-2 px-2">
        <h1 className="text-2xl font-bold text-center mb-4 text-neutral-900">{title}</h1>
        <GasPriceCard />
      </div>
    </div>
  );
}
