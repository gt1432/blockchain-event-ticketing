import React, { useState } from "react";
import { Wallet, LogOut, ChevronDown, CheckCircle2 } from "lucide-react";
import { WalletState } from "../types";
import { formatAddress, SUPPORTED_NETWORKS } from "../services/web3Service";

interface WalletButtonProps {
  wallet: WalletState;
  onConnect: () => void;
  onDisconnect: () => void;
  onSwitchNetwork: (chainId: number) => void;
  compact?: boolean;
}

export const WalletButton: React.FC<WalletButtonProps> = ({
  wallet,
  onConnect,
  onDisconnect,
  onSwitchNetwork,
  compact = false,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!wallet.isConnected) {
    return (
      <button
        onClick={onConnect}
        disabled={wallet.isConnecting}
        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-purple-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
      >
        <Wallet className="w-4 h-4" />
        <span>{wallet.isConnecting ? "Connecting..." : "Connect MetaMask"}</span>
      </button>
    );
  }

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