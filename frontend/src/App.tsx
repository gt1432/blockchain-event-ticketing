import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { NetworkWarning } from "./components/NetworkWarning";
import { LandingPage } from "./pages/LandingPage";
import { EventsPage } from "./pages/EventsPage";
import { EventDetailPage } from "./pages/EventDetailPage";
import { OrganizerDashboard } from "./pages/OrganizerDashboard";
import { MyTicketsPage } from "./pages/MyTicketsPage";
import { MarketplacePage } from "./pages/MarketplacePage";
import { ScannerPage } from "./pages/ScannerPage";
import { TransactionHistoryPage } from "./pages/TransactionHistoryPage";
import { AdminPage } from "./pages/AdminPage";
import { useWallet } from "./hooks/useWallet";
import { Ticket, ShieldCheck, Heart } from "lucide-react";
import { CONTRACT_ADDRESS, formatAddress } from "./services/web3Service";

export default function App() {
  const { wallet, connect, disconnect, switchNetwork } = useWallet();

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col font-sans selection:bg-purple-500 selection:text-white">
      {/* Navbar */}
      <Navbar
        wallet={wallet}
        onConnect={connect}
        onDisconnect={disconnect}
        onSwitchNetwork={switchNetwork}
      />

      {/* Network Warning Banner if connected to unsupported network */}
      <NetworkWarning wallet={wallet} onSwitch={switchNetwork} />

      {/* Main Routed Content */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage wallet={wallet} onConnect={connect} />} />
          <Route path="/events" element={<EventsPage wallet={wallet} />} />
          <Route path="/events/:eventId" element={<EventDetailPage wallet={wallet} />} />
          <Route path="/organizer" element={<OrganizerDashboard wallet={wallet} />} />
          <Route path="/my-tickets" element={<MyTicketsPage wallet={wallet} />} />
          <Route path="/marketplace" element={<MarketplacePage wallet={wallet} />} />
          <Route path="/scanner" element={<ScannerPage wallet={wallet} />} />
          <Route path="/history" element={<TransactionHistoryPage wallet={wallet} />} />
          <Route path="/admin" element={<AdminPage wallet={wallet} />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 glass-panel py-10 px-4 lg:px-8 mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-white">
              <Ticket className="w-4 h-4" />
            </div>
            <div>
              <span className="font-display font-bold text-white text-sm">TicketChain</span>
              <p className="text-[11px] text-slate-500">Decentralized Event Passes & Anti-Scalping Protocol</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/events" className="hover:text-white transition-colors">Events</Link>
            <Link to="/marketplace" className="hover:text-white transition-colors">Resale Market</Link>
            <Link to="/scanner" className="hover:text-white transition-colors">Gate Scanner</Link>
            <Link to="/history" className="hover:text-white transition-colors">Audit Trail</Link>
          </div>

          <div className="text-right font-mono text-[11px] space-y-1">
            <div className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Contract: {formatAddress(CONTRACT_ADDRESS)}</span>
            </div>
            <div className="text-slate-500">ERC-721 Standard • Hardhat & Sepolia Ready</div>
          </div>
        </div>
      </footer>
    </div>
  );
}