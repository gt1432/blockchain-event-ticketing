import React from "react";
import { Loader2, CheckCircle2, XCircle, ExternalLink, X } from "lucide-react";
import { TransactionState } from "../types";
import { getExplorerUrl } from "../services/web3Service";

interface TransactionModalProps {
  txState: TransactionState;
  chainId: number | null;
  onClose: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  txState,
  chainId,
  onClose,
}) => {
  if (txState.status === "idle") return null;

  const explorerUrl = chainId && txState.hash ? getExplorerUrl(chainId, txState.hash) : "#";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel border border-white/15 rounded-3xl p-6 max-w-md w-full relative shadow-2xl text-center space-y-4">
        {txState.status !== "pending" && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {txState.status === "pending" && (
          <div className="py-4 space-y-3">
            <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <h3 className="font-display font-bold text-lg text-white">Blockchain Transaction Pending</h3>
            <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
              {txState.description || "Please approve the transaction in MetaMask and wait for block confirmation."}
            </p>
          </div>
        )}

        {txState.status === "success" && (
          <div className="py-4 space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-display font-bold text-lg text-white">Transaction Confirmed!</h3>
            <p className="text-xs text-slate-300 max-w-xs mx-auto">
              Smart contract executed successfully on the blockchain network.
            </p>
          </div>
        )}

        {txState.status === "error" && (
          <div className="py-4 space-y-3">
            <div className="w-16 h-16 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <XCircle className="w-8 h-8" />
            </div>
            <h3 className="font-display font-bold text-lg text-white">Transaction Failed</h3>
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-left">
              <p className="text-xs font-mono text-rose-300 break-words max-h-32 overflow-y-auto">
                {txState.error}
              </p>
            </div>
          </div>
        )}

        {txState.hash && (
          <div className="pt-2 border-t border-white/10 text-xs">
            <a
              href={explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-mono underline"
            >
              <span>View On Explorer ({txState.hash.slice(0, 10)}...{txState.hash.slice(-8)})</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {txState.status !== "pending" && (
          <button
            onClick={onClose}
            className="w-full bg-white/10 hover:bg-white/15 text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
};