import React, { useState, useEffect, useCallback } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../hooks/useAuth";
import { Plus, BarChart3, Scan, Calendar, ArrowUpRight, BadgeAlert, Sparkles, HelpCircle } from "lucide-react";
import CreateEventModal from "../../components/organizer/CreateEventModal";
import GateScanner from "../../components/organizer/GateScanner";

const Dashboard = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Calculated Metrics
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalSold, setTotalSold] = useState(0);

  const fetchOrganizerData = useCallback(async () => {
    if (!user) return;
    
    try {
      const eventsRef = collection(db, "events");
      const q = query(eventsRef, where("organizerId", "==", user.uid));
      const querySnapshot = await getDocs(q);

      const fetchedEvents = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort events by creation date (newest first)
      fetchedEvents.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      setEvents(fetchedEvents);

      // Aggregate stats
      let revenueSum = 0;
      let soldSum = 0;
      
      fetchedEvents.forEach((ev) => {
        const sold = ev.soldCount || 0;
        const price = ev.price || 0;
        revenueSum += sold * price;
        soldSum += sold;
      });

      setTotalRevenue(revenueSum);
      setTotalSold(soldSum);
    } catch (err) {
      console.error("Error fetching organizer metrics:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrganizerData();
  }, [fetchOrganizerData]);

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#2A2A2A] font-sans pb-16">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 md:pt-12">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-1.5 text-[#EA7963] mb-1">
              <Sparkles size={14} className="text-[#358597]" />
              <span className="text-xs uppercase tracking-wider font-semibold">Organizer Management Hub</span>
            </div>
            <h1 className="text-4xl font-bold font-display tracking-tight text-[#2A2A2A]">
              Platform Operations
            </h1>
            <p className="text-neutral-500 text-sm font-light mt-1">
              Monitor active ticket sales, configure Waitlists, and scan visitor entry passes.
            </p>
          </div>

          <button 
            onClick={() => setCreateModalOpen(true)}
            className="h-12 px-6 rounded-full bg-[#EA7963] text-white hover:bg-[#D96853] transition-all duration-300 font-display font-medium tracking-wide shadow-md flex items-center justify-center gap-2 self-start sm:self-auto shrink-0"
          >
            <Plus size={18} />
            Create Event
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Revenue Card */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-100/80 shadow-xl shadow-neutral-100/50 flex flex-col justify-between min-h-[140px]">
            <div className="flex justify-between items-center text-neutral-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Revenue</span>
              <BarChart3 size={18} className="text-[#358597]" />
            </div>
            <div>
              <h2 className="text-4xl font-bold font-display text-[#2A2A2A] tracking-tight">
                ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <span className="text-[10px] text-neutral-400 font-light mt-1 flex items-center gap-0.5">
                <ArrowUpRight size={10} className="text-emerald-500" /> Live payout commission included
              </span>
            </div>
          </div>

          {/* Tickets Sold Card */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-100/80 shadow-xl shadow-neutral-100/50 flex flex-col justify-between min-h-[140px]">
            <div className="flex justify-between items-center text-neutral-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Passes Issued</span>
              <Calendar size={18} className="text-[#EA7963]" />
            </div>
            <div>
              <h2 className="text-4xl font-bold font-display text-[#2A2A2A] tracking-tight">
                {totalSold}
              </h2>
              <span className="text-[10px] text-neutral-400 font-light mt-1">Across all published listings</span>
            </div>
          </div>

          {/* Active Listings Card */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-100/80 shadow-xl shadow-neutral-100/50 flex flex-col justify-between min-h-[140px]">
            <div className="flex justify-between items-center text-neutral-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Campaigns</span>
              <Scan size={18} className="text-emerald-500" />
            </div>
            <div>
              <h2 className="text-4xl font-bold font-display text-[#2A2A2A] tracking-tight">
                {events.length}
              </h2>
              <span className="text-[10px] text-neutral-400 font-light mt-1">Ready for ticket scanning</span>
            </div>
          </div>
        </div>

        {/* Organizer Workspace Layout Grid */}
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          
          {/* Active Events List Container (2/3 width on wide screens) */}
          <div className="lg:col-span-2 bg-white rounded-[2rem] border border-neutral-100 shadow-xl shadow-neutral-100/50 p-6 md:p-8">
            <h3 className="font-display font-semibold text-lg border-b border-neutral-100 pb-4 mb-6 text-left">
              My Active Listings
            </h3>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#358597]"></div>
                <p className="mt-4 text-xs text-neutral-400 font-light">Loading events...</p>
              </div>
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-neutral-200 rounded-[2rem] bg-neutral-50/20 text-center">
                <div className="w-16 h-16 rounded-full bg-[#EA7963]/10 flex items-center justify-center text-[#EA7963] mb-4 shadow-sm border border-[#EA7963]/20">
                  <Calendar size={26} />
                </div>
                <h4 className="font-display font-bold text-lg text-[#2A2A2A] tracking-tight">No Events Published Yet</h4>
                <p className="text-neutral-400 text-xs font-light max-w-xs mt-1.5 leading-relaxed">
                  Start building your community! Publish your first event or city trail challenge to invite visitors.
                </p>
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="mt-6 h-10 px-5 rounded-full bg-[#EA7963] text-white hover:bg-[#D96853] transition-all text-xs font-semibold tracking-wider uppercase shadow-md flex items-center gap-1.5"
                >
                  <Plus size={14} className="shrink-0" />
                  Create First Event
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {events.map((ev) => {
                  const percentSold = ev.inventory > 0 ? Math.min(100, Math.round(((ev.soldCount || 0) / ev.inventory) * 100)) : 0;
                  return (
                    <div 
                      key={ev.id} 
                      className="p-5 rounded-2xl border border-neutral-100 hover:border-neutral-200/60 bg-[#FDFDFD] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                    >
                      {/* Left: Metadata & Image */}
                      <div className="flex gap-4 items-center">
                        <img 
                          src={ev.image} 
                          alt={ev.name} 
                          className="w-16 h-16 rounded-xl object-cover border border-neutral-200/50 shrink-0" 
                          loading="lazy"
                        />
                        <div className="text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-display font-bold text-base text-[#2A2A2A] leading-tight">
                              {ev.name}
                            </h4>
                            {ev.hypeMode && (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 font-semibold uppercase tracking-wider">
                                Waitlist
                              </span>
                            )}
                            {ev.isFree && (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 font-semibold uppercase tracking-wider">
                                Free
                              </span>
                            )}
                          </div>
                          
                          <p className="text-xs text-neutral-400 font-light">
                            {new Date(ev.date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                          </p>
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-500 border border-neutral-200/40 inline-block mt-1 font-sans">
                            {ev.category}
                          </span>
                        </div>
                      </div>

                      {/* Right: Registration Metrics & Capacity bar */}
                      <div className="w-full md:w-48 text-left md:text-right shrink-0">
                        <div className="flex justify-between text-xs text-neutral-500 mb-1 font-sans">
                          <span>{ev.soldCount || 0} / {ev.inventory} Sold</span>
                          <span className="font-semibold text-neutral-700">{percentSold}%</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              ev.hypeMode ? "bg-[#EA7963]" : "bg-[#358597]"
                            }`} 
                            style={{ width: `${percentSold}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2.5">
                          <span className="text-[10px] font-mono text-neutral-400">ID: {ev.id.substring(0, 8)}...</span>
                          <span className="text-sm font-bold text-[#2A2A2A]">
                            {ev.isFree ? "Free" : `$${ev.price.toFixed(2)}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Interactive Gate Scanner Panel (1/3 width) */}
          <div className="lg:col-span-1">
            <GateScanner onCheckInSuccess={fetchOrganizerData} />
          </div>

        </div>
      </div>

      {/* Create Event Dialog Modal */}
      <CreateEventModal 
        isOpen={createModalOpen} 
        onClose={() => setCreateModalOpen(false)} 
        onEventCreated={fetchOrganizerData}
      />
    </div>
  );
};

export default Dashboard;
