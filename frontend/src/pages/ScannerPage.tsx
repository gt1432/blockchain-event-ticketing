import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  QrCode,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Camera,
  RefreshCw,
  Loader2,
  Lock,
} from "lucide-react";
import { WalletState, VerificationResult } from "../types";
import {
  getReadOnlyContract,
  redeemTicket,
  formatAddress,
  CONTRACT_ADDRESS,
  checkUserRoles,
} from "../services/web3Service";
import { useTransaction } from "../hooks/useTransaction";
import { TransactionModal } from "../components/TransactionModal";

interface ScannerPageProps {
  wallet: WalletState;
}

export const ScannerPage: React.FC<ScannerPageProps> = ({ wallet }) => {
  const [scannerActive, setScannerActive] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const { txState, execute, reset } = useTransaction();

  // Handle QR scanning
  const startCamera = async () => {
    try {
      const qrScanner = new Html5Qrcode("reader");
      html5QrCodeRef.current = qrScanner;

      await qrScanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          stopCamera();
          verifyTicketData(decodedText);
        },
        () => {}
      );
      setScannerActive(true);
    } catch (err) {
      console.error("Camera start error:", err);
      alert("Unable to open camera. You can paste or type the ticket QR JSON code manually.");
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && scannerActive) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn("Camera stop error:", err);
      }
      setScannerActive(false);
    }
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const verifyTicketData = async (rawString: string) => {
    setVerifying(true);
    setResult(null);

    try {
      // 1. Parse JSON
      let data: any;
      try {
        data = JSON.parse(rawString);
      } catch {
        setResult({
          status: "INVALID_TICKET",
          message: "QR code data is corrupted or does not match TicketChain protocol.",
        });
        setVerifying(false);
        return;
      }

      const { token, event, contract: qrContract } = data;
      if (!token || !event) {
        setResult({
          status: "INVALID_TICKET",
          message: "Missing token or event identifiers in QR data.",
        });
        setVerifying(false);
        return;
      }

      // Check contract address matching
      if (qrContract && qrContract.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) {
        setResult({
          status: "INVALID_TICKET",
          message: "Ticket belongs to a different or counterfeit smart contract.",
        });
        setVerifying(false);
        return;
      }

      // 2. Query Blockchain directly
      const contract = await getReadOnlyContract();
      const ticketDetails = await contract.getTicketDetails(token);
      const eventDetails = await contract.getEventDetails(ticketDetails.eventId);
      const currentOwner = await contract.getTicketOwner(token);

      // Check verifier role of the currently connected wallet
      if (wallet.address) {
        const roles = await checkUserRoles(wallet.address);
        if (!roles.isVerifier && !roles.isAdmin) {
          setResult({
            status: "UNAUTHORIZED_VERIFIER",
            message: "Connected wallet is NOT authorized as a staff verifier. Only VERIFIER_ROLE can redeem.",
            tokenId: Number(ticketDetails.tokenId),
            eventId: Number(ticketDetails.eventId),
            eventName: eventDetails.name,
            owner: currentOwner,
            isRedeemed: ticketDetails.isRedeemed,
          });
          setVerifying(false);
          return;
        }
      }

      // 3. Check redemption status
      if (ticketDetails.isRedeemed) {
        setResult({
          status: "ALREADY_USED",
          message: "DUPLICATE ENTRY DETECTED! This ticket has already been redeemed at the door.",
          tokenId: Number(ticketDetails.tokenId),
          eventId: Number(ticketDetails.eventId),
          eventName: eventDetails.name,
          owner: currentOwner,
          isRedeemed: true,
        });
      } else {
        setResult({
          status: "VALID",
          message: "TICKET PASS VALIDATED! Genuine ERC-721 NFT verified directly on Ethereum blockchain.",
          tokenId: Number(ticketDetails.tokenId),
          eventId: Number(ticketDetails.eventId),
          eventName: eventDetails.name,
          owner: currentOwner,
          isRedeemed: false,
        });
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      setResult({
        status: "INVALID_TICKET",
        message: err?.message || "Token ID not found on smart contract.",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleRedeemTicket = async () => {
    if (!result || !result.tokenId) return;
    try {
      await execute(
        () => redeemTicket(result.tokenId!),
        `Redeeming Ticket #${result.tokenId} on-chain for gate entry...`
      );
      // Update result to already used
      setResult((prev) =>
        prev
          ? {
              ...prev,
              status: "ALREADY_USED",
              isRedeemed: true,
              message: "Successfully redeemed on blockchain! Attendee granted entrance.",
            }
          : null
      );
    } catch (err) {
      console.error("Redemption error:", err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2 text-center max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Event Gate Verifier Mode</span>
        </div>
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-white">
          Ticket QR Scanner & Gate Redemption
        </h1>
        <p className="text-sm text-slate-400">
          Verify attendee NFT ownership on-chain in real time and execute cryptographic gate redemption.
        </p>
      </div>

      {/* Staff Verifier Badge Warning */}
      {wallet.isConnected && !wallet.isVerifier && !wallet.isAdmin && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <strong className="text-white">Note:</strong> Your wallet ({formatAddress(wallet.address || "")}) is not an authorized verifier yet. You can scan and inspect tickets, but calling on-chain <code className="bg-black/30 px-1 rounded">redeemTicket()</code> requires an organizer to grant you the <code className="bg-black/30 px-1 rounded">VERIFIER_ROLE</code>.
          </div>
        </div>
      )}

      {/* Camera / Manual Input Card */}
      <div className="glass-panel border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-white/10">
          <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-purple-400" />
            <span>Door Scanner</span>
          </h2>

          <div className="flex items-center gap-2">
            {scannerActive ? (
              <button
                onClick={stopCamera}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-xl transition-all"
              >
                Stop Camera
              </button>
            ) : (
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Start Camera Scanner</span>
              </button>
            )}
          </div>
        </div>

        {/* Camera Video Viewport */}
        <div
          id="reader"
          className={`w-full max-w-sm mx-auto overflow-hidden rounded-2xl bg-black/60 ${
            scannerActive ? "border-2 border-purple-500/50 block" : "hidden"
          }`}
        />

        {/* Manual Test Input (For environments without physical camera) */}
        <div className="space-y-3 pt-2">
          <div className="text-xs text-slate-300 font-semibold flex items-center justify-between">
            <span>Manual QR Input / Token Lookup</span>
            <span className="text-[11px] text-slate-500">Test or fallback input</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder='Paste ticket QR JSON or {"token": 1, "event": 1}'
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={() => verifyTicketData(manualInput)}
              disabled={verifying || !manualInput}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold text-xs rounded-xl shadow-md disabled:opacity-50 flex items-center gap-1.5"
            >
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>Verify</span>
            </button>
          </div>
        </div>
      </div>

      {/* Verification Result Card */}
      {result && (
        <div
          className={`glass-panel rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl border transition-all animate-fadeIn ${
            result.status === "VALID"
              ? "border-emerald-500/50 bg-emerald-500/5"
              : result.status === "ALREADY_USED"
              ? "border-red-500/50 bg-red-500/5"
              : result.status === "UNAUTHORIZED_VERIFIER"
              ? "border-amber-500/50 bg-amber-500/5"
              : "border-rose-500/50 bg-rose-500/5"
          }`}
        >
          {/* Status Header */}
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                result.status === "VALID"
                  ? "bg-emerald-500 text-white shadow-emerald-500/30"
                  : result.status === "ALREADY_USED"
                  ? "bg-red-500 text-white shadow-red-500/30"
                  : result.status === "UNAUTHORIZED_VERIFIER"
                  ? "bg-amber-500 text-white shadow-amber-500/30"
                  : "bg-rose-500 text-white shadow-rose-500/30"
              }`}
            >
              {result.status === "VALID" && <CheckCircle2 className="w-8 h-8" />}
              {result.status === "ALREADY_USED" && <XCircle className="w-8 h-8" />}
              {result.status === "UNAUTHORIZED_VERIFIER" && <Lock className="w-8 h-8" />}
              {result.status === "INVALID_TICKET" && <AlertTriangle className="w-8 h-8" />}
            </div>

            <div>
              <div
                className={`font-display font-extrabold text-2xl uppercase tracking-wider ${
                  result.status === "VALID"
                    ? "text-emerald-400"
                    : result.status === "ALREADY_USED"
                    ? "text-red-400"
                    : result.status === "UNAUTHORIZED_VERIFIER"
                    ? "text-amber-400"
                    : "text-rose-400"
                }`}
              >
                {result.status === "VALID" && "ENTRY APPROVED (VALID)"}
                {result.status === "ALREADY_USED" && "ENTRY DENIED (ALREADY USED)"}
                {result.status === "UNAUTHORIZED_VERIFIER" && "UNAUTHORIZED VERIFIER ROLE"}
                {result.status === "INVALID_TICKET" && "ENTRY DENIED (INVALID TICKET)"}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">{result.message}</p>
            </div>
          </div>

          {/* Ticket Breakdown */}
          {result.tokenId && (
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Token ID</span>
                <div className="font-bold text-white">#{result.tokenId}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Event ID</span>
                <div className="font-bold text-white">#{result.eventId}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Current Owner</span>
                <div className="font-bold text-cyan-300 truncate">{formatAddress(result.owner || "")}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Status</span>
                <div
                  className={`font-bold ${
                    result.isRedeemed ? "text-red-400" : "text-emerald-400"
                  }`}
                >
                  {result.isRedeemed ? "REDEEMED" : "UNREDEEMED"}
                </div>
              </div>
            </div>
          )}

          {/* Door Staff Action: Redeem on Blockchain */}
          {result.status === "VALID" && (
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Admit attendee and mark token as consumed in smart contract:
              </span>
              <button
                onClick={handleRedeemTicket}
                disabled={txState.status === "pending"}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-display font-bold text-xs rounded-xl shadow-xl shadow-emerald-500/25 transition-all flex items-center gap-2"
              >
                {txState.status === "pending" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Redeeming on Chain...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Redeem Ticket at Gate</span>
                  </>
                )}
              </button>
            </div>
          )}
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