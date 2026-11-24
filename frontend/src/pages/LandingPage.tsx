import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Ticket,
  ShieldCheck,
  TrendingDown,
  QrCode,
  Sparkles,
  ArrowRight,
  Lock,
  Zap,
  CheckCircle2,
  Users,
} from "lucide-react";
import { WalletState, EventItem } from "../types";
import { fetchAllEvents } from "../services/web3Service";
import { EventCard } from "../components/EventCard";

interface LandingPageProps {
  wallet: WalletState;
  onConnect: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ wallet, onConnect }) => {
  const [featuredEvents, setFeaturedEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllEvents().then((evs) => {
      setFeaturedEvents(evs.slice(0, 3));
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-24 pb-20 overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 lg:px-8 max-w-7xl mx-auto">
        {/* Glow ambient background elements */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-purple-600/20 via-indigo-600/20 to-blue-600/20 blur-[120px] pointer-events-none rounded-full" />

        <div className="text-center space-y-6 max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-purple-500/30 text-purple-300 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Smart Contract Powered • Built on Ethereum & ERC-721</span>
          </div>

          <h1 className="font-display font-extrabold text-4xl sm:text-6xl lg:text-7xl tracking-tight text-white leading-[1.1]">
            Decentralized Event Passes with{" "}
            <span className="gradient-text">Zero Scalping</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Eliminate counterfeit tickets, secondary market price gouging, and unauthorized transfers.
            Every ticket is an immutable NFT protected by cryptographic rules and verified via secure QR codes.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/events"
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white font-semibold text-sm px-6 py-3.5 rounded-2xl shadow-xl shadow-purple-500/25 transition-all transform hover:scale-[1.02]"
            >
              <span>Explore Events</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {!wallet.isConnected ? (
              <button
                onClick={onConnect}
                className="flex items-center gap-2 glass-card hover:bg-white/10 text-slate-200 border border-white/15 font-semibold text-sm px-6 py-3.5 rounded-2xl transition-all"
              >
                <span>Connect MetaMask</span>
              </button>
            ) : (
              <Link
                to="/my-tickets"
                className="flex items-center gap-2 glass-card hover:bg-white/10 text-slate-200 border border-white/15 font-semibold text-sm px-6 py-3.5 rounded-2xl transition-all"
              >
                <Ticket className="w-4 h-4 text-purple-400" />
                <span>View My Tickets</span>
              </Link>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-12 border-t border-white/10 max-w-3xl mx-auto">
            <div>
              <div className="font-display font-bold text-2xl text-white">0%</div>
              <div className="text-xs text-slate-400">Counterfeit Risk</div>
            </div>
            <div>
              <div className="font-display font-bold text-2xl text-cyan-400">Enforced</div>
              <div className="text-xs text-slate-400">Price Resale Caps</div>
            </div>
            <div>
              <div className="font-display font-bold text-2xl text-purple-400">Instant</div>
              <div className="text-xs text-slate-400">Staff QR Scanning</div>
            </div>
            <div>
              <div className="font-display font-bold text-2xl text-emerald-400">100%</div>
              <div className="text-xs text-slate-400">On-Chain Ownership</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Live On Chain</span>
            <h2 className="font-display font-bold text-3xl text-white mt-1">Featured Events</h2>
          </div>
          <Link
            to="/events"
            className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 font-semibold"
          >
            <span>Browse All Events</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-96 glass-panel rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : featuredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredEvents.map((ev) => (
              <EventCard key={ev.id} event={ev} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 glass-panel rounded-3xl border border-white/10 space-y-4">
            <Ticket className="w-12 h-12 text-slate-500 mx-auto" />
            <h3 className="font-display font-bold text-lg text-white">No Events Published Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Be the first organizer to deploy an event onto the Ethereum network!
            </p>
            <Link
              to="/organizer"
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-lg"
            >
              <span>Create Event in Organizer Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </section>

      {/* Why Anti-Scalping Matters */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="glass-panel border border-purple-500/20 rounded-3xl p-8 lg:p-12 relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
                The Scalping Problem Solved
              </span>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">
                How Blockchain Enforces <span className="gradient-text">Fair Prices</span>
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Traditional ticketing platforms suffer from ticket bots that scoop up inventory and resell it
                at 300% to 1000% markups. With TicketChain, the smart contract itself overrides standard ERC-721
                transfer hooks.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Smart Contract Maximum Price Limit</h4>
                    <p className="text-xs text-slate-400">
                      Organizers define the maximum allowable resale price. Any listing above this threshold is immediately reverted by the Ethereum Virtual Machine.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Direct Transfer Lockout</h4>
                    <p className="text-xs text-slate-400">
                      Standard ERC-721 wallet-to-wallet transfers are disabled. Tickets can only be traded through the built-in verified marketplace, eliminating black-market cash deals.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Atomic Settlement & Fair Royalties</h4>
                    <p className="text-xs text-slate-400">
                      Funds and NFT ownership transfer atomically within the same transaction. No escrow disputes, chargebacks, or bounced payments.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Example Card */}
            <div className="glass-card border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-xs font-bold text-slate-300">Smart Contract Simulation</span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 font-mono px-2 py-0.5 rounded">
                  EventTicketing.sol
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-white/5 flex justify-between items-center">
                  <span className="text-slate-400">Original Mint Price:</span>
                  <span className="text-white font-bold">0.0500 ETH (₹12,500)</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 flex justify-between items-center">
                  <span className="text-slate-400">Allowed Resale Ceiling:</span>
                  <span className="text-cyan-300 font-bold">0.0600 ETH (+20% max)</span>
                </div>
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex justify-between items-center">
                  <span className="text-red-300">Scalper Asks 0.2000 ETH:</span>
                  <span className="text-red-400 font-bold">REVERT: Exceeds Max</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex justify-between items-center">
                  <span className="text-emerald-300">Fair Fan Lists at 0.0550 ETH:</span>
                  <span className="text-emerald-400 font-bold">APPROVED & LISTED</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Steps Section */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 space-y-10">
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Seamless Experience</span>
          <h2 className="font-display font-bold text-3xl text-white">How It Works in 3 Steps</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel border border-white/10 rounded-3xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-display font-bold text-xl border border-purple-500/30">
              1
            </div>
            <h3 className="font-display font-bold text-lg text-white">Buy with MetaMask</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Browse verified events, select your ticket quantity, and sign the transaction via MetaMask. An ERC-721 NFT is minted directly to your wallet address.
            </p>
          </div>

          <div className="glass-panel border border-white/10 rounded-3xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-display font-bold text-xl border border-cyan-500/30">
              2
            </div>
            <h3 className="font-display font-bold text-lg text-white">Resell Fairly if Plans Change</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Cannot attend? List your ticket on our marketplace with one click. The smart contract ensures your price stays within the organizer's fair maximum resale limit.
            </p>
          </div>

          <div className="glass-panel border border-white/10 rounded-3xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-display font-bold text-xl border border-emerald-500/30">
              3
            </div>
            <h3 className="font-display font-bold text-lg text-white">Show QR at Door & Enter</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Present your ticket's dynamic QR code. Authorized door staff scan using our built-in camera verifier, checking token ownership on-chain and redeeming it immediately.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};