# Kultura — Tourism & Cultural Discovery Engine 🎭✨

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.3-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-12.15-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Kultura** is a premium, real-time web application designed to bridge the gap between cultural event organizers, local venues, and attendees/tourists. Built with a "travel magazine" aesthetic, Kultura delivers a seamless end-to-end experience—from discovering local art, theater, and curated city trails to secure ticketing, digital wallet passports, and front-gate check-ins.

---

## 🌟 Key Product Features & Value Proposition

### 1. 🎭 3-Tier Dual/Multi-Role Architecture
- **Visitors & Tourists:** Clean, distraction-free discovery feed, interactive Vibe Map, digital ticket wallet, and trail passport stamps.
- **Event Organizers:** Secure management hub with real-time financial analytics (Total Revenue, Attendees, Conversion), event creation tools, pre-booking waitlists, and built-in ticket QR scanners.
- **Platform Admins:** Global dashboard to approve/reject organizers, manage platform fee commissions, monitor real-time metrics, and curate featured spotlight gatherings.

### 2. ⚡ Real-Time Booking & Inventory Engine
- **Live Inventory Syncing:** Firebase Firestore backend ensures real-time ticket quantity updates, preventing overselling across concurrent buyers.
- **Paid & Free Passes:** Full support for paid events via Stripe-inspired checkout and instant $0.00 "Free Entry Passes" for community meetups and public gallery openings.

### 3. 🎟️ Digital Ticket Wallet ("My Collection")
- **Personalized Passports:** Purchased tickets feature unique 6-digit verification IDs, scannable QR codes, and live check-in badges.
- **Gamified Attendance:** Frames attendance as building a personal "Gallery" of cultural memories, significantly boosting retention and engagement.

### 4. 📲 Organizer Management Hub & Gate Scanner
- **QR Gate Validation:** Integrated web scanner cross-references global databases instantly, facilitating rapid gate throughput and eliminating double-entry fraud.
- **Revenue & Attendee Insights:** Organizers track sales trends, ticket tiers, check-in percentages, and payout statuses in real-time.

---

## 🗺️ V2 Tourism & Local Discovery Engine

### 🏆 1. "Cultural Passports" & City Trails
- **Gamified Discovery:** Local tourism boards and admins group events into themed "Trails" (e.g., *The Historic Art Trail* or *Weekend Jazz Passport*).
- **Verified Stamps:** Attending events on a trail stamps the user's digital passport, unlocking exclusive rewards at partnered local cafes and venues.

### 📍 2. Interactive "Vibe Map"
- **Mood & Vibe Geolocation:** Dark-mode interactive map allowing travelers to discover events near their current location filtered by vibe: *Chill Evening*, *Energetic Crowd*, *Family Friendly*, or *Local Secret*.

### ⏳ 3. Pre-Booking Waitlists ("Hype Mode")
- **Demand Validation:** Organizers launch events in "Hype Mode" to collect pre-booking waitlists prior to securing venues. Pre-booked users receive 24-hour early access notifications when tickets go live.

### 🍸 4. "After-Event" Social Meetups
- **Connecting Travelers & Locals:** Post-event secret meetup reveals at local partner bars and restaurants, providing solo travelers and culture enthusiasts a casual space to mingle.

### 🗓️ 5. Smart "Day-Tripper" Itinerary Builder
- **Gap Filling:** Automatically detects time gaps between booked morning exhibitions and evening shows, suggesting local walking tours, cafes, and spots nearby.

---

## 🎨 Design System & Aesthetics

Adhering strictly to the [Kultura Design System](file:///c:/Users/dayoo/OneDrive/Dokumente/development/Kultura_app/DESIGN_SYSTEM.md):

* **Typography:** 
  * **Headings (`font-display`):** **Space Grotesk** for primary and secondary headings (`h1`–`h4`), delivering a bold modern look.
  * **Body Text (`font-sans`):** **Inter** for readable body copy, descriptions, inputs, and UI labels.
* **Palette:**
  * **Canvas:** `#FDFDFD` (Clean off-white)
  * **Primary Ink:** `#2A2A2A` (Charcoal slate)
  * **Accent Color:** `#358597` (Cool Teal) & `#EA7963` (Warm Coral)
* **Glassmorphism:** Frosted glass cards (`bg-white/12 backdrop-blur-2xl border border-white/20`) and large, soft drop shadow layers (`shadow-2xl`).

---

## 🛠️ Tech Stack & Architecture

- **Frontend Core:** React 19, React Router DOM v7, Vite 8
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`), Lucide React Icons
- **Backend & Database:** Firebase (Firestore, Firebase Auth)
- **Payments:** Stripe integration (`@stripe/stripe-js`, `@stripe/react-stripe-js`)
- **Fonts:** Google Fonts (Space Grotesk & Inter)

---

## 📁 Repository Structure

```
Kultura_app/
├── public/                # Static public assets
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── discovery/     # Vibe Map & Trail components
│   │   ├── events/        # Event cards, booking modals, checkout
│   │   ├── layout/        # Navbar, footer, navigation bars
│   │   └── organizer/     # Gate scanner, event creation forms
│   ├── hooks/             # Custom React hooks (useAuth, etc.)
│   ├── lib/               # Firebase initialization & utilities
│   ├── views/             # Page views by user role
│   │   ├── admin/         # Admin platform dashboard
│   │   ├── organizer/     # Organizer management hub & scanner
│   │   └── visitor/       # Discover feed, Ticket wallet, Trails
│   ├── App.jsx            # Application router & layout shell
│   ├── index.css          # Design system tokens & Tailwind imports
│   └── main.jsx           # App entrypoint
├── blueprint.md           # Product blueprint & feature spec
├── DESIGN_SYSTEM.md       # Design system & typography guidelines
└── package.json           # Build dependencies & scripts
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18.0 or higher
- **npm** or **yarn**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/fxboro/Kultura-app.git
   cd Kultura-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory and add your Firebase and Stripe credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
   ```

4. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

5. **Build for production:**
   ```bash
   npm run build
   ```

---

## 📜 Available NPM Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `dev` | `vite` | Starts local development server on port `5173` |
| `build` | `vite build` | Compiles production bundle to `dist/` |
| `preview` | `vite preview` | Previews production build locally |
| `lint` | `eslint .` | Runs ESLint static analysis |

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
