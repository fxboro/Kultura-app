import React, { useState } from "react";
import { doc, collection, addDoc, updateDoc, serverTimestamp, increment } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../hooks/useAuth";
import { X, Sparkles, AlertCircle, CreditCard, Sparkle, CheckCircle2, Calendar, MapPin, User, Flame } from "lucide-react";

const BookingModal = ({ isOpen, onClose, event, onSuccess }) => {
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("form"); // "form" | "loading" | "success"
  const [generatedTickets, setGeneratedTickets] = useState([]);

  // Mock Card Details
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  if (!isOpen || !event) return null;

  const { name, date, price, inventory, soldCount, isFree, hypeMode, image, category } = event;
  const remainingInventory = inventory - (soldCount || 0);
  const maxPurchase = Math.min(5, remainingInventory);

  // Pricing calculations
  const ticketPrice = isFree ? 0 : price;
  const subtotal = ticketPrice * quantity;
  const bookingFee = isFree ? 0 : subtotal * 0.025; // 2.5% commission fee
  const processingFee = isFree ? 0 : (subtotal > 0 ? subtotal * 0.014 + 0.25 : 0); // 1.4% + $0.25 Stripe fee
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setStatus("loading");

    if (!user) {
      setError("Please log in to purchase tickets.");
      setStatus("form");
      setLoading(false);
      return;
    }

    if (remainingInventory < quantity && !hypeMode) {
      setError("Not enough tickets remaining for this event.");
      setStatus("form");
      setLoading(false);
      return;
    }

    try {
      // Simulate Payment Delay if it's a paid ticket
      if (!isFree && !hypeMode) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        // Mock credit card field validations
        if (cardNumber.replace(/\s/g, "").length !== 16 || cardCvc.length < 3 || !cardName) {
          throw new Error("Credit card payment failed. Please verify your details.");
        }
      } else {
        // Small delay for free/waitlist to feel natural
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      // Generate Ticket Document(s)
      const ticketDocs = [];
      for (let i = 0; i < quantity; i++) {
        const ticketCode = generate6DigitCode();
        const ticketData = {
          eventId: event.id,
          eventName: name,
          eventDate: date,
          eventImage: image,
          eventCategory: category,
          userId: user.uid,
          userEmail: user.email,
          ticketCode,
          price: ticketPrice,
          status: hypeMode ? "waitlist" : "valid",
          purchaseDate: new Date(),
        };

        const docRef = await addDoc(collection(db, "tickets"), ticketData);
        ticketDocs.push({ id: docRef.id, code: ticketCode });
      }

      // Update Event Inventory & Aggregations
      const eventDocRef = doc(db, "events", event.id);
      if (hypeMode) {
        await updateDoc(eventDocRef, {
          waitlistCount: increment(quantity)
        });
      } else {
        await updateDoc(eventDocRef, {
          soldCount: increment(quantity)
        });
      }

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
    // Format card number to have spaces every 4 digits
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
      {/* Modal Card Container */}
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

        {/* 1. Processing Loading Screen */}
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

        {/* 2. Success Screen */}
        {status === "success" && (
          <div className="p-8 flex flex-col items-center justify-center overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 border border-emerald-100 flex items-center justify-center mb-4">
              <CheckCircle2 size={36} />
            </div>

            <h3 className="font-display font-bold text-2xl text-[#2A2A2A] tracking-tight">
              {hypeMode ? "Waitlist Confirmed" : "Ticket Registered!"}
            </h3>
            <p className="text-emerald-600 text-xs font-medium mt-1">
              {hypeMode ? "You're successfully on the pre-booking list." : "Admission pass generated successfully."}
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

              {hypeMode && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-amber-700 text-xs flex gap-2">
                  <Flame size={16} className="shrink-0 text-amber-500" />
                  <span>We'll email you at <strong>{user?.email}</strong> the moment ticket bookings open!</span>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full h-12 rounded-full bg-[#2A2A2A] text-white hover:bg-neutral-800 transition-colors font-display text-sm font-semibold shadow-md"
            >
              Go to My Collection
            </button>
          </div>
        )}

        {/* 3. Booking / Checkout Form */}
        {status === "form" && (
          <form onSubmit={handleSubmit} className="p-8 overflow-y-auto flex-grow flex flex-col justify-between">
            <div>
              {/* Dynamic Badge */}
              <div className="flex items-center gap-1.5 text-[#358597] mb-2 text-left">
                {hypeMode ? (
                  <>
                    <Flame size={16} className="text-[#EA7963] animate-pulse" />
                    <span className="font-display font-medium text-sm tracking-wide text-[#EA7963]">Pre-Booking Waitlist</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="text-[#358597]" />
                    <span className="font-display font-medium text-sm tracking-wide">Checkout Terminal</span>
                  </>
                )}
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold font-display text-[#2A2A2A] tracking-tight text-left leading-tight">
                {hypeMode ? "Join the Waitlist" : "Register Event Pass"}
              </h2>
              <p className="text-neutral-500 text-xs font-light text-left mt-1 max-w-sm">
                Confirm your slot for <strong>{name}</strong>.
              </p>

              {error && (
                <div className="my-4 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs flex gap-2.5 items-start leading-relaxed font-sans text-left">
                  <AlertCircle size={16} className="shrink-0 text-rose-500 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100 my-5 font-sans">
                <div className="text-left">
                  <span className="block text-sm font-semibold text-[#2A2A2A]">Select Quantity</span>
                  <span className="block text-[10px] text-neutral-400 font-light mt-0.5">Maximum 5 tickets per user</span>
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
                <div className="space-y-4 pt-4 border-t border-neutral-100 text-left font-sans">
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
                      className="w-full h-11 px-4 rounded-xl border border-neutral-200/80 bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-[#358597]/25 focus:border-[#358597] text-xs text-[#2A2A2A] placeholder-neutral-300 transition-all font-light"
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
                      className="w-full h-11 px-4 rounded-xl border border-neutral-200/80 bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-[#358597]/25 focus:border-[#358597] text-xs font-mono tracking-wider text-[#2A2A2A] placeholder-neutral-300 transition-all font-light"
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
                        className="w-full h-11 px-4 rounded-xl border border-neutral-200/80 bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-[#358597]/25 focus:border-[#358597] text-xs text-center text-[#2A2A2A] placeholder-neutral-300 transition-all font-light"
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
                        className="w-full h-11 px-4 rounded-xl border border-neutral-200/80 bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-[#358597]/25 focus:border-[#358597] text-xs text-center text-[#2A2A2A] placeholder-neutral-300 transition-all font-light"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Price Breakdown Container */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 text-xs font-sans space-y-2 mt-5 text-left">
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-light">Subtotal ({quantity} x ${ticketPrice.toFixed(2)})</span>
                  <span className="font-semibold text-neutral-600">${subtotal.toFixed(2)}</span>
                </div>
                {!isFree && !hypeMode && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-neutral-400 font-light">Service Fee (2.5%)</span>
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
            <div className="flex items-center gap-4 mt-8">
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
                {hypeMode ? "Join Waitlist" : isFree ? "Confirm Free Pass" : `Pay $${totalCost.toFixed(2)}`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BookingModal;
