import React, { useState } from "react";
import QRCode from "react-qr-code";
import { TicketItem } from "../types";
import { formatEth, ethToInr, formatAddress, generateTicketQRData, CONTRACT_ADDRESS } from "../services/web3Service";
import { Calendar, MapPin, ShieldCheck, QrCode, Tag, CheckCircle2, AlertOctagon } from "lucide-react";

interface TicketCardProps {
  ticket: TicketItem;
  chainId: number | null;
  onListResale?: (tokenId: number) => void;
  onCancelResale?: (tokenId: number) => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  chainId,
  onListResale,
  onCancelResale,
}) => {
  const [showQR, setShowQR] = useState(false);

  const event = ticket.event;
  const eventDate = event ? new Date(event.date * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }) : "Unknown Date";

  const qrData = generateTicketQRData(
    CONTRACT_ADDRESS,
    chainId || 31337,
    ticket.eventId,
    ticket.tokenId
  );

  return (
    <div className="glass-panel border border-white/10 rounded-3xl overflow-hidden shadow-xl transition-all hover:border-purple-500/40 flex flex-col relative">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-900/60 via-indigo-900/60 to-blue-900/60 p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span className="font-display font-bold text-sm tracking-wide text-white">ERC-721 NFT PASS</span>
        </div>
        <div className="flex items-center gap-2">
          {ticket.isRedeemed ? (
            <span className="bg-red-500/20 text-red-300 border border-red-500/30 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> REDEEMED
            </span>
          ) : ticket.isListedForResale ? (
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
              <Tag className="w-3 h-3" /> LISTED FOR RESALE
            </span>
          ) : (
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> VALID FOR ENTRY
            </span>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex justify-between items-start">
            <h3 className="font-display font-bold text-lg text-white">
              {event?.name || `Event #${ticket.eventId}`}
            </h3>
            <span className="font-mono text-xs font-semibold text-purple-300 px-2.5 py-1 bg-purple-500/10 rounded-lg border border-purple-500/20">
              Token #{ticket.tokenId}
            </span>
          </div>
          <div className="mt-3 space-y-1.5 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>{eventDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="line-clamp-1">{event?.venue || "Venue Details"}</span>
            </div>
          </div>
        </div>

        {/* Ownership & Price Metadata */}
        <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-1 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Original Purchaser</span>
            <span className="font-mono text-slate-200">{formatAddress(ticket.originalOwner)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Purchase Price</span>
            <span className="font-semibold text-white">
              {formatEth(ticket.purchasePrice)} ETH (≈ ₹{ethToInr(formatEth(ticket.purchasePrice))})
            </span>
          </div>
          {ticket.isListedForResale && (
            <div className="flex justify-between text-amber-300 font-semibold pt-1 border-t border-white/5">
              <span>Resale Asking Price</span>
              <span>{formatEth(ticket.resalePrice)} ETH</span>
            </div>
          )}
        </div>

        {/* QR Code Section */}
        {showQR ? (
          <div className="p-4 bg-white rounded-2xl flex flex-col items-center justify-center space-y-2 animate-fadeIn">
            <div className="p-2 bg-white rounded-xl">
              <QRCode value={qrData} size={160} />
            </div>
            <p className="text-[10px] text-slate-600 font-mono text-center">
              Scan at door with TicketChain scanner
            </p>
            <button
              onClick={() => setShowQR(false)}
              className="text-xs text-purple-600 font-bold hover:underline"
            >
              Hide QR Code
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowQR(true)}
            className="w-full py-3 bg-gradient-to-r from-purple-600/30 via-indigo-600/30 to-blue-600/30 hover:from-purple-600/40 hover:to-blue-600/40 border border-purple-500/30 rounded-2xl flex items-center justify-center gap-2 text-xs font-semibold text-purple-200 transition-all"
          >
            <QrCode className="w-4 h-4 text-purple-400" />
            <span>Show Verification QR Code</span>
          </button>
        )}

        {/* Anti-Scalping Resale Action Buttons */}
        {!ticket.isRedeemed && (
          <div className="pt-2 border-t border-white/10 flex items-center gap-2">
            {ticket.isListedForResale ? (
              <button
                onClick={() => onCancelResale?.(ticket.tokenId)}
                className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-semibold text-xs rounded-xl transition-colors"
              >
                Cancel Resale Listing
              </button>
            ) : (
              <button
                onClick={() => onListResale?.(ticket.tokenId)}
                className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>List for Resale (Price Capped)</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};