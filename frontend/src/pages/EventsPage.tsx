import React, { useEffect, useState } from "react";
import { Search, Filter, Ticket, Loader2 } from "lucide-react";
import { EventItem, WalletState } from "../types";
import { fetchAllEvents } from "../services/web3Service";
import { EventCard } from "../components/EventCard";

interface EventsPageProps {
  wallet: WalletState;
}

export const EventsPage: React.FC<EventsPageProps> = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "upcoming" | "soldout">("all");

  useEffect(() => {
    fetchAllEvents().then((evs) => {
      setEvents(evs);
      setLoading(false);
    });
  }, []);

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.venue.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase());

    const isSoldOut = e.ticketsSold >= e.totalTickets;
    const isPast = e.date * 1000 < Date.now();

    if (filter === "upcoming") return matchesSearch && !isSoldOut && !isPast;
    if (filter === "soldout") return matchesSearch && isSoldOut;
    return matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-white">Explore Events</h1>
        <p className="text-sm text-slate-400">
          Discover genuine concerts, conferences, and sports events with blockchain-guaranteed tickets.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by event name or venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filter === "all"
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                : "bg-white/5 text-slate-400 hover:text-white"
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setFilter("upcoming")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filter === "upcoming"
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                : "bg-white/5 text-slate-400 hover:text-white"
            }`}
          >
            Available Now
          </button>
          <button
            onClick={() => setFilter("soldout")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filter === "soldout"
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                : "bg-white/5 text-slate-400 hover:text-white"
            }`}
          >
            Sold Out
          </button>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-96 glass-panel rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((ev) => (
            <EventCard key={ev.id} event={ev} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 glass-panel rounded-3xl border border-white/10 space-y-3">
          <Ticket className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="font-display font-bold text-lg text-white">No Matching Events Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search criteria or filter to see more events.
          </p>
        </div>
      )}
    </div>
  );
};