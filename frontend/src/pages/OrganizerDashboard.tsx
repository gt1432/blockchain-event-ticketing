import React, { useEffect, useState } from "react";
import {
  PlusCircle,
  Calendar,
  MapPin,
  Ticket,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  UserCheck,
  Loader2,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { EventItem, WalletState } from "../types";
import {
  createEvent,
  fetchAllEvents,
  setVerifierRole,
  formatEth,
  ethToInr,
  formatAddress,
} from "../services/web3Service";
import { useTransaction } from "../hooks/useTransaction";
import { TransactionModal } from "../components/TransactionModal";

interface OrganizerDashboardProps {
  wallet: WalletState;
}

export const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({ wallet }) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Event form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [date, setDate] = useState("");
  const [totalTickets, setTotalTickets] = useState("100");
  const [ticketPriceEth, setTicketPriceEth] = useState("0.02");
  const [maxResalePriceEth, setMaxResalePriceEth] = useState("0.025");
  const [imageURI, setImageURI] = useState(
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80"
  );

  // Verifier management
  const [verifierAddress, setVerifierAddress] = useState("");

  const { txState, execute, reset } = useTransaction();

  const loadOrganizerEvents = async () => {
    setLoading(true);
    const all = await fetchAllEvents();
    if (wallet.address) {
      const myEvents = all.filter(
        (e) => e.organizer.toLowerCase() === wallet.address?.toLowerCase()
      );
      setEvents(myEvents);
    } else {
      setEvents(all);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOrganizerEvents();
  }, [wallet.address]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.isConnected) {
      alert("Please connect MetaMask or select 'Demo Mode' -> Organizer (Bob) in the top navbar to publish events.");
      return;
    }

    if (parseFloat(maxResalePriceEth) < parseFloat(ticketPriceEth)) {
      alert("Maximum resale price must be greater than or equal to original ticket price!");
      return;
    }

    const unixDate = Math.floor(new Date(date).getTime() / 1000);
    if (isNaN(unixDate) || unixDate < Date.now() / 1000) {
      alert("Please select a valid future date.");
      return;
    }

    try {
      await execute(
        () =>
          createEvent(
            name,
            description,
            venue,
            unixDate,
            parseInt(totalTickets),
            ticketPriceEth,
            maxResalePriceEth,
            imageURI
          ),
        `Publishing event "${name}" to the Ethereum network...`
      );

      // Reset form
      setName("");
      setDescription("");
      setVenue("");
      setDate("");
      loadOrganizerEvents();
    } catch (err) {
      console.error("Create event error:", err);
    }
  };

  const handleAddVerifier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifierAddress) return;
    try {
      await execute(
        () => setVerifierRole(verifierAddress, true),
        `Granting VERIFIER_ROLE to ${verifierAddress}...`
      );
      setVerifierAddress("");
    } catch (err) {
      console.error("Set verifier error:", err);
    }
  };

  const totalTicketsSold = events.reduce((sum, e) => sum + e.ticketsSold, 0);
  const totalCapacity = events.reduce((sum, e) => sum + e.totalTickets, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Organizer Control Center</span>
        </div>
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-white">Event Organizer Hub</h1>
        <p className="text-sm text-slate-400">
          Create anti-scalping events, monitor live NFT ticket mints, and authorize staff verifiers.
        </p>
      </div>

      {/* Metrics overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-panel border border-white/10 rounded-2xl p-5 space-y-1">
          <div className="text-xs text-slate-400">My Published Events</div>
          <div className="font-display font-bold text-2xl text-white">{events.length}</div>
        </div>
        <div className="glass-panel border border-white/10 rounded-2xl p-5 space-y-1">
          <div className="text-xs text-slate-400">Total NFT Tickets Sold</div>
          <div className="font-display font-bold text-2xl text-purple-400">{totalTicketsSold}</div>
        </div>
        <div className="glass-panel border border-white/10 rounded-2xl p-5 space-y-1">
          <div className="text-xs text-slate-400">Total Ticket Capacity</div>
          <div className="font-display font-bold text-2xl text-cyan-400">{totalCapacity}</div>
        </div>
      </div>

      {/* Main Grid: Create Event Form & Verifier Management */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Create Event Form */}
        <div className="lg:col-span-7 glass-panel border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="space-y-1 border-b border-white/10 pb-4">
            <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-purple-400" />
              <span>Create New Anti-Scalping Event</span>
            </h2>
            <p className="text-xs text-slate-400">
              Deploy a new event directly to the smart contract with blockchain-enforced resale price rules.
            </p>
          </div>

          <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Event Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Electric Dreams EDM Festival 2027"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Description *</label>
              <textarea
                required
                rows={3}
                placeholder="Detailed event description, artist line-up, and venue entry rules..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Venue Location *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arena Grand, Mumbai"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Total Tickets *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={totalTickets}
                  onChange={(e) => setTotalTickets(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Original Price (ETH) *
                </label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={ticketPriceEth}
                  onChange={(e) => setTicketPriceEth(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  ≈ ₹{ethToInr(ticketPriceEth)}
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Max Resale Cap (ETH) *
                </label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={maxResalePriceEth}
                  onChange={(e) => setMaxResalePriceEth(e.target.value)}
                  className="w-full bg-white/5 border border-purple-500/40 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
                <span className="text-[10px] text-cyan-300 mt-1 block font-semibold">
                  Anti-scalp ceiling
                </span>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Event Poster Image URL</label>
              <input
                type="url"
                value={imageURI}
                onChange={(e) => setImageURI(e.target.value)}
                placeholder="https://..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              {/* Presets */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-slate-400">Sample Posters:</span>
                <button
                  type="button"
                  onClick={() =>
                    setImageURI(
                      "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1000&q=80"
                    )
                  }
                  className="text-[10px] text-purple-400 hover:underline"
                >
                  Concert
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setImageURI(
                      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1000&q=80"
                    )
                  }
                  className="text-[10px] text-purple-400 hover:underline"
                >
                  Festival
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setImageURI(
                      "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1000&q=80"
                    )
                  }
                  className="text-[10px] text-purple-400 hover:underline"
                >
                  Conference
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={txState.status === "pending"}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white font-display font-bold text-sm shadow-xl shadow-purple-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 pt-2"
            >
              {txState.status === "pending" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing on Chain...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Publish Event to Blockchain</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Authorize Verifier Staff */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="space-y-1">
              <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-cyan-400" />
                <span>Authorize Event Staff Verifier</span>
              </h2>
              <p className="text-xs text-slate-400">
                Grant VERIFIER_ROLE to security personnel or staff so they can scan & redeem tickets at entrance doors.
              </p>
            </div>

            <form onSubmit={handleAddVerifier} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Staff Ethereum Address *</label>
                <input
                  type="text"
                  required
                  placeholder="0x..."
                  value={verifierAddress}
                  onChange={(e) => setVerifierAddress(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                disabled={txState.status === "pending" || !verifierAddress}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Grant Door Verifier Access</span>
              </button>
            </form>
          </div>

          {/* Quick Notice */}
          <div className="glass-panel border border-purple-500/20 rounded-2xl p-5 space-y-2 text-xs">
            <h4 className="font-semibold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Organizer Permissions</span>
            </h4>
            <p className="text-slate-300 leading-relaxed">
              In test mode on Hardhat Localhost, default signers are pre-authorized with ORGANIZER_ROLE.
              Deploying on testnet requires ORGANIZER_ROLE granted by the admin contract deployer.
            </p>
          </div>
        </div>
      </div>

      {/* My Created Events Table */}
      <div className="glass-panel border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl">
        <h2 className="font-display font-bold text-xl text-white">My Created Events</h2>

        {loading ? (
          <div className="py-10 text-center">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
          </div>
        ) : events.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px]">
                  <th className="py-3 px-4">Event ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Venue</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Sold / Total</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Max Resale</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-purple-300">#{ev.id}</td>
                    <td className="py-3 px-4 font-semibold text-white">{ev.name}</td>
                    <td className="py-3 px-4 text-slate-300">{ev.venue}</td>
                    <td className="py-3 px-4 text-slate-300">
                      {new Date(ev.date * 1000).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-white">{ev.ticketsSold}</span>
                      <span className="text-slate-500"> / {ev.totalTickets}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-white">{formatEth(ev.ticketPrice)} ETH</td>
                    <td className="py-3 px-4 font-mono text-cyan-300 font-semibold">
                      {formatEth(ev.maxResalePrice)} ETH
                    </td>
                    <td className="py-3 px-4">
                      <a
                        href={`/events/${ev.id}`}
                        className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-slate-400 text-xs">
            No events published from this connected wallet yet. Use the form above to deploy your first event!
          </div>
        )}
      </div>

      <TransactionModal
        txState={txState}
        chainId={wallet.chainId}
        onClose={reset}
      />
    </div>
  );
};