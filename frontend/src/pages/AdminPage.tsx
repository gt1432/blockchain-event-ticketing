import React, { useState } from "react";
import { ShieldCheck, UserCheck, UserX, Loader2 } from "lucide-react";
import { WalletState } from "../types";
import {
  grantOrganizerRole,
  revokeOrganizerRole,
  setVerifierRole,
} from "../services/web3Service";
import { useTransaction } from "../hooks/useTransaction";
import { TransactionModal } from "../components/TransactionModal";

interface AdminPageProps {
  wallet: WalletState;
}

export const AdminPage: React.FC<AdminPageProps> = ({ wallet }) => {
  const [organizerTarget, setOrganizerTarget] = useState("");
  const [verifierTarget, setVerifierTarget] = useState("");

  const { txState, execute, reset } = useTransaction();

  const handleGrantOrganizer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizerTarget) return;
    try {
      await execute(
        () => grantOrganizerRole(organizerTarget),
        `Granting ORGANIZER_ROLE to ${organizerTarget}...`
      );
      setOrganizerTarget("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleRevokeOrganizer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizerTarget) return;
    try {
      await execute(
        () => revokeOrganizerRole(organizerTarget),
        `Revoking ORGANIZER_ROLE from ${organizerTarget}...`
      );
      setOrganizerTarget("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleGrantVerifier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifierTarget) return;
    try {
      await execute(
        () => setVerifierRole(verifierTarget, true),
        `Granting VERIFIER_ROLE to ${verifierTarget}...`
      );
      setVerifierTarget("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-10 space-y-8">
      <div className="space-y-2">
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-white">Platform Administration</h1>
        <p className="text-sm text-slate-400">
          Manage system-level AccessControl roles for organizers and gate verifiers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Organizer Roles */}
        <div className="glass-panel border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
          <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-purple-400" />
            <span>Manage Organizers</span>
          </h2>
          <form className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Target Ethereum Address</label>
              <input
                type="text"
                placeholder="0x..."
                value={organizerTarget}
                onChange={(e) => setOrganizerTarget(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleGrantOrganizer}
                disabled={txState.status === "pending" || !organizerTarget}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-xs"
              >
                Grant Organizer
              </button>
              <button
                type="button"
                onClick={handleRevokeOrganizer}
                disabled={txState.status === "pending" || !organizerTarget}
                className="py-2.5 px-4 bg-red-600/30 hover:bg-red-600/40 text-red-300 border border-red-500/30 font-semibold rounded-xl text-xs"
              >
                Revoke
              </button>
            </div>
          </form>
        </div>

        {/* Verifier Roles */}
        <div className="glass-panel border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
          <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <span>Manage Door Verifiers</span>
          </h2>
          <form onSubmit={handleGrantVerifier} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Target Ethereum Address</label>
              <input
                type="text"
                placeholder="0x..."
                value={verifierTarget}
                onChange={(e) => setVerifierTarget(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>
            <button
              type="submit"
              disabled={txState.status === "pending" || !verifierTarget}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-xs"
            >
              Grant Verifier Access
            </button>
          </form>
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