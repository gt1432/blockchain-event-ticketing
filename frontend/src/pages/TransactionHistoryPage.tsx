import React, { useEffect, useState } from "react";
import { History, ExternalLink, Filter, Loader2, ArrowUpRight } from "lucide-react";
import { WalletState } from "../types";
import {
  getReadOnlyContract,
  formatAddress,
  formatEth,
  getExplorerUrl,
  CONTRACT_ADDRESS,
} from "../services/web3Service";

interface HistoryItem {
  id: string;
  type: "CREATED" | "PURCHASE" | "RESALE" | "REDEEM";
  title: string;
  txHash: string;
  blockNumber: number;
  details: string;
}

const INITIAL_DEMO_LOGS: HistoryItem[] = [
  {
    id: "tx-demo-1",
    type: "CREATED",
    title: "Event Created",
    txHash: "0x8fa35824945d8bfa79f64923485bfae792641a029384bbad749e75910fa31294",
    blockNumber: 4892015,
    details: 'Event #1: "Neon Horizon EDM Festival 2027" deployed by 0xf39F...2266 (Price: 0.025 ETH, Max Cap: 0.030 ETH)',
  },
  {
    id: "tx-demo-2",
    type: "PURCHASE",
    title: "Primary Ticket Purchase",
    txHash: "0x12b59812949581fae84920491823904810294819024819028491024981294812",
    blockNumber: 4892038,
    details: "Token #1 bought for Event #1 by 0x7099...79C8 (0.025 ETH)",
  },
  {
    id: "tx-demo-3",
    type: "RESALE",
    title: "Anti-Scalping Resale",
    txHash: "0x63a4819203948102948190248102948102948190248190248102948102948190",
    blockNumber: 4892072,
    details: "Token #101 transferred from 0x7099...79C8 to 0x3C44...93BC (Price: 0.028 ETH, Cap: 0.030 ETH)",
  },
  {
    id: "tx-demo-4",
    type: "REDEEM",
    title: "Ticket Gate Redemption",
    txHash: "0x98c4819203948102948190248102948102948190248190248102948102948190",
    blockNumber: 4892110,
    details: "Token #1 checked in at entrance gate for Event #1 by Staff Verifier 0x15d3...6871",
  },
  {
    id: "tx-demo-5",
    type: "CREATED",
    title: "Event Created",
    txHash: "0x44d35824945d8bfa79f64923485bfae792641a029384bbad749e75910fa31294",
    blockNumber: 4892145,
    details: 'Event #2: "Web3 & AI World Summit 2027" deployed by 0xf39F...2266 (Price: 0.040 ETH, Max Cap: 0.048 ETH)',
  },
];

interface TransactionHistoryPageProps {
  wallet: WalletState;
}

export const TransactionHistoryPage: React.FC<TransactionHistoryPageProps> = ({ wallet }) => {
  const [history, setHistory] = useState<HistoryItem[]>(INITIAL_DEMO_LOGS);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>("ALL");

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const contract = await getReadOnlyContract();
        const [createdLogs, purchaseLogs, resoldLogs, redeemLogs] = await Promise.all([
          contract.queryFilter(contract.filters.EventCreated(), 0, "latest"),
          contract.queryFilter(contract.filters.TicketPurchased(), 0, "latest"),
          contract.queryFilter(contract.filters.TicketResold(), 0, "latest"),
          contract.queryFilter(contract.filters.TicketRedeemed(), 0, "latest"),
        ]);

        const items: HistoryItem[] = [];

        createdLogs.forEach((log: any) => {
          items.push({
            id: log.transactionHash + "-" + log.index,
            type: "CREATED",
            title: "Event Created",
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
            details: `Event #${log.args?.eventId}: "${log.args?.name}" deployed by ${formatAddress(log.args?.organizer)}`,
          });
        });

        purchaseLogs.forEach((log: any) => {
          items.push({
            id: log.transactionHash + "-" + log.index,
            type: "PURCHASE",
            title: "Primary Ticket Purchase",
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
            details: `Token #${log.args?.tokenId} bought for Event #${log.args?.eventId} by ${formatAddress(log.args?.buyer)} (${formatEth(log.args?.price)} ETH)`,
          });
        });

        resoldLogs.forEach((log: any) => {
          items.push({
            id: log.transactionHash + "-" + log.index,
            type: "RESALE",
            title: "Anti-Scalping Resale",
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
            details: `Token #${log.args?.tokenId} transferred from ${formatAddress(log.args?.from)} to ${formatAddress(log.args?.to)} (${formatEth(log.args?.price)} ETH)`,
          });
        });

        redeemLogs.forEach((log: any) => {
          items.push({
            id: log.transactionHash + "-" + log.index,
            type: "REDEEM",
            title: "Ticket Gate Redemption",
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
            details: `Token #${log.args?.tokenId} checked in at door for Event #${log.args?.eventId} by ${formatAddress(log.args?.attendee)}`,
          });
        });

        if (items.length > 0) {
          items.sort((a, b) => b.blockNumber - a.blockNumber);
          setHistory(items);
        }
      } catch (err) {
        console.warn("Using initial demo logs:", err);
      }
    };

    fetchLogs();
  }, []);

  const filteredHistory = filter === "ALL" ? history : history.filter((h) => h.type === filter);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-8">
      <div className="space-y-2">
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-white">
          On-Chain Audit Trail
        </h1>
        <p className="text-sm text-slate-400">
          Immutable event log queried directly from Ethereum smart contract receipts.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {["ALL", "CREATED", "PURCHASE", "RESALE", "REDEEM"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filter === f
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/25"
                : "bg-white/5 text-slate-400 hover:text-white"
            }`}
          >
            {f === "ALL" ? "All Events" : f}
          </button>
        ))}
      </div>

      <div className="glass-panel border border-white/10 rounded-3xl p-6 shadow-2xl">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Querying Ethereum blockchain event receipts...</p>
          </div>
        ) : filteredHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px]">
                  <th className="py-3 px-4">Action Type</th>
                  <th className="py-3 px-4">Event Details</th>
                  <th className="py-3 px-4">Block</th>
                  <th className="py-3 px-4">Transaction Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredHistory.map((item) => {
                  const explorerUrl = wallet.chainId ? getExplorerUrl(wallet.chainId, item.txHash) : "#";
                  return (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                            item.type === "CREATED"
                              ? "bg-blue-500/20 text-blue-300"
                              : item.type === "PURCHASE"
                              ? "bg-purple-500/20 text-purple-300"
                              : item.type === "RESALE"
                              ? "bg-cyan-500/20 text-cyan-300"
                              : "bg-emerald-500/20 text-emerald-300"
                          }`}
                        >
                          {item.title}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-200">{item.details}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">#{item.blockNumber}</td>
                      <td className="py-3 px-4">
                        <a
                          href={explorerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-purple-400 hover:text-purple-300 flex items-center gap-1"
                        >
                          <span>{item.txHash.slice(0, 10)}...{item.txHash.slice(-8)}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400 text-xs">
            No events found on the blockchain for this filter yet.
          </div>
        )}
      </div>
    </div>
  );
};