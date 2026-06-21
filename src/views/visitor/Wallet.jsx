import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../hooks/useAuth";
import { Ticket, Award, History, Calendar, MapPin, Search, ArrowUpRight, Check, Sparkles, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Wallet = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("active"); // "active" | "waitlist" | "history"
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch user tickets in real-time
  useEffect(() => {
    if (!user) return;

    const ticketsRef = collection(db, "tickets");
    const q = query(ticketsRef, where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
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

      setTickets(fetchedTickets);
      setLoading(false);
    }, (err) => {
      console.error("Error listening to tickets:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Filter tickets by activeTab
  const getFilteredTickets = () => {
    return tickets.filter((t) => {
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
        </div>

        {/* Dynamic Loading state */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#358597]"></div>
            <p className="mt-4 text-xs text-neutral-400 font-light">Loading ticket archive...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          /* Empty Wallet View */
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-neutral-200 rounded-[2.5rem] bg-neutral-50/50 text-center">
            <div className="w-14 h-14 rounded-full bg-neutral-50 flex items-center justify-center border border-neutral-100 mb-4 text-neutral-300">
              <Ticket size={22} />
            </div>
            
            <h4 className="font-display font-semibold text-lg text-[#2A2A2A]">
              {activeTab === "active" ? "No active passes" : activeTab === "waitlist" ? "No pre-booking waitlists" : "Empty stamped passport"}
            </h4>
            
            <p className="text-neutral-400 text-xs font-light max-w-xs mt-1.5 leading-relaxed">
              {activeTab === "active" 
                ? "Explore trails happening around Berlin and secure your entry passes."
                : activeTab === "waitlist"
                  ? "Join upcoming Hype Mode launches to secure 24h pre-booking access."
                  : "Stamps will appear here automatically when checked-in at event entry gates."}
            </p>
            
            <button
              onClick={() => navigate("/")}
              className="mt-6 h-11 px-6 rounded-full bg-[#358597] text-white hover:bg-[#2C6E7D] transition-colors font-display text-xs font-semibold tracking-wider uppercase shadow-md flex items-center gap-1.5"
            >
              Discover Events
              <ArrowUpRight size={14} />
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
                <div 
                  key={t.id} 
                  className={`bg-white rounded-3xl border border-neutral-100 hover:border-neutral-200/80 shadow-xl shadow-neutral-100/40 overflow-hidden flex flex-col sm:flex-row min-h-[180px] transition-all relative ${
                    t.status === "checked-in" ? "opacity-95" : ""
                  }`}
                >
                  {/* LEFT STUB: Event details */}
                  <div className="p-5 flex gap-4 flex-grow text-left">
                    {/* Event Banner */}
                    <img 
                      src={t.eventImage || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=200&auto=format&fit=crop"} 
                      alt={t.eventName} 
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-neutral-200/45 shrink-0 select-none align-middle"
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

                        <h3 className="font-display font-bold text-base text-[#2A2A2A] leading-tight">
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
                  <div className="p-5 sm:w-44 bg-neutral-50/50 border-t sm:border-t-0 sm:border-l border-neutral-100 flex flex-col justify-between items-center shrink-0">
                    
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
                        <span className="font-semibold text-emerald-600">Checked In</span>
                      ) : t.status === "waitlist" ? (
                        <span className="text-amber-600 font-medium">Notify on Open</span>
                      ) : (
                        <span className="text-[#358597] font-medium">Ready to Scan</span>
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;
