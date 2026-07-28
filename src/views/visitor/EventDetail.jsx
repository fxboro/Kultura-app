import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../hooks/useAuth";
import { 
  Calendar, MapPin, Sparkles, Flame, PartyPopper, ArrowLeft, 
  Building2, CheckCircle2, Ticket, Award, 
  Utensils, Wine, Coffee, Compass, Share2
} from "lucide-react";
import BookingModal from "../../components/events/BookingModal";

// Fallback seed events matching Discover feed
const DEFAULT_SEED_EVENTS = [
  {
    id: "seed-1",
    name: "Classic Jazz Quintet Live at A-Trane",
    date: new Date(Date.now() + 86400000 * 3).toISOString(),
    image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=800&auto=format&fit=crop",
    category: "Music",
    vibe: "Energetic",
    price: 35.00,
    inventory: 80,
    soldCount: 14,
    waitlistCount: 0,
    featured: true,
    isFree: false,
    hypeMode: false,
    organizerId: "espasiert-shay-jones-uid",
    organizerEmail: "c.essfinder@gmail.com",
    organizerName: "Shay Jones",
    organizationName: "Espasiert",
    venueName: "A-Trane Jazz Club",
    venueAddress: "Bleibtreustraße 1, 10623 Berlin, Germany",
    latitude: 52.5069,
    longitude: 13.3228,
    estimatedDuration: 120,
    meetupEnabled: true,
    meetupVenueName: "Café Einstein Stammhaus",
    meetupVenueAddress: "Kurfürstenstraße 58, 10785 Berlin, Germany",
    meetupNote: "Ask for the Espasiert table — first drink is on the house for ticket holders.",
    createdAt: new Date().toISOString()
  },
  {
    id: "seed-2",
    name: "Berlin Avant-Garde Gallery Opening",
    date: new Date(Date.now() + 86400000 * 2).toISOString(),
    image: "https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?q=80&w=800&auto=format&fit=crop",
    category: "Art",
    vibe: "Chill",
    price: 0,
    inventory: 60,
    soldCount: 22,
    waitlistCount: 0,
    featured: true,
    isFree: true,
    hypeMode: false,
    organizerId: "espasiert-shay-jones-uid",
    organizerEmail: "c.essfinder@gmail.com",
    organizerName: "Shay Jones",
    organizationName: "Espasiert",
    venueName: "Hamburger Bahnhof",
    venueAddress: "Invalidenstraße 50-51, 10557 Berlin, Germany",
    latitude: 52.5283,
    longitude: 13.3725,
    estimatedDuration: 90,
    meetupEnabled: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "seed-3",
    name: "Historical Street Art & Secret Courtyards Trail",
    date: new Date(Date.now() + 86400000 * 4).toISOString(),
    image: "https://images.unsplash.com/photo-1561055657-b9e0bf0fa360?q=80&w=800&auto=format&fit=crop",
    category: "City Trail",
    vibe: "Local Secret",
    price: 18.00,
    inventory: 40,
    soldCount: 19,
    waitlistCount: 0,
    featured: false,
    isFree: false,
    hypeMode: false,
    organizerId: "espasiert-shay-jones-uid",
    organizerEmail: "c.essfinder@gmail.com",
    organizerName: "Shay Jones",
    organizationName: "Espasiert",
    venueName: "East Side Gallery",
    venueAddress: "Mühlenstraße 3-100, 10243 Berlin, Germany",
    latitude: 52.5051,
    longitude: 13.4396,
    estimatedDuration: 150,
    meetupEnabled: true,
    meetupVenueName: "Holzmarkt Bar",
    meetupVenueAddress: "Holzmarktstraße 25, 10243 Berlin, Germany",
    meetupNote: "Meet at the rooftop terrace. Show your Espasiert pass for a secret menu.",
    createdAt: new Date().toISOString()
  },
  {
    id: "seed-4",
    name: "Symphony Under the Stars — Open Air Concert",
    date: new Date(Date.now() + 86400000 * 9).toISOString(),
    image: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=800&auto=format&fit=crop",
    category: "Music",
    vibe: "Chill",
    price: 45.00,
    inventory: 150,
    soldCount: 0,
    waitlistCount: 38,
    featured: false,
    isFree: false,
    hypeMode: true,
    organizerId: "espasiert-shay-jones-uid",
    organizerEmail: "c.essfinder@gmail.com",
    organizerName: "Shay Jones",
    organizationName: "Espasiert",
    venueName: "Olympiapark Munich",
    venueAddress: "Spiridon-Louis-Ring 21, 80809 Munich, Germany",
    latitude: 48.1737,
    longitude: 11.5471,
    estimatedDuration: 180,
    meetupEnabled: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "seed-5",
    name: "Shakespeare in the Park: Midsummer Night",
    date: new Date(Date.now() + 86400000 * 5).toISOString(),
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop",
    category: "Theater",
    vibe: "Family Friendly",
    price: 0,
    inventory: 120,
    soldCount: 45,
    waitlistCount: 0,
    featured: false,
    isFree: true,
    hypeMode: false,
    organizerId: "espasiert-shay-jones-uid",
    organizerEmail: "c.essfinder@gmail.com",
    organizerName: "Shay Jones",
    organizationName: "Espasiert",
    venueName: "Englischer Garten Amphitheater",
    venueAddress: "Englischer Garten 1, 80538 Munich, Germany",
    latitude: 48.1528,
    longitude: 11.5923,
    estimatedDuration: 120,
    meetupEnabled: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "seed-6",
    name: "London Underground Acoustic Sessions",
    date: new Date(Date.now() + 86400000 * 6).toISOString(),
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop",
    category: "Nightlife",
    vibe: "Local Secret",
    price: 24.00,
    inventory: 75,
    soldCount: 18,
    waitlistCount: 0,
    featured: true,
    isFree: false,
    hypeMode: false,
    organizerId: "espasiert-shay-jones-uid",
    organizerEmail: "c.essfinder@gmail.com",
    organizerName: "Shay Jones",
    organizationName: "Espasiert",
    venueName: "The Jazz Cafe",
    venueAddress: "5 Parkway, Camden Town, London NW1 7PG, UK",
    latitude: 51.5390,
    longitude: -0.1426,
    estimatedDuration: 150,
    meetupEnabled: true,
    meetupVenueName: "The Hawley Arms",
    meetupVenueAddress: "2 Castlehaven Rd, London NW1 8QU, UK",
    meetupNote: "Casual networking session for acoustic lovers and travelers.",
    createdAt: new Date().toISOString()
  },
  {
    id: "seed-7",
    name: "Borough Market Night Food & Wine Crawl",
    date: new Date(Date.now() + 86400000 * 7).toISOString(),
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800&auto=format&fit=crop",
    category: "Food",
    vibe: "Energetic",
    price: 32.00,
    inventory: 35,
    soldCount: 12,
    waitlistCount: 0,
    featured: false,
    isFree: false,
    hypeMode: false,
    organizerId: "espasiert-shay-jones-uid",
    organizerEmail: "c.essfinder@gmail.com",
    organizerName: "Shay Jones",
    organizationName: "Espasiert",
    venueName: "Borough Market",
    venueAddress: "8 Southwark St, London SE1 1TL, UK",
    latitude: 51.5055,
    longitude: -0.0910,
    estimatedDuration: 180,
    meetupEnabled: true,
    meetupVenueName: "Tap & Bottle London",
    meetupVenueAddress: "64 Hopton St, London SE1 9JH, UK",
    meetupNote: "Exclusive wine tasting pairing session included for Espasiert pass holders.",
    createdAt: new Date().toISOString()
  },
  {
    id: "seed-8",
    name: "Edinburgh Fringe Immersive Light & Sculpture Exhibition",
    date: new Date(Date.now() + 86400000 * 10).toISOString(),
    image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=800&auto=format&fit=crop",
    category: "Art",
    vibe: "Chill",
    price: 20.00,
    inventory: 100,
    soldCount: 0,
    waitlistCount: 29,
    featured: false,
    isFree: false,
    hypeMode: true,
    organizerId: "espasiert-shay-jones-uid",
    organizerEmail: "c.essfinder@gmail.com",
    organizerName: "Shay Jones",
    organizationName: "Espasiert",
    venueName: "Royal Mile Art Hub",
    venueAddress: "150 Royal Mile, Edinburgh EH1 1QS, UK",
    latitude: 55.9505,
    longitude: -3.1856,
    estimatedDuration: 90,
    meetupEnabled: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "seed-9",
    name: "Manchester Vinyl & Deep House Showcase",
    date: new Date(Date.now() + 86400000 * 6).toISOString(),
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800&auto=format&fit=crop",
    category: "Nightlife",
    vibe: "Energetic",
    price: 22.00,
    inventory: 90,
    soldCount: 31,
    waitlistCount: 0,
    featured: false,
    isFree: false,
    hypeMode: false,
    organizerId: "espasiert-shay-jones-uid",
    organizerEmail: "c.essfinder@gmail.com",
    organizerName: "Shay Jones",
    organizationName: "Espasiert",
    venueName: "Albert Hall Manchester",
    venueAddress: "27 Peter St, Manchester M2 5QR, UK",
    latitude: 53.4780,
    longitude: -2.2472,
    estimatedDuration: 240,
    meetupEnabled: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "seed-10",
    name: "Speicherstadt & Elbphilharmonie Architectural Walk",
    date: new Date(Date.now() + 86400000 * 4).toISOString(),
    image: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=800&auto=format&fit=crop",
    category: "City Trail",
    vibe: "Family Friendly",
    price: 0,
    inventory: 80,
    soldCount: 37,
    waitlistCount: 0,
    featured: false,
    isFree: true,
    hypeMode: false,
    organizerId: "espasiert-shay-jones-uid",
    organizerEmail: "c.essfinder@gmail.com",
    organizerName: "Shay Jones",
    organizationName: "Espasiert",
    venueName: "Speicherstadt Hamburg",
    venueAddress: "Am Sandtorkai 36, 20457 Hamburg, Germany",
    latitude: 53.5434,
    longitude: 9.9926,
    estimatedDuration: 120,
    meetupEnabled: false,
    createdAt: new Date().toISOString()
  }
];

const getContextualDescription = (event) => {
  if (event.description) return event.description;

  const categoryDescriptions = {
    Music: "Step into an immersive auditory experience celebrating sound, rhythm, and stage mastery. Curated by industry veterans to bring together passionate live music enthusiasts and local artists in an unforgettable atmosphere.",
    Art: "Explore groundbreaking visual storytelling, curated gallery installations, and expressive craftsmanship. Designed for art lovers, collectors, and curious minds looking to experience culture at its finest.",
    "City Trail": "Embark on an interactive cultural exploration through historic pathways, secret courtyards, and local hotspots. Collect passport stamps at verified check-ins and unlock exclusive partner perks along the trail.",
    Theater: "Experience captivating dramatic performances, live classic readings, and theatrical arts. Bring your friends and family for an evening of powerful storytelling and stagecraft.",
    Food: "Savor a curated culinary journey featuring artisanal tastings, premium beverage pairings, and local gastro secrets. Perfect for foodies and culinary enthusiasts looking for memorable flavors.",
    Nightlife: "Dive into the vibrant rhythm of the city after dark. Featuring curated vinyl sessions, deep house sets, and intimate lounge vibes designed for high-energy social gatherings."
  };

  return categoryDescriptions[event.category] || "Join us for a unique cultural gathering curated to inspire, connect, and entertain. Enjoy high-quality programming, local venue hospitality, and exclusive visitor benefits.";
};

