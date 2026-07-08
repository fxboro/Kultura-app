import React, { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc, deleteDoc, doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../hooks/useAuth";
import { ShieldAlert, DollarSign, Users, Award, Sparkles, Plus, Trash2, Check, Briefcase, Calendar, Info, Percent, RotateCcw, Star, CheckCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Admin = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Route protection override check
  const HARDCODED_ADMIN_UIDS = ["demo-admin-uid", "admin-demo-uid"];
  const isAdmin = user && (HARDCODED_ADMIN_UIDS.includes(user.uid) || profile?.role === "admin");

  // Platform Metrics States
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [trails, setTrails] = useState([]);
  const [platformGmv, setPlatformGmv] = useState(0);
  const [loading, setLoading] = useState(true);

  // Form States for Trail Builder
  const [trailName, setTrailName] = useState("");
  const [trailDescription, setTrailDescription] = useState("");
  const [trailCategory, setTrailCategory] = useState("Music");
  const [trailReward, setTrailReward] = useState("");
  const [trailBadge, setTrailBadge] = useState("");
  const [selectedThemeColor, setSelectedThemeColor] = useState("from-teal-500/20 to-[#358597]/20 text-teal-700 border-teal-200/50");
  const [selectedEventIds, setSelectedEventIds] = useState([]);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [creating, setCreating] = useState(false);

  // Commission Control States
  const [globalRate, setGlobalRate] = useState(2.5); // Display as percentage
  const [globalRateInput, setGlobalRateInput] = useState("2.5");
  const [globalRateSaving, setGlobalRateSaving] = useState(false);
  const [globalRateSuccess, setGlobalRateSuccess] = useState(null);
  const [organizerFees, setOrganizerFees] = useState({}); // { [uid]: { commissionRate, ... } }
  const [orgFeeInputs, setOrgFeeInputs] = useState({}); // { [uid]: "3.5" }
  const [orgFeeSaving, setOrgFeeSaving] = useState({}); // { [uid]: true/false }

  // Theme presets
  const themeOptions = [
    {
      name: "Cool Teal",
      value: "from-teal-500/20 to-[#358597]/20 text-teal-700 border-teal-200/50"
    },
    {
      name: "Weekend Jazz (Amber/Orange)",
      value: "from-amber-500/20 to-orange-500/20 text-amber-700 border-amber-200/50"
    },
    {
      name: "Urban Explorer (Rose/Coral)",
      value: "from-rose-500/20 to-[#EA7963]/20 text-[#EA7963] border-rose-200/50"
    },
    {
      name: "Mystic Purple (Indigo/Purple)",
      value: "from-indigo-500/20 to-purple-500/20 text-indigo-700 border-indigo-200/50"
    },
    {
      name: "Forest Green (Emerald/Teal)",
      value: "from-emerald-500/20 to-teal-500/20 text-emerald-700 border-emerald-200/50"
    }
  ];

  // Set up listeners for real-time dashboard updates
  useEffect(() => {
    if (authLoading || !isAdmin) return;

    // 1. Listen to Tickets
    const unsubscribeTickets = onSnapshot(collection(db, "tickets"), (snapshot) => {
      const fetchedTickets = snapshot.docs.map(doc => doc.data());
      setTickets(fetchedTickets);
      
      // Calculate GMV (Sum of paid ticket prices excluding waitlists)
      let gmv = 0;
      fetchedTickets.forEach(t => {
        if (t.status !== "waitlist") {
          gmv += t.price || 0;
        }
      });
      setPlatformGmv(gmv);
    }, (err) => console.error("Admin Error (Tickets):", err));

    // 2. Listen to Users
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const fetchedUsers = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
      setUsers(fetchedUsers);
    }, (err) => console.error("Admin Error (Users):", err));

    // 3. Listen to Events
    const unsubscribeEvents = onSnapshot(collection(db, "events"), (snapshot) => {
      const fetchedEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEvents(fetchedEvents);
    }, (err) => console.error("Admin Error (Events):", err));

    // 4. Listen to Trails
    const unsubscribeTrails = onSnapshot(collection(db, "trails"), (snapshot) => {
      const fetchedTrails = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTrails(fetchedTrails);
      setLoading(false);
    }, (err) => {
      console.error("Admin Error (Trails):", err);
      setLoading(false);
    });

    // 5. Listen to Global Platform Fee
    const unsubscribeGlobalFee = onSnapshot(doc(db, "platformSettings", "fees"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const ratePercent = (data.globalCommissionRate || 0.025) * 100;
        setGlobalRate(ratePercent);
        setGlobalRateInput(ratePercent.toString());
      }
    }, (err) => console.error("Admin Error (Global Fee):", err));

    // 6. Listen to Per-Organizer Fee Overrides
    const unsubscribeOrgFees = onSnapshot(collection(db, "organizerFees"), (snapshot) => {
      const fees = {};
      snapshot.docs.forEach(d => {
        fees[d.id] = d.data();
      });
      setOrganizerFees(fees);
    }, (err) => console.error("Admin Error (Organizer Fees):", err));

    return () => {
      unsubscribeTickets();
      unsubscribeUsers();
      unsubscribeEvents();
      unsubscribeTrails();
      unsubscribeGlobalFee();
      unsubscribeOrgFees();
    };
  }, [authLoading, isAdmin]);

  // Handle checking/unchecking events for the trail
  const handleEventToggle = (eventId) => {
    setSelectedEventIds((prev) => {
      if (prev.includes(eventId)) {
        return prev.filter(id => id !== eventId);
      }
      // Limit selection to 3
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, eventId];
    });
  };

  // Submit Trail Builder Form
  const handleCreateTrail = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (selectedEventIds.length !== 3) {
      setFormError("You must select exactly 3 events to create a trail challenge.");
      return;
    }

    if (!trailName || !trailDescription || !trailReward || !trailBadge) {
      setFormError("Please fill in all the trail details.");
      return;
    }

    setCreating(true);
    try {
      await addDoc(collection(db, "trails"), {
        name: trailName,
        description: trailDescription,
        category: trailCategory,
        reward: trailReward,
        badge: trailBadge,
        themeColor: selectedThemeColor,
        eventIds: selectedEventIds,
        goalCount: 3,
        createdAt: serverTimestamp()
      });

      setFormSuccess(`Trail "${trailName}" created successfully!`);
      // Reset Builder fields
      setTrailName("");
      setTrailDescription("");
      setTrailReward("");
      setTrailBadge("");
      setSelectedEventIds([]);
    } catch (err) {
      console.error("Error creating trail:", err);
      setFormError("Failed to store trail challenge in database. Try again.");
    } finally {
      setCreating(false);
    }
  };

  // Delete Trail
  const handleDeleteTrail = async (trailId) => {
    try {
      await deleteDoc(doc(db, "trails", trailId));
    } catch (err) {
      console.error("Error deleting trail:", err);
    }
  };

  // --- Commission Handlers ---

  // Save global commission rate
  const handleSaveGlobalRate = async () => {
    const parsed = parseFloat(globalRateInput);
    if (isNaN(parsed) || parsed < 0 || parsed > 100) return;

    setGlobalRateSaving(true);
    setGlobalRateSuccess(null);
    try {
      await setDoc(doc(db, "platformSettings", "fees"), {
        globalCommissionRate: parsed / 100,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setGlobalRateSuccess(`Global rate updated to ${parsed}%`);
      setTimeout(() => setGlobalRateSuccess(null), 3000);
    } catch (err) {
      console.error("Error saving global rate:", err);
    } finally {
      setGlobalRateSaving(false);
    }
  };

  // Apply per-organizer fee override
  const handleApplyOrgFee = async (orgUser) => {
    const inputVal = orgFeeInputs[orgUser.uid];
    const parsed = parseFloat(inputVal);
    if (isNaN(parsed) || parsed < 0 || parsed > 100) return;

    setOrgFeeSaving(prev => ({ ...prev, [orgUser.uid]: true }));
    try {
      await setDoc(doc(db, "organizerFees", orgUser.uid), {
        commissionRate: parsed / 100,
        organizerName: orgUser.displayName || orgUser.email || "Unknown",
        organizerEmail: orgUser.email || "",
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error applying organizer fee:", err);
    } finally {
      setOrgFeeSaving(prev => ({ ...prev, [orgUser.uid]: false }));
    }
  };

  // Reset organizer override (delete the document, reverts to global)
  const handleResetOrgFee = async (orgUid) => {
    setOrgFeeSaving(prev => ({ ...prev, [orgUid]: true }));
    try {
      await deleteDoc(doc(db, "organizerFees", orgUid));
      setOrgFeeInputs(prev => {
        const next = { ...prev };
        delete next[orgUid];
        return next;
      });
    } catch (err) {
      console.error("Error resetting organizer fee:", err);
    } finally {
      setOrgFeeSaving(prev => ({ ...prev, [orgUid]: false }));
    }
  };

  // Toggle approval status for an organizer
  const handleToggleApproval = async (orgUid, currentStatus) => {
    try {
      await updateDoc(doc(db, "users", orgUid), {
        approved: !currentStatus
      });
    } catch (err) {
      console.error("Error toggling approval status:", err);
    }
  };

  // Toggle featured status for an event
  const handleToggleFeatured = async (eventId, currentStatus) => {
    try {
      await updateDoc(doc(db, "events", eventId), {
        featured: !currentStatus
      });
    } catch (err) {
      console.error("Error toggling featured status:", err);
    }
  };

  // Render Loading Indicator
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FDFDFD]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#358597]"></div>
        <p className="mt-4 font-sans text-sm text-neutral-500">Checking credentials...</p>
      </div>
    );
  }

  // Render Access Denied Panel
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md bg-white border border-rose-100 rounded-[2rem] p-8 shadow-2xl shadow-rose-100/50">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center mx-auto mb-5 select-none">
            <ShieldAlert size={28} />
          </div>
          <h1 className="font-display font-bold text-2xl text-[#2A2A2A] tracking-tight">Access Restricted</h1>
          <p className="text-neutral-400 text-sm font-light mt-2 leading-relaxed">
            You do not possess the required administrator credentials to view this dashboard panel. If this is an error, please sign in with an admin profile.
          </p>
          <button 
            onClick={() => navigate("/")}
            className="mt-6 px-6 py-3 rounded-full bg-[#2A2A2A] text-white hover:bg-neutral-800 transition-colors text-xs font-semibold uppercase tracking-wider font-display shadow-md"
          >
            Return to Discover Feed
          </button>
        </div>
      </div>
    );
  }

  const organizersCount = users.filter(u => u.role === "organizer").length;
  const visitorsCount = users.filter(u => u.role === "visitor").length;

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#2A2A2A] font-sans pb-24 text-left">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 md:pt-12">
        {/* Header */}
        <div className="mb-10">
          <span className="text-xs uppercase tracking-wider text-rose-500 font-semibold flex items-center gap-1">
            <ShieldAlert size={13} /> System Administrator Portal
          </span>
          <h1 className="text-4xl font-bold font-display text-[#2A2A2A] tracking-tight mt-1">
            Kultura Operations
          </h1>
          <p className="text-neutral-500 text-sm font-light mt-1">
            Monitor real-time platform statistics and construct tourist-facing City Trail challenges.
          </p>
        </div>

        {/* Global Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* GMV */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-100/80 shadow-xl shadow-neutral-100/50 flex flex-col justify-between min-h-[140px]">
            <div className="flex justify-between items-center text-neutral-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Platform GMV</span>
              <DollarSign size={18} className="text-emerald-500" />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold font-display text-[#2A2A2A] tracking-tight">
                ${platformGmv.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <span className="text-[10px] text-neutral-400 font-light mt-1 block">Live transaction checkout GMV</span>
            </div>
          </div>

          {/* Users */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-100/80 shadow-xl shadow-neutral-100/50 flex flex-col justify-between min-h-[140px]">
            <div className="flex justify-between items-center text-neutral-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Users</span>
              <Users size={18} className="text-[#358597]" />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold font-display text-[#2A2A2A] tracking-tight">
                {users.length}
              </h2>
              <span className="text-[10px] text-neutral-400 font-light mt-1 block">
                {visitorsCount} Visitors • {organizersCount} Organizers
              </span>
            </div>
          </div>

          {/* Events */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-100/80 shadow-xl shadow-neutral-100/50 flex flex-col justify-between min-h-[140px]">
            <div className="flex justify-between items-center text-neutral-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Campaigns</span>
              <Calendar size={18} className="text-[#EA7963]" />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold font-display text-[#2A2A2A] tracking-tight">
                {events.length}
              </h2>
              <span className="text-[10px] text-neutral-400 font-light mt-1 block">Across all categories and vibes</span>
            </div>
          </div>

          {/* Tickets Issued */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-100/80 shadow-xl shadow-neutral-100/50 flex flex-col justify-between min-h-[140px]">
            <div className="flex justify-between items-center text-neutral-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Passes Registered</span>
              <Award size={18} className="text-amber-500" />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold font-display text-[#2A2A2A] tracking-tight">
                {tickets.length}
              </h2>
              <span className="text-[10px] text-neutral-400 font-light mt-1 block">
                {tickets.filter(t => t.status === "checked-in").length} check-ins processed
              </span>
            </div>
          </div>
        </div>

        {/* Commission Control Panel */}
        <div className="bg-white rounded-[2rem] border border-neutral-100 shadow-xl shadow-neutral-100/50 p-6 md:p-8 mb-12">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-4 mb-6">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <Percent size={16} />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg text-[#2A2A2A]">Commission Control</h3>
              <p className="text-[10px] text-neutral-400 font-light">Manage platform fees globally or per organizer.</p>
            </div>
          </div>

          {/* Global Rate Section */}
          <div className="mb-8">
            <label className="block text-xs font-semibold text-neutral-400 mb-1.5 pl-1 uppercase tracking-wider">Global Platform Commission</label>
            <p className="text-[10px] text-neutral-400 font-light pl-1 mb-3">This rate applies to all organizers unless individually overridden below.</p>
            <div className="flex items-center gap-3">
              <div className="relative flex-grow max-w-[200px]">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={globalRateInput}
                  onChange={(e) => setGlobalRateInput(e.target.value)}
                  className="w-full h-11 px-4 pr-10 rounded-2xl border border-neutral-200 bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 text-sm font-mono font-semibold text-[#2A2A2A] placeholder-neutral-300 transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 text-xs font-semibold">%</span>
              </div>
              <button
                onClick={handleSaveGlobalRate}
                disabled={globalRateSaving}
                className="h-11 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-200 text-white font-display text-xs font-semibold tracking-wider uppercase transition-all duration-300 shadow-md flex items-center gap-2"
              >
                {globalRateSaving ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white/35 border-t-white animate-spin"></div>
                ) : (
                  <Check size={14} />
                )}
                Save Global Rate
              </button>
              <span className="text-xs text-neutral-400 font-light">
                Current: <span className="font-semibold text-[#2A2A2A]">{globalRate}%</span>
              </span>
            </div>
            {globalRateSuccess && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs flex gap-2 items-center">
                <Check size={14} className="shrink-0 text-emerald-500" />
                <span>{globalRateSuccess}</span>
              </div>
            )}
          </div>

          {/* Per-Organizer Override Table */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1.5 pl-1 uppercase tracking-wider">Per-Organizer Overrides</label>
            <p className="text-[10px] text-neutral-400 font-light pl-1 mb-3">Set a custom commission rate for individual organizers. Overrides take priority over the global rate at checkout.</p>

            {(() => {
              const organizers = users.filter(u => u.role === "organizer");
              if (organizers.length === 0) {
                return (
                  <div className="py-8 text-center text-xs text-neutral-400 font-light border border-dashed border-neutral-100 rounded-2xl bg-neutral-50/50">
                    No registered organizers found on the platform.
                  </div>
                );
              }
              return (
                <div className="border border-neutral-100 rounded-2xl overflow-hidden">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-neutral-50/80 border-b border-neutral-100 text-[9px] uppercase tracking-wider font-semibold text-neutral-400">
                    <div className="col-span-4">Organizer</div>
                    <div className="col-span-2 text-center">Active Rate</div>
                    <div className="col-span-3 text-center">Custom Rate</div>
                    <div className="col-span-3 text-center">Actions</div>
                  </div>
                  {/* Table Rows */}
                  <div className="divide-y divide-neutral-100 max-h-[320px] overflow-y-auto no-scrollbar">
                    {organizers.map((org) => {
                      const override = organizerFees[org.uid];
                      const hasOverride = !!override;
                      const activeRate = hasOverride ? (override.commissionRate * 100) : globalRate;
                      const currentInput = orgFeeInputs[org.uid] ?? (hasOverride ? (override.commissionRate * 100).toString() : "");
                      const isSaving = orgFeeSaving[org.uid] || false;

                      return (
                        <div key={org.uid} className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-neutral-50/50 transition-colors">
                          {/* Organizer Info */}
                          <div className="col-span-4 min-w-0">
                            <span className="block text-xs font-semibold text-[#2A2A2A] truncate">{org.displayName || "Unnamed"}</span>
                            <span className="block text-[10px] text-neutral-400 font-light truncate">{org.email || "No email"}</span>
                          </div>

                          {/* Active Rate Badge */}
                          <div className="col-span-2 flex justify-center">
                            <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold font-mono ${
                              hasOverride
                                ? "bg-amber-50 text-amber-600 border border-amber-100"
                                : "bg-neutral-100 text-neutral-500 border border-neutral-200/50"
                            }`}>
                              {activeRate}%
                            </span>
                            {!hasOverride && (
                              <span className="text-[8px] text-neutral-300 font-light ml-1 self-center">global</span>
                            )}
                          </div>

                          {/* Custom Rate Input */}
                          <div className="col-span-3 flex justify-center">
                            <div className="relative w-full max-w-[100px]">
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                placeholder={globalRate.toString()}
                                value={currentInput}
                                onChange={(e) => setOrgFeeInputs(prev => ({ ...prev, [org.uid]: e.target.value }))}
                                className="w-full h-8 px-3 pr-7 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-400 text-[11px] font-mono font-semibold text-[#2A2A2A] placeholder-neutral-300 transition-all"
                              />
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 text-[10px] font-semibold">%</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="col-span-3 flex justify-center gap-1.5">
                            <button
                              onClick={() => handleApplyOrgFee(org)}
                              disabled={isSaving || !currentInput}
                              className="h-8 px-3 rounded-xl bg-[#358597] hover:bg-[#2C6E7D] disabled:bg-neutral-200 text-white text-[10px] font-semibold tracking-wide uppercase transition-all flex items-center gap-1"
                            >
                              {isSaving ? (
                                <div className="w-3 h-3 rounded-full border-2 border-white/35 border-t-white animate-spin"></div>
                              ) : (
                                <Check size={10} />
                              )}
                              Apply
                            </button>
                            {hasOverride && (
                              <button
                                onClick={() => handleResetOrgFee(org.uid)}
                                disabled={isSaving}
                                className="h-8 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200/80 disabled:bg-neutral-50 text-neutral-500 hover:text-rose-600 text-[10px] font-semibold tracking-wide uppercase transition-all flex items-center gap-1"
                              >
                                <RotateCcw size={10} />
                                Reset
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Organizer Verification Board */}
        <div className="bg-white rounded-[2rem] border border-neutral-100 shadow-xl shadow-neutral-100/50 p-6 md:p-8 mb-12">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-4 mb-6">
            <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600">
              <Briefcase size={16} />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg text-[#2A2A2A]">Organizer Verification Board</h3>
              <p className="text-[10px] text-neutral-400 font-light">Approve or revoke publishing credentials for platform event organizers.</p>
            </div>
          </div>

          {(() => {
            const organizers = users.filter(u => u.role === "organizer");
            if (organizers.length === 0) {
              return (
                <div className="py-8 text-center text-xs text-neutral-400 font-light border border-dashed border-neutral-100 rounded-2xl bg-neutral-50/50">
                  No registered organizers found on the platform.
                </div>
              );
            }
            return (
              <div className="border border-neutral-100 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-neutral-50/80 border-b border-neutral-100 text-[9px] uppercase tracking-wider font-semibold text-neutral-400">
                  <div className="col-span-5">Organizer Info</div>
                  <div className="col-span-3 text-center">Registration Date</div>
                  <div className="col-span-2 text-center">Status</div>
                  <div className="col-span-2 text-center">Action</div>
                </div>
                <div className="divide-y divide-neutral-100 max-h-[300px] overflow-y-auto no-scrollbar">
                  {organizers.map((org) => {
                    const isApproved = org.approved === true;
                    const regDate = org.createdAt ? new Date(org.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" }) : "N/A";
                    return (
                      <div key={org.uid} className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-neutral-50/50 transition-colors">
                        <div className="col-span-5 min-w-0 text-left">
                          <span className="block text-xs font-semibold text-[#2A2A2A] truncate">{org.displayName || "Unnamed"}</span>
                          <span className="block text-[10px] text-neutral-400 font-light truncate">{org.email || "No email"}</span>
                        </div>
                        <div className="col-span-3 text-center text-xs text-neutral-500 font-light">
                          {regDate}
                        </div>
                        <div className="col-span-2 flex justify-center">
                          <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            isApproved
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                              : "bg-amber-50 text-amber-600 border border-amber-100"
                          }`}>
                            {isApproved ? "Approved" : "Pending"}
                          </span>
                        </div>
                        <div className="col-span-2 flex justify-center">
                          <button
                            onClick={() => handleToggleApproval(org.uid, isApproved)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-semibold tracking-wide uppercase transition-all flex items-center gap-1 ${
                              isApproved
                                ? "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100"
                                : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100"
                            }`}
                          >
                            {isApproved ? (
                              <>
                                <XCircle size={12} />
                                Revoke
                              </>
                            ) : (
                              <>
                                <CheckCircle size={12} />
                                Approve
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Featured Event Curation Panel */}
        <div className="bg-white rounded-[2rem] border border-neutral-100 shadow-xl shadow-neutral-100/50 p-6 md:p-8 mb-12">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-4 mb-6">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Star size={16} />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg text-[#2A2A2A]">Event Curation & Spotlight</h3>
              <p className="text-[10px] text-neutral-400 font-light">Promote selected events to the featured gallery carousel at the top of the Discover feed.</p>
            </div>
          </div>

          {events.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400 font-light border border-dashed border-neutral-100 rounded-2xl bg-neutral-50/50">
              No published events available to curate.
            </div>
          ) : (
            <div className="border border-neutral-100 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-neutral-50/80 border-b border-neutral-100 text-[9px] uppercase tracking-wider font-semibold text-neutral-400">
                <div className="col-span-5">Event Details</div>
                <div className="col-span-3 text-center">Category / Vibe</div>
                <div className="col-span-2 text-center">Admission Price</div>
                <div className="col-span-2 text-center">Featured Spotlight</div>
              </div>
              <div className="divide-y divide-neutral-100 max-h-[300px] overflow-y-auto no-scrollbar">
                {events.map((ev) => {
                  const isFeatured = ev.featured === true;
                  return (
                    <div key={ev.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-neutral-50/50 transition-colors">
                      <div className="col-span-5 flex items-center gap-3 min-w-0 text-left">
                        <img 
                          src={ev.image} 
                          alt={ev.name} 
                          className="w-8 h-8 rounded-lg object-cover border border-neutral-100 shrink-0"
                          loading="lazy"
                        />
                        <div className="min-w-0">
                          <span className="block text-xs font-semibold text-[#2A2A2A] truncate">{ev.name}</span>
                          <span className="block text-[9px] text-neutral-400 font-light">ID: {ev.id.substring(0, 8)}...</span>
                        </div>
                      </div>
                      <div className="col-span-3 text-center text-xs text-neutral-500 font-light">
                        {ev.category} • {ev.vibe}
                      </div>
                      <div className="col-span-2 text-center text-xs font-semibold text-[#2A2A2A]">
                        {ev.isFree ? "Free" : `$${ev.price?.toFixed(2)}`}
                      </div>
                      <div className="col-span-2 flex justify-center">
                        <button
                          onClick={() => handleToggleFeatured(ev.id, isFeatured)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-semibold tracking-wide uppercase transition-all flex items-center gap-1 ${
                            isFeatured
                              ? "bg-amber-500 text-white hover:bg-amber-600"
                              : "bg-neutral-50 text-neutral-400 hover:text-[#2A2A2A] border border-neutral-200"
                          }`}
                        >
                          <Star size={12} className={isFeatured ? "fill-white" : ""} />
                          {isFeatured ? "Featured" : "Spotlight"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Dashboard Main layout splits */}
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          
          {/* LEFT: Trail Builder Form (2/3 width on wide screens) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[2rem] border border-neutral-100 shadow-xl shadow-neutral-100/50 p-6 md:p-8">
              
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-4 mb-6">
                <div className="w-8 h-8 rounded-full bg-[#EA7963]/10 flex items-center justify-center text-[#EA7963]">
                  <Sparkles size={16} />
                </div>
                <h3 className="font-display font-semibold text-lg text-[#2A2A2A]">City Trail Builder</h3>
              </div>

              {formError && (
                <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs flex gap-2.5 items-start">
                  <ShieldAlert size={16} className="shrink-0 text-rose-500 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs flex gap-2.5 items-start">
                  <Check size={16} className="shrink-0 text-emerald-500 mt-0.5" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <form onSubmit={handleCreateTrail} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-1.5 pl-1">Trail Name</label>
                    <input
                      type="text"
                      required
                      value={trailName}
                      onChange={(e) => setTrailName(e.target.value)}
                      placeholder="e.g. Historic Art Tour"
                      className="w-full h-11 px-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-[#EA7963]/25 focus:border-[#EA7963] text-xs text-[#2A2A2A] placeholder-neutral-300 transition-all font-light"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-1.5 pl-1">Trail Description</label>
                    <input
                      type="text"
                      required
                      value={trailDescription}
                      onChange={(e) => setTrailDescription(e.target.value)}
                      placeholder="e.g. Explore museum venues and art crawls."
                      className="w-full h-11 px-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-[#EA7963]/25 focus:border-[#EA7963] text-xs text-[#2A2A2A] placeholder-neutral-300 transition-all font-light"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-1.5 pl-1">Category</label>
                    <select
                      value={trailCategory}
                      onChange={(e) => setTrailCategory(e.target.value)}
                      className="w-full h-11 px-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-[#EA7963]/25 focus:border-[#EA7963] text-xs text-[#2A2A2A] transition-all font-light"
                    >
                      <option value="Music">Music</option>
                      <option value="Art">Art</option>
                      <option value="Theater">Theater</option>
                      <option value="Tourism">Tourism</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-1.5 pl-1">Completion Reward</label>
                    <input
                      type="text"
                      required
                      value={trailReward}
                      onChange={(e) => setTrailReward(e.target.value)}
                      placeholder="e.g. Free Coffee at Partner Cafe"
                      className="w-full h-11 px-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-[#EA7963]/25 focus:border-[#EA7963] text-xs text-[#2A2A2A] placeholder-neutral-300 transition-all font-light"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-1.5 pl-1">Gamified Badge Name</label>
                    <input
                      type="text"
                      required
                      value={trailBadge}
                      onChange={(e) => setTrailBadge(e.target.value)}
                      placeholder="e.g. Master Connoisseur"
                      className="w-full h-11 px-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-[#EA7963]/25 focus:border-[#EA7963] text-xs text-[#2A2A2A] placeholder-neutral-300 transition-all font-light"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5 pl-1">Card Color Theme</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {themeOptions.map((opt) => (
                      <button
                        type="button"
                        key={opt.name}
                        onClick={() => setSelectedThemeColor(opt.value)}
                        className={`p-3 rounded-2xl text-[10px] text-center border font-semibold flex items-center justify-center transition-all bg-gradient-to-r ${opt.value} ${
                          selectedThemeColor === opt.value
                            ? "ring-2 ring-neutral-800 scale-[1.02] shadow-sm"
                            : "opacity-85 hover:opacity-100"
                        }`}
                      >
                        {opt.name.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Event Selector (exactly 3 required) */}
                <div className="border-t border-neutral-100 pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <span className="block text-xs font-semibold text-neutral-400 pl-1">Required Events (Choose Exactly 3)</span>
                      <span className="block text-[10px] text-neutral-400 font-light pl-1 mt-0.5">Select the 3 event cards to link to this pass.</span>
                    </div>
                    <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full ${
                      selectedEventIds.length === 3 ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-neutral-100 text-neutral-500"
                    }`}>
                      {selectedEventIds.length} / 3 Selected
                    </span>
                  </div>

                  {events.length === 0 ? (
                    <div className="py-8 text-center text-xs text-neutral-400 font-light border border-dashed border-neutral-100 rounded-2xl bg-neutral-50/50">
                      No published events available to link to a trail.
                    </div>
                  ) : (
                    <div className="max-h-[300px] overflow-y-auto border border-neutral-100 rounded-2xl p-4 bg-neutral-50/30 grid grid-cols-1 md:grid-cols-2 gap-3 no-scrollbar">
                      {events.map((ev) => {
                        const isChecked = selectedEventIds.includes(ev.id);
                        const disabled = !isChecked && selectedEventIds.length >= 3;

                        return (
                          <div 
                            key={ev.id}
                            onClick={() => !disabled && handleEventToggle(ev.id)}
                            className={`p-3 rounded-xl border flex items-center gap-3 select-none transition-all cursor-pointer ${
                              isChecked
                                ? "bg-white border-[#EA7963] shadow-md shadow-neutral-100/50"
                                : disabled
                                  ? "bg-neutral-50 border-neutral-100 opacity-50 cursor-not-allowed"
                                  : "bg-white border-neutral-100 hover:border-neutral-200/60"
                            }`}
                          >
                            <img 
                              src={ev.image} 
                              alt={ev.name} 
                              className="w-10 h-10 rounded-lg object-cover border border-neutral-100"
                              loading="lazy"
                            />
                            <div className="flex-grow min-w-0 text-left">
                              <h4 className="font-semibold text-xs text-[#2A2A2A] truncate leading-tight">{ev.name}</h4>
                              <span className="text-[9px] text-neutral-400 font-light block mt-0.5">
                                {ev.category} • {ev.vibe}
                              </span>
                            </div>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                              isChecked ? "bg-[#EA7963] border-[#EA7963] text-white" : "border-neutral-200 bg-white"
                            }`}>
                              {isChecked && <Check size={12} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={creating || selectedEventIds.length !== 3}
                  className="w-full h-12 rounded-full bg-[#EA7963] hover:bg-[#D96853] disabled:bg-neutral-200 text-white font-display text-xs font-semibold tracking-wider uppercase transition-all duration-300 shadow-md flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <div className="w-5 h-5 rounded-full border-2 border-white/35 border-t-white animate-spin"></div>
                  ) : (
                    <>
                      <Plus size={16} />
                      Publish City Trail Challenge
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT: Active Trails Management (1/3 width) */}
          <div className="lg:col-span-1 bg-white rounded-[2rem] border border-neutral-100 shadow-xl shadow-neutral-100/50 p-6 md:p-8">
            <h3 className="font-display font-semibold text-lg border-b border-neutral-100 pb-4 mb-6">
              Platform Trails ({trails.length})
            </h3>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#358597]"></div>
              </div>
            ) : trails.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-xs text-neutral-400 font-light">No custom trails added to the database yet.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[580px] overflow-y-auto no-scrollbar">
                {trails.map((trail) => (
                  <div 
                    key={trail.id}
                    className="p-4 rounded-2xl border border-neutral-100/80 bg-neutral-50/40 relative overflow-hidden flex flex-col justify-between shadow-sm"
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className="text-[8px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 border border-neutral-200 uppercase font-bold">
                        {trail.category}
                      </span>
                      <button 
                        onClick={() => handleDeleteTrail(trail.id)}
                        className="text-neutral-400 hover:text-rose-600 transition-colors p-1 rounded-full hover:bg-rose-50"
                        title="Delete Trail"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <h4 className="font-display font-bold text-sm text-[#2A2A2A] leading-tight mb-1">
                      {trail.name}
                    </h4>
                    
                    <p className="text-neutral-400 text-[10px] font-light leading-relaxed mb-3">
                      {trail.description}
                    </p>

                    {trail.eventIds && (
                      <div className="bg-white border border-neutral-100 rounded-xl p-2.5 text-left text-[10px] text-neutral-500 space-y-1 mb-2 font-sans shadow-inner">
                        <span className="block font-semibold uppercase text-neutral-400 text-[8px] tracking-wider leading-none mb-1">Linkages</span>
                        {trail.eventIds.map((id, idx) => {
                          const evObj = events.find(e => e.id === id);
                          return (
                            <div key={id} className="truncate">
                              {idx + 1}. {evObj ? evObj.name : `Event: ${id.substring(0, 5)}...`}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="text-[9px] text-[#EA7963] font-sans flex items-start gap-1">
                      <span className="font-semibold">Reward:</span>
                      <span>{trail.reward}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Admin;
