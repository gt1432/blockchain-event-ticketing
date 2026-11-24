import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Ticket,
  Compass,
  Tag,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  X,
  TrendingDown,
} from "lucide-react";
import { TicketItem, WalletState } from "../types";
import {
  fetchUserTickets,
  listTicketForResale,
  cancelResaleListing,
  formatEth,
  ethToInr,
} from "../services/web3Service";
import { useTransaction } from "../hooks/useTransaction";
import { TransactionModal } from "../components/TransactionModal";
import { TicketCard } from "../components/TicketCard";

interface MyTicketsPageProps {
  wallet: WalletState;
}

export const MyTicketsPage: React.FC<MyTicketsPageProps> = ({ wallet }) => {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Resale modal state
  const [resaleModalOpen, setResaleModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [resalePriceEth, setResalePriceEth] = useState("");
  const [priceError, setPriceError] = useState<string | null>(null);

  const { txState, execute, reset } = useTransaction();

  const loadTickets = async () => {
    if (!wallet.address) {
      setTickets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const list = await fetchUserTickets(wallet.address);
    setTickets(list);
    setLoading(false);
  };

  useEffect(() => {
    loadTickets();
  }, [wallet.address]);

  const openResaleModal = (tokenId: number) => {
    const t = tickets.find((item) => item.tokenId === tokenId);
    if (t) {
      setSelectedTicket(t);
      const originalPrice = formatEth(t.purchasePrice);
      setResalePriceEth(originalPrice);
      setPriceError(null);
      setResaleModalOpen(true);
    }
  };

  const handlePriceChange = (val: string) => {
    setResalePriceEth(val);
    if (!selectedTicket || !selectedTicket.event) return;

    const maxEth = parseFloat(formatEth(selectedTicket.event.maxResalePrice));
    const inputEth = parseFloat(val);

    if (isNaN(inputEth) || inputEth <= 0) {
      setPriceError("Price must be greater than 0");
    } else if (inputEth > maxEth) {
      setPriceError(
        `Price exceeds the organizer maximum resale cap of ${maxEth} ETH!`
      );
    } else {
      setPriceError(null);
    }
  };

  const submitResaleListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    if (priceError) return;

    try {
      await execute(
        () => listTicketForResale(selectedTicket.tokenId, resalePriceEth),
        `Listing Token #${selectedTicket.tokenId} on Anti-Scalping Marketplace for ${resalePriceEth} ETH...`
      );
      setResaleModalOpen(false);
      loadTickets();
    } catch (err) {
      console.error("List resale error:", err);
    }
  };

  const handleCancelResale = async (tokenId: number) => {
    try {
      await execute(
        () => cancelResaleListing(tokenId),
        `Canceling resale listing for Token #${tokenId}...`
      );
      loadTickets();
    } catch (err) {
      console.error("Cancel resale error:", err);
    }
  };

  if (!wallet.isConnected) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <Ticket className="w-16 h-16 text-purple-400 mx-auto" />
        <h2 className="font-display font-bold text-2xl text-white">Connect Your Wallet</h2>
        <p className="text-xs text-slate-400">
          Please connect your MetaMask wallet to view your owned NFT passes and dynamic QR codes.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-white">My NFT Passes</h1>
        <p className="text-sm text-slate-400">
          Your personal digital ticket wallet. View unique QR codes for event gate entry or list tickets for resale.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-96 glass-panel rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : tickets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tickets.map((t) => (
            <TicketCard
              key={t.tokenId}
              ticket={t}
              chainId={wallet.chainId}
              onListResale={openResaleModal}
              onCancelResale={handleCancelResale}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 glass-panel rounded-3xl border border-white/10 space-y-4">
          <Ticket className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="font-display font-bold text-lg text-white">You Don't Own Any Tickets Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Discover upcoming concerts, festivals, and conferences to mint your first verifiable NFT ticket pass.
          </p>
          <Link
            to="/events"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-lg transition-all"
          >
            <Compass className="w-4 h-4" />
            <span>Explore Events</span>
          </Link>
        </div>
      )}

      {/* Resale Price Listing Modal */}
      {resaleModalOpen && selectedTicket && selectedTicket.event && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel border border-purple-500/30 rounded-3xl p-6 max-w-md w-full relative shadow-2xl space-y-5">
            <button
              onClick={() => setResaleModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                Anti-Scalping Resale
              </span>
              <h3 className="font-display font-bold text-lg text-white">
                List Ticket #{selectedTicket.tokenId}
              </h3>
              <p className="text-xs text-slate-400">{selectedTicket.event.name}</p>
            </div>

            {/* Smart Contract Bounds Info */}
            <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Original Face Value:</span>
                <span className="font-semibold text-white">
                  {formatEth(selectedTicket.purchasePrice)} ETH
                </span>
              </div>
              <div className="flex justify-between text-cyan-300 font-semibold border-t border-white/5 pt-1.5">
                <span>Maximum Allowed Resale Cap:</span>
                <span>{formatEth(selectedTicket.event.maxResalePrice)} ETH</span>
              </div>
            </div>

            <form onSubmit={submitResaleListing} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1">
                  Your Resale Asking Price (ETH) *
                </label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={resalePriceEth}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>≈ ₹{ethToInr(resalePriceEth)}</span>
                  <span>Platform fee: 2.5%</span>
                </div>
              </div>

              {priceError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{priceError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!!priceError || txState.status === "pending"}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white font-semibold text-xs shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Tag className="w-4 h-4" />
                <span>Confirm Resale Listing</span>
              </button>
            </form>
          </div>
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