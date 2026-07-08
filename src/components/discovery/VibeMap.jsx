import { useState, useMemo } from "react";
import { MapPin, Calendar, X, PartyPopper } from "lucide-react";

// Berlin approximate bounding box for coordinate mapping
const MAP_BOUNDS = {
  minLat: 52.48,
  maxLat: 52.55,
  minLng: 13.28,
  maxLng: 13.48,
};

// Vibe to color mappings
const VIBE_COLORS = {
  "Chill": { bg: "bg-teal-500", glow: "shadow-teal-500/60", ring: "ring-teal-400/30", text: "text-teal-400", dot: "#14b8a6" },
  "Energetic": { bg: "bg-[#EA7963]", glow: "shadow-[#EA7963]/60", ring: "ring-[#EA7963]/30", text: "text-[#EA7963]", dot: "#EA7963" },
  "Family Friendly": { bg: "bg-amber-400", glow: "shadow-amber-400/60", ring: "ring-amber-400/30", text: "text-amber-400", dot: "#fbbf24" },
  "Local Secret": { bg: "bg-purple-500", glow: "shadow-purple-500/60", ring: "ring-purple-500/30", text: "text-purple-400", dot: "#a855f7" },
};

const DEFAULT_COLOR = { bg: "bg-teal-500", glow: "shadow-teal-500/60", ring: "ring-teal-400/30", text: "text-teal-400", dot: "#14b8a6" };

