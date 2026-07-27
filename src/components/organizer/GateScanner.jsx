import { useState } from "react";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../hooks/useAuth";
import { Scan, CheckCircle2, ShieldAlert, AlertCircle, RefreshCw, Calendar, User } from "lucide-react";

const GateScanner = ({ onCheckInSuccess, disabled }) => {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle"); // "idle" | "success" | "warning" | "error"
  const [ticketDetails, setTicketDetails] = useState(null);
  const [message, setMessage] = useState("");

  const handleScan = async (e) => {
    e.preventDefault();
    let cleanCode = code.trim().toUpperCase();
    if (cleanCode.startsWith("KULTURA-TICKET:")) {
      const parts = cleanCode.split(":");
      if (parts.length >= 2) {
        cleanCode = parts[1];
      }
    }

    if (!cleanCode || cleanCode.length !== 6) {
      setStatus("error");
      setMessage("Please enter a valid 6-digit code or QR code payload.");
      return;
    }

    setLoading(true);
    setStatus("idle");
    setMessage("");
    setTicketDetails(null);

    try {
      // 1. Query ticket matching the 6-digit code
      const ticketsRef = collection(db, "tickets");
      const q = query(ticketsRef, where("ticketCode", "==", cleanCode));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setStatus("error");
        setMessage("Ticket not found. Please verify the code and try again.");
        setLoading(false);
        return;
      }

      const ticketDoc = querySnapshot.docs[0];
      const ticketData = ticketDoc.data();
      const ticketId = ticketDoc.id;

      // 2. Fetch the corresponding event to check organizer permissions
      const eventRef = doc(db, "events", ticketData.eventId);
      const eventSnap = await getDoc(eventRef);

      if (!eventSnap.exists()) {
        setStatus("error");
        setMessage("The event associated with this ticket no longer exists.");
        setLoading(false);
        return;
      }

      const eventData = eventSnap.data();

      // Verify currently logged in organizer owns the event
      if (eventData.organizerId !== user.uid) {
        setStatus("error");
        setMessage("Access denied! This ticket belongs to an event hosted by another organizer.");
        setLoading(false);
        return;
      }

      // Keep ticket details for display
      const details = {
        id: ticketId,
        eventName: ticketData.eventName || eventData.name,
        eventDate: ticketData.eventDate || eventData.date,
        buyerEmail: ticketData.userEmail || "Registered Visitor",
        purchaseDate: ticketData.purchaseDate ? new Date(ticketData.purchaseDate.seconds * 1000).toLocaleString() : "N/A",
        scannedAt: ticketData.scannedAt ? new Date(ticketData.scannedAt.seconds * 1000).toLocaleString() : null,
        status: ticketData.status
      };
      setTicketDetails(details);

      // 3. Check for double-entry check-ins
      if (ticketData.status === "checked-in") {
        setStatus("warning");
        setMessage(`Double Entry Alert! This ticket was already checked-in.`);
        setLoading(false);
        return;
      }

      // 4. Perform successful check-in
      await updateDoc(doc(db, "tickets", ticketId), {
        status: "checked-in",
        scannedAt: serverTimestamp()
      });

      setStatus("success");
      setMessage("Check-in successful! Admission pass verified.");

      // 5. Trail Completion Detection — check if the attendee completed any trail
      try {
        const trailsSnap = await getDocs(collection(db, "trails"));
        const allTrails = trailsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Get all checked-in tickets for this attendee
        const attendeeTicketsQ = query(
          collection(db, "tickets"),
          where("userId", "==", ticketData.userId),
          where("status", "==", "checked-in")
        );
        const attendeeTicketsSnap = await getDocs(attendeeTicketsQ);
        const checkedInEventIds = new Set(
          attendeeTicketsSnap.docs.map(d => d.data().eventId)
        );

        for (const trail of allTrails) {
          if (!trail.eventIds || !Array.isArray(trail.eventIds)) continue;

          const completedCount = trail.eventIds.filter(id => checkedInEventIds.has(id)).length;
          const goalCount = trail.goalCount || 3;

          if (completedCount >= goalCount) {
            // Check if reward already exists
            const rewardRef = doc(db, "users", ticketData.userId, "completedTrails", trail.id);
            const rewardSnap = await getDoc(rewardRef);

            if (!rewardSnap.exists()) {
              await setDoc(rewardRef, {
                trailId: trail.id,
                trailName: trail.name || "Cultural Trail",
                badge: trail.badge || "Explorer",
                reward: trail.reward || "Special Reward",
                themeColor: trail.themeColor || "",
                completedAt: serverTimestamp()
              });
            }
          }
        }
      } catch (trailErr) {
        console.error("Trail completion check failed (non-blocking):", trailErr);
      }
      
      if (onCheckInSuccess) {
        onCheckInSuccess();
      }
    } catch (err) {
      console.error("Scanning error:", err);
      setStatus("error");
      setMessage("An error occurred during database lookup. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCode("");
    setStatus("idle");
    setMessage("");
    setTicketDetails(null);
  };

  if (disabled) {
    return (
      <div className="bg-white rounded-[2rem] border border-neutral-100 shadow-xl shadow-neutral-100/50 p-6 md:p-8 flex flex-col items-center justify-center min-h-[300px] text-center font-sans">
        <div className="w-12 h-12 rounded-full bg-neutral-50 border border-neutral-100 text-neutral-400 flex items-center justify-center mb-4 select-none">
          <Scan size={22} className="opacity-50" />
        </div>
        <h3 className="font-display font-semibold text-base text-[#2A2A2A]">Scanner Locked</h3>
        <p className="text-neutral-400 text-xs font-light mt-1.5 max-w-[200px] leading-relaxed mx-auto">
          Verification pending. The gate ticket scanner will unlock once your account is approved.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2rem] border border-neutral-100 shadow-xl shadow-neutral-100/50 p-6 md:p-8">
      {/* Title */}
      <div className="flex items-center gap-2 border-b border-neutral-100 pb-4 mb-6">
        <div className="w-8 h-8 rounded-full bg-[#358597]/10 flex items-center justify-center text-[#358597]">
          <Scan size={18} />
        </div>
        <h3 className="font-display font-semibold text-lg text-[#2A2A2A]">Gate Check-In</h3>
      </div>

      {status === "idle" && (
        <form onSubmit={handleScan} className="space-y-4 text-left font-sans">
          <p className="text-xs text-neutral-400 font-light pl-1 leading-relaxed">
            Enter the 6-digit ticket code printed on the attendee's pass or generated on their collection app screen.
          </p>
          
          <div className="relative">
            <input
              type="text"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. A4B9C2"
              className="w-full h-14 px-4 pr-16 rounded-2xl border border-neutral-200 bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-[#358597]/25 focus:border-[#358597] text-lg font-mono font-bold tracking-widest text-center text-[#2A2A2A] placeholder-neutral-300 transition-all"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-2 h-10 px-4 rounded-xl bg-[#358597] text-white hover:bg-[#2C6E7D] transition-colors flex items-center justify-center font-display text-xs font-semibold"
            >
              {loading ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                "Scan"
              )}
            </button>
          </div>
        </form>
      )}

      {/* Success View */}
      {status === "success" && ticketDetails && (
        <div className="flex flex-col items-center text-center font-sans">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 border border-emerald-100 flex items-center justify-center mb-4">
            <CheckCircle2 size={36} />
          </div>
          <h4 className="font-display font-bold text-xl text-[#2A2A2A] mb-1">Access Granted</h4>
          <p className="text-xs text-emerald-600 font-medium mb-6">{message}</p>

          <div className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl p-4 text-left space-y-2 mb-6 text-sm">
            <div className="flex justify-between items-center text-xs border-b border-neutral-100 pb-2 mb-2">
              <span className="text-neutral-400 font-light">Ticket Code</span>
              <span className="font-mono font-bold text-[#2A2A2A]">{code}</span>
            </div>
            <div className="flex items-start gap-2.5">
              <Calendar size={14} className="text-[#358597] shrink-0 mt-0.5" />
              <div>
                <span className="block text-[10px] text-neutral-400 leading-none">Event</span>
                <span className="font-semibold text-neutral-700">{ticketDetails.eventName}</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <User size={14} className="text-[#EA7963] shrink-0 mt-0.5" />
              <div>
                <span className="block text-[10px] text-neutral-400 leading-none">Attendee</span>
                <span className="font-semibold text-neutral-700">{ticketDetails.buyerEmail}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="w-full h-12 rounded-full border border-neutral-200 hover:bg-neutral-50 font-display text-sm font-medium transition-colors"
          >
            Scan Next Ticket
          </button>
        </div>
      )}

      {/* Warning/Double Entry View */}
      {status === "warning" && ticketDetails && (
        <div className="flex flex-col items-center text-center font-sans">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 border border-amber-100 flex items-center justify-center mb-4">
            <ShieldAlert size={36} />
          </div>
          <h4 className="font-display font-bold text-xl text-[#2A2A2A] mb-1">Double Entry Alert</h4>
          <p className="text-xs text-amber-600 font-medium mb-6">This pass has already been checked-in.</p>

          <div className="w-full bg-rose-50/50 border border-rose-100/50 rounded-2xl p-4 text-left space-y-2 mb-6 text-sm">
            <div className="flex justify-between items-center text-xs border-b border-rose-100 pb-2 mb-2">
              <span className="text-rose-500 font-medium">Scanned Previously At:</span>
              <span className="font-mono font-bold text-rose-700">{ticketDetails.scannedAt || "Earlier"}</span>
            </div>
            <div className="flex items-start gap-2.5">
              <Calendar size={14} className="text-[#358597] shrink-0 mt-0.5" />
              <div>
                <span className="block text-[10px] text-neutral-400 leading-none">Event</span>
                <span className="font-semibold text-neutral-700">{ticketDetails.eventName}</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <User size={14} className="text-[#EA7963] shrink-0 mt-0.5" />
              <div>
                <span className="block text-[10px] text-neutral-400 leading-none">Attendee Email</span>
                <span className="font-semibold text-neutral-700">{ticketDetails.buyerEmail}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="w-full h-12 rounded-full border border-neutral-200 hover:bg-neutral-50 font-display text-sm font-medium transition-colors"
          >
            Scan Next Ticket
          </button>
        </div>
      )}

      {/* Error View */}
      {status === "error" && (
        <div className="flex flex-col items-center text-center font-sans">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center mb-4">
            <AlertCircle size={36} />
          </div>
          <h4 className="font-display font-bold text-xl text-[#2A2A2A] mb-1">Verification Failed</h4>
          <p className="text-xs text-rose-600 font-light max-w-xs mb-6">{message}</p>

          <button
            onClick={handleReset}
            className="w-full h-12 rounded-full border border-neutral-200 hover:bg-neutral-50 font-display text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default GateScanner;
