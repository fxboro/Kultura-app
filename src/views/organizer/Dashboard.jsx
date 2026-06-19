import React from "react";
import { Plus, BarChart3, Scan, Calendar, Settings } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const Dashboard = () => {
  const { profile } = useAuth();

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#2A2A2A] font-sans pb-16">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 md:pt-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <span className="text-xs uppercase tracking-wider text-[#EA7963] font-semibold">Organizer Space</span>
            <h1 className="text-4xl font-bold font-display text-[#2A2A2A] tracking-tight mt-1">
              Events Dashboard
            </h1>
            <p className="text-neutral-500 text-sm font-light mt-1">
              Track event ticket sales, scan admissions, and publish new programs.
            </p>
          </div>

          <button className="h-12 px-6 rounded-full bg-[#EA7963] text-white hover:bg-[#D96853] transition-all duration-300 font-display font-medium tracking-wide shadow-lg flex items-center justify-center gap-2 self-start md:self-auto">
            <Plus size={18} />
            Create Event
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-xl shadow-neutral-100/50">
            <div className="flex justify-between items-center text-neutral-400 mb-4">
              <span className="text-sm font-light">Total Revenue</span>
              <BarChart3 size={20} className="text-[#358597]" />
            </div>
            <h2 className="text-4xl font-bold font-display text-[#2A2A2A] tracking-tight">$0.00</h2>
            <p className="text-xs text-neutral-400 font-light mt-1">Across 0 active events</p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-xl shadow-neutral-100/50">
            <div className="flex justify-between items-center text-neutral-400 mb-4">
              <span className="text-sm font-light">Tickets Sold</span>
              <Calendar size={20} className="text-[#EA7963]" />
            </div>
            <h2 className="text-4xl font-bold font-display text-[#2A2A2A] tracking-tight">0</h2>
            <p className="text-xs text-neutral-400 font-light mt-1">Total reservations</p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-xl shadow-neutral-100/50">
            <div className="flex justify-between items-center text-neutral-400 mb-4">
              <span className="text-sm font-light">Admissions Scanned</span>
              <Scan size={20} className="text-emerald-500" />
            </div>
            <h2 className="text-4xl font-bold font-display text-[#2A2A2A] tracking-tight">0%</h2>
            <p className="text-xs text-neutral-400 font-light mt-1">Check-in completion rate</p>
          </div>
        </div>

        {/* Main section list */}
        <div className="bg-white rounded-[2rem] border border-neutral-100 shadow-xl shadow-neutral-100/50 p-8">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-6">
            <h3 className="font-display font-semibold text-lg">My Active Events</h3>
            <button className="text-xs text-neutral-400 hover:text-[#2A2A2A] flex items-center gap-1">
              <Settings size={12} /> Manage
            </button>
          </div>

          {/* Empty state list */}
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-50 flex items-center justify-center border border-neutral-100 mb-3 text-neutral-400">
              <Calendar size={20} />
            </div>
            <h4 className="font-display font-semibold text-base text-[#2A2A2A]">No events listed yet</h4>
            <p className="text-neutral-400 text-xs font-light max-w-xs mt-1">
              Publish your first event trail or entry pass to start hosting attendees.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
