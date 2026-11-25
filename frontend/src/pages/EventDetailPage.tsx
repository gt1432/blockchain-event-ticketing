import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Sparkles,
  Calendar,
  MapPin,
  Ticket,
  ShieldCheck,
  TrendingDown,
  ArrowLeft,
  Loader2,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { EventItem, WalletState } from "../types";
import {
  fetchEventById,
  buyTicket,
  formatEth,
  ethToInr,
  formatAddress,
} from "../services/web3Service";
import { useTransaction } from "../hooks/useTransaction";
import { TransactionModal } from "../components/TransactionModal";

interface EventDetailPageProps {
  wallet: WalletState;
}

export const EventDetailPage: React.FC<EventDetailPageProps> = ({ wallet }) => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasedTokenId, setPurchasedTokenId] = useState<number | null>(null);

  const { txState, execute, reset } = useTransaction();

  const loadEvent = () => {
    if (eventId) {
      setLoading(true);
      fetchEventById(Number(eventId)).then((ev) => {
        setEvent(ev);
        setLoading(false);
      });
    }
  };

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-display font-bold text-2xl text-white">Event Not Found</h2>
        <p className="text-xs text-slate-400">
          The event ID requested does not exist or has not been deployed on the blockchain.
        </p>
        <Link
          to="/events"
          className="inline-flex items-center gap-2 bg-purple-600 text-white text-xs px-4 py-2 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </Link>
      </div>
    );
  }

  const isSoldOut = event.ticketsSold >= event.totalTickets;
  const isPast = event.date * 1000 < Date.now();
  const available = Math.max(0, event.totalTickets - event.ticketsSold);
  const percentSold = Math.min(100, Math.round((event.ticketsSold / event.totalTickets) * 100));

  const dateStr = new Date(event.date * 1000).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const ethPrice = formatEth(event.ticketPrice);
  const maxResaleEth = formatEth(event.maxResalePrice);

  const handlePurchase = async () => {
    if (!wallet.isConnected) {
      alert("Please connect MetaMask or select 'Demo Mode' -> Attendee (Alice) in the top navbar to test ticket purchase.");
      return;
    }

    try {
      await execute(
        () => buyTicket(event.id, event.ticketPrice),
        `Purchasing 1 NFT ticket for ${event.name}...`
      );
      // Reload event stats
      loadEvent();
    } catch (err) {
      console.error("Purchase failed:", err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-10 space-y-8">
      {/* Back link */}
      <Link
        to="/events"
        className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to all events
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Event Poster & Overview */}
        <div className="lg:col-span-7 space-y-6">
          <div className="relative h-96 rounded-3xl overflow-hidden glass-panel border border-white/10 bg-slate-900 shadow-2xl">
            <img
              src={event.imageURI}
              alt={event.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as any).src =
                  "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1000&q=80";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#070913] via-transparent to-transparent opacity-80" />

            <div className="absolute top-4 left-4">
              <span className="bg-purple-600/90 backdrop-blur-md text-white font-mono text-xs px-3 py-1 rounded-full font-bold">
                Event #{event.id}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white">
              {event.name}
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
              <div className="p-3.5 glass-card rounded-2xl flex items-center gap-3">
                <Calendar className="w-5 h-5 text-purple-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Date & Time</div>
                  <div className="font-medium text-white">{dateStr}</div>
                </div>
              </div>

              <div className="p-3.5 glass-card rounded-2xl flex items-center gap-3">
                <MapPin className="w-5 h-5 text-cyan-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Venue Location</div>
                  <div className="font-medium text-white">{event.venue}</div>
                </div>
              </div>
            </div>

            <div className="glass-panel border border-white/10 rounded-2xl p-5 space-y-2">
              <h3 className="font-display font-bold text-sm text-white">About the Event</h3>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>

            {/* Smart Contract Proof Details */}
            <div className="glass-panel border border-white/10 rounded-2xl p-5 space-y-3">
              <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>On-Chain Contract Specifications</span>
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-2.5 bg-white/5 rounded-xl">
                  <div className="text-[10px] text-slate-400 uppercase">Organizer Address</div>
                  <div className="text-slate-200 truncate">{formatAddress(event.organizer)}</div>
                </div>
                <div className="p-2.5 bg-white/5 rounded-xl">
                  <div className="text-[10px] text-slate-400 uppercase">Token Standard</div>
                  <div className="text-purple-300 font-bold">ERC-721 NFT</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Ticket Purchase Box */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel border border-purple-500/30 rounded-3xl p-6 space-y-6 shadow-2xl relative">
            <div className="border-b border-white/10 pb-4">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                Official Primary Sale
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-display font-extrabold text-3xl text-white">
                    {ethPrice} ETH
                  </span>
                  <span className="text-xs text-slate-400">≈ ₹{ethToInr(ethPrice)}</span>
                </div>
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  Face Value
                </span>
              </div>
            </div>

            {/* Availability progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Tickets Available</span>
                <span className="font-bold text-white">
                  {available} of {event.totalTickets} remaining
                </span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 rounded-full"
                  style={{ width: `${percentSold}%` }}
                />
              </div>
            </div>

            {/* Anti-Scalping Policy Notice */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border border-purple-500/20 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                <TrendingDown className="w-4 h-4 text-cyan-400" />
                <span>Anti-Scalping Rule Enforced</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                The smart contract prevents reselling this ticket above the maximum resale ceiling of{" "}
                <strong className="text-white">{maxResaleEth} ETH</strong> (≈ ₹{ethToInr(maxResaleEth)}).
                Direct peer transfers are locked to prevent scalper circumvention.
              </p>
            </div>

            {/* Purchase CTA */}
            {isSoldOut ? (
              <button
                disabled
                className="w-full py-3.5 rounded-2xl bg-red-500/20 text-red-300 border border-red-500/30 font-bold text-sm cursor-not-allowed"
              >
                Sold Out on Primary Market
              </button>
            ) : isPast ? (
              <button
                disabled
                className="w-full py-3.5 rounded-2xl bg-slate-800 text-slate-400 font-bold text-sm cursor-not-allowed"
              >
                Event has Concluded
              </button>
            ) : (
              <button
                onClick={handlePurchase}
                disabled={txState.status === "pending"}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white font-display font-bold text-sm shadow-xl shadow-purple-500/25 transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {txState.status === "pending" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Minting NFT Ticket...</span>
                  </>
                ) : (
                  <>
                    <Ticket className="w-4 h-4" />
                    <span>Purchase & Mint NFT Ticket</span>
                  </>
                )}
              </button>
            )}

            <div className="text-center text-[10px] text-slate-400">
              Transaction settles immediately on Ethereum. Ticket NFT will appear in "My Tickets".
            </div>

            {!wallet.isConnected && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center space-y-1">
                <p className="text-[11px] text-amber-200 font-semibold flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Testing without MetaMask?
                </p>
                <p className="text-[10px] text-slate-400">
                  Select <strong>Demo Mode</strong> in the top right to instantly test purchasing & minting this NFT ticket pass.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <TransactionModal
        txState={txState}
        chainId={wallet.chainId}
        onClose={reset}
      />
    </div>
  );
};