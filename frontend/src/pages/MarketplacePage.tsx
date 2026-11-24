import React, { useEffect, useState } from "react";
import {
  Repeat,
  Tag,
  ShieldCheck,
  TrendingDown,
  Calendar,
  MapPin,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { ResaleListingItem, WalletState } from "../types";
import {
  fetchResaleListings,
  buyResaleTicket,
  formatEth,
  ethToInr,
  formatAddress,
} from "../services/web3Service";
import { useTransaction } from "../hooks/useTransaction";
import { TransactionModal } from "../components/TransactionModal";

interface MarketplacePageProps {
  wallet: WalletState;
}

export const MarketplacePage: React.FC<MarketplacePageProps> = ({ wallet }) => {
  const [listings, setListings] = useState<ResaleListingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const { txState, execute, reset } = useTransaction();

  const loadListings = async () => {
    setLoading(true);
    const list = await fetchResaleListings();
    setListings(list);
    setLoading(false);
  };

  useEffect(() => {
    loadListings();
  }, []);

  const handleBuyResale = async (item: ResaleListingItem) => {
    if (!wallet.isConnected) {
      alert("Please connect MetaMask first.");
      return;
    }

    try {
      await execute(
        () => buyResaleTicket(item.tokenId, item.price),
        `Purchasing Resale Token #${item.tokenId} for ${formatEth(item.price)} ETH...`
      );
      loadListings();
    } catch (err) {
      console.error("Buy resale error:", err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-xs font-semibold">
          <TrendingDown className="w-3.5 h-3.5" />
          <span>Smart Contract Enforced Anti-Scalping</span>
        </div>
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-white">
          Secondary Resale Marketplace
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          Purchase verified authentic resale tickets from other fans. Every price is strictly
          capped by smart contract code—no scalpers, no predatory markups.
        </p>
      </div>

      {/* Anti-Scalping Rule Banner */}
      <div className="glass-panel border border-cyan-500/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              On-Chain Price Guarantee
            </h4>
            <p className="text-xs text-slate-300">
              Transactions above the organizer maximum resale price are automatically rejected by Solidity bytecode.
            </p>
          </div>
        </div>
        <div className="text-xs font-mono text-cyan-300 bg-cyan-500/10 px-3 py-1.5 rounded-xl border border-cyan-500/20">
          Atomic Swaps • 2.5% Platform Fee
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-80 glass-panel rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : listings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((item) => {
            const dateStr = new Date(item.eventDate * 1000).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            const askingEth = formatEth(item.price);
            const origEth = formatEth(item.originalPrice);
            const maxEth = formatEth(item.maxResalePrice);
            const isOwner =
              wallet.address && item.seller.toLowerCase() === wallet.address.toLowerCase();

            return (
              <div
                key={item.tokenId}
                className="glass-panel border border-white/10 hover:border-cyan-500/40 rounded-3xl overflow-hidden transition-all flex flex-col justify-between"
              >
                {/* Event Poster */}
                <div className="relative h-44 bg-slate-900 overflow-hidden">
                  <img
                    src={item.imageURI}
                    alt={item.eventName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as any).src =
                        "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1000&q=80";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070913] via-transparent to-transparent opacity-80" />
                  <div className="absolute top-3 left-3 bg-cyan-500/90 text-white font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                    Resale #{item.tokenId}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="font-display font-bold text-lg text-white line-clamp-1">
                      {item.eventName}
                    </h3>
                    <div className="space-y-1 text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-purple-400" />
                        <span>{dateStr}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="line-clamp-1">{item.eventVenue}</span>
                      </div>
                    </div>
                  </div>

                  {/* Anti-scalping comparison panel */}
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Face Value:</span>
                      <span className="font-mono text-white">{origEth} ETH</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Max Price Allowed:</span>
                      <span className="font-mono text-cyan-300 font-bold">{maxEth} ETH</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Seller:</span>
                      <span className="font-mono text-slate-300">{formatAddress(item.seller)}</span>
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-cyan-300">Resale Price</div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-display font-bold text-lg text-white">{askingEth} ETH</span>
                        <span className="text-[11px] text-slate-400">≈ ₹{ethToInr(askingEth)}</span>
                      </div>
                    </div>

                    {isOwner ? (
                      <span className="text-xs text-slate-400 italic">Your Listing</span>
                    ) : (
                      <button
                        onClick={() => handleBuyResale(item)}
                        disabled={txState.status === "pending"}
                        className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                      >
                        <Tag className="w-3.5 h-3.5" />
                        <span>Buy Ticket</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 glass-panel rounded-3xl border border-white/10 space-y-3">
          <Repeat className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="font-display font-bold text-lg text-white">No Tickets Currently Listed</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            All fans are holding their tickets! If someone lists an anti-scalping resale ticket, it will appear here.
          </p>
        </div>
      )}

      <TransactionModal
        txState={txState}
        chainId={wallet.chainId}
        onClose={reset}
      />
    </div>
  );
};