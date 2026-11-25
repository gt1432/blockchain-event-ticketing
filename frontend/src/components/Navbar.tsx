import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Ticket,
  Compass,
  Repeat,
  QrCode,
  LayoutDashboard,
  History,
  ShieldCheck,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { WalletState, DemoRole } from "../types";
import { WalletButton } from "./WalletButton";

interface NavbarProps {
  wallet: WalletState;
  onConnect: () => void;
  onConnectDemo: (role: DemoRole) => void;
  onDisconnect: () => void;
  onSwitchNetwork: (chainId: number) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  wallet,
  onConnect,
  onConnectDemo,
  onDisconnect,
  onSwitchNetwork,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: "Explore Events", path: "/events", icon: Compass },
    { name: "Resale Market", path: "/marketplace", icon: Repeat, badge: "Anti-Scalp" },
    { name: "My Tickets", path: "/my-tickets", icon: Ticket },
    { name: "Scan & Verify", path: "/scanner", icon: QrCode },
    { name: "Organizer Hub", path: "/organizer", icon: LayoutDashboard },
    { name: "Audit Trail", path: "/history", icon: History },
  ];

  if (wallet.isAdmin) {
    navLinks.push({ name: "Admin", path: "/admin", icon: ShieldCheck, badge: "Role" });
  }

  const isActive = (p: string) => location.pathname === p;

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-white/10 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-105 transition-transform">
            <Ticket className="w-5 h-5 text-white transform -rotate-12" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-xl tracking-tight text-white">Ticket</span>
              <span className="font-display font-bold text-xl tracking-tight gradient-text">Chain</span>
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            </div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">NFT Anti-Scalping</p>
          </div>
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 relative ${
                  active
                    ? "bg-purple-600/20 text-white border border-purple-500/30 shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-purple-400" : "text-slate-400"}`} />
                <span>{link.name}</span>
                {link.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <WalletButton
            wallet={wallet}
            onConnect={onConnect}
            onConnectDemo={onConnectDemo}
            onDisconnect={onDisconnect}
            onSwitchNetwork={onSwitchNetwork}
          />
        </div>

        <div className="flex lg:hidden items-center gap-2">
          <WalletButton
            wallet={wallet}
            onConnect={onConnect}
            onConnectDemo={onConnectDemo}
            onDisconnect={onDisconnect}
            onSwitchNetwork={onSwitchNetwork}
            compact
          />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-white/5 text-slate-300 hover:text-white border border-white/10"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden mt-3 pt-3 border-t border-white/10 space-y-1 pb-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium ${
                  active
                    ? "bg-purple-600/25 text-white border border-purple-500/30"
                    : "text-slate-300 hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-purple-400" />
                  <span>{link.name}</span>
                </div>
                {link.badge && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
};
