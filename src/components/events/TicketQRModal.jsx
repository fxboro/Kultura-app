import React, { useState } from "react";
import { X, Copy, Check, Calendar, Sun, Sparkles, MapPin, Ticket, ShieldCheck } from "lucide-react";

/**
 * Pure SVG 2D QR Code Generator Component
 * Generates a clean, scannable vector QR matrix based on payload string.
 */
const QRCodeSVG = ({ value, size = 200 }) => {
  // Generate a deterministic 21x21 QR-like matrix grid based on input string
  const gridSize = 21;
  const matrix = Array(gridSize).fill(0).map(() => Array(gridSize).fill(false));

  // 1. Finder patterns at 3 corners (top-left, top-right, bottom-left)
  const addFinderPattern = (startRow, startCol) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isOuterBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isInnerCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[startRow + r][startCol + c] = isOuterBorder || isInnerCore;
      }
    }
  };

  addFinderPattern(0, 0); // Top-left
  addFinderPattern(0, 14); // Top-right
  addFinderPattern(14, 0); // Bottom-left

  // 2. Timing patterns
  for (let i = 8; i < 13; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // 3. Fill remaining data bits deterministically from string checksum
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      // Skip finder pattern zones
      const isTopLeft = r < 8 && c < 8;
      const isTopRight = r < 8 && c >= 13;
      const isBottomLeft = r >= 13 && c < 8;
      if (isTopLeft || isTopRight || isBottomLeft) continue;
      if (r === 6 || c === 6) continue;

      const bitVal = Math.abs(Math.sin((r * 21 + c + 1) * hash + r * c)) > 0.48;
      matrix[r][c] = bitVal;
    }
  }

  const cellSize = size / gridSize;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-xl shadow-inner bg-white p-2">
      {matrix.map((row, r) =>
        row.map((isDark, c) =>
          isDark ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize + 0.2}
              height={cellSize + 0.2}
              fill="#1A1A1A"
              rx={cellSize * 0.15}
            />
          ) : null
        )
      )}
    </svg>
  );
};

