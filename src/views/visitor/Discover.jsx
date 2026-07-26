import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { collection, query, onSnapshot, addDoc, where } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../hooks/useAuth";
import { Search, MapPin, Compass, Flame, RefreshCw, Award, CheckCircle, Star, Map, LayoutGrid } from "lucide-react";
import EventCard from "../../components/events/EventCard";
import BookingModal from "../../components/events/BookingModal";
import VibeMap from "../../components/discovery/VibeMap";

const Discover = () => {
  const { user } = useAuth();
  const [, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [dbTrails, setDbTrails] = useState([]);
  const [events, setEvents] = useState([]);
  const [checkedInTickets, setCheckedInTickets] = useState([]);
  const [completedTrailIds, setCompletedTrailIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [selectedVibe, setSelectedVibe] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("Berlin, Germany");
  const [viewMode, setViewMode] = useState("list"); // "list" | "map"

  // Booking states
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [bookingOpen, setBookingOpen] = useState(false);

  // Predefined vibes list
  const vibes = ["All", "Chill", "Energetic", "Family Friendly", "Local Secret"];

  // Fetch dynamic trails from database
  useEffect(() => {
    const trailsRef = collection(db, "trails");
    const unsubscribe = onSnapshot(trailsRef, (snapshot) => {
      const fetchedTrails = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setDbTrails(fetchedTrails);
    }, (err) => {
      console.error("Error listening to trails: ", err);
    });
    return () => unsubscribe();
  }, []);

  const getCheckedInCountForTrail = (trail) => {
    if (trail.eventIds && Array.isArray(trail.eventIds)) {
      const checkedInEventIds = checkedInTickets.map(t => t.eventId);
      const uniqueCheckedInIds = new Set(checkedInEventIds);
      return trail.eventIds.filter(id => uniqueCheckedInIds.has(id)).length;
    }
    return checkedInTickets.filter(t => t.eventCategory === trail.category).length;
  };

  // Predefined City Trails
  const defaultTrails = [
    {
      id: "jazz-passport",
      name: "The Weekend Jazz Passport",
      category: "Music",
      goalCount: 3,
      description: "Experience live jazz, acoustic sessions, and city night jams.",
      reward: "Free Coffee & Pastry at Partner Cafes",
      badge: "Jazz Pioneer",
      themeColor: "from-amber-500/20 to-orange-500/20 text-amber-700 border-amber-200/50"
    },
    {
      id: "art-trail",
      name: "Berlin Historic Art Trail",
      category: "Art",
      goalCount: 3,
      description: "Explore contemporary gallery openings, design walks, and indie art shows.",
      reward: "25% Off Your Next Cultural Ticket",
      badge: "Art Connoisseur",
      themeColor: "from-teal-500/20 to-[#358597]/20 text-teal-700 border-teal-200/50"
    },
    {
      id: "urban-explorer",
      name: "Urban Explorer Pass",
      category: "Tourism",
      goalCount: 2,
      description: "Discover local street art, secret pathways, and historic city guides.",
      reward: "Free City Guidebook & Digital Stamp",
      badge: "City Trailblazer",
      themeColor: "from-rose-500/20 to-[#EA7963]/20 text-[#EA7963] border-rose-200/50"
    }
  ];

  // 1. Fetch live events
  useEffect(() => {
    const eventsRef = collection(db, "events");
    
    // Set up real-time listener for events
    const unsubscribe = onSnapshot(eventsRef, (snapshot) => {
      const fetchedEvents = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by date/time (earliest first)
      fetchedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
      setEvents(fetchedEvents);
      setLoading(false);
    }, (err) => {
      console.error("Error listening to events: ", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Fetch user's checked-in tickets for Trail calculations
  useEffect(() => {
    if (!user) return;

    const ticketsRef = collection(db, "tickets");
    const q = query(
      ticketsRef, 
      where("userId", "==", user.uid), 
      where("status", "==", "checked-in")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tickets = snapshot.docs.map((doc) => doc.data());
      setCheckedInTickets(tickets);
    }, (err) => {
      console.error("Error listening to checked-in tickets: ", err);
    });

    return () => {
      unsubscribe();
      setCheckedInTickets([]);
    };
  }, [user]);

  // 3. Fetch user's completed trails for persistent reward state
  useEffect(() => {
    if (!user) return;

    const rewardsRef = collection(db, "users", user.uid, "completedTrails");
    const unsubscribe = onSnapshot(rewardsRef, (snapshot) => {
      const ids = new Set(snapshot.docs.map((doc) => doc.id));
      setCompletedTrailIds(ids);
    }, (err) => {
      console.error("Error listening to completed trails: ", err);
    });

    return () => {
      unsubscribe();
      setCompletedTrailIds(new Set());
    };
  }, [user]);

  // Click card button action handler
  const handleOpenBooking = useCallback((event) => {
    if (!user) {
      // Trigger App.jsx login modal via query param
      setSearchParams({ login: "true" });
    } else {
      setSelectedEvent(event);
      setBookingOpen(true);
    }
  }, [user, setSearchParams]);

  // Seeder helper to populate database with sample data
  const seedSampleEvents = async () => {
    setSeeding(true);
    try {
      const sampleEvents = [
        {
          name: "Berlin Avant-Garde Gallery Opening",
          date: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
          image: "https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?q=80&w=800&auto=format&fit=crop",
          category: "Art",
          vibe: "Chill",
          price: 0,
          inventory: 50,
          soldCount: 0,
          waitlistCount: 0,
          isFree: true,
          hypeMode: false,
          organizerId: "demo-organizer-uid",
          venueName: "Hamburger Bahnhof",
          venueAddress: "Invalidenstraße 50-51, 10557 Berlin",
          latitude: 52.5283,
          longitude: 13.3725,
          estimatedDuration: 90,
          meetupEnabled: false,
          createdAt: new Date()
        },
        {
          name: "Classic Jazz Quintet Live",
          date: new Date(Date.now() + 86400000 * 5).toISOString(),
          image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=800&auto=format&fit=crop",
          category: "Music",
          vibe: "Energetic",
          price: 35.00,
          inventory: 80,
          soldCount: 0,
          waitlistCount: 0,
          isFree: false,
          hypeMode: false,
          organizerId: "demo-organizer-uid",
          venueName: "A-Trane Jazz Club",
          venueAddress: "Bleibtreustraße 1, 10623 Berlin",
          latitude: 52.5069,
          longitude: 13.3228,
          estimatedDuration: 120,
          meetupEnabled: true,
          meetupVenueName: "Café Einstein Stammhaus",
          meetupVenueAddress: "Kurfürstenstraße 58, 10785 Berlin",
          meetupNote: "Ask for the Kultura table — first drink is on the house for ticket holders.",
          createdAt: new Date()
        },
        {
          name: "Historical Street Art Walking Tour",
          date: new Date(Date.now() + 86400000 * 3).toISOString(),
          image: "https://images.unsplash.com/photo-1561055657-b9e0bf0fa360?q=80&w=800&auto=format&fit=crop",
          category: "Tourism",
          vibe: "Local Secret",
          price: 15.00,
          inventory: 30,
          soldCount: 0,
          waitlistCount: 0,
          isFree: false,
          hypeMode: false,
          organizerId: "demo-organizer-uid",
          venueName: "East Side Gallery",
          venueAddress: "Mühlenstraße 3-100, 10243 Berlin",
          latitude: 52.5051,
          longitude: 13.4396,
          estimatedDuration: 150,
          meetupEnabled: true,
          meetupVenueName: "Holzmarkt Bar",
          meetupVenueAddress: "Holzmarktstraße 25, 10243 Berlin",
          meetupNote: "Meet at the rooftop terrace. Show your Kultura pass for a secret menu.",
          createdAt: new Date()
        },
        {
          name: "Symphony Under the Stars",
          date: new Date(Date.now() + 86400000 * 8).toISOString(),
          image: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=800&auto=format&fit=crop",
          category: "Music",
          vibe: "Chill",
          price: 45.00,
          inventory: 120,
          soldCount: 0,
          waitlistCount: 0,
          isFree: false,
          hypeMode: true,
          organizerId: "demo-organizer-uid",
          venueName: "Berliner Philharmonie",
          venueAddress: "Herbert-von-Karajan-Straße 1, 10785 Berlin",
          latitude: 52.5104,
          longitude: 13.3696,
          estimatedDuration: 180,
          meetupEnabled: false,
          createdAt: new Date()
        },
        {
          name: "Shakespeare in the Park",
          date: new Date(Date.now() + 86400000 * 4).toISOString(),
          image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop",
          category: "Theater",
          vibe: "Family Friendly",
          price: 0,
          inventory: 150,
          soldCount: 0,
          waitlistCount: 0,
          isFree: true,
          hypeMode: false,
          organizerId: "demo-organizer-uid",
          venueName: "Volkspark Friedrichshain",
          venueAddress: "Am Friedrichshain, 10249 Berlin",
          latitude: 52.5282,
          longitude: 13.4382,
          estimatedDuration: 120,
          meetupEnabled: false,
          createdAt: new Date()
        }
      ];

      for (const ev of sampleEvents) {
        await addDoc(collection(db, "events"), ev);
      }
    } catch (err) {
      console.error("Error seeding data:", err);
    } finally {
      setSeeding(false);
    }
  };

  // Filters calculation
  const filteredEvents = events.filter((ev) => {
    // Vibe filter
    if (selectedVibe !== "All") {
      const fallbackVibe = ev.category === "Music" ? "Energetic" : ev.category === "Art" ? "Chill" : ev.category === "Theater" ? "Family Friendly" : "Local Secret";
      const eventVibe = ev.vibe || fallbackVibe;
      if (eventVibe.toLowerCase() !== selectedVibe.toLowerCase()) return false;
    }
    // Search query filter
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchName = ev.name?.toLowerCase().includes(q);
      const matchCategory = ev.category?.toLowerCase().includes(q);
      const matchVibe = ev.vibe?.toLowerCase().includes(q);
      if (!matchName && !matchCategory && !matchVibe) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#2A2A2A] font-sans pb-24">
      {/* Editorial Hero Banner */}
      <div className="relative overflow-hidden select-none rounded-b-[2rem] sm:rounded-b-[2.5rem] md:rounded-[2.5rem] md:mx-6 lg:mx-8 md:mt-4 min-h-[420px] sm:min-h-[450px] md:min-h-[440px] lg:min-h-[460px] shadow-xl md:shadow-2xl flex flex-col justify-end">
        {/* Hero Background Image */}
        <img 
          src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1920&auto=format&fit=crop" 
          alt="Cultural Festival" 
          loading="eager"
          className="absolute inset-0 w-full h-full object-cover object-center transform scale-105 transition-transform duration-1000 ease-out"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/90" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/60 to-transparent opacity-95" />
        
        {/* Hero Content */}
        <div className="relative z-10 w-full px-4 pt-10 pb-6 sm:px-8 sm:pt-12 sm:pb-8 md:px-10 md:pt-14 md:pb-9 lg:px-14 lg:pt-16 lg:pb-10 flex flex-col justify-end">
          
          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-bold font-display text-white tracking-tight max-w-2xl mb-2.5 md:mb-3 text-left leading-[1.12] sm:leading-[1.08]">
            Discover the Soul <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-neutral-300">
              of the City.
            </span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-white/80 text-xs sm:text-sm md:text-base max-w-xl font-light leading-relaxed mb-5 md:mb-6 text-left">
            Experience local theater, dynamic gallery openings, historical city trails, and acoustic sessions happening near you.
          </p>

          {/* Search Inputs (Glassmorphism) */}
          <div className="w-full max-w-3xl bg-white/12 backdrop-blur-2xl border border-white/20 p-2 sm:p-2.5 rounded-2xl md:rounded-full flex flex-col md:flex-row gap-2 items-stretch md:items-center shadow-2xl shadow-black/30 hover:border-white/30 focus-within:border-white/40 focus-within:bg-white/15 transition-all duration-300">
            {/* Search Field */}
            <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 md:py-0 bg-white/5 md:bg-transparent rounded-xl md:rounded-none">
              <Search className="text-white/60 shrink-0" size={18} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What vibe are you looking for?" 
                className="w-full bg-transparent border-none text-white placeholder-white/50 focus:outline-none font-light text-xs sm:text-sm md:text-base"
              />
            </div>
            
            {/* Divider (desktop only) */}
            <div className="hidden md:block w-px h-7 bg-white/20 shrink-0" />
            
            {/* Location Field */}
            <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 md:py-0 bg-white/5 md:bg-transparent rounded-xl md:rounded-none">
              <MapPin className="text-[#EA7963] shrink-0" size={18} />
              <input 
                type="text" 
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                placeholder="Berlin, Germany" 
                className="w-full bg-transparent border-none text-white placeholder-white/50 focus:outline-none font-light text-xs sm:text-sm md:text-base"
              />
            </div>
            
            {/* Explore Button */}
            <button className="w-full md:w-auto h-11 sm:h-12 md:h-12 px-8 rounded-xl md:rounded-full bg-gradient-to-r from-[#358597] to-[#2C6E7D] hover:from-[#2C6E7D] hover:to-[#225763] text-white active:scale-[0.98] transition-all duration-300 font-display font-semibold tracking-wide shadow-lg shadow-[#358597]/30 shrink-0 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer">
              <Compass size={18} />
              Explore
            </button>
          </div>
        </div>
      </div>

      {/* Main Discover Layout */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12">
        
        {/* Featured Gatherings Section */}
        {(() => {
          const featuredEvents = events.filter(e => e.featured === true);
          if (featuredEvents.length === 0) return null;

          return (
            <div className="mb-14 text-left">
              <div className="mb-6">
                <span className="text-xs uppercase tracking-wider text-amber-500 font-semibold flex items-center gap-1">
                  <Star size={14} className="fill-amber-500 text-amber-500" /> Spotlight Curation
                </span>
                <h2 className="text-3xl font-bold font-display text-[#2A2A2A] tracking-tight mt-1">Featured Gatherings</h2>
                <p className="text-neutral-500 text-xs font-light">Handpicked premium cultural highlights curated by our platform team.</p>
              </div>

              {/* Horizontal Scroll Carousel */}
              <div className="flex gap-6 overflow-x-auto pb-4 pt-1 snap-x no-scrollbar select-none">
                {featuredEvents.map((event) => {
                  return (
                    <div 
                      key={event.id}
                      className="w-[280px] sm:w-[320px] shrink-0 bg-white border border-neutral-100 rounded-3xl overflow-hidden shadow-xl shadow-neutral-100/50 hover:shadow-2xl hover:shadow-neutral-200/50 hover:border-neutral-200/50 transition-all duration-300 snap-start flex flex-col justify-between"
                    >
                      {/* Image container */}
                      <div className="relative h-44 w-full overflow-hidden">
                        <img 
                          src={event.image} 
                          alt={event.name} 
                          className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        {/* Featured Tag overlay */}
                        <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-white text-[10px] font-bold uppercase tracking-wider">
                          <Star size={10} className="fill-amber-400 text-amber-400" />
                          Featured
                        </div>
                      </div>

                      {/* Event Details */}
                      <div className="p-5 flex-grow flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 border border-neutral-200/50 text-neutral-500 font-bold uppercase tracking-wider">
                              {event.category}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-light font-mono">
                              {event.vibe}
                            </span>
                          </div>

                          <h3 className="font-display font-bold text-base text-[#2A2A2A] leading-tight mb-2 truncate">
                            {event.name}
                          </h3>

                          <p className="text-[11px] text-neutral-400 font-light mb-4">
                            {new Date(event.date).toLocaleDateString(undefined, {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </p>
                        </div>

                        {/* Button and price */}
                        <div className="flex items-center justify-between pt-3 border-t border-neutral-50">
                          <div>
                            <span className="block text-[8px] uppercase tracking-wider text-neutral-400 font-semibold">Pass Rate</span>
                            <span className="font-display font-bold text-sm text-[#2A2A2A]">
                              {event.isFree ? "Free" : `$${event.price?.toFixed(2)}`}
                            </span>
                          </div>

                          <button
                            onClick={() => handleOpenBooking(event)}
                            className="h-9 px-4 rounded-full bg-[#2A2A2A] text-white hover:bg-neutral-800 transition-colors text-xs font-semibold tracking-wide uppercase font-display shadow-sm flex items-center gap-1"
                          >
                            Book Spot
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* City Trails Passport Section */}
        <div className="mb-14">
          <div className="text-left mb-6">
            <span className="text-xs uppercase tracking-wider text-[#EA7963] font-semibold flex items-center gap-1">
              <Award size={14} className="text-[#358597]" /> Visitor Gamified Passport
            </span>
            <h2 className="text-3xl font-bold font-display text-[#2A2A2A] tracking-tight mt-1">Active City Trails</h2>
            <p className="text-neutral-500 text-xs font-light">Attend events and scan passes to stamp your passport and unlock local rewards.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...defaultTrails, ...dbTrails].map((trail) => {
              const checkedInCount = getCheckedInCountForTrail(trail);
              const progressPercent = Math.min(100, Math.round((checkedInCount / trail.goalCount) * 100));
              const isCompleted = completedTrailIds.has(trail.id) || checkedInCount >= trail.goalCount;

              return (
                <div 
                  key={trail.id}
                  className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-xl shadow-neutral-100/50 flex flex-col justify-between relative overflow-hidden text-left"
                >
                  {/* Decorative Subtle Background */}
                  <div className={`absolute -right-10 -bottom-10 w-32 h-32 rounded-full bg-gradient-to-br ${trail.themeColor} opacity-30 pointer-events-none blur-xl`} />

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-500 border border-neutral-200/50 uppercase font-bold font-sans">
                        {trail.category} Trail
                      </span>
                      {isCompleted && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold uppercase tracking-wider">
                          Reward Unlocked!
                        </span>
                      )}
                    </div>

                    <h3 className="font-display font-bold text-lg text-[#2A2A2A] mb-1.5 leading-tight">
                      {trail.name}
                    </h3>
                    
                    <p className="text-neutral-400 text-xs font-light leading-relaxed mb-4">
                      {trail.description}
                    </p>

                    {trail.eventIds && (
                      <div className="mb-5 p-3 rounded-2xl bg-neutral-50/50 border border-neutral-100/50 text-left">
                        <span className="block text-[9px] uppercase tracking-wider text-neutral-400 font-semibold mb-1.5 pl-0.5">Required Stops</span>
                        <ul className="space-y-1.5">
                          {trail.eventIds.map((id) => {
                            const ev = events.find(e => e.id === id);
                            return (
                              <li key={id} className="text-[10px] text-neutral-500 font-sans flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#EA7963]/80 shrink-0" />
                                <span className="truncate flex-grow" title={ev ? ev.name : "Event Stops"}>
                                  {ev ? ev.name : `Event: ${id.substring(0, 5)}...`}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div>
                    {/* Progress Indicator */}
                    <div className="flex justify-between text-xs font-sans text-neutral-500 mb-1.5">
                      <span>{checkedInCount} / {trail.goalCount} Stamps Earned</span>
                      <span className="font-semibold">{progressPercent}%</span>
                    </div>

                    <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden mb-4">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${
                          isCompleted ? "bg-emerald-500" : "bg-[#358597]"
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>

                    {/* Reward Text */}
                    {isCompleted ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs flex gap-2 items-center">
                        <CheckCircle size={14} className="shrink-0 text-emerald-500" />
                        <div>
                          <span className="block text-[8px] uppercase tracking-wider font-semibold leading-none text-emerald-500 mb-0.5">Unlocked Code: TRAVELPASS7</span>
                          <span className="font-semibold text-[10px] leading-tight">{trail.reward}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-neutral-400 font-sans flex items-start gap-1">
                        <span className="font-semibold text-[#EA7963]">Reward:</span>
                        <span>{trail.reward} ({trail.badge} badge)</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vibe Filters and Feed Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-neutral-100 pb-5 mb-8 text-left">
          <div>
            <h2 className="text-3xl font-bold font-display text-[#2A2A2A] tracking-tight">Curated Vibe Trails</h2>
            <p className="text-neutral-500 text-sm font-light mt-1">Handpicked cultural gather spots filtered by your current mood.</p>
          </div>

          {/* Vibe Pills Horizontal Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto py-2 mt-4 md:mt-0 max-w-full no-scrollbar select-none">
            {vibes.map((vibe) => (
              <button
                key={vibe}
                onClick={() => setSelectedVibe(vibe)}
                className={`h-9 px-4 rounded-full text-xs font-semibold tracking-wide shrink-0 transition-all duration-300 font-display ${
                  selectedVibe === vibe
                    ? "bg-[#358597] text-white shadow-md shadow-teal-500/25"
                    : "bg-neutral-100 hover:bg-neutral-200/60 text-neutral-500"
                }`}
              >
                {vibe}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 mt-4 md:mt-0 ml-0 md:ml-3 shrink-0">
            <button
              onClick={() => setViewMode("list")}
              className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                viewMode === "list"
                  ? "bg-[#2A2A2A] text-white shadow-md"
                  : "bg-neutral-100 text-neutral-400 hover:bg-neutral-200/60"
              }`}
              title="List View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                viewMode === "map"
                  ? "bg-[#2A2A2A] text-white shadow-md"
                  : "bg-neutral-100 text-neutral-400 hover:bg-neutral-200/60"
              }`}
              title="Map View"
            >
              <Map size={16} />
            </button>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#358597]"></div>
            <p className="mt-4 text-xs text-neutral-400 font-light">Discovering cultural itineraries...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          /* Empty Feed State & Demo Seeder */
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-neutral-200 rounded-[2.5rem] bg-neutral-50/50">
            <div className="w-16 h-16 rounded-full bg-[#358597]/10 flex items-center justify-center mb-4 text-[#358597]">
              <Compass size={28} />
            </div>
            
            <h3 className="font-display font-semibold text-lg text-[#2A2A2A]">Events are on their way</h3>
            <p className="text-neutral-400 text-xs font-light max-w-xs text-center mt-1 leading-relaxed">
              No matching listings loaded in this vibe category yet. Seed demo events to showcase the interface instantly.
            </p>

            <button
              onClick={seedSampleEvents}
              disabled={seeding}
              className="mt-6 h-11 px-6 rounded-full bg-[#EA7963] hover:bg-[#D96853] disabled:bg-neutral-400 text-white font-display text-xs font-semibold tracking-wider uppercase transition-all duration-300 shadow-md flex items-center gap-2"
            >
              {seeding ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Flame size={14} />
              )}
              Seed Sample Events
            </button>
          </div>
        ) : viewMode === "map" ? (
          /* Interactive Vibe Map View */
          <VibeMap
            events={filteredEvents}
            onBook={handleOpenBooking}
            selectedVibe={selectedVibe}
          />
        ) : (
          /* Active Event Feed Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event) => (
              <EventCard 
                key={event.id} 
                event={event} 
                onBook={handleOpenBooking} 
              />
            ))}
          </div>
        )}
      </div>

      {/* Global Booking Checkout Modal */}
      <BookingModal
        isOpen={bookingOpen}
        onClose={() => {
          setBookingOpen(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
        onSuccess={() => {
          // Allow small delay before closing modal
          setTimeout(() => {
            setBookingOpen(false);
            setSelectedEvent(null);
            navigate("/wallet");
          }, 2000);
        }}
      />
    </div>
  );
};

export default Discover;
