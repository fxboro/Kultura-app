import { useState, useEffect } from "react";
import { doc, collection, runTransaction, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../hooks/useAuth";
import { 
  X, Sparkles, AlertCircle, CreditCard, CheckCircle2, Flame, PartyPopper, 
  UserCheck, UserPlus, LogIn, ArrowRight, ShieldCheck, Mail, User, Gift
} from "lucide-react";

const BookingModal = ({ isOpen, onClose, event, onSuccess, onOpenAuth }) => {
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("form"); // "auth-gate" | "form" | "loading" | "success"
  const [isGuestMode, setIsGuestMode] = useState(false);

  // Guest details
  const [guestEmail, setGuestEmail] = useState("");
  const [guestName, setGuestName] = useState("");

  const [generatedTickets, setGeneratedTickets] = useState([]);

  // Mock Card Details
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  // Dynamic commission rate (resolved from Firestore)
  const [commissionRate, setCommissionRate] = useState(0.025); // default 2.5%

  // Reset modal state when opened or when user status changes
  useEffect(() => {
    if (!isOpen) return;

    if (!user && !isGuestMode) {
      setStatus("auth-gate");
    } else if (user) {
      setStatus("form");
    }
  }, [isOpen, user, isGuestMode]);

  // If user logs in while modal is open in auth-gate, auto-advance to form
  useEffect(() => {
    if (user && status === "auth-gate") {
      setStatus("form");
    }
  }, [user, status]);

  // Fetch applicable commission rate when modal opens
  useEffect(() => {
    if (!isOpen || !event) return;

    const fetchCommissionRate = async () => {
      try {
        const orgFeeRef = doc(db, "organizerFees", event.organizerId);
        const orgFeeSnap = await getDoc(orgFeeRef);
        if (orgFeeSnap.exists()) {
          const rate = orgFeeSnap.data().commissionRate;
          if (typeof rate === "number" && rate >= 0) {
            setCommissionRate(rate);
            return;
          }
        }

        const globalFeeRef = doc(db, "platformSettings", "fees");
        const globalFeeSnap = await getDoc(globalFeeRef);
        if (globalFeeSnap.exists()) {
          const rate = globalFeeSnap.data().globalCommissionRate;
          if (typeof rate === "number" && rate >= 0) {
            setCommissionRate(rate);
            return;
          }
        }

        setCommissionRate(0.025);
      } catch (err) {
        console.error("Error fetching commission rate:", err);
        setCommissionRate(0.025);
      }
    };

    fetchCommissionRate();
  }, [isOpen, event]);

  if (!isOpen || !event) return null;

  const { name, date, price, inventory, soldCount, isFree, hypeMode, image, category } = event;
  const remainingInventory = inventory - (soldCount || 0);
  const maxPurchase = Math.min(5, remainingInventory);

  // Pricing calculations
  const ticketPrice = isFree ? 0 : price;
  const subtotal = ticketPrice * quantity;
  const bookingFee = isFree ? 0 : subtotal * commissionRate;
  const processingFee = isFree ? 0 : (subtotal > 0 ? subtotal * 0.014 + 0.25 : 0);
  const totalCost = subtotal + bookingFee + processingFee;

  const handleIncrement = () => {
    if (quantity < maxPurchase) {
      setQuantity(prev => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const generate6DigitCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleContinueAsGuest = () => {
    setIsGuestMode(true);
    setError(null);
    setStatus("form");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Ensure user or guest mode
    if (!user && !isGuestMode) {
      setStatus("auth-gate");
      setLoading(false);
      return;
    }

    // Validate guest inputs
    if (!user && isGuestMode) {
      if (!guestEmail.trim() || !guestEmail.includes("@")) {
        setError("Please enter a valid email address to receive your gate pass.");
        setLoading(false);
        return;
      }
    }

    if (remainingInventory < quantity && !hypeMode) {
      setError("Not enough tickets remaining for this event.");
      setLoading(false);
      return;
    }

    setStatus("loading");

    try {
      // Simulate Payment Delay if it's a paid ticket
      if (!isFree && !hypeMode) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        if (cardNumber.replace(/\s/g, "").length !== 16 || cardCvc.length < 3 || !cardName) {
          throw new Error("Credit card payment failed. Please verify card details.");
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      const ticketDocs = [];
      const eventDocRef = doc(db, "events", event.id);

      // Run transactional update to ensure stock availability
      await runTransaction(db, async (transaction) => {
        const eventSnap = await transaction.get(eventDocRef);
        if (!eventSnap.exists()) {
          throw new Error("This event no longer exists.");
        }

        const freshEventData = eventSnap.data();
        const freshSoldCount = freshEventData.soldCount || 0;
        const freshWaitlistCount = freshEventData.waitlistCount || 0;
        const freshInventory = freshEventData.inventory || 0;

        if (!freshEventData.hypeMode) {
          const freshRemainingInventory = freshInventory - freshSoldCount;
          if (freshRemainingInventory < quantity) {
            throw new Error("Not enough tickets remaining for this event.");
          }
        }

        for (let i = 0; i < quantity; i++) {
          const ticketCode = generate6DigitCode();
          const ticketRef = doc(collection(db, "tickets"));
          
          const effectiveEmail = user ? user.email : guestEmail.trim().toLowerCase();
          const effectiveUserId = user ? user.uid : `guest_${Date.now()}`;
          const effectiveName = user ? (user.displayName || "Member") : (guestName.trim() || "Guest Visitor");

          const ticketData = {
            eventId: event.id,
            eventName: name,
            eventDate: date,
            eventImage: image,
            eventCategory: category,
            userId: effectiveUserId,
            userEmail: effectiveEmail,
            userName: effectiveName,
            isGuest: !user,
            ticketCode,
            price: ticketPrice,
            status: freshEventData.hypeMode ? "waitlist" : "valid",
            purchaseDate: new Date(),
            // Account members unlock after-party perks; guests receive basic ticket
            meetupEnabled: user ? (event.meetupEnabled || false) : false,
            ...(user && event.meetupEnabled && event.meetupVenueName && { meetupVenueName: event.meetupVenueName }),
            ...(user && event.meetupEnabled && event.meetupVenueAddress && { meetupVenueAddress: event.meetupVenueAddress }),
            ...(user && event.meetupEnabled && event.meetupNote && { meetupNote: event.meetupNote }),
          };

          transaction.set(ticketRef, ticketData);
          ticketDocs.push({ id: ticketRef.id, code: ticketCode });
        }

        if (freshEventData.hypeMode) {
          transaction.update(eventDocRef, {
            waitlistCount: freshWaitlistCount + quantity
          });
        } else {
          transaction.update(eventDocRef, {
            soldCount: freshSoldCount + quantity
          });
        }
      });

      setGeneratedTickets(ticketDocs);
      setStatus("success");
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Booking error:", err);
      setError(err.message || "An error occurred during booking. Please try again.");
      setStatus("form");
    } finally {
      setLoading(false);
    }
  };

  const handleCardNumberChange = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    const formatted = val.match(/.{1,4}/g)?.join(" ") || val;
    setCardNumber(formatted.substring(0, 19));
  };

  const handleExpiryChange = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    let formatted = val;
    if (val.length > 2) {
      formatted = `${val.substring(0, 2)}/${val.substring(2, 4)}`;
    }
    setCardExpiry(formatted.substring(0, 5));
  };

  const handleCvcChange = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    setCardCvc(val.substring(0, 4));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-md transition-opacity duration-300">
      <div 
        className="w-full max-w-lg bg-[#FDFDFD] border border-neutral-100 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col relative max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button (except during loading) */}
        {status !== "loading" && (
          <button 
            onClick={onClose}
            className="absolute right-6 top-6 w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200/80 text-neutral-500 hover:text-[#2A2A2A] flex items-center justify-center transition-colors shadow-sm z-10"
          >
            <X size={16} />
          </button>
        )}

        {/* ---------------------------------------------------- */}
        {/* 0. AUTH GATE SCREEN (Unauthenticated Visitors)       */}
        {/* ---------------------------------------------------- */}
        {status === "auth-gate" && (
          <div className="p-7 overflow-y-auto flex-grow flex flex-col justify-between text-left">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#358597]/10 text-[#358597] text-[11px] font-bold uppercase tracking-wider mb-3">
                <Sparkles size={13} />
                Checkout Access
              </div>

              <h2 className="text-2xl font-bold font-display text-[#2A2A2A] tracking-tight">
                How would you like to proceed?
              </h2>
              <p className="text-neutral-500 text-xs font-light mt-1">
                Booking slot for <strong className="text-neutral-700">{name}</strong>.
              </p>

              {/* Perks Comparison Teaser Card */}
              <div className="my-5 p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-teal-500/10 border border-neutral-200/80 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#2A2A2A] font-display">
                  <Gift size={16} className="text-[#EA7963]" />
                  <span>Account Benefits vs Guest Booking</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-sans">
                  <div className="bg-white/80 p-2.5 rounded-xl border border-neutral-200/50">
                    <span className="block font-bold text-[#358597] mb-1">✨ Member Account</span>
                    <ul className="space-y-1 text-neutral-600 font-light">
                      <li className="flex items-center gap-1">✓ 20% Partner Discounts</li>
                      <li className="flex items-center gap-1">✓ Passport Stamps</li>
                      <li className="flex items-center gap-1">✓ After-Party Access</li>
                      <li className="flex items-center gap-1">✓ Digital Ticket Wallet</li>
                    </ul>
                  </div>

                  <div className="bg-white/50 p-2.5 rounded-xl border border-neutral-200/40">
                    <span className="block font-bold text-neutral-500 mb-1">👤 Guest Checkout</span>
                    <ul className="space-y-1 text-neutral-400 font-light">
                      <li className="flex items-center gap-1">✕ No Partner Perks</li>
                      <li className="flex items-center gap-1">✕ No Passport Stamps</li>
                      <li className="flex items-center gap-1">✓ Basic Passcode Email</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Options */}
              <div className="space-y-3">
                {/* Create Account Option (Recommended) */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuth?.("signup");
                  }}
                  className="w-full p-4 rounded-2xl bg-gradient-to-r from-[#358597] to-[#2C6E7D] text-white hover:opacity-95 transition-all shadow-md flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                      <UserPlus size={20} />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-sm">Create Free Account</span>
                        <span className="bg-amber-400 text-neutral-900 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                          Recommended
                        </span>
                      </div>
                      <span className="text-[11px] text-white/80 font-light">Unlock partner discounts & passport stamps</span>
                    </div>
                  </div>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Log In Option */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuth?.("login");
                  }}
                  className="w-full p-3.5 rounded-2xl bg-white border border-neutral-200 hover:bg-neutral-50 text-[#2A2A2A] transition-all shadow-sm flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-neutral-100 text-neutral-600 flex items-center justify-center shrink-0">
                      <LogIn size={18} />
                    </div>
                    <div className="text-left">
                      <span className="font-display font-bold text-xs block">Log In to Existing Account</span>
                      <span className="text-[10px] text-neutral-400 font-light">Access your saved profile & tickets</span>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-neutral-400 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Guest Option */}
                <button
                  type="button"
                  onClick={handleContinueAsGuest}
                  className="w-full p-3.5 rounded-2xl bg-neutral-100/80 hover:bg-neutral-200/60 text-neutral-700 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-neutral-200/70 text-neutral-600 flex items-center justify-center shrink-0">
                      <UserCheck size={18} />
                    </div>
                    <div className="text-left">
                      <span className="font-display font-semibold text-xs block">Proceed as Guest</span>
                      <span className="text-[10px] text-neutral-400 font-light">Quick booking with basic ticket email</span>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-neutral-400 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* 1. PROCESSING LOADING SCREEN                         */}
        {/* ---------------------------------------------------- */}
        {status === "loading" && (
          <div className="p-10 flex flex-col items-center justify-center min-h-[350px]">
            <div className="relative mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#358597]"></div>
              <Sparkles size={24} className="absolute inset-0 m-auto text-[#EA7963] animate-pulse" />
            </div>
            <h3 className="font-display font-semibold text-lg text-[#2A2A2A]">Securing Your Trail Spot</h3>
            <p className="text-neutral-400 text-xs font-light mt-1.5 max-w-xs text-center leading-relaxed">
              {hypeMode ? "Registering profile to waitlist..." : isFree ? "Generating admission pass code..." : "Simulating Stripe secure transaction token..."}
            </p>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* 2. SUCCESS CONFIRMATION SCREEN                       */}
        {/* ---------------------------------------------------- */}
        {status === "success" && (
          <div className="p-8 flex flex-col items-center justify-center overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 border border-emerald-100 flex items-center justify-center mb-4">
              <CheckCircle2 size={36} />
            </div>

            <h3 className="font-display font-bold text-2xl text-[#2A2A2A] tracking-tight">
              {hypeMode ? "Waitlist Confirmed" : "Ticket Registered!"}
            </h3>
            <p className="text-emerald-600 text-xs font-medium mt-1">
              {isGuestMode && !user 
                ? "Guest booking complete. Passcodes emailed." 
                : hypeMode 
                  ? "You're successfully on the pre-booking list." 
                  : "Admission pass generated successfully."}
            </p>

            <div className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl p-5 my-6 text-left text-sm space-y-3 font-sans">
              <div className="flex justify-between border-b border-neutral-100 pb-2">
                <span className="text-neutral-400 font-light">Event</span>
                <span className="font-semibold text-neutral-700 max-w-[200px] truncate">{name}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2">
                <span className="text-neutral-400 font-light">Date</span>
                <span className="font-semibold text-neutral-700">
                  {new Date(date).toLocaleDateString(undefined, { dateStyle: "medium" })}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2">
                <span className="text-neutral-400 font-light">Qty</span>
                <span className="font-semibold text-neutral-700">{quantity} ticket(s)</span>
              </div>

              {/* Passcodes list */}
              {!hypeMode && (
                <div className="pt-1">
                  <span className="block text-[10px] uppercase font-semibold text-neutral-400 tracking-wider mb-2">Gate Passcode(s)</span>
                  <div className="grid grid-cols-2 gap-2">
                    {generatedTickets.map((t, idx) => (
                      <div key={t.id} className="bg-white border border-neutral-200/60 p-2 rounded-xl text-center shadow-sm">
                        <span className="block text-[9px] text-neutral-400 leading-none">Pass {idx + 1}</span>
                        <span className="font-mono font-bold text-sm text-[#2A2A2A] block mt-0.5 tracking-wider">{t.code}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Guest Upsell Banner */}
              {isGuestMode && !user && (
                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200/60 text-amber-900 text-xs space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5 text-amber-800">
                    <Sparkles size={14} className="text-amber-500" />
                    <span>Create an account to claim partner perks</span>
                  </div>
                  <p className="text-[11px] text-amber-700 font-light leading-relaxed">
                    Sign up with <strong>{guestEmail}</strong> to link your tickets to the digital wallet and unlock 20% off at local partner bars and cafés!
                  </p>
                </div>
              )}

              {/* Meetup Teaser for logged in users */}
              {user && event.meetupEnabled && (
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-purple-700 text-xs flex gap-2 items-start">
                  <PartyPopper size={16} className="shrink-0 text-purple-500 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-[10px] uppercase tracking-wider text-purple-500 mb-0.5">After-Party Included</span>
                    <span>This event includes a secret post-event meetup. Details will be revealed after you check in at the gate.</span>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full flex gap-3">
              {isGuestMode && !user ? (
                <>
                  <button
                    onClick={onClose}
                    className="flex-1 h-12 rounded-full border border-neutral-200 hover:bg-neutral-50 text-neutral-600 font-display text-xs font-semibold uppercase tracking-wider"
                  >
                    Done
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAuth?.("signup");
                    }}
                    className="flex-1 h-12 rounded-full bg-[#358597] text-white hover:bg-[#2C6E7D] font-display text-xs font-semibold uppercase tracking-wider shadow-md"
                  >
                    Create Account
                  </button>
                </>
              ) : (
                <button
                  onClick={onClose}
                  className="w-full h-12 rounded-full bg-[#2A2A2A] text-white hover:bg-neutral-800 transition-colors font-display text-sm font-semibold shadow-md"
                >
                  Go to My Collection
                </button>
              )}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* 3. BOOKING / CHECKOUT FORM                           */}
        {/* ---------------------------------------------------- */}
        {status === "form" && (
          <form onSubmit={handleSubmit} className="p-8 overflow-y-auto flex-grow flex flex-col justify-between text-left">
            <div>
              {/* Top Banner & Back Option */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-[#358597]">
                  {hypeMode ? (
                    <>
                      <Flame size={16} className="text-[#EA7963] animate-pulse" />
                      <span className="font-display font-medium text-sm tracking-wide text-[#EA7963]">Pre-Booking Waitlist</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} className="text-[#358597]" />
                      <span className="font-display font-medium text-sm tracking-wide">
                        {isGuestMode && !user ? "Guest Checkout" : "Checkout Terminal"}
                      </span>
                    </>
                  )}
                </div>

                {!user && (
                  <button
                    type="button"
                    onClick={() => setStatus("auth-gate")}
                    className="text-[11px] text-[#358597] hover:underline font-semibold"
                  >
                    Change to Member
                  </button>
                )}
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold font-display text-[#2A2A2A] tracking-tight leading-tight">
                {hypeMode ? "Join the Waitlist" : "Register Event Pass"}
              </h2>
              <p className="text-neutral-500 text-xs font-light mt-1 max-w-sm">
                Confirming slot for <strong>{name}</strong>.
              </p>

              {/* Guest Warning / Upgrade Teaser Banner */}
              {isGuestMode && !user && (
                <div className="my-4 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/70 text-amber-900 text-xs space-y-1">
                  <div className="font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1 text-amber-800">
                      <ShieldCheck size={14} className="text-amber-500" /> Booking as Guest
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAuth?.("signup");
                      }}
                      className="text-[10px] uppercase tracking-wider font-bold text-[#358597] underline"
                    >
                      Sign up for Perks
                    </button>
                  </div>
                  <p className="text-[11px] text-amber-700 font-light leading-relaxed">
                    Guest bookings receive ticket passcodes via email, but do not qualify for partner discounts or passport stamps.
                  </p>
                </div>
              )}

              {error && (
                <div className="my-4 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs flex gap-2.5 items-start leading-relaxed font-sans">
                  <AlertCircle size={16} className="shrink-0 text-rose-500 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Guest Contact Details Input */}
              {isGuestMode && !user && (
                <div className="space-y-3.5 my-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-100 font-sans">
                  <span className="block text-xs font-bold text-[#2A2A2A] uppercase tracking-wider font-display">
                    Guest Ticket Delivery Info
                  </span>

                  <div>
                    <label className="block text-[10px] font-medium text-neutral-500 mb-1 pl-1 flex items-center gap-1">
                      <User size={12} className="text-neutral-400" /> Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Dayo Chima"
                      className="w-full h-11 px-4 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#358597]/25 text-xs text-[#2A2A2A]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-neutral-500 mb-1 pl-1 flex items-center gap-1">
                      <Mail size={12} className="text-[#358597]" /> Email Address (For Ticket Delivery)
                    </label>
                    <input
                      type="email"
                      required
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="dayo@example.com"
                      className="w-full h-11 px-4 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#358597]/25 text-xs text-[#2A2A2A]"
                    />
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100 my-4 font-sans">
                <div>
                  <span className="block text-sm font-semibold text-[#2A2A2A]">Select Quantity</span>
                  <span className="block text-[10px] text-neutral-400 font-light mt-0.5">Maximum 5 tickets per order</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={handleDecrement}
                    disabled={quantity <= 1}
                    className="w-9 h-9 rounded-full bg-white border border-neutral-200/80 hover:bg-neutral-50 text-[#2A2A2A] disabled:opacity-40 flex items-center justify-center font-bold transition-colors shadow-sm"
                  >
                    -
                  </button>
                  <span className="font-display font-bold text-base w-4 text-center">{quantity}</span>
                  <button
                    type="button"
                    onClick={handleIncrement}
                    disabled={quantity >= maxPurchase || hypeMode}
                    className="w-9 h-9 rounded-full bg-white border border-neutral-200/80 hover:bg-neutral-50 text-[#2A2A2A] disabled:opacity-40 flex items-center justify-center font-bold transition-colors shadow-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Stripe Payment Form Simulation (Only if paid event and not hype mode) */}
              {!isFree && !hypeMode && (
                <div className="space-y-4 pt-3 border-t border-neutral-100 font-sans">
                  <div className="flex items-center gap-2 text-neutral-400 text-xs uppercase tracking-wider font-semibold mb-1 pl-1">
                    <CreditCard size={14} className="text-[#358597]" />
                    <span>Cardholder Information (Stripe Sandbox)</span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-neutral-400 mb-1.5 pl-1">Name on Card</label>
                    <input
                      type="text"
                      required
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="Chima Adim"
                      className="w-full h-11 px-4 rounded-xl border border-neutral-200/80 bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-[#358597]/25 text-xs text-[#2A2A2A]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-neutral-400 mb-1.5 pl-1">Card Number</label>
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="4242 4242 4242 4242"
                      className="w-full h-11 px-4 rounded-xl border border-neutral-200/80 bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-[#358597]/25 text-xs font-mono tracking-wider text-[#2A2A2A]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-medium text-neutral-400 mb-1.5 pl-1">Expiry Date</label>
                      <input
                        type="text"
                        required
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        placeholder="MM/YY"
                        className="w-full h-11 px-4 rounded-xl border border-neutral-200/80 bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-[#358597]/25 text-xs text-center text-[#2A2A2A]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-neutral-400 mb-1.5 pl-1">Security Code (CVC)</label>
                      <input
                        type="password"
                        required
                        value={cardCvc}
                        onChange={handleCvcChange}
                        placeholder="•••"
                        className="w-full h-11 px-4 rounded-xl border border-neutral-200/80 bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-[#358597]/25 text-xs text-center text-[#2A2A2A]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Price Breakdown Container */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 text-xs font-sans space-y-2 mt-4">
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-light">Subtotal ({quantity} x ${ticketPrice.toFixed(2)})</span>
                  <span className="font-semibold text-neutral-600">${subtotal.toFixed(2)}</span>
                </div>
                {!isFree && !hypeMode && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-neutral-400 font-light">Platform Fee ({(commissionRate * 100).toFixed(1)}%)</span>
                      <span className="font-semibold text-neutral-600">${bookingFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400 font-light">Payment processing (Stripe)</span>
                      <span className="font-semibold text-neutral-600">${processingFee.toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between border-t border-neutral-200 pt-2 font-display text-sm">
                  <span className="font-bold text-[#2A2A2A]">{hypeMode ? "Deposit Due" : "Total Cost"}</span>
                  <span className={`font-bold ${isFree || hypeMode ? "text-emerald-600" : "text-[#358597]"}`}>
                    {isFree || hypeMode ? "Free" : `$${totalCost.toFixed(2)}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions Row */}
            <div className="flex items-center gap-4 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="h-12 px-6 rounded-full border border-neutral-200 hover:bg-neutral-50 text-neutral-600 transition-colors font-display text-xs font-semibold tracking-wider uppercase shrink-0"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                className={`h-12 rounded-full font-display text-xs font-semibold tracking-wider uppercase text-white transition-all duration-300 shadow-md flex-grow flex items-center justify-center gap-2 ${
                  hypeMode 
                    ? "bg-[#EA7963] hover:bg-[#D96853]" 
                    : isFree 
                      ? "bg-emerald-600 hover:bg-emerald-700" 
                      : "bg-[#358597] hover:bg-[#2C6E7D]"
                }`}
              >
                {hypeMode 
                  ? "Join Waitlist" 
                  : isFree 
                    ? "Confirm Free Pass" 
                    : `Pay $${totalCost.toFixed(2)}`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BookingModal;
