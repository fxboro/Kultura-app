import React, { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../hooks/useAuth";
import { X, Sparkles, AlertCircle, Plus } from "lucide-react";

const CreateEventModal = ({ isOpen, onClose, onEventCreated }) => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [image, setImage] = useState("");
  const [category, setCategory] = useState("Music");
  const [vibe, setVibe] = useState("Chill");
  const [price, setPrice] = useState("");
  const [inventory, setInventory] = useState("");
  
  // Toggles
  const [isFree, setIsFree] = useState(false);
  const [hypeMode, setHypeMode] = useState(false);
  
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFreeToggle = (checked) => {
    setIsFree(checked);
    if (checked) {
      setPrice("0");
      setValidationErrors(prev => ({ ...prev, price: "" }));
    } else {
      setPrice("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});
    setLoading(true);

    if (!user) {
      setError("You must be logged in to create an event.");
      setLoading(false);
      return;
    }

    // Inline Validation
    const errors = {};
    if (!name.trim()) {
      errors.name = "Event title is required.";
    }
    if (!date) {
      errors.date = "Event date and time is required.";
    } else {
      const selectedDate = new Date(date);
      const now = new Date();
      if (selectedDate < now) {
        errors.date = "Event date cannot be in the past.";
      }
    }

    let parsedPrice = 0;
    if (!isFree) {
      if (price === "") {
        errors.price = "Price is required.";
      } else {
        parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
          errors.price = "Price cannot be negative.";
        }
      }
    }

    let parsedInventory = 0;
    if (inventory === "") {
      errors.inventory = "Capacity is required.";
    } else {
      parsedInventory = parseInt(inventory, 10);
      if (isNaN(parsedInventory) || parsedInventory <= 0) {
        errors.inventory = "Capacity must be a positive integer.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setLoading(false);
      return;
    }

    try {
      const eventData = {
        name,
        date,
        image: image || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=600&auto=format&fit=crop",
        category,
        vibe,
        price: parsedPrice,
        inventory: parsedInventory,
        organizerId: user.uid,
        isFree,
        hypeMode,
        soldCount: 0,
        waitlistCount: 0,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, "events"), eventData);
      
      // Reset form
      setName("");
      setDate("");
      setImage("");
      setCategory("Music");
      setVibe("Chill");
      setPrice("");
      setInventory("");
      setIsFree(false);
      setHypeMode(false);
      setValidationErrors({});
      
      if (onEventCreated) onEventCreated();
      onClose();
    } catch (err) {
      console.error("Error creating event:", err);
      setError(err.message || "Failed to create the event. Please verify your inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-md transition-opacity duration-300">
      {/* Modal Container */}
      <div 
        className="w-full max-w-lg bg-[#FDFDFD] border border-neutral-100 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col relative max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200/80 text-neutral-500 hover:text-[#2A2A2A] flex items-center justify-center transition-colors shadow-sm z-10"
        >
          <X size={16} />
        </button>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-y-auto p-8">
          <div className="flex items-center gap-1.5 text-[#EA7963] mb-2">
            <Sparkles size={16} className="text-[#358597]" />
            <span className="font-display font-medium text-sm tracking-wide">Publish Event</span>
          </div>

          <h2 className="text-3xl font-bold font-display text-[#2A2A2A] tracking-tight mb-6">
            Create Event Listing
          </h2>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs flex gap-2.5 items-start leading-relaxed font-sans">
              <AlertCircle size={16} className="shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4 font-sans text-left flex-grow">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5 pl-1">Event Title</label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (validationErrors.name) {
                    setValidationErrors(prev => ({ ...prev, name: "" }));
                  }
                }}
                placeholder="e.g. Symphony Under the Stars"
                className={`w-full h-12 px-4 rounded-2xl border bg-neutral-50/50 focus:outline-none focus:ring-2 text-sm text-[#2A2A2A] placeholder-neutral-300 transition-all font-light ${
                  validationErrors.name 
                    ? "border-rose-300 focus:ring-rose-500/25 focus:border-rose-500" 
                    : "border-neutral-200/80 focus:ring-[#EA7963]/25 focus:border-[#EA7963]"
                }`}
              />
              {validationErrors.name && (
                <p className="text-rose-500 text-xs mt-1.5 pl-1 font-sans flex items-center gap-1.5">
                  <AlertCircle size={12} className="shrink-0 text-rose-500" />
                  {validationErrors.name}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 pl-1">Date & Time</label>
                <input
                  type="datetime-local"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    if (validationErrors.date) {
                      setValidationErrors(prev => ({ ...prev, date: "" }));
                    }
                  }}
                  className={`w-full h-12 px-4 rounded-2xl border bg-neutral-50/50 focus:outline-none focus:ring-2 text-sm text-[#2A2A2A] transition-all font-light ${
                    validationErrors.date 
                      ? "border-rose-300 focus:ring-rose-500/25 focus:border-rose-500" 
                      : "border-neutral-200/80 focus:ring-[#EA7963]/25 focus:border-[#EA7963]"
                  }`}
                />
                {validationErrors.date && (
                  <p className="text-rose-500 text-xs mt-1.5 pl-1 font-sans flex items-center gap-1.5">
                    <AlertCircle size={12} className="shrink-0 text-rose-500" />
                    {validationErrors.date}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 pl-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-12 px-4 rounded-2xl border border-neutral-200/80 bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-[#EA7963]/25 focus:border-[#EA7963] text-sm text-[#2A2A2A] transition-all font-light"
                >
                  <option value="Music">Music</option>
                  <option value="Art">Art</option>
                  <option value="Theater">Theater</option>
                  <option value="Tourism">Tourism</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 pl-1">Vibe</label>
                <select
                  value={vibe}
                  onChange={(e) => setVibe(e.target.value)}
                  className="w-full h-12 px-4 rounded-2xl border border-neutral-200/80 bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-[#EA7963]/25 focus:border-[#EA7963] text-sm text-[#2A2A2A] transition-all font-light"
                >
                  <option value="Chill">Chill</option>
                  <option value="Energetic">Energetic</option>
                  <option value="Family Friendly">Family Friendly</option>
                  <option value="Local Secret">Local Secret</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5 pl-1">Image URL</label>
              <input
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full h-12 px-4 rounded-2xl border border-neutral-200/80 bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-[#EA7963]/25 focus:border-[#EA7963] text-sm text-[#2A2A2A] placeholder-neutral-300 transition-all font-light"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 pl-1">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  disabled={isFree}
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    if (validationErrors.price) {
                      setValidationErrors(prev => ({ ...prev, price: "" }));
                    }
                  }}
                  placeholder={isFree ? "Free" : "29.99"}
                  className={`w-full h-12 px-4 rounded-2xl border bg-neutral-50/50 focus:outline-none focus:ring-2 text-sm text-[#2A2A2A] disabled:bg-neutral-100 disabled:text-neutral-400 placeholder-neutral-300 transition-all font-light ${
                    validationErrors.price 
                      ? "border-rose-300 focus:ring-rose-500/25 focus:border-rose-500" 
                      : "border-neutral-200/80 focus:ring-[#EA7963]/25 focus:border-[#EA7963]"
                  }`}
                />
                {validationErrors.price && (
                  <p className="text-rose-500 text-xs mt-1.5 pl-1 font-sans flex items-center gap-1.5">
                    <AlertCircle size={12} className="shrink-0 text-rose-500" />
                    {validationErrors.price}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 pl-1">Tickets Capacity</label>
                <input
                  type="number"
                  value={inventory}
                  onChange={(e) => {
                    setInventory(e.target.value);
                    if (validationErrors.inventory) {
                      setValidationErrors(prev => ({ ...prev, inventory: "" }));
                    }
                  }}
                  placeholder="150"
                  className={`w-full h-12 px-4 rounded-2xl border bg-neutral-50/50 focus:outline-none focus:ring-2 text-sm text-[#2A2A2A] placeholder-neutral-300 transition-all font-light ${
                    validationErrors.inventory 
                      ? "border-rose-300 focus:ring-rose-500/25 focus:border-rose-500" 
                      : "border-neutral-200/80 focus:ring-[#EA7963]/25 focus:border-[#EA7963]"
                  }`}
                />
                {validationErrors.inventory && (
                  <p className="text-rose-500 text-xs mt-1.5 pl-1 font-sans flex items-center gap-1.5">
                    <AlertCircle size={12} className="shrink-0 text-rose-500" />
                    {validationErrors.inventory}
                  </p>
                )}
              </div>
            </div>

            {/* Custom Toggles */}
            <div className="space-y-3 pt-3 border-t border-neutral-100">
              {/* Free Event Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50/80 border border-neutral-100/50">
                <div>
                  <span className="block text-sm font-semibold text-[#2A2A2A]">Free Entry Event</span>
                  <span className="block text-[10px] text-neutral-400 font-light mt-0.5">Bypasses credit card checkouts for visitors.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isFree}
                    onChange={(e) => handleFreeToggle(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#358597]"></div>
                </label>
              </div>

              {/* Hype Mode Waitlist Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50/80 border border-neutral-100/50">
                <div>
                  <span className="block text-sm font-semibold text-[#2A2A2A]">Waitlist / Hype Mode</span>
                  <span className="block text-[10px] text-neutral-400 font-light mt-0.5">Users register to waitlists instead of booking tickets.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={hypeMode}
                    onChange={(e) => setHypeMode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#EA7963]"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full h-12 rounded-full font-display font-medium tracking-wide text-white transition-all duration-300 shadow-md flex items-center justify-center gap-2 mt-8 ${
              loading 
                ? "bg-neutral-400 cursor-not-allowed" 
                : "bg-[#EA7963] hover:bg-[#D96853]"
            }`}
          >
            {loading ? (
              <div className="w-5 h-5 rounded-full border-2 border-white/35 border-t-white animate-spin"></div>
            ) : (
              <>
                <Plus size={16} />
                Publish Event Listing
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;
