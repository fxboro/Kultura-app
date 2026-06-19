import React from "react";
import { Search, MapPin, Compass, Sparkles } from "lucide-react";

const Discover = () => {
  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#2A2A2A] font-sans pb-16">
      {/* Hero Container */}
      <div className="relative mx-4 mt-6 md:mx-8 md:mt-8 rounded-[2rem] overflow-hidden shadow-2xl h-[55vh] md:h-[65vh]">
        {/* Background Image with Overlay */}
        <img 
          src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop" 
          alt="Cultural Festival" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2A2A2A]/90 via-[#2A2A2A]/40 to-transparent flex flex-col justify-end p-6 md:p-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 self-start px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-white text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles size={12} className="text-[#EA7963]" />
            Your Next Experience
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold font-display text-white tracking-tight leading-[1.1] max-w-3xl mb-4">
            Discover the Soul of the City.
          </h1>
          <p className="text-white/80 text-sm md:text-lg max-w-xl font-light mb-8">
            Experience local theater, dynamic gallery openings, historical city trails, and acoustic sessions happening near you.
          </p>

          {/* Search Bar - Glassmorphism */}
          <div className="w-full max-w-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-2 rounded-2xl md:rounded-full flex flex-col md:flex-row gap-2 items-stretch md:items-center">
            <div className="flex-1 flex items-center gap-3 px-3">
              <Search className="text-white/60 shrink-0" size={18} />
              <input 
                type="text" 
                placeholder="What vibe are you looking for?" 
                className="w-full bg-transparent border-none text-white placeholder-white/50 focus:outline-none font-light text-sm"
              />
            </div>
            
            <div className="hidden md:block w-px h-6 bg-white/25"></div>
            
            <div className="flex-1 flex items-center gap-3 px-3">
              <MapPin className="text-white/60 shrink-0" size={18} />
              <input 
                type="text" 
                placeholder="Berlin, Germany" 
                className="w-full bg-transparent border-none text-white placeholder-white/50 focus:outline-none font-light text-sm"
              />
            </div>
            
            <button className="h-12 px-8 rounded-xl md:rounded-full bg-[#358597] text-white hover:bg-[#2C6E7D] transition-all duration-300 font-display font-medium tracking-wide shadow-lg shrink-0 flex items-center justify-center gap-2">
              <Compass size={18} />
              Explore
            </button>
          </div>
        </div>
      </div>

      {/* Main Discover Grid Placeholder */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold font-display text-[#2A2A2A] tracking-tight">Curated Trails & Events</h2>
            <p className="text-neutral-500 text-sm font-light mt-1">Handpicked cultural walks, music lounges, and exhibitions.</p>
          </div>
        </div>

        {/* Empty State placeholder */}
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-neutral-200 rounded-[2rem] bg-neutral-50/50">
          <div className="w-16 h-16 rounded-full bg-[#358597]/10 flex items-center justify-center mb-4 text-[#358597]">
            <Compass size={28} />
          </div>
          <h3 className="font-display font-semibold text-lg text-[#2A2A2A]">Events are on their way</h3>
          <p className="text-neutral-500 text-sm font-light max-w-xs text-center mt-1">
            We are working with local organizers to load cultural trails. Check back shortly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Discover;
