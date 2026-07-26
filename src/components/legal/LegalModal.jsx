import React, { useState, useEffect } from "react";
import { X, ShieldCheck, FileText, Lock, Cookie, Info, ArrowUpRight, Sparkles } from "lucide-react";

const LegalModal = ({ isOpen, initialDoc = "about", onClose }) => {
  const [activeTab, setActiveTab] = useState(initialDoc || "about");

  useEffect(() => {
    if (initialDoc) {
      setActiveTab(initialDoc);
    }
  }, [initialDoc]);

  if (!isOpen) return null;

  const tabs = [
    { id: "about", label: "About Kultura", icon: Info },
    { id: "terms", label: "Terms & Conditions", icon: FileText },
    { id: "imprint", label: "Imprint / Impressum", icon: ShieldCheck },
    { id: "privacy", label: "Data Protection", icon: Lock },
    { id: "cookies", label: "Cookie Policy", icon: Cookie }
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-md transition-opacity duration-300 select-text"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-3xl bg-[#FDFDFD] border border-neutral-100 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative max-h-[85vh] text-[#2A2A2A] font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-[#2A2A2A] flex items-center justify-center transition-colors shadow-sm z-20"
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div className="p-6 md:p-8 border-b border-neutral-100 bg-white">
          <div className="flex items-center gap-1.5 text-[#358597] mb-1">
            <Sparkles size={16} className="text-[#EA7963]" />
            <span className="font-display font-medium text-xs tracking-wider uppercase">Legal & Platform Transparency</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold font-display text-[#2A2A2A] tracking-tight">
            Kultura Information Center
          </h2>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-4 bg-neutral-50/70 border-b border-neutral-100 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-semibold font-display whitespace-nowrap transition-all ${
                  isActive 
                    ? "border-[#358597] text-[#358597]" 
                    : "border-transparent text-neutral-400 hover:text-neutral-600"
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content View */}
        <div className="p-6 md:p-8 overflow-y-auto no-scrollbar space-y-6 text-sm text-neutral-600 leading-relaxed text-left font-light">
          
          {/* ABOUT TAB */}
          {activeTab === "about" && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold font-display text-[#2A2A2A]">Connecting People with Urban Culture</h3>
              <p>
                <strong>Kultura</strong> is a modern web platform designed to bridge local cultural organizers with curious city explorers. We eliminate the friction between discovery and attendance through dynamic vibe mapping, gamified city trail passports, and direct digital gate check-ins.
              </p>
              
              <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-2">
                <h4 className="font-semibold text-[#2A2A2A] font-display text-sm">Dual-Role Platform Architecture</h4>
                <p className="text-xs">
                  Attendees get a clean, distraction-free discovery feed and mobile wallet, while organizers receive a suite of management tools—all without needing separate applications.
                </p>
              </div>

              <div className="pt-2">
                <span className="block font-semibold text-[#2A2A2A] text-xs mb-1">Created By:</span>
                <a 
                  href="https://chimadev.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-[#358597] hover:text-[#EA7963] hover:underline"
                >
                  chimadev.com <ArrowUpRight size={13} />
                </a>
              </div>
            </div>
          )}

          {/* TERMS & CONDITIONS TAB */}
          {activeTab === "terms" && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold font-display text-[#2A2A2A]">Terms & Conditions</h3>
              <p className="text-xs text-neutral-400">Last updated: January 2026</p>

              <div className="space-y-3">
                <h4 className="font-semibold text-[#2A2A2A] font-display">1. Acceptance of Terms</h4>
                <p>By accessing or using Kultura, you agree to comply with and be bound by these Terms of Service. If you do not agree, please do not use the application.</p>

                <h4 className="font-semibold text-[#2A2A2A] font-display">2. Ticket Issuance & Admission Passes</h4>
                <p>Digital tickets purchased or reserved via Kultura grant single-entry admission to the designated event. 6-digit verification codes are unique and valid for gate check-in only.</p>

                <h4 className="font-semibold text-[#2A2A2A] font-display">3. Organizer Obligations</h4>
                <p>Organizers publishing listings warrant that all event details, venue information, and capacity limits are accurate and compliant with local municipal regulations.</p>
              </div>
            </div>
          )}

          {/* IMPRINT / IMPRESSUM TAB */}
          {activeTab === "imprint" && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold font-display text-[#2A2A2A]">Imprint / Impressum</h3>
              <p className="text-xs text-neutral-400">Information pursuant to § 5 TMG / European Digital Services Act</p>

              <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-[#2A2A2A] block">Platform Operator:</span>
                  <span>Kultura Digital Experience Technologies Ltd.</span>
                </div>
                <div>
                  <span className="font-semibold text-[#2A2A2A] block">Creator & Engineering Agency:</span>
                  <a 
                    href="https://chimadev.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-bold text-[#358597] hover:underline inline-flex items-center gap-0.5"
                  >
                    chimadev.com <ArrowUpRight size={12} />
                  </a>
                </div>
                <div>
                  <span className="font-semibold text-[#2A2A2A] block">Contact & Inquiries:</span>
                  <span>contact@kultura.dev | hello@chimadev.com</span>
                </div>
                <div>
                  <span className="font-semibold text-[#2A2A2A] block">Responsible for Content:</span>
                  <span>Chima Okereke / Lead Product Engineer</span>
                </div>
              </div>
            </div>
          )}

          {/* PRIVACY TAB */}
          {activeTab === "privacy" && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold font-display text-[#2A2A2A]">Data Protection & Privacy Policy</h3>
              <p className="text-xs text-neutral-400">GDPR & Data Security Compliance</p>

              <div className="space-y-3">
                <h4 className="font-semibold text-[#2A2A2A] font-display">1. Information We Collect</h4>
                <p>We process account details (email address, full name, organization name) strictly to manage ticket distribution, gate validation, and organizer verification.</p>

                <h4 className="font-semibold text-[#2A2A2A] font-display">2. Firebase Infrastructure Security</h4>
                <p>User credentials and profiles are securely stored using Firebase Authentication and Firestore rules, encrypted in transit (TLS 1.3) and at rest.</p>

                <h4 className="font-semibold text-[#2A2A2A] font-display">3. Your Data Rights</h4>
                <p>You maintain full rights to request data export or account deletion at any time by contacting support.</p>
              </div>
            </div>
          )}

          {/* COOKIES TAB */}
          {activeTab === "cookies" && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold font-display text-[#2A2A2A]">Cookie & Storage Policy</h3>
              <p className="text-xs text-neutral-400">Essential Local Storage Usage</p>

              <div className="space-y-3">
                <h4 className="font-semibold text-[#2A2A2A] font-display">1. Essential Authentication Cookies</h4>
                <p>Kultura uses essential session tokens and local storage strictly to keep you securely signed in and preserve your active cultural passport progress.</p>

                <h4 className="font-semibold text-[#2A2A2A] font-display">2. No Third-Party Tracking Pixels</h4>
                <p>We do not sell user data or use intrusive ad-tracking networks. All telemetry remains first-party for platform performance optimization.</p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 px-8 border-t border-neutral-100 bg-neutral-50/50 flex justify-between items-center text-xs text-neutral-400">
          <span>Crafted by <a href="https://chimadev.com" target="_blank" rel="noopener noreferrer" className="text-[#358597] font-semibold hover:underline">chimadev.com</a></span>
          <button 
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#2A2A2A] text-white hover:bg-neutral-800 font-display font-medium transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegalModal;