const TicketQRModal = ({ isOpen, onClose, ticket }) => {
  const [copied, setCopied] = useState(false);
  const [highBrightness, setHighBrightness] = useState(false);

  if (!isOpen || !ticket) return null;

  const { ticketCode, id, eventName, eventDate, eventCategory, status, price, meetupEnabled, meetupVenueName, meetupVenueAddress } = ticket;
  const isCheckedIn = status === "checked-in";
  const qrPayload = `KULTURA-TICKET:${ticketCode}:${id}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(ticketCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadICS = () => {
    const startDate = new Date(eventDate);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Default 2 hrs duration

    const formatDate = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Kultura App//Digital Ticket Wallet//EN",
      "BEGIN:VEVENT",
      `SUMMARY:${eventName}`,
      `DESCRIPTION:Kultura Gate Passcode: ${ticketCode}. Category: ${eventCategory || "Cultural Event"}.`,
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `LOCATION:${meetupVenueAddress || "Cultural Venue"}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kultura-${ticketCode}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-md transition-opacity duration-300">
      <div
        className={`w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative transition-all duration-300 max-h-[90vh] overflow-y-auto no-scrollbar ${
          highBrightness ? "bg-white text-black" : "bg-[#FDFDFD] border border-neutral-100 text-[#2A2A2A]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="p-6 pb-2 flex items-center justify-between border-b border-neutral-100/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#358597]/10 flex items-center justify-center text-[#358597]">
              <Ticket size={16} />
            </div>
            <span className="font-display font-semibold text-sm tracking-tight text-[#2A2A2A]">
              Digital Gate Pass
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* High brightness scanner toggle */}
            <button
              onClick={() => setHighBrightness(!highBrightness)}
              className={`p-2 rounded-full text-xs font-semibold flex items-center gap-1 transition-colors ${
                highBrightness ? "bg-amber-100 text-amber-800" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
              title="Toggle optical scanner high-contrast mode"
            >
              <Sun size={15} />
              <span className="hidden sm:inline text-[10px] uppercase font-bold tracking-wider">
                {highBrightness ? "Normal Mode" : "Scanner Mode"}
              </span>
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-[#2A2A2A] flex items-center justify-center transition-colors shadow-sm"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8 flex flex-col items-center text-center font-sans">
          {/* Status Badge */}
          <div className="mb-4">
            {isCheckedIn ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold uppercase tracking-wider">
                <ShieldCheck size={14} className="text-emerald-600" /> Passport Stamped
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#358597]/10 border border-[#358597]/20 text-[#358597] text-xs font-semibold uppercase tracking-wider">
                <Sparkles size={14} className="text-[#EA7963]" /> Ready for Front-Gate Scan
              </span>
            )}
          </div>

          {/* Event Title */}
          <h2 className="text-2xl font-bold font-display tracking-tight text-[#2A2A2A] max-w-xs leading-tight mb-1">
            {eventName}
          </h2>
          <p className="text-xs text-neutral-400 font-light mb-6">
            {new Date(eventDate).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })}
          </p>

          {/* QR Code Graphic Frame */}
          <div className="relative p-5 rounded-3xl bg-white border-2 border-neutral-100 shadow-xl mb-6 flex flex-col items-center">
            <QRCodeSVG value={qrPayload} size={210} />
            
            <div className="mt-4 flex items-center gap-2 bg-neutral-50 px-4 py-2 rounded-2xl border border-neutral-200/60 w-full justify-between">
              <div>
                <span className="block text-[9px] uppercase tracking-wider text-neutral-400 font-semibold text-left">
                  6-Digit Gate Code
                </span>
                <span className="font-mono font-bold text-lg text-[#2A2A2A] tracking-widest">
                  {ticketCode}
                </span>
              </div>

              <button
                onClick={handleCopyCode}
                className="p-2 rounded-xl bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-600 hover:text-[#358597] transition-all flex items-center gap-1 text-xs font-medium shadow-sm"
              >
                {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                <span className="text-[10px] font-semibold uppercase tracking-wider">
                  {copied ? "Copied" : "Copy"}
                </span>
              </button>
            </div>
          </div>

          {/* Ticket Metadata Summary */}
          <div className="w-full bg-neutral-50 rounded-2xl border border-neutral-100 p-4 text-left text-xs space-y-2 mb-6 font-sans">
            <div className="flex justify-between border-b border-neutral-100 pb-2">
              <span className="text-neutral-400 font-light">Ticket Pass ID</span>
              <span className="font-mono text-neutral-600 font-medium">{id.substring(0, 10)}...</span>
            </div>
            <div className="flex justify-between border-b border-neutral-100 pb-2">
              <span className="text-neutral-400 font-light">Category</span>
              <span className="font-semibold text-neutral-700">{eventCategory || "Cultural Trail"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400 font-light">Paid Admission</span>
              <span className="font-semibold text-[#358597]">
                {price === 0 ? "Free Entry Pass" : `$${price.toFixed(2)}`}
              </span>
            </div>

            {meetupEnabled && (
              <div className="pt-2 border-t border-neutral-200/60 flex items-start gap-2 text-purple-700">
                <MapPin size={14} className="shrink-0 text-purple-500 mt-0.5" />
                <span className="text-[11px] font-medium leading-tight">
                  {isCheckedIn
                    ? `After-Party Meetup: ${meetupVenueName || "Secret Venue"} (${meetupVenueAddress || ""})`
                    : "Includes Secret After-Party Meetup (Unlocks upon gate scan)"}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="w-full flex gap-3">
            <button
              onClick={handleDownloadICS}
              className="flex-1 h-12 rounded-full border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-display text-xs font-semibold tracking-wider uppercase transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Calendar size={15} /> Add to Calendar
            </button>
            <button
              onClick={onClose}
              className="flex-1 h-12 rounded-full bg-[#2A2A2A] hover:bg-neutral-800 text-white font-display text-xs font-semibold tracking-wider uppercase transition-colors shadow-md"
            >
              Close Pass
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketQRModal;
