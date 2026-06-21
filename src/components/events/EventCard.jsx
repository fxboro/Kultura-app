import React from "react";
import { Calendar, MapPin, Tag, Sparkles, Flame, CheckCircle } from "lucide-react";

const EventCard = ({ event, onBook }) => {
  const { name, date, image, category, vibe, price, inventory, soldCount, isFree, hypeMode } = event;

  const capacity = inventory || 100;
  const sold = soldCount || 0;
  const percentSold = Math.min(100, Math.round((sold / capacity) * 100));
  const isSoldOut = sold >= capacity;

  // Format date nicely
  const eventDate = new Date(date);
  const formattedDate = eventDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = eventDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Dynamic tags/styles based on status
  const getButtonStyles = () => {
    if (isSoldOut && !hypeMode) {
      return "bg-neutral-300 text-neutral-500 cursor-not-allowed";
    }
    if (hypeMode) {
      return "bg-[#EA7963] hover:bg-[#D96853] text-white shadow-md shadow-coral-500/20";
    }
    if (isFree) {
      return "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20";
    }
    return "bg-[#358597] hover:bg-[#2C6E7D] text-white shadow-md shadow-teal-500/20";
  };

  const getButtonText = () => {
    if (isSoldOut && !hypeMode) return "Sold Out";
    if (hypeMode) return "Join Waitlist";
    if (isFree) return "Get Free Pass";
    return "Book Ticket";
  };

  return (
    <div className="group bg-white rounded-[2rem] border border-neutral-100/80 shadow-xl shadow-neutral-100/40 hover:shadow-2xl hover:shadow-neutral-200/50 overflow-hidden flex flex-col justify-between transition-all duration-300 h-full">
      {/* Image Banner Section */}
      <div className="relative h-56 overflow-hidden select-none shrink-0">
        <img 
          src={image} 
          alt={name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="lazy"
        />
        {/* Transparent Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

        {/* Floating Badges */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          {/* Category Tag */}
          <span className="bg-white/85 backdrop-blur-md border border-white/20 text-[#2A2A2A] text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full shadow-sm">
            {category}
          </span>
          {/* Vibe Tag */}
          {vibe && (
            <span className="bg-[#358597]/90 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full shadow-sm flex items-center gap-1">
              <Sparkles size={10} />
              {vibe}
            </span>
          )}
        </div>

        {/* Dynamic Hype/Pre-Booking Tag */}
        {hypeMode && (
          <div className="absolute top-4 right-4 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full shadow-md flex items-center gap-1 border border-amber-400">
            <Flame size={11} className="animate-pulse" />
            Hype Mode
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-6 flex flex-col justify-between flex-grow">
        <div className="text-left flex-grow">
          {/* Date & Time */}
          <div className="flex items-center gap-1.5 text-[#358597] text-xs font-semibold mb-2">
            <Calendar size={13} />
            <span>{formattedDate} • {formattedTime}</span>
          </div>

          {/* Event Title */}
          <h3 className="font-display font-bold text-xl text-[#2A2A2A] leading-tight mb-2 tracking-tight group-hover:text-[#358597] transition-colors duration-300">
            {name}
          </h3>

          {/* Capacity Progress Bar */}
          <div className="mt-4 mb-4">
            <div className="flex justify-between text-[11px] text-neutral-400 mb-1.5 font-sans">
              <span>{hypeMode ? "Waitlisted" : `${sold} / ${capacity} booked`}</span>
              <span className="font-medium text-neutral-600">{percentSold}% capacity</span>
            </div>
            <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  hypeMode ? "bg-amber-500" : isFree ? "bg-emerald-500" : "bg-[#358597]"
                }`}
                style={{ width: `${percentSold}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Pricing & CTA Row */}
        <div className="border-t border-neutral-100 pt-4 flex items-center justify-between gap-4 mt-auto">
          {/* Price Label */}
          <div className="text-left shrink-0">
            <span className="block text-[9px] uppercase tracking-wider text-neutral-400 font-semibold leading-none">Admission</span>
            <span className="text-xl font-bold font-display text-[#2A2A2A] mt-1 block">
              {isFree ? (
                <span className="text-emerald-600">Free</span>
              ) : (
                `$${price.toFixed(2)}`
              )}
            </span>
          </div>

          {/* CTA Action Button */}
          <button
            onClick={() => onBook(event)}
            disabled={isSoldOut && !hypeMode}
            className={`h-11 px-5 rounded-full font-display text-xs font-semibold tracking-wider uppercase transition-all duration-300 flex-grow text-center flex items-center justify-center ${getButtonStyles()}`}
          >
            {getButtonText()}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