const getPartnerPerks = (event) => {
  const perks = [];

  if (event.meetupEnabled && event.meetupVenueName) {
    perks.push({
      id: "meetup-partner",
      type: "Bar & Lounge",
      name: event.meetupVenueName,
      address: event.meetupVenueAddress || "Near event venue",
      offer: "Exclusive After-Party Access",
      detail: event.meetupNote || "Show your Kultura digital ticket at the entrance for complimentary welcome drinks and reserved seating."
    });
  }

  if (event.category === "Music" || event.category === "Nightlife") {
    perks.push({
      id: "partner-lounge",
      type: "Speakeasy Bar",
      name: "The Velvet Taproom",
      address: "12 Cultural Way",
      offer: "20% Off Post-Show Drinks",
      detail: "Flash your verified gate check-in badge on the Kultura Wallet to redeem 20% off craft cocktails."
    });
  }

  perks.push({
    id: "partner-cafe",
    type: "Café & Bakery",
    name: "Artisan Brew Co.",
    address: "Central Square",
    offer: "Free Artisan Coffee",
    detail: "Earn 50 Kultura Passport points upon event check-in and redeem a complimentary specialty brew."
  });

  perks.push({
    id: "partner-wellness",
    type: "Spa & Wellness",
    name: "Kultura Wellness Lounge",
    address: "Plaza Suite 4B",
    offer: "15% Wellness Pass Discount",
    detail: "Event attendees receive priority booking and a 15% discount on morning recovery treatments."
  });

  return perks;
};