const VibeMap = ({ events, onBook, selectedVibe }) => {
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [selectedPin, setSelectedPin] = useState(null);

  // Filter events that have coordinates
  const mappableEvents = useMemo(() => {
    return events.filter(ev => ev.latitude && ev.longitude);
  }, [events]);

  const unmappableEvents = useMemo(() => {
    return events.filter(ev => !ev.latitude || !ev.longitude);
  }, [events]);

  // Filter by vibe
  const filteredMappable = useMemo(() => {
    if (selectedVibe === "All") return mappableEvents;
    return mappableEvents.filter(ev => {
      const fallbackVibe = ev.category === "Music" ? "Energetic" : ev.category === "Art" ? "Chill" : ev.category === "Theater" ? "Family Friendly" : "Local Secret";
      const eventVibe = ev.vibe || fallbackVibe;
      return eventVibe.toLowerCase() === selectedVibe.toLowerCase();
    });
  }, [mappableEvents, selectedVibe]);

  // Map lat/lng to percentage position on the map canvas
  const getPosition = (lat, lng) => {
    const x = ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * 100;
    const y = ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * 100;
    return {
      left: `${Math.max(5, Math.min(95, x))}%`,
      top: `${Math.max(8, Math.min(92, y))}%`,
    };
  };

  const getVibeColor = (vibe) => VIBE_COLORS[vibe] || DEFAULT_COLOR;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="relative">
      {/* Map Canvas */}
      <div className="relative w-full rounded-[2rem] overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-950 border border-neutral-700/50 shadow-2xl"
        style={{ minHeight: "520px" }}
      >
        {/* Decorative Street Grid */}
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
          {/* Horizontal lines */}
          {[15, 30, 45, 60, 75, 90].map((y) => (
            <div key={`h-${y}`} className="absolute w-full h-px bg-white" style={{ top: `${y}%` }} />
          ))}
          {/* Vertical lines */}
          {[12, 25, 38, 50, 62, 75, 88].map((x) => (
            <div key={`v-${x}`} className="absolute h-full w-px bg-white" style={{ left: `${x}%` }} />
          ))}
          {/* Diagonal accent */}
          <div className="absolute w-[140%] h-px bg-white/50 origin-top-left rotate-[25deg]" style={{ top: "20%", left: "-10%" }} />
          <div className="absolute w-[140%] h-px bg-white/50 origin-top-left rotate-[-15deg]" style={{ top: "70%", left: "-5%" }} />
        </div>

        {/* Decorative River Path */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M-5,45 Q15,35 30,50 T55,42 T80,55 T105,48" stroke="#60a5fa" strokeWidth="0.8" fill="none" />
          <path d="M-5,47 Q15,37 30,52 T55,44 T80,57 T105,50" stroke="#60a5fa" strokeWidth="0.4" fill="none" />
        </svg>

        {/* Map Legend */}
        <div className="absolute top-5 left-5 z-20">
          <div className="bg-neutral-900/80 backdrop-blur-md border border-neutral-700/50 rounded-2xl px-4 py-3 flex flex-col gap-1.5">
            <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-semibold">Berlin · Live Events</span>
            <div className="flex items-center gap-3 flex-wrap">
              {Object.entries(VIBE_COLORS).map(([vibe, color]) => (
                <div key={vibe} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${color.bg}`} />
                  <span className="text-[10px] text-neutral-400 font-light">{vibe}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Event Pin Count Badge */}
        <div className="absolute top-5 right-5 z-20">
          <div className="bg-neutral-900/80 backdrop-blur-md border border-neutral-700/50 rounded-xl px-3 py-2 text-center">
            <span className="font-display font-bold text-lg text-white block leading-none">{filteredMappable.length}</span>
            <span className="text-[9px] text-neutral-400 font-light">events on map</span>
          </div>
        </div>

        {/* Event Pins */}
        {filteredMappable.map((ev) => {
          const pos = getPosition(ev.latitude, ev.longitude);
          const fallbackVibe = ev.category === "Music" ? "Energetic" : ev.category === "Art" ? "Chill" : ev.category === "Theater" ? "Family Friendly" : "Local Secret";
          const eventVibe = ev.vibe || fallbackVibe;
          const color = getVibeColor(eventVibe);
          const isHovered = hoveredEvent === ev.id;
          const isSelected = selectedPin === ev.id;

          return (
            <div
              key={ev.id}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{ left: pos.left, top: pos.top }}
              onMouseEnter={() => setHoveredEvent(ev.id)}
              onMouseLeave={() => setHoveredEvent(null)}
              onClick={() => setSelectedPin(isSelected ? null : ev.id)}
            >
              {/* Animated Pulse Ring */}
              <div className={`absolute inset-0 rounded-full ${color.bg} opacity-30 animate-ping`}
                style={{ width: "24px", height: "24px", margin: "auto", top: 0, left: 0, right: 0, bottom: 0 }}
              />

              {/* Pin Dot */}
              <div className={`relative w-4 h-4 rounded-full ${color.bg} shadow-lg ${color.glow} ring-4 ${color.ring} transition-transform duration-200 ${isHovered || isSelected ? "scale-150" : "scale-100"}`} />

              {/* Hover/Selected Tooltip Card */}
              {(isHovered || isSelected) && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-64 bg-neutral-900/95 backdrop-blur-xl border border-neutral-700/60 rounded-2xl shadow-2xl p-4 z-30 pointer-events-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Close button for selected */}
                  {isSelected && (
                    <button onClick={() => setSelectedPin(null)} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400">
                      <X size={10} />
                    </button>
                  )}

                  {/* Mini Image */}
                  <div className="w-full h-24 rounded-xl overflow-hidden mb-3">
                    <img src={ev.image} alt={ev.name} className="w-full h-full object-cover" loading="lazy" />
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${color.bg} text-white`}>
                      {eventVibe}
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-neutral-700 text-neutral-300 font-semibold uppercase tracking-wider">
                      {ev.category}
                    </span>
                    {ev.meetupEnabled && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-900/50 text-purple-300 font-semibold uppercase tracking-wider flex items-center gap-0.5">
                        <PartyPopper size={8} /> Party
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h4 className="font-display font-bold text-sm text-white leading-tight mb-1 truncate">{ev.name}</h4>

                  {/* Details */}
                  <div className="flex items-center gap-1 text-[10px] text-neutral-400 mb-1">
                    <Calendar size={10} className="text-teal-400 shrink-0" />
                    <span>{formatDate(ev.date)} · {formatTime(ev.date)}</span>
                  </div>

                  {ev.venueName && (
                    <div className="flex items-center gap-1 text-[10px] text-neutral-400 mb-3">
                      <MapPin size={10} className="text-[#EA7963] shrink-0" />
                      <span className="truncate">{ev.venueName}</span>
                    </div>
                  )}

                  {/* Price + CTA */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-display font-bold text-sm text-white">
                      {ev.isFree ? <span className="text-emerald-400">Free</span> : `$${ev.price.toFixed(2)}`}
                    </span>
                    <button
                      onClick={() => onBook(ev)}
                      disabled={!ev.hypeMode && (ev.soldCount || 0) >= (ev.inventory || 100)}
                      className={`h-8 px-4 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                        ev.hypeMode
                          ? "bg-[#EA7963] hover:bg-[#D96853] text-white"
                          : ev.isFree
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "bg-teal-500 hover:bg-teal-600 text-white"
                      }`}
                    >
                      {ev.hypeMode ? "Waitlist" : ev.isFree ? "Free Pass" : "Book"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Empty State */}
        {filteredMappable.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <MapPin size={32} className="text-neutral-600 mb-3" />
            <h4 className="font-display font-semibold text-neutral-400 text-sm">No Events on Map</h4>
            <p className="text-neutral-500 text-xs font-light mt-1 max-w-xs">
              No events with location data match this vibe filter. Try selecting "All" vibes or add coordinates when creating events.
            </p>
          </div>
        )}
      </div>

      {/* Unlisted Events Strip */}
      {unmappableEvents.length > 0 && (
        <div className="mt-4">
          <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold mb-2 block pl-1">
            {unmappableEvents.length} Events Without Location Data
          </span>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {unmappableEvents.map((ev) => (
              <div
                key={ev.id}
                className="shrink-0 w-48 bg-white rounded-2xl border border-neutral-100 shadow-md p-3 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => onBook(ev)}
              >
                <img src={ev.image} alt={ev.name} className="w-full h-20 rounded-xl object-cover mb-2" loading="lazy" />
                <h5 className="font-display font-bold text-xs text-[#2A2A2A] truncate">{ev.name}</h5>
                <p className="text-[10px] text-neutral-400 font-light mt-0.5">{formatDate(ev.date)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VibeMap;
