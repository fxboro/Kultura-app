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
  const [price, setPrice] = useState("");
  const [inventory, setInventory] = useState("");
  
  // Toggles
  const [isFree, setIsFree] = useState(false);
  const [hypeMode, setHypeMode] = useState(false);
  
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFreeToggle = (checked) => {
    setIsFree(checked);
    if (checked) {
      setPrice("0");
    } else {
      setPrice("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!user) {
      setError("You must be logged in to create an event.");
      setLoading(false);
      return;
    }

    try {
      const parsedPrice = isFree ? 0 : parseFloat(price);
      const parsedInventory = parseInt(inventory, 10);

      if (isNaN(parsedPrice) || parsedPrice < 0) {
        throw new Error("Please enter a valid price.");
      }
      if (isNaN(parsedInventory) || parsedInventory <= 0) {
        throw new Error("Please enter a valid event capacity/inventory.");
      }

      const eventData = {
        name,
        date,
        image: image || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=600&auto=format&fit=crop",
        category,
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
      setPrice("");
      setInventory("");
      setIsFree(false);
      setHypeMode(false);
      
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
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Symphony Under the Stars"
                className="w-full h-12 px-4 rounded-2xl border border-neutral-200/80 bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-[#EA7963]/25 focus:border-[#EA7963] text-sm text-[#2A2A2A] placeholder-neutral-300 transition-all font-light"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 pl-1">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-12 px-4 rounded-2xl border border-neutral-200/80 bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-[#EA7963]/25 focus:border-[#EA7963] text-sm text-[#2A2A2A] transition-all font-light"
                />
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
                  required
                  disabled={isFree}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder={isFree ? "Free" : "29.99"}
                  className="w-full h-12 px-4 rounded-2xl border border-neutral-200/80 bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-[#EA7963]/25 focus:border-[#EA7963] text-sm text-[#2A2A2A] disabled:bg-neutral-100 disabled:text-neutral-400 placeholder-neutral-300 transition-all font-light"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 pl-1">Tickets Capacity</label>
                <input
                  type="number"
                  required
                  value={inventory}
                  onChange={(e) => setInventory(e.target.value)}
                  placeholder="150"
                  className="w-full h-12 px-4 rounded-2xl border border-neutral-200/80 bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-[#EA7963]/25 focus:border-[#EA7963] text-sm text-[#2A2A2A] placeholder-neutral-300 transition-all font-light"
                />
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
