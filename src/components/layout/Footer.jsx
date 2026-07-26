import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  CheckCircle2, 
  Send, 
  ArrowUpRight, 
  Compass, 
  Ticket, 
  Briefcase, 
  ShieldCheck,
  Info,
  FileText,
  Lock,
  Cookie
} from "lucide-react";
import LegalModal from "../legal/LegalModal";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [legalModalDoc, setLegalModalDoc] = useState(null); // null | "about" | "terms" | "imprint" | "privacy" | "cookies"

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setTimeout(() => {
        setSubscribed(false);
        setEmail("");
      }, 3500);
    }
  };

  return (
    <footer className="w-full bg-[#121212] text-white font-sans pt-16 pb-24 sm:pb-12 border-t border-neutral-800 relative overflow-hidden select-none">
      {/* Background Decorative Glow Accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#358597]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#EA7963]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 relative z-10">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12 pb-14 border-b border-neutral-800/80">
          
          {/* Column 1 & 2: Brand Logo, Tagline & Newsletter */}
          <div className="lg:col-span-2 space-y-6 text-left">
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="font-display font-bold text-3xl tracking-tight text-white hover:text-neutral-200 transition-colors">
                Kultura
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-[#EA7963]/20 text-[#EA7963] border border-[#EA7963]/30">
                Platform
              </span>
            </Link>

            <p className="text-neutral-400 text-sm font-light leading-relaxed max-w-sm">
              Discover local cultural itineraries, gallery openings, secret city trails, and acoustic sessions happening near you.
            </p>

            {/* Newsletter Subscription Widget */}
            <div className="pt-2">
              <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">
                Stay In The Cultural Loop
              </label>
              {subscribed ? (
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 max-w-sm animate-in">
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
                  <span>You're subscribed! Expect curated drop alerts in your inbox.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex items-center gap-2 max-w-sm">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 h-11 px-4 rounded-xl bg-neutral-900 border border-neutral-800 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#358597] transition-all font-light"
                  />
                  <button
                    type="submit"
                    className="h-11 px-5 rounded-xl bg-[#358597] hover:bg-[#2C6E7D] text-white font-display text-xs font-semibold tracking-wide transition-all shadow-md flex items-center justify-center shrink-0 gap-1.5 cursor-pointer"
                  >
                    <span>Subscribe</span>
                    <Send size={14} />
                  </button>
                </form>
              )}
            </div>

            {/* Operational Cities Badge */}
            <div className="flex items-center gap-2 pt-1 text-xs text-neutral-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Operational across Berlin, Munich, London & Hamburg</span>
            </div>
          </div>

          {/* Column 3: Navigation Links */}
          <div className="space-y-4 text-left">
            <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-white border-b border-neutral-800 pb-2">
              Explore
            </h3>
            <ul className="space-y-2.5 text-xs text-neutral-400 font-light">
              <li>
                <Link to="/" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Compass size={14} className="text-[#358597]" /> Discover Feed
                </Link>
              </li>
              <li>
                <Link to="/wallet" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Ticket size={14} className="text-[#358597]" /> My Collection
                </Link>
              </li>
              <li>
                <Link to="/organizer" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Briefcase size={14} className="text-[#EA7963]" /> Organizer Portal
                </Link>
              </li>
              <li>
                <button onClick={() => setLegalModalDoc("about")} className="hover:text-white transition-colors text-left cursor-pointer">
                  Cultural Passports
                </button>
              </li>
              <li>
                <button onClick={() => setLegalModalDoc("about")} className="hover:text-white transition-colors text-left cursor-pointer">
                  Interactive Vibe Map
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Policy Pages */}
          <div className="space-y-4 text-left">
            <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-white border-b border-neutral-800 pb-2">
              Legal & Policy
            </h3>
            <ul className="space-y-2.5 text-xs text-neutral-400 font-light">
              <li>
                <button 
                  onClick={() => setLegalModalDoc("about")}
                  className="hover:text-white transition-colors text-left cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Info size={13} className="text-[#358597]" /> About Kultura
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setLegalModalDoc("terms")}
                  className="hover:text-white transition-colors text-left cursor-pointer inline-flex items-center gap-1.5"
                >
                  <FileText size={13} className="text-[#358597]" /> Terms & Conditions
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setLegalModalDoc("imprint")}
                  className="hover:text-white transition-colors text-left cursor-pointer inline-flex items-center gap-1.5"
                >
                  <ShieldCheck size={13} className="text-[#EA7963]" /> Imprint / Impressum
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setLegalModalDoc("privacy")}
                  className="hover:text-white transition-colors text-left cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Lock size={13} className="text-[#358597]" /> Data Protection & Privacy
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setLegalModalDoc("cookies")}
                  className="hover:text-white transition-colors text-left cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Cookie size={13} className="text-[#EA7963]" /> Cookie Policy & Settings
                </button>
              </li>
            </ul>
          </div>

          {/* Column 5: Creator Attribution (chimadev.com) & Socials */}
          <div className="space-y-4 text-left">
            <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-white border-b border-neutral-800 pb-2">
              Created By
            </h3>

            {/* Creator Badge Box */}
            <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800/80 space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">
                Platform Design & Engineering
              </span>
              <a
                href="https://chimadev.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-base font-bold font-display text-white hover:text-[#EA7963] transition-colors group"
              >
                <span>chimadev.com</span>
                <ArrowUpRight size={16} className="text-[#EA7963] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
              <p className="text-[11px] text-neutral-400 font-light leading-snug">
                Engineering high-impact digital products & web applications.
              </p>
            </div>

            {/* Social Icons */}
            <div className="pt-1">
              <span className="text-xs text-neutral-400 font-light block mb-2">Connect with us</span>
              <div className="flex items-center gap-2">
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors" title="GitHub">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors" title="Twitter / X">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors" title="LinkedIn">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.74a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z"/></svg>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors" title="Instagram">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Credits & Copyright Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 font-light">
          <p>© {new Date().getFullYear()} Kultura Inc. All rights reserved.</p>

          <div className="flex items-center gap-1.5">
            <span>Built with passion by</span>
            <a
              href="https://chimadev.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#358597] hover:text-[#EA7963] hover:underline transition-colors inline-flex items-center gap-0.5"
            >
              chimadev.com
              <ArrowUpRight size={12} />
            </a>
          </div>
        </div>

      </div>

      {/* Interactive Legal & Information Modal */}
      <LegalModal
        isOpen={!!legalModalDoc}
        initialDoc={legalModalDoc}
        onClose={() => setLegalModalDoc(null)}
      />
    </footer>
  );
};

export default Footer;
