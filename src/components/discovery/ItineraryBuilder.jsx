import { useState, useMemo } from "react";
import { Calendar, Clock, MapPin, Coffee, Utensils, Footprints, PartyPopper, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";

// Curated local suggestions for gap fillers (MVP: hardcoded Berlin recommendations)
const GAP_FILLERS = {
  morning: [
    { name: "Third Wave Coffee Roasters", type: "coffee", address: "Torstraße 96, Berlin", note: "Award-winning flat whites and pastries", icon: Coffee },
    { name: "Friedrichshain Farmer's Market", type: "market", address: "Boxhagener Platz, Berlin", note: "Local produce, street food, and live music", icon: Utensils },
  ],
  afternoon: [
    { name: "Free Kreuzberg Street Art Walk", type: "tour", address: "Meets at Schlesisches Tor U-Bahn", note: "Self-guided 90-min walking tour", icon: Footprints },
    { name: "House of Small Wonder Lunch", type: "food", address: "Johannisstraße 20, Berlin", note: "Japanese-inspired brunch and lunch in a treehouse setting", icon: Utensils },
  ],
  evening: [
    { name: "Sunset at Klunkerkranich", type: "bar", address: "Karl-Marx-Str. 66, Berlin", note: "Rooftop bar on top of a parking garage — secret Berlin gem", icon: Coffee },
    { name: "Markthalle Neun Street Food", type: "food", address: "Eisenbahnstr. 42, Berlin", note: "Thursday is Street Food Thursday — local favorite", icon: Utensils },
  ],
};

const ItineraryBuilder = ({ tickets }) => {
  // Get unique dates from tickets
  const ticketDates = useMemo(() => {
    const dateSet = new Map();
    tickets.forEach((t) => {
      if (t.status !== "valid") return;
      const d = new Date(t.eventDate);
      const key = d.toISOString().split("T")[0]; // YYYY-MM-DD
      if (!dateSet.has(key)) {
        dateSet.set(key, d);
      }
    });
    // Sort dates chronologically
    return Array.from(dateSet.entries())
      .sort((a, b) => a[1] - b[1])
      .map(([key, date]) => ({ key, date }));
  }, [tickets]);

  const [selectedDateIndex, setSelectedDateIndex] = useState(0);

  const selectedDate = ticketDates[selectedDateIndex];

  // Get tickets for the selected date, sorted by time
  const dayTickets = useMemo(() => {
    if (!selectedDate) return [];
    return tickets
      .filter((t) => {
        if (t.status !== "valid") return false;
        const d = new Date(t.eventDate);
        return d.toISOString().split("T")[0] === selectedDate.key;
      })
      .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
  }, [tickets, selectedDate]);

  // Build timeline with gap detection
  const timeline = useMemo(() => {
    if (dayTickets.length === 0) return [];

    const items = [];

    dayTickets.forEach((ticket, idx) => {
      const eventStart = new Date(ticket.eventDate);
      const duration = ticket.estimatedDuration || 120; // default 2 hours
      const eventEnd = new Date(eventStart.getTime() + duration * 60000);

      // Check for gap before this event (from previous event's end)
      if (idx > 0) {
        const prevTicket = dayTickets[idx - 1];
        const prevStart = new Date(prevTicket.eventDate);
        const prevDuration = prevTicket.estimatedDuration || 120;
        const prevEnd = new Date(prevStart.getTime() + prevDuration * 60000);

        const gapMinutes = (eventStart - prevEnd) / 60000;

        if (gapMinutes >= 90) {
          // Determine time of day for suggestion type
          const gapMidpoint = new Date(prevEnd.getTime() + (gapMinutes / 2) * 60000);
          const hour = gapMidpoint.getHours();
          const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
          const suggestions = GAP_FILLERS[timeOfDay] || GAP_FILLERS.afternoon;

          items.push({
            type: "gap",
            startTime: prevEnd,
            endTime: eventStart,
            durationMinutes: Math.round(gapMinutes),
            suggestions,
            timeOfDay,
          });
        }
      }

      // Add the event
      items.push({
        type: "event",
        ticket,
        startTime: eventStart,
        endTime: eventEnd,
        durationMinutes: duration,
      });

      // Add meetup after event if enabled
      if (ticket.meetupEnabled && ticket.meetupVenueName) {
        items.push({
          type: "meetup",
          ticket,
          startTime: eventEnd,
        });
      }
    });

    return items;
  }, [dayTickets]);

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDateDisplay = (date) => {
    return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  };

  // Empty state
  if (ticketDates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-neutral-200 rounded-[2.5rem] bg-neutral-50/20 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center border mb-4 shadow-sm bg-[#358597]/10 border-[#358597]/20 text-[#358597]">
          <Calendar size={26} />
        </div>
        <h4 className="font-display font-bold text-lg text-[#2A2A2A] tracking-tight">
          No Upcoming Events Booked
        </h4>
        <p className="text-neutral-400 text-xs font-light max-w-sm mt-2 leading-relaxed">
          Book some events from the Discover feed to build your personalized day itinerary. We'll suggest local spots to fill your free time.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Date Navigator */}
      <div className="flex items-center justify-between mb-6 bg-white rounded-2xl border border-neutral-100 shadow-sm p-3">
        <button
          onClick={() => setSelectedDateIndex(Math.max(0, selectedDateIndex - 1))}
          disabled={selectedDateIndex === 0}
          className="w-9 h-9 rounded-xl bg-neutral-50 hover:bg-neutral-100 disabled:opacity-30 flex items-center justify-center transition-colors"
        >
          <ChevronLeft size={16} className="text-neutral-600" />
        </button>

        <div className="text-center">
          <span className="text-[9px] uppercase tracking-wider text-[#358597] font-semibold block">
            Day {selectedDateIndex + 1} of {ticketDates.length}
          </span>
          <span className="font-display font-bold text-base text-[#2A2A2A]">
            {selectedDate ? formatDateDisplay(selectedDate.date) : ""}
          </span>
          <span className="block text-[10px] text-neutral-400 font-light mt-0.5">
            {dayTickets.length} event{dayTickets.length !== 1 ? "s" : ""} planned
          </span>
        </div>

        <button
          onClick={() => setSelectedDateIndex(Math.min(ticketDates.length - 1, selectedDateIndex + 1))}
          disabled={selectedDateIndex >= ticketDates.length - 1}
          className="w-9 h-9 rounded-xl bg-neutral-50 hover:bg-neutral-100 disabled:opacity-30 flex items-center justify-center transition-colors"
        >
          <ChevronRight size={16} className="text-neutral-600" />
        </button>
      </div>

      {/* Timeline */}
      <div className="relative pl-8">
        {/* Vertical timeline line */}
        <div className="absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-[#358597] via-neutral-200 to-neutral-100" />

        <div className="space-y-0">
          {timeline.map((item, idx) => {
            if (item.type === "event") {
              const t = item.ticket;
              return (
                <div key={`event-${idx}`} className="relative pb-6">
                  {/* Timeline dot */}
                  <div className="absolute -left-5 top-3 w-3 h-3 rounded-full bg-[#358597] ring-4 ring-[#358597]/15 z-10" />

                  {/* Event Card */}
                  <div className="bg-white rounded-2xl border border-neutral-100 shadow-lg shadow-neutral-100/50 p-4 ml-3 hover:shadow-xl transition-shadow">
                    <div className="flex gap-3">
                      <img
                        src={t.eventImage || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=200&auto=format&fit=crop"}
                        alt={t.eventName}
                        className="w-14 h-14 rounded-xl object-cover border border-neutral-200/50 shrink-0"
                        loading="lazy"
                      />
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#358597]/10 text-[#358597] font-bold uppercase tracking-wider">
                            {t.eventCategory || "Event"}
                          </span>
                          {t.meetupEnabled && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-500 font-bold uppercase tracking-wider flex items-center gap-0.5">
                              <PartyPopper size={8} /> Party
                            </span>
                          )}
                        </div>
                        <h4 className="font-display font-bold text-sm text-[#2A2A2A] leading-tight truncate">{t.eventName}</h4>
                      </div>
                    </div>

                    {/* Time & Venue Details */}
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Clock size={10} className="text-[#358597]" />
                        {formatTime(item.startTime)} – {formatTime(item.endTime)}
                        <span className="text-neutral-300 font-light">({item.durationMinutes} min)</span>
                      </span>
                      {t.venueName && (
                        <span className="flex items-center gap-1">
                          <MapPin size={10} className="text-[#EA7963]" />
                          {t.venueName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            if (item.type === "gap") {
              return (
                <div key={`gap-${idx}`} className="relative pb-6">
                  {/* Timeline dot — dashed */}
                  <div className="absolute -left-5 top-3 w-3 h-3 rounded-full bg-amber-400 ring-4 ring-amber-400/15 z-10" />

                  {/* Gap Card */}
                  <div className="ml-3 p-4 rounded-2xl bg-gradient-to-br from-amber-50/80 to-orange-50/40 border border-amber-100/60 shadow-sm">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Sparkles size={12} className="text-amber-500" />
                      <span className="text-[10px] uppercase tracking-wider font-bold text-amber-600">
                        {item.durationMinutes} min free · {item.timeOfDay} suggestion
                      </span>
                    </div>

                    <p className="text-xs text-neutral-500 font-light mb-3">
                      You have a gap between {formatTime(item.startTime)} and {formatTime(item.endTime)}. Here are some local picks:
                    </p>

                    <div className="space-y-2">
                      {item.suggestions.map((s, sIdx) => {
                        const Icon = s.icon;
                        return (
                          <div key={sIdx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/70 border border-amber-100/30">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                              <Icon size={14} className="text-amber-600" />
                            </div>
                            <div className="min-w-0">
                              <h5 className="text-xs font-semibold text-[#2A2A2A] leading-tight">{s.name}</h5>
                              <p className="text-[10px] text-neutral-400 font-light truncate">{s.address}</p>
                              <p className="text-[10px] text-amber-600/80 font-light mt-0.5">{s.note}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            if (item.type === "meetup") {
              const t = item.ticket;
              return (
                <div key={`meetup-${idx}`} className="relative pb-6">
                  {/* Timeline dot */}
                  <div className="absolute -left-5 top-3 w-3 h-3 rounded-full bg-purple-500 ring-4 ring-purple-500/15 z-10" />

                  {/* Meetup Card */}
                  <div className="ml-3 p-3 rounded-2xl bg-gradient-to-br from-purple-50/80 to-indigo-50/40 border border-purple-100/60 shadow-sm">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <PartyPopper size={12} className="text-purple-500" />
                      <span className="text-[10px] uppercase tracking-wider font-bold text-purple-600">After-Event Meetup</span>
                    </div>
                    <h5 className="text-xs font-semibold text-[#2A2A2A]">{t.meetupVenueName}</h5>
                    {t.meetupVenueAddress && (
                      <p className="text-[10px] text-neutral-400 font-light flex items-center gap-1 mt-0.5">
                        <MapPin size={9} className="text-purple-400 shrink-0" />
                        {t.meetupVenueAddress}
                      </p>
                    )}
                    {t.meetupNote && (
                      <p className="text-[10px] text-purple-600/80 font-light mt-1 italic">"{t.meetupNote}"</p>
                    )}
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>
    </div>
  );
};

export default ItineraryBuilder;
