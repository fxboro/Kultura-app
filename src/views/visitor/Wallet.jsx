import React from "react";
import { Ticket, Award, Map, History } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const Wallet = () => {
  const { profile } = useAuth();

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#2A2A2A] font-sans pb-16">
      {/* Upper header */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 md:pt-12">
        <div className="mb-10">
          <span className="text-xs uppercase tracking-wider text-[#358597] font-semibold">Visitor Dashboard</span>
          <h1 className="text-4xl font-bold font-display text-[#2A2A2A] tracking-tight mt-1">
            My Cultural Collection
          </h1>
          <p className="text-neutral-500 text-sm font-light mt-1">
            Your personal gallery of ticket passes, digital badges, and stamps.
          </p>
        </div>

        {/* Tab Menu Header */}
        <div className="flex border-b border-neutral-100 gap-6 mb-8 text-sm">
          <button className="pb-3 border-b-2 border-[#358597] text-[#358597] font-medium flex items-center gap-2">
            <Ticket size={16} /> Active Passes
          </button>
          <button className="pb-3 text-neutral-400 font-light flex items-center gap-2 hover:text-[#2A2A2A]">
            <Award size={16} /> Cultural Passport
          </button>
          <button className="pb-3 text-neutral-400 font-light flex items-center gap-2 hover:text-[#2A2A2A]">
            <History size={16} /> History
          </button>
        </div>

        {/* Placeholder grids for active passes */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Example static card to show aesthetics */}
          <div className="bg-white rounded-3xl border border-neutral-100 shadow-xl shadow-neutral-100/50 overflow-hidden flex flex-col justify-between">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs px-3 py-1 rounded-full bg-[#358597]/10 text-[#358597] font-medium">
                  Active
                </span>
                <span className="text-xs font-mono text-neutral-400">#KUL-779213</span>
              </div>
              <h3 className="text-xl font-bold font-display text-[#2A2A2A] mb-1">
                Berlin Historic Art Trail
              </h3>
              <p className="text-xs text-neutral-400 flex items-center gap-1 mb-4">
                <Map size={12} /> Starts: Saturday, June 20, 2026
              </p>
              
              <div className="bg-neutral-50 p-4 rounded-2xl flex items-center justify-center border border-neutral-100">
                {/* Simulated QR Code */}
                <div className="w-32 h-32 bg-neutral-200 rounded-lg flex flex-col items-center justify-center p-2 border border-neutral-300">
                  <div className="w-full h-full bg-neutral-900 rounded flex flex-col items-center justify-center text-white text-[10px] font-mono text-center">
                    [QR CODE]
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t border-neutral-100 bg-neutral-50/50 px-6 py-4 flex items-center justify-between">
              <span className="text-xs font-light text-neutral-400">Admit 1 Guest</span>
              <span className="text-xs font-semibold text-[#EA7963]">Unused</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
