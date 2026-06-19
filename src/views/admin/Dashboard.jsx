import React from "react";
import { ShieldAlert, Users, Award, DollarSign, ArrowUpRight } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const Dashboard = () => {
  const { profile } = useAuth();

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#2A2A2A] font-sans pb-16">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 md:pt-12">
        {/* Header */}
        <div className="mb-10">
          <span className="text-xs uppercase tracking-wider text-rose-500 font-semibold flex items-center gap-1">
            <ShieldAlert size={12} /> System Administrator
          </span>
          <h1 className="text-4xl font-bold font-display text-[#2A2A2A] tracking-tight mt-1">
            Platform Operations
          </h1>
          <p className="text-neutral-500 text-sm font-light mt-1">
            Monitor global analytics, approve cultural event hosts, and manage platform fee rates.
          </p>
        </div>

        {/* Global Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-xl shadow-neutral-100/50">
            <div className="flex justify-between items-center text-neutral-400 mb-3">
              <span className="text-xs font-light">Global Revenue</span>
              <DollarSign size={16} className="text-emerald-500" />
            </div>
            <h2 className="text-3xl font-bold font-display text-[#2A2A2A] tracking-tight">$0.00</h2>
            <span className="text-[10px] text-emerald-500 flex items-center gap-0.5 mt-1 font-semibold">
              <ArrowUpRight size={10} /> +0% fee commission
            </span>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-xl shadow-neutral-100/50">
            <div className="flex justify-between items-center text-neutral-400 mb-3">
              <span className="text-xs font-light">Total Users</span>
              <Users size={16} className="text-[#358597]" />
            </div>
            <h2 className="text-3xl font-bold font-display text-[#2A2A2A] tracking-tight">0</h2>
            <p className="text-[10px] text-neutral-400 font-light mt-1">Visitor and organizer accounts</p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-xl shadow-neutral-100/50">
            <div className="flex justify-between items-center text-neutral-400 mb-3">
              <span className="text-xs font-light">Active Organizers</span>
              <Award size={16} className="text-[#EA7963]" />
            </div>
            <h2 className="text-3xl font-bold font-display text-[#2A2A2A] tracking-tight">0</h2>
            <p className="text-[10px] text-neutral-400 font-light mt-1">0 pending approvals</p>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-xl shadow-neutral-100/50">
            <div className="flex justify-between items-center text-neutral-400 mb-3">
              <span className="text-xs font-light">Featured Trails</span>
              <Award size={16} className="text-amber-500" />
            </div>
            <h2 className="text-3xl font-bold font-display text-[#2A2A2A] tracking-tight">0</h2>
            <p className="text-[10px] text-neutral-400 font-light mt-1">Curated trails on Discover page</p>
          </div>
        </div>

        {/* Action Panel lists */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-[2rem] border border-neutral-100 shadow-xl shadow-neutral-100/50 p-8">
            <h3 className="font-display font-semibold text-lg border-b border-neutral-100 pb-4 mb-6">
              Organizer Verification Queue
            </h3>
            <div className="text-center py-10">
              <p className="text-xs text-neutral-400 font-light">No organizers awaiting verification approval.</p>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-neutral-100 shadow-xl shadow-neutral-100/50 p-8">
            <h3 className="font-display font-semibold text-lg border-b border-neutral-100 pb-4 mb-6">
              Commission Rates
            </h3>
            <div className="flex justify-between items-center py-2 text-sm">
              <span className="text-neutral-500 font-light">Base Ticket Comm.</span>
              <span className="font-bold text-[#2A2A2A]">2.5%</span>
            </div>
            <div className="flex justify-between items-center py-2 text-sm border-b border-neutral-100 pb-4 mb-4">
              <span className="text-neutral-500 font-light">Stripe Pay Processing</span>
              <span className="font-bold text-neutral-400">1.4% + $0.25</span>
            </div>
            <button className="w-full h-12 rounded-full border border-neutral-200 text-[#2A2A2A] hover:bg-neutral-50 font-display text-sm font-medium transition-colors">
              Modify Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