const EventDetail = ({ onOpenAuth }) => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [event, setEvent] = useState(location.state?.event || null);
  const [loading, setLoading] = useState(!location.state?.event);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (location.state?.event) {
      setEvent(location.state.event);
      setLoading(false);
      return;
    }

    const fetchEvent = async () => {
      try {
        const seedMatch = DEFAULT_SEED_EVENTS.find(e => e.id === eventId);
        if (seedMatch) {
          setEvent(seedMatch);
          setLoading(false);
          return;
        }

        const docRef = doc(db, "events", eventId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setEvent({ id: docSnap.id, ...docSnap.data() });
        } else {
          setEvent(DEFAULT_SEED_EVENTS[0]);
        }
      } catch (err) {
        console.error("Error fetching event detail:", err);
        setEvent(DEFAULT_SEED_EVENTS[0]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, location.state]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#358597]"></div>
        <p className="mt-4 text-xs text-neutral-400 font-light font-sans">Loading event details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold font-display text-[#2A2A2A]">Event Not Found</h2>
        <p className="text-neutral-500 text-xs mt-2 mb-6">The event you are looking for does not exist or has been removed.</p>
        <button 
          onClick={() => navigate("/")} 
          className="px-6 py-3 rounded-full bg-[#358597] text-white text-xs font-semibold uppercase tracking-wider font-display shadow-md"
        >
          Return to Discover
        </button>
      </div>
    );
  }

  const {
    name, date, image, category, vibe, price, inventory, soldCount, 
    isFree, hypeMode, venueName, venueAddress, organizerName, organizationName,
    estimatedDuration, meetupEnabled
  } = event;

  const capacity = inventory || 100;
  const sold = soldCount || 0;
  const percentSold = Math.min(100, Math.round((sold / capacity) * 100));
  const isSoldOut = sold >= capacity;

  const eventDate = new Date(date);
  const formattedDate = eventDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
  const formattedTime = eventDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  });

  const partnerPerks = getPartnerPerks(event);
  const contextualDescription = getContextualDescription(event);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getCTAButtonStyles = () => {
    if (isSoldOut && !hypeMode) {
      return "bg-neutral-300 text-neutral-500 cursor-not-allowed";
    }
    if (hypeMode) {
      return "bg-[#EA7963] hover:bg-[#D96853] text-white shadow-lg shadow-coral-500/25";
    }
    if (isFree) {
      return "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25";
    }
    return "bg-[#358597] hover:bg-[#2C6E7D] text-white shadow-lg shadow-teal-500/25";
  };

  const getCTAButtonText = () => {
    if (isSoldOut && !hypeMode) return "Sold Out";
    if (hypeMode) return "Join Waitlist";
    if (isFree) return "Get Free Pass";
    return "Book Ticket Now";
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#2A2A2A] font-sans pb-32">
      {/* Navigation Top Bar */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 pb-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="h-10 px-4 rounded-full bg-neutral-100 hover:bg-neutral-200/80 text-neutral-600 font-display text-xs font-semibold flex items-center gap-2 transition-all"
        >
          <ArrowLeft size={16} />
          Back to Events
        </button>

        <button
          onClick={handleShare}
          className="h-10 px-4 rounded-full border border-neutral-200 hover:bg-neutral-50 text-neutral-600 font-display text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
        >
          <Share2 size={15} className="text-[#358597]" />
          {copied ? "Link Copied!" : "Share Event"}
        </button>
      </div>

      {/* Main Content Container */}
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        
        {/* Editorial Hero Banner */}
        <div className="relative rounded-[2.5rem] overflow-hidden h-[360px] sm:h-[420px] md:h-[480px] shadow-2xl mb-8 group">
          <img 
            src={image} 
            alt={name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Floating Badges */}
          <div className="absolute top-6 left-6 flex flex-wrap gap-2.5 z-10">
            <span className="bg-white/90 backdrop-blur-md text-[#2A2A2A] text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full shadow-md">
              {category}
            </span>
            {vibe && (
              <span className="bg-[#358597]/90 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full shadow-md flex items-center gap-1.5">
                <Sparkles size={13} />
                {vibe} Vibe
              </span>
            )}
          </div>

          <div className="absolute top-6 right-6 flex gap-2 z-10">
            {hypeMode && (
              <div className="bg-amber-500 text-white text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full shadow-lg flex items-center gap-1.5 border border-amber-400">
                <Flame size={14} className="animate-pulse" />
                Hype Mode
              </div>
            )}
            {meetupEnabled && !hypeMode && (
              <div className="bg-purple-600/90 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full shadow-lg flex items-center gap-1.5 border border-purple-400/50">
                <PartyPopper size={14} />
                After-Party Perks Included
              </div>
            )}
          </div>

          {/* Bottom Title & Date Overlay */}
          <div className="absolute bottom-6 left-6 right-6 text-left text-white z-10">
            <div className="flex items-center gap-2 text-white/80 text-xs font-medium uppercase tracking-wider mb-2">
              <Calendar size={14} className="text-[#EA7963]" />
              <span>{formattedDate} • {formattedTime}</span>
              {estimatedDuration && (
                <span>({estimatedDuration} mins)</span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display text-white tracking-tight leading-tight max-w-3xl">
              {name}
            </h1>
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Info Column (2/3) */}
          <div className="lg:col-span-2 space-y-8 text-left">
            
            {/* Organizer & Venue Card */}
            <div className="bg-white border border-neutral-100 rounded-[2rem] p-6 sm:p-8 shadow-xl shadow-neutral-100/50 grid sm:grid-cols-2 gap-6">
              {/* Organizer Info */}
              <div className="flex items-start gap-4 border-b sm:border-b-0 sm:border-r border-neutral-100 pb-4 sm:pb-0 sm:pr-6">
                <div className="w-12 h-12 rounded-2xl bg-[#EA7963]/10 text-[#EA7963] border border-[#EA7963]/20 flex items-center justify-center shrink-0">
                  <Building2 size={22} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block mb-0.5">Presented By</span>
                  <h4 className="font-display font-bold text-lg text-[#2A2A2A] leading-tight">
                    {organizationName || "Espasiert Cultural Collective"}
                  </h4>
                  <p className="text-xs text-neutral-400 font-light mt-0.5">
                    Curator: <span className="font-medium text-neutral-600">{organizerName || "Shay Jones"}</span>
                  </p>
                </div>
              </div>

              {/* Venue Info */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#358597]/10 text-[#358597] border border-[#358597]/20 flex items-center justify-center shrink-0">
                  <MapPin size={22} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block mb-0.5">Event Venue</span>
                  <h4 className="font-display font-bold text-lg text-[#2A2A2A] leading-tight">
                    {venueName || "Central Cultural Hall"}
                  </h4>
                  <p className="text-xs text-neutral-400 font-light mt-0.5 leading-relaxed">
                    {venueAddress || "Berlin, Germany"}
                  </p>
                </div>
              </div>
            </div>

            {/* Event Description */}
            <div className="bg-white border border-neutral-100 rounded-[2rem] p-6 sm:p-8 shadow-xl shadow-neutral-100/50">
              <div className="flex items-center gap-2 text-[#358597] mb-3">
                <Compass size={18} />
                <h3 className="font-display font-bold text-xl text-[#2A2A2A]">About This Event</h3>
              </div>
              <p className="text-neutral-600 text-sm font-light leading-relaxed whitespace-pre-line">
                {contextualDescription}
              </p>
            </div>

            {/* Partner Perks & Visitor Discounts */}
            <div className="bg-white border border-neutral-100 rounded-[2rem] p-6 sm:p-8 shadow-xl shadow-neutral-100/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-[#EA7963]">
                  <Award size={20} />
                  <h3 className="font-display font-bold text-xl text-[#2A2A2A]">Partner Perks & Discounts</h3>
                </div>
                <span className="text-[10px] px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100 font-bold uppercase tracking-wider">
                  Post-Event Rewards
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-light mb-6">
                Attending this event unlocks instant discounts and free perks at partnered local establishments across the city.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {partnerPerks.map((perk) => (
                  <div 
                    key={perk.id}
                    className="p-5 rounded-2xl border border-neutral-100 hover:border-neutral-200/80 bg-[#FDFDFD] shadow-sm flex flex-col justify-between transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 bg-neutral-100 px-2.5 py-0.5 rounded-full">
                          {perk.type}
                        </span>
                        <CheckCircle2 size={15} className="text-emerald-500" />
                      </div>
                      <h4 className="font-display font-bold text-base text-[#2A2A2A] mb-1">
                        {perk.name}
                      </h4>
                      <span className="inline-block text-xs font-bold text-[#EA7963] bg-[#EA7963]/10 px-2.5 py-1 rounded-lg mb-2">
                        {perk.offer}
                      </span>
                      <p className="text-xs text-neutral-500 font-light leading-relaxed">
                        {perk.detail}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-neutral-100 text-[11px] text-neutral-400 flex items-center gap-1 font-mono">
                      <MapPin size={11} className="text-neutral-400 shrink-0" />
                      <span className="truncate">{perk.address}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cultural Passport Badge */}
            <div className="bg-gradient-to-r from-[#358597]/10 via-[#358597]/5 to-[#EA7963]/10 border border-[#358597]/20 rounded-[2rem] p-6 sm:p-8 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-[#358597]">City Trail Stamp</span>
                <h4 className="font-display font-bold text-lg text-[#2A2A2A] mt-1">Earn Kultura Passport Stamps</h4>
                <p className="text-xs text-neutral-500 font-light mt-1 max-w-lg">
                  Present your ticket QR code at gate check-in to automatically stamp your cultural passport and progress toward unlocking free city rewards.
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white text-[#358597] shadow-md flex items-center justify-center shrink-0 border border-neutral-200/50">
                <Ticket size={28} />
              </div>
            </div>

          </div>

          {/* Sidebar Conversion Card (1/3) */}
          <div className="lg:col-span-1 lg:sticky lg:top-24 space-y-6 text-left">
            
            <div className="bg-white border border-neutral-100 rounded-[2rem] p-6 sm:p-8 shadow-2xl shadow-neutral-100/80">
              
              <div className="flex justify-between items-baseline mb-4 border-b border-neutral-100 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block">Admission Rate</span>
                  <div className="text-3xl font-bold font-display text-[#2A2A2A] mt-1">
                    {isFree ? (
                      <span className="text-emerald-600">Free Pass</span>
                    ) : (
                      `$${price.toFixed(2)}`
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block">Status</span>
                  <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-block mt-1 ${
                    isSoldOut ? "bg-rose-50 text-rose-600 border border-rose-100" :
                    hypeMode ? "bg-amber-50 text-amber-600 border border-amber-100" :
                    isFree ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                    "bg-teal-50 text-[#358597] border border-teal-100"
                  }`}>
                    {isSoldOut ? "Sold Out" : hypeMode ? "Pre-Booking" : "Available"}
                  </span>
                </div>
              </div>

              {/* Progress & Capacity Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-xs text-neutral-500 mb-1.5 font-sans">
                  <span>{hypeMode ? "Waitlisted" : `${sold} / ${capacity} Passports Issued`}</span>
                  <span className="font-semibold">{percentSold}%</span>
                </div>
                <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      hypeMode ? "bg-amber-500" : isFree ? "bg-emerald-500" : "bg-[#358597]"
                    }`} 
                    style={{ width: `${percentSold}%` }}
                  />
                </div>
              </div>

              {/* Instant Conversion Perks List */}
              <div className="space-y-3 mb-8 text-xs text-neutral-600 font-sans">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>Instant 6-digit gate passcode & digital QR wallet</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>After-party partner perks included</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>Verified 100% money-back guarantee if canceled</span>
                </div>
              </div>

              {/* Main CTA Button */}
              <button
                onClick={() => setBookingOpen(true)}
                disabled={isSoldOut && !hypeMode}
                className={`w-full h-14 rounded-full font-display text-sm font-semibold tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 ${getCTAButtonStyles()}`}
              >
                <Ticket size={18} />
                {getCTAButtonText()}
              </button>

            </div>
          </div>
        </div>
      </div>

      {/* Booking Checkout Modal */}
      <BookingModal
        isOpen={bookingOpen}
        onClose={() => setBookingOpen(false)}
        event={event}
        onOpenAuth={onOpenAuth}
        onSuccess={() => {
          setTimeout(() => {
            setBookingOpen(false);
            navigate("/wallet");
          }, 2000);
        }}
      />
    </div>
  );
};

export default EventDetail;
