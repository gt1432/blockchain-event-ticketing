import React, { useState } from "react";
import { Wallet, LogOut, ChevronDown, CheckCircle2, Sparkles, User, Briefcase, ShieldCheck, Zap } from "lucide-react";
import { WalletState, DemoRole } from "../types";
import { formatAddress, SUPPORTED_NETWORKS, DEMO_ACCOUNTS } from "../services/web3Service";

interface WalletButtonProps {
  wallet: WalletState;
  onConnect: () => void;
  onConnectDemo: (role: DemoRole) => void;
  onDisconnect: () => void;
  onSwitchNetwork: (chainId: number) => void;
  compact?: boolean;
}

export const WalletButton: React.FC<WalletButtonProps> = ({
  wallet,
  onConnect,
  onConnectDemo,
  onDisconnect,
  onSwitchNetwork,
  compact = false,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);

  // If completely disconnected
  if (!wallet.isConnected) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={onConnect}
          disabled={wallet.isConnecting}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white font-semibold text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-lg shadow-purple-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          title="Connect with your MetaMask extension"
        >
          <Wallet className="w-4 h-4" />
          <span>{wallet.isConnecting ? "Connecting..." : "Connect MetaMask"}</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setDemoMenuOpen(!demoMenuOpen)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-cyan-500/20 hover:from-amber-500/30 hover:to-cyan-500/30 text-cyan-200 border border-cyan-500/40 font-semibold text-xs sm:text-sm px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl shadow-md transition-all backdrop-blur-md"
            title="Instant 1-Click Demo Mode without needing MetaMask"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Demo Mode</span>
            <ChevronDown className="w-3 h-3 text-cyan-400" />
          </button>

          {demoMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 glass-panel border border-cyan-500/30 rounded-2xl p-2.5 shadow-2xl z-50 space-y-1.5 backdrop-blur-xl bg-[#0b0f19]/95">
              <div className="p-2 border-b border-white/10 text-left">
                <p className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Select Demo Persona
                </p>
                <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                  Test buying passes, creating events & gate redemption with 1 click.
                </p>
              </div>

              <button
                onClick={() => {
                  onConnectDemo("attendee");
                  setDemoMenuOpen(false);
                }}
                className="w-full text-left p-2 rounded-xl hover:bg-white/10 text-xs text-slate-200 flex items-center gap-2.5 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold text-white">Attendee (Alice)</div>
                  <div className="text-[10px] text-slate-400">Buy tickets & view NFT passes</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onConnectDemo("organizer");
                  setDemoMenuOpen(false);
                }}
                className="w-full text-left p-2 rounded-xl hover:bg-white/10 text-xs text-slate-200 flex items-center gap-2.5 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0">
                  <Briefcase className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold text-white">Organizer (Bob)</div>
                  <div className="text-[10px] text-slate-400">Publish events & configure caps</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onConnectDemo("verifier");
                  setDemoMenuOpen(false);
                }}
                className="w-full text-left p-2 rounded-xl hover:bg-white/10 text-xs text-slate-200 flex items-center gap-2.5 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold text-white">Gate Staff (Verifier)</div>
                  <div className="text-[10px] text-slate-400">Door QR scanner & check-in</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // If connected in Demo Mode
  if (wallet.isDemo) {
    const roleInfo = DEMO_ACCOUNTS[wallet.demoRole || "attendee"] || DEMO_ACCOUNTS.attendee;

    return (
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-cyan-500/40 bg-gradient-to-r from-purple-900/40 to-cyan-900/40 text-xs sm:text-sm font-medium hover:border-cyan-400 transition-all shadow-md shadow-cyan-500/10"
        >
          <span className="flex items-center gap-1 text-amber-300 font-bold text-[11px] bg-amber-400/20 px-1.5 py-0.5 rounded-md border border-amber-400/30">
            <Zap className="w-3 h-3 fill-amber-300" />
            DEMO
          </span>

          <span className="text-white font-semibold">
            {wallet.demoRole === "organizer" ? "Organizer (Bob)" : wallet.demoRole === "verifier" ? "Gate Staff" : "Attendee (Alice)"}
          </span>

          <span className="font-mono text-slate-300 text-xs hidden sm:inline">
            ({formatAddress(wallet.address || "")})
          </span>

          <ChevronDown className="w-3.5 h-3.5 text-cyan-300" />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-72 glass-panel border border-cyan-500/30 rounded-2xl p-3 shadow-2xl z-50 space-y-2.5 bg-[#0b0f19]/95 backdrop-blur-xl">
            <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/20 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-cyan-300 uppercase font-bold tracking-wider">Active Demo Account</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">Simulation Mode</span>
              </div>
              <p className="text-xs font-bold text-white">{roleInfo.name}</p>
              <p className="text-[11px] font-mono text-slate-300 break-all">{wallet.address}</p>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] text-slate-400 px-1 font-semibold uppercase">Switch Demo Persona</p>

              <button
                onClick={() => {
                  onConnectDemo("attendee");
                  setDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                  wallet.demoRole === "attendee" ? "bg-purple-600/30 text-purple-200 border border-purple-500/30" : "text-slate-300 hover:bg-white/5"
                }`}
              >
                <span>Attendee (Alice) - Buy Passes</span>
                {wallet.demoRole === "attendee" && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
              </button>

              <button
                onClick={() => {
                  onConnectDemo("organizer");
                  setDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                  wallet.demoRole === "organizer" ? "bg-indigo-600/30 text-indigo-200 border border-indigo-500/30" : "text-slate-300 hover:bg-white/5"
                }`}
              >
                <span>Organizer (Bob) - Create Events</span>
                {wallet.demoRole === "organizer" && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
              </button>

              <button
                onClick={() => {
                  onConnectDemo("verifier");
                  setDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                  wallet.demoRole === "verifier" ? "bg-emerald-600/30 text-emerald-200 border border-emerald-500/30" : "text-slate-300 hover:bg-white/5"
                }`}
              >
                <span>Gate Staff - Door Scanner</span>
                {wallet.demoRole === "verifier" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            </div>

            <div className="pt-1 border-t border-white/10 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  onConnect();
                  setDropdownOpen(false);
                }}
                className="text-[11px] text-purple-300 hover:text-white transition-colors"
              >
                Connect MetaMask
              </button>

              <button
                onClick={() => {
                  onDisconnect();
                  setDropdownOpen(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors border border-rose-500/20"
              >
                <LogOut className="w-3 h-3" />
                <span>Exit Demo</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Real MetaMask
  const currentNetwork = wallet.chainId ? SUPPORTED_NETWORKS[wallet.chainId] : null;
  const isUnsupported = !currentNetwork;

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all ${
          isUnsupported
            ? "bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20"
            : "glass-card border-white/10 hover:border-purple-500/40 text-slate-200"
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isUnsupported ? "bg-red-400 animate-ping" : "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
          }`}
        />

        {!compact && (
          <span className="text-xs text-slate-400 border-r border-white/10 pr-2">
            {currentNetwork?.name || "Unsupported"}
          </span>
        )}

        <span className="font-mono font-semibold text-slate-100">
          {formatAddress(wallet.address || "")}
        </span>

        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 glass-panel border border-white/15 rounded-2xl p-3 shadow-2xl z-50 space-y-2">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <p className="text-[11px] text-slate-400 uppercase font-semibold">Active Account</p>
            <p className="text-xs font-mono text-slate-200 break-all">{wallet.address}</p>
            <div className="flex flex-wrap gap-1 pt-1">
              {wallet.isAdmin && (
                <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-md border border-red-500/30">Admin</span>
              )}
              {wallet.isOrganizer && (
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-md border border-purple-500/30">Organizer</span>
              )}
              {wallet.isVerifier && (
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-md border border-blue-500/30">Staff Verifier</span>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[11px] text-slate-400 px-1 font-semibold uppercase">Switch Network</p>
            {Object.entries(SUPPORTED_NETWORKS).map(([cid, net]) => {
              const numId = Number(cid);
              const isSelected = wallet.chainId === numId;
              return (
                <button
                  key={cid}
                  onClick={() => {
                    onSwitchNetwork(numId);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                    isSelected
                      ? "bg-purple-600/30 text-purple-200 border border-purple-500/30"
                      : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  <span>{net.name}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              onDisconnect();
              setDropdownOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors border border-transparent hover:border-rose-500/20"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Disconnect Session</span>
          </button>
        </div>
      )}
    </div>
  );
};
