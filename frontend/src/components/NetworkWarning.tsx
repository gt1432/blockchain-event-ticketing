import React from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { WalletState } from "../types";

interface NetworkWarningProps {
  wallet: WalletState;
  onSwitch: (chainId: number) => void;
}

export const NetworkWarning: React.FC<NetworkWarningProps> = ({ wallet, onSwitch }) => {
  if (!wallet.isConnected || !wallet.error) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500/15 via-red-500/15 to-purple-500/15 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-200 flex items-center justify-between backdrop-blur-md">
      <div className="flex items-center gap-2 max-w-2xl mx-auto">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <span>{wallet.error}</span>
        <button
          onClick={() => onSwitch(31337)}
          className="ml-3 font-semibold underline hover:text-white flex items-center gap-1 text-cyan-300"
        >
          Switch to Hardhat Local (31337) <ArrowRight className="w-3 h-3" />
        </button>
        <span className="text-slate-500">or</span>
        <button
          onClick={() => onSwitch(11155111)}
          className="font-semibold underline hover:text-white text-purple-300"
        >
          Sepolia (11155111)
        </button>
      </div>
    </div>
  );
};