import React from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Ticket, ShieldCheck, ArrowRight } from "lucide-react";
import { EventItem } from "../types";
import { formatEth, ethToInr } from "../services/web3Service";

interface EventCardProps {
  event: EventItem;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const isSoldOut = event.ticketsSold >= event.totalTickets;
  const isPast = event.date * 1000 < Date.now();
  const available = Math.max(0, event.totalTickets - event.ticketsSold);
  const percentSold = Math.min(100, Math.round((event.ticketsSold / event.totalTickets) * 100));

  const dateStr = new Date(event.date * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const ethPrice = formatEth(event.ticketPrice);
  const inrPrice = ethToInr(ethPrice);

  return (
    <div className="glass-panel border border-white/10 hover:border-purple-500/40 rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 flex flex-col group">
      {/* Event Image */}
      <div className="relative h-52 overflow-hidden bg-slate-900">
        <img
          src={event.imageURI}
          alt={event.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as any).src =
              "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1000&q=80";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070913] via-transparent to-transparent opacity-80" />

        {/* Status badges */}
        <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5">
          {isSoldOut ? (
            <span className="bg-red-500/80 backdrop-blur-md text-white font-bold text-[11px] px-3 py-1 rounded-full uppercase tracking-wider">
              Sold Out
            </span>
          ) : isPast ? (
            <span className="bg-slate-700/80 backdrop-blur-md text-slate-300 font-semibold text-[11px] px-3 py-1 rounded-full uppercase tracking-wider">
              Concluded
            </span>
          ) : (
            <span className="bg-emerald-500/80 backdrop-blur-md text-white font-bold text-[11px] px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> NFT Protected
            </span>
          )}
        </div>

        {/* Event ID badge */}
        <div className="absolute top-3.5 right-3.5 bg-black/60 backdrop-blur-md text-slate-300 font-mono text-[11px] px-2.5 py-1 rounded-full border border-white/10">
          #{event.id}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <h3 className="font-display font-bold text-lg text-white group-hover:text-purple-300 transition-colors line-clamp-1">
            {event.name}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        </div>

        {/* Details grid */}
        <div className="space-y-2 text-xs text-slate-300 pt-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
            <span>{dateStr}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="line-clamp-1">{event.venue}</span>
          </div>
        </div>

        {/* Availability Bar */}
        <div className="space-y-1.5 pt-2 border-t border-white/5">
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Ticket Availability</span>
            <span className="font-semibold text-slate-200">
              {available} / {event.totalTickets} Left
            </span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full transition-all duration-500"
              style={{ width: `${percentSold}%` }}
            />
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="pt-2 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Original Price</div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-bold text-lg text-white">{ethPrice} ETH</span>
              <span className="text-[11px] text-slate-400">≈ ₹{inrPrice}</span>
            </div>
          </div>

          <Link
            to={`/events/${event.id}`}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all group-hover:shadow-purple-500/25"
          >
            <span>View Event</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};