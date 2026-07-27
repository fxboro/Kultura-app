import { useState, useEffect, useRef } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../hooks/useAuth";
import { Ticket, Award, History, Calendar, MapPin, ArrowUpRight, Check, Sparkles, Flame, Gift, Star, Route, PartyPopper, QrCode, Search, Bell, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ItineraryBuilder from "../../components/discovery/ItineraryBuilder";
import TicketQRModal from "../../components/events/TicketQRModal";

const Wallet = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("active"); // "active" | "waitlist" | "history" | "rewards" | "itinerary"
  const [tickets, setTickets] = useState([]);
  const [completedTrails, setCompletedTrails] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Interactive Ticket QR inspection state
  const [selectedTicketForQR, setSelectedTicketForQR] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [checkInNotice, setCheckInNotice] = useState(null);
  const prevCheckedInIdsRef = useRef(new Set());

  // Dev mode detection — user.uid starts with "dev-user-"
  const isDevMode = user?.uid?.startsWith("dev-user-");

  // Fetch user tickets in real-time (or load demo data in dev mode)
  useEffect(() => {
    if (!user) return;

    // Dev mode: generate demo tickets so the wallet is testable without Firebase
    if (isDevMode) {
      const now = new Date();
      const demoTickets = [
        {
          id: "demo-ticket-001",
          userId: user.uid,
          eventName: "Lagos Jazz Festival 2026",
          eventDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          eventCategory: "Music",
          eventImage: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?q=80&w=400&auto=format&fit=crop",
          ticketCode: "KLT-847291",
          status: "valid",
          price: 45.00,
          quantity: 1,
          meetupEnabled: true,
          meetupVenueName: "Café Harmonia",
          meetupVenueAddress: "12 Akin Adesola, Victoria Island, Lagos",
          meetupNote: "After the show — live acoustic jam session with the headline performers.",
          purchaseDate: { seconds: Math.floor(now.getTime() / 1000) - 86400 }
        },
        {
          id: "demo-ticket-002",
          userId: user.uid,
          eventName: "Nollywood Night: Heritage Screening",
          eventDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          eventCategory: "Film",
          eventImage: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=400&auto=format&fit=crop",
          ticketCode: "KLT-563014",
          status: "valid",
          price: 0,
          quantity: 2,
          meetupEnabled: false,
          purchaseDate: { seconds: Math.floor(now.getTime() / 1000) - 3600 }
        },
        {
          id: "demo-ticket-003",
          userId: user.uid,
          eventName: "Afrobeats Under the Stars",
          eventDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          eventCategory: "Music",
          eventImage: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=400&auto=format&fit=crop",
          ticketCode: "KLT-110582",
          status: "checked-in",
          price: 30.00,
          quantity: 1,
          meetupEnabled: true,
          meetupVenueName: "Rooftop Lounge",
          meetupVenueAddress: "42 Admiralty Way, Lekki Phase 1",
          meetupNote: "DJ afterparty with complimentary local cocktails for all ticket holders.",
          purchaseDate: { seconds: Math.floor(now.getTime() / 1000) - 172800 }
        },
        {
          id: "demo-ticket-004",
          userId: user.uid,
          eventName: "Art Basel × Kultura Pop-Up",
          eventDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          eventCategory: "Art",
          eventImage: "https://images.unsplash.com/photo-1578301978693-85fa9fd0c5b5?q=80&w=400&auto=format&fit=crop",
          ticketCode: "KLT-729438",
          status: "waitlist",
          price: 75.00,
          quantity: 1,
          meetupEnabled: false,
          purchaseDate: { seconds: Math.floor(now.getTime() / 1000) - 7200 }
        }
      ];

      // Sort by purchase date (newest first)
      demoTickets.sort((a, b) => (b.purchaseDate?.seconds || 0) - (a.purchaseDate?.seconds || 0));

      // Initialize checked-in IDs for check-in detection
      demoTickets.forEach((t) => {
        if (t.status === "checked-in") {
          prevCheckedInIdsRef.current.add(t.id);
        }
      });

      setTickets(demoTickets);
      setLoading(false);
      return; // No Firestore listener needed in dev mode
    }

    // Production mode: real-time Firestore listener
    const ticketsRef = collection(db, "tickets");
    const q = query(ticketsRef, where("userId", "==", user.uid));

    // Safety timeout: if Firestore never responds, stop loading after 4 seconds
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 4000);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      clearTimeout(safetyTimeout);
      const fetchedTickets = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort tickets (newest purchase first)
      fetchedTickets.sort((a, b) => {
        const timeA = a.purchaseDate?.seconds || 0;
        const timeB = b.purchaseDate?.seconds || 0;
        return timeB - timeA;
      });

      // Detect real-time gate check-ins to trigger notification banner
      fetchedTickets.forEach((t) => {
        if (t.status === "checked-in") {
          if (prevCheckedInIdsRef.current.size > 0 && !prevCheckedInIdsRef.current.has(t.id)) {
            setCheckInNotice({
              eventName: t.eventName,
              meetupEnabled: t.meetupEnabled,
              meetupVenueName: t.meetupVenueName
            });
          }
          prevCheckedInIdsRef.current.add(t.id);
        }
      });

      setTickets(fetchedTickets);
      setLoading(false);
    }, (err) => {
      clearTimeout(safetyTimeout);
      console.error("Error listening to tickets:", err);
      setLoading(false);
    });

    return () => {
      clearTimeout(safetyTimeout);
      unsubscribe();
    };
  }, [user, isDevMode]);

  // Fetch completed trails (rewards)
  useEffect(() => {
    if (!user) return;

    // Skip Firestore query in dev mode
    if (isDevMode) return;

    const rewardsRef = collection(db, "users", user.uid, "completedTrails");
    const unsubscribe = onSnapshot(rewardsRef, (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by completedAt (newest first)
      fetched.sort((a, b) => {
        const timeA = a.completedAt?.seconds || 0;
        const timeB = b.completedAt?.seconds || 0;
        return timeB - timeA;
      });
      setCompletedTrails(fetched);
    }, (err) => {
      console.error("Error listening to completed trails:", err);
    });

    return () => {
      unsubscribe();
      setCompletedTrails([]);
    };
  }, [user, isDevMode]);

  // Filter tickets by activeTab and searchQuery
  const getFilteredTickets = () => {
    return tickets.filter((t) => {
      const matchesSearch = searchQuery.trim() === "" || 
        t.eventName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.eventCategory?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.ticketCode?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (activeTab === "active") return t.status === "valid";
      if (activeTab === "waitlist") return t.status === "waitlist";
      if (activeTab === "history") return t.status === "checked-in";
      return false;
    });
  };

  const filteredTickets = getFilteredTickets();

  // Helper: Renders vertical barcode stripes for that classic physical pass look
  const renderStripeBarcode = (code) => {
    // Generate a semi-deterministic set of bars based on the ticket code
    const bars = [];
    const charSum = code.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    for (let i = 0; i < 28; i++) {
      const isThick = (charSum + i) % 3 === 0;
      const isMedium = (charSum + i) % 4 === 1;
      const widthClass = isThick ? "w-[3px]" : isMedium ? "w-[2px]" : "w-[1px]";
      const colorClass = i % 7 === 0 ? "bg-transparent" : "bg-neutral-800";
      bars.push(<div key={i} className={`h-full ${widthClass} ${colorClass} shrink-0`} />);
    }
    return <div className="h-10 flex gap-[1.5px] items-center justify-center bg-white px-2 py-1 rounded border border-neutral-100 overflow-hidden select-none w-full">{bars}</div>;
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#2A2A2A] font-sans pb-24">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 md:pt-12">
        
        {/* Header */}
        <div className="mb-10 text-left">
          <div className="flex items-center gap-1 text-[#358597] mb-1 font-sans">
            <Sparkles size={14} className="text-[#EA7963]" />
            <span className="text-xs uppercase tracking-wider font-semibold">Visitor Account Panel</span>
          </div>
          <h1 className="text-4xl font-bold font-display text-[#2A2A2A] tracking-tight mt-1">
            My Cultural Collection
          </h1>
          <p className="text-neutral-500 text-sm font-light mt-1">
            View active gate passes, review pre-booking waitlists, and manage your stamped trail history.
          </p>
        </div>

        {/* Tab Selector Menu */}
        <div className="flex border-b border-neutral-100 gap-6 mb-8 text-sm select-none">
          <button 
            onClick={() => setActiveTab("active")}
            className={`pb-3 font-display text-sm font-semibold tracking-wide flex items-center gap-2 border-b-2 transition-all duration-300 ${
              activeTab === "active" 
                ? "border-[#358597] text-[#358597]" 
                : "border-transparent text-neutral-400 font-light hover:text-[#2A2A2A]"
            }`}
          >
            <Ticket size={16} /> 
            Active Passes
            {tickets.filter(t => t.status === "valid").length > 0 && (
              <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[#358597]/15 text-[#358597] font-sans">
                {tickets.filter(t => t.status === "valid").length}
              </span>
            )}
          </button>
          
          <button 
            onClick={() => setActiveTab("waitlist")}
            className={`pb-3 font-display text-sm font-semibold tracking-wide flex items-center gap-2 border-b-2 transition-all duration-300 ${
              activeTab === "waitlist" 
                ? "border-[#EA7963] text-[#EA7963]" 
                : "border-transparent text-neutral-400 font-light hover:text-[#2A2A2A]"
            }`}
          >
            <Flame size={16} /> 
            Waitlists
            {tickets.filter(t => t.status === "waitlist").length > 0 && (
              <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[#EA7963]/15 text-[#EA7963] font-sans">
                {tickets.filter(t => t.status === "waitlist").length}
              </span>
            )}
          </button>
          
          <button 
            onClick={() => setActiveTab("history")}
            className={`pb-3 font-display text-sm font-semibold tracking-wide flex items-center gap-2 border-b-2 transition-all duration-300 ${
              activeTab === "history" 
                ? "border-emerald-600 text-emerald-600" 
                : "border-transparent text-neutral-400 font-light hover:text-[#2A2A2A]"
            }`}
          >
            <History size={16} /> 
            Stamped Passport
            {tickets.filter(t => t.status === "checked-in").length > 0 && (
              <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-sans">
                {tickets.filter(t => t.status === "checked-in").length}
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab("rewards")}
            className={`pb-3 font-display text-sm font-semibold tracking-wide flex items-center gap-2 border-b-2 transition-all duration-300 ${
              activeTab === "rewards" 
                ? "border-amber-500 text-amber-600" 
                : "border-transparent text-neutral-400 font-light hover:text-[#2A2A2A]"
            }`}
          >
            <Gift size={16} /> 
            Rewards
            {completedTrails.length > 0 && (
              <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-sans">
                {completedTrails.length}
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab("itinerary")}
            className={`pb-3 font-display text-sm font-semibold tracking-wide flex items-center gap-2 border-b-2 transition-all duration-300 ${
              activeTab === "itinerary" 
                ? "border-[#358597] text-[#358597]" 
                : "border-transparent text-neutral-400 font-light hover:text-[#2A2A2A]"
            }`}
          >
            <Route size={16} /> 
            Itinerary
          </button>
        </div>

        {/* Real-time Gate Check-In Celebration Notification Banner */}
        {checkInNotice && (
          <div className="mb-6 p-4 rounded-3xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs flex justify-between items-center shadow-md animate-bounce">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <PartyPopper size={20} />
              </div>
              <div className="text-left">
                <span className="font-bold text-sm text-emerald-900 block">Gate Pass Stamped! 🎉</span>
                <span>Checked in for <strong>{checkInNotice.eventName}</strong>. {checkInNotice.meetupEnabled ? `Unlocked Secret After-Party Meetup at ${checkInNotice.meetupVenueName || "Partner Venue"}!` : "Your cultural passport has been stamped."}</span>
              </div>
            </div>
            <button onClick={() => setCheckInNotice(null)} className="p-1.5 rounded-full text-emerald-600 hover:bg-emerald-100/50 transition-colors">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Quick Search & Filter Bar */}
        {["active", "waitlist", "history"].includes(activeTab) && (
          <div className="relative mb-6 max-w-sm text-left">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter passes by event, category, or code..."
              className="w-full h-11 pl-9 pr-4 rounded-full border border-neutral-200/80 bg-white focus:outline-none focus:ring-2 focus:ring-[#358597]/20 focus:border-[#358597] text-xs text-[#2A2A2A] placeholder-neutral-300 transition-all font-light shadow-sm"
            />
          </div>
        )}

        {/* Itinerary Tab — renders independently */}
        {activeTab === "itinerary" ? (
          <ItineraryBuilder tickets={tickets} />
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#358597]"></div>
            <p className="mt-4 text-xs text-neutral-400 font-light">Loading ticket archive...</p>
          </div>
        ) : filteredTickets.length === 0 && activeTab !== "rewards" ? (
          /* Empty Wallet View */
          <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-neutral-200 rounded-[2.5rem] bg-neutral-50/20 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center border mb-4 shadow-sm ${
              activeTab === "active" 
                ? "bg-[#358597]/10 border-[#358597]/20 text-[#358597]" 
                : activeTab === "waitlist"
                  ? "bg-[#EA7963]/10 border-[#EA7963]/20 text-[#EA7963]"
                  : "bg-emerald-50 border-emerald-100 text-emerald-600"
            }`}>
              {activeTab === "active" ? (
                <Ticket size={26} />
              ) : activeTab === "waitlist" ? (
                <Flame size={26} />
              ) : (
                <History size={26} />
              )}
            </div>
            
            <h4 className="font-display font-bold text-lg text-[#2A2A2A] tracking-tight">
              {activeTab === "active" ? "Your Wallet is Empty" : activeTab === "waitlist" ? "No Active Waitlists" : "No Stamped History Yet"}
            </h4>
            
            <p className="text-neutral-400 text-xs font-light max-w-sm mt-2 leading-relaxed">
              {activeTab === "active" 
                ? "You don't have any active passes. Browse the curated cultural trails around the city to book your next experience."
                : activeTab === "waitlist"
                  ? "You aren't on any pre-booking waitlists. Join waitlists for upcoming hot events to lock in early ticket access."
                  : "Collect stamps by attending events! Present your digital ticket at the gate scanner to stamp your cultural passport."}
            </p>
            
            <button
              onClick={() => navigate("/")}
              className={`mt-6 h-10 px-5 rounded-full text-white transition-all text-xs font-semibold tracking-wider uppercase shadow-md flex items-center gap-1.5 ${
                activeTab === "active" 
                  ? "bg-[#358597] hover:bg-[#2C6E7D]" 
                  : activeTab === "waitlist"
                    ? "bg-[#EA7963] hover:bg-[#D96853]"
                    : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              Explore Discover Feed
              <ArrowUpRight size={14} className="shrink-0" />
            </button>
          </div>
        ) : (
          /* Tickets Grid (Aesthetic Ticket Stubs) */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredTickets.map((t) => {
              const eventDate = new Date(t.eventDate);
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

              return (
                <div key={t.id} className="flex flex-col gap-3 h-full">
                  <div 
                    onClick={() => setSelectedTicketForQR(t)}
                    className={`bg-white rounded-3xl border border-neutral-100 hover:border-[#358597]/40 hover:shadow-2xl shadow-xl shadow-neutral-100/40 overflow-hidden flex flex-col sm:flex-row min-h-[180px] transition-all duration-300 relative cursor-pointer group ${
                      t.status === "checked-in" ? "opacity-95" : ""
                    }`}
                  >
                    {/* LEFT STUB: Event details */}
                    <div className="p-5 flex gap-4 flex-grow text-left">
                      {/* Event Banner */}
                      <img 
                        src={t.eventImage || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=200&auto=format&fit=crop"} 
                        alt={t.eventName} 
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-neutral-200/45 shrink-0 select-none align-middle group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      
                      <div className="flex flex-col justify-between">
                        <div>
                          {/* Status / Category tag */}
                          <div className="flex flex-wrap gap-2 items-center mb-1">
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-neutral-100 border border-neutral-200/50 text-neutral-500 font-bold uppercase tracking-wider font-sans">
                              {t.eventCategory || "Trail"}
                            </span>
                            
                            {t.status === "waitlist" && (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 font-semibold uppercase tracking-wider font-sans flex items-center gap-0.5">
                                <Flame size={9} /> Waitlist
                              </span>
                            )}
                            
                            {t.status === "checked-in" && (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 font-semibold uppercase tracking-wider font-sans">
                                Stamped
                              </span>
                            )}
                          </div>

                          <h3 className="font-display font-bold text-base text-[#2A2A2A] leading-tight group-hover:text-[#358597] transition-colors">
                            {t.eventName}
                          </h3>
                          
                          <p className="text-[11px] text-neutral-400 font-light mt-1.5 flex items-center gap-1 font-sans">
                            <Calendar size={12} className="text-[#358597]" />
                            <span>{formattedDate} • {formattedTime}</span>
                          </p>
                        </div>

                        <div className="mt-4 sm:mt-0">
                          <span className="block text-[8px] uppercase tracking-wider text-neutral-400 font-semibold leading-none">Admission Paid</span>
                          <span className="font-display font-bold text-sm text-[#2A2A2A] mt-0.5 block">
                            {t.price === 0 ? "Free Entry" : `$${t.price.toFixed(2)}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Dash/Perforated Line separator */}
                    <div className="hidden sm:flex flex-col justify-between items-center py-2 shrink-0 select-none">
                      <div className="w-4 h-4 bg-[#FDFDFD] rounded-full border-r border-neutral-100 -mt-4" />
                      <div className="w-px h-28 border-l border-dashed border-neutral-200" />
                      <div className="w-4 h-4 bg-[#FDFDFD] rounded-full border-r border-neutral-100 -mb-4" />
                    </div>

                    {/* RIGHT STUB: Barcode / Scan details */}
                    <div className="p-5 sm:w-44 bg-neutral-50/50 border-t sm:border-t-0 sm:border-l border-neutral-100 flex flex-col justify-between items-center shrink-0 group-hover:bg-[#358597]/5 transition-colors">
                      
                      {t.status === "waitlist" ? (
                        <div className="flex flex-col items-center justify-center flex-grow py-4">
                          <Flame size={24} className="text-amber-500 mb-1" />
                          <span className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider font-sans">Waitlist Code</span>
                          <span className="font-mono font-bold text-sm text-[#2A2A2A] mt-1">{t.ticketCode}</span>
                        </div>
                      ) : (
                        <>
                          <div className="w-full text-center">
                            <span className="text-[9px] uppercase tracking-wider font-semibold text-neutral-400 leading-none block mb-1">Gate Passcode</span>
                            <span className="font-mono font-bold text-lg text-[#2A2A2A] block tracking-widest">{t.ticketCode}</span>
                          </div>

                          {/* Barcode Visual */}
                          <div className={`w-full mt-3 ${t.status === "checked-in" ? "opacity-30 select-none pointer-events-none" : ""}`}>
                            {renderStripeBarcode(t.ticketCode)}
                          </div>
                        </>
                      )}

                      <div className="w-full text-center mt-3 border-t border-neutral-100/80 pt-2 text-[10px] font-sans">
                        {t.status === "checked-in" ? (
                          <span className="font-semibold text-emerald-600 flex items-center justify-center gap-1">
                            <Check size={12} /> Stamped
                          </span>
                        ) : t.status === "waitlist" ? (
                          <span className="text-amber-600 font-medium">Notify on Open</span>
                        ) : (
                          <span className="text-[#358597] font-semibold group-hover:underline flex items-center justify-center gap-1">
                            <QrCode size={12} /> View QR Pass
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stamped Stamp Overlay for Checked-In tickets */}
                    {t.status === "checked-in" && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none select-none">
                        <div className="border-[3px] border-emerald-600/70 bg-white/70 backdrop-blur-sm px-6 py-2 rounded-2xl rotate-[-12deg] shadow-lg flex items-center gap-1.5">
                          <Check size={18} className="text-emerald-600 font-bold shrink-0" />
                          <span className="font-display font-bold text-xs text-emerald-700 tracking-widest uppercase">
                            Passport Stamped
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* After-Event Meetup Details (Unlocked/Revealed) */}
                  {t.meetupEnabled && t.status === "checked-in" && (
                    <div className="bg-gradient-to-br from-purple-900 via-indigo-950 to-neutral-950 border border-purple-800/40 rounded-3xl p-5 shadow-lg animate-in slide-in-from-bottom duration-500 text-left text-white relative overflow-hidden">
                      {/* Decorative background elements */}
                      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-purple-500/20 blur-xl pointer-events-none" />
                      <div className="absolute -left-6 -top-6 w-20 h-20 rounded-full bg-indigo-500/10 blur-lg pointer-events-none" />
                      
                      <div className="flex items-start gap-3.5 relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center shrink-0">
                          <PartyPopper size={18} className="text-purple-300" />
                        </div>
                        <div className="flex-grow min-w-0">
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/20 font-bold uppercase tracking-wider inline-block mb-1.5">
                            Unlocked After-Party Meetup
                          </span>
                          <h4 className="font-display font-bold text-sm text-white truncate">
                            {t.meetupVenueName || "Partner Venue"}
                          </h4>
                          <p className="text-[10px] text-purple-200/70 font-light mt-0.5 flex items-center gap-1">
                            <MapPin size={10} className="text-purple-300 shrink-0" />
                            <span className="truncate">{t.meetupVenueAddress || "Address provided by organizer"}</span>
                          </p>
                          {t.meetupNote && (
                            <p className="text-[11px] text-purple-200 bg-purple-950/40 border border-purple-800/30 rounded-xl p-2.5 mt-3 italic font-light leading-relaxed">
                              "{t.meetupNote}"
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* After-Event Meetup Teaser (Locked) */}
                  {t.meetupEnabled && t.status !== "checked-in" && (
                    <div className="bg-neutral-50 border border-neutral-100 rounded-3xl p-4 shadow-sm text-left flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
                        <PartyPopper size={16} className="text-neutral-400" />
                      </div>
                      <div className="min-w-0 flex-grow">
                        <span className="block text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">After-Event Meetup</span>
                        <span className="text-[10px] text-[#358597] font-medium flex items-center gap-1 mt-0.5">
                          <span>🔒 Secret location unlocks after check-in at gate</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Rewards Tab Content */}
        {activeTab === "rewards" && (
          completedTrails.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-neutral-200 rounded-[2.5rem] bg-neutral-50/20 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center border mb-4 shadow-sm bg-amber-50 border-amber-100 text-amber-500">
                <Gift size={26} />
              </div>
              <h4 className="font-display font-bold text-lg text-[#2A2A2A] tracking-tight">
                No Rewards Unlocked Yet
              </h4>
              <p className="text-neutral-400 text-xs font-light max-w-sm mt-2 leading-relaxed">
                Complete city trails by attending all required events and scanning your pass at the gate. Rewards and badges will appear here.
              </p>
              <button
                onClick={() => navigate("/")}
                className="mt-6 h-10 px-5 rounded-full bg-amber-500 hover:bg-amber-600 text-white transition-all text-xs font-semibold tracking-wider uppercase shadow-md flex items-center gap-1.5"
              >
                Browse City Trails
                <ArrowUpRight size={14} className="shrink-0" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {completedTrails.map((reward) => {
                const completedDate = reward.completedAt?.seconds
                  ? new Date(reward.completedAt.seconds * 1000).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Recently";

                // Generate a deterministic reward code from trail ID
                const rewardCode = `KULTURA-${(reward.trailId || "TRAIL").substring(0, 4).toUpperCase()}${Math.abs(reward.trailId?.split("").reduce((a, c) => a + c.charCodeAt(0), 0) || 0) % 900 + 100}`;

                return (
                  <div
                    key={reward.id}
                    className="bg-white rounded-3xl border border-neutral-100 shadow-xl shadow-neutral-100/40 overflow-hidden relative"
                  >
                    {/* Decorative gradient top bar */}
                    <div className={`h-2 w-full bg-gradient-to-r ${reward.themeColor ? reward.themeColor.split(" ").filter(c => c.startsWith("from-") || c.startsWith("to-")).join(" ") : "from-amber-400 to-orange-500"}`} />

                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Badge Icon */}
                        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                          <Star size={24} className="text-amber-500" />
                        </div>

                        <div className="flex-grow min-w-0">
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold uppercase tracking-wider inline-block mb-1.5">
                            Trail Complete
                          </span>
                          <h3 className="font-display font-bold text-base text-[#2A2A2A] leading-tight truncate">
                            {reward.trailName}
                          </h3>
                          <p className="text-[10px] text-neutral-400 font-light mt-0.5">
                            Earned: {completedDate}
                          </p>
                        </div>
                      </div>

                      {/* Badge */}
                      <div className="mt-4 flex items-center gap-2 p-3 rounded-2xl bg-neutral-50/80 border border-neutral-100/50">
                        <Award size={16} className="text-[#358597] shrink-0" />
                        <div>
                          <span className="block text-[9px] uppercase tracking-wider text-neutral-400 font-semibold">Badge Earned</span>
                          <span className="text-sm font-display font-bold text-[#2A2A2A]">{reward.badge}</span>
                        </div>
                      </div>

                      {/* Reward Code */}
                      <div className="mt-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                        <span className="block text-[9px] uppercase tracking-wider text-emerald-500 font-semibold mb-0.5">Reward Code</span>
                        <span className="font-mono font-bold text-sm text-emerald-700 tracking-wider">{rewardCode}</span>
                        <p className="text-[10px] text-emerald-600/80 font-light mt-1">{reward.reward}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Ticket Pass inspection & QR Modal */}
      <TicketQRModal 
        isOpen={!!selectedTicketForQR} 
        onClose={() => setSelectedTicketForQR(null)} 
        ticket={selectedTicketForQR} 
      />
    </div>
  );
};

export default Wallet;
