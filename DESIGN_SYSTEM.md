# Kultura Design System & UI/UX Standards

This document establishes the official design system, geometry, typography, and styling guidelines for the Kultura platform. All components, layouts, and views generated for this application must strictly adhere to these principles.

---

## 1. Responsive & Mobile-First Design
* **Constraint:** Every single view must look flawless on standard mobile viewports first.
* **Layouts:** Use Tailwind’s responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`) to adapt layouts for larger devices.
* **Touch Targets:** Ensure all buttons, links, and interactive elements are touch-friendly.
  * Minimum touch-target height of `h-12` (48px) or use `py-3` vertical padding.

## 2. Typography
* **Headings:** Use **Space Grotesk** (`font-display`) for all primary and secondary headings (`h1`, `h2`, `h3`, `h4`) to create a striking, modern look.
* **Body Text:** Use **Inter** (`font-sans`) for all readable body copy, descriptions, details, forms, and secondary UI labels to ensure high legibility.

## 3. "Travel Magazine" Aesthetic
* **Imagery:** Use immersive, high-quality, edge-to-edge photography and artwork to make views feel premium and editorial. Avoid standard corporate illustrations.
* **Shadows:** Use large, soft, low-opacity drop shadows to create a feeling of layered depth.
  * Tailwind classes: `shadow-xl`, `shadow-2xl` combined with low-opacity overlay layers.

## 4. Glassmorphism & Translucency
* **Application:** Navbars, floating action menus, filters, overlays, and drawer components should appear to float above the content canvas.
* **Implementation:** Apply frosted-glass styling.
  * Tailwind classes: `bg-white/70 backdrop-blur-lg border border-white/20` (and dark-mode equivalents).

## 5. Soft Geometry
* **Corners:** Maintain a highly rounded, soft, and approachable aesthetic across the entire app.
* **Containers:** Use large corner radiuses on cards, dialogs, modals, and buttons.
  * Tailwind classes: `rounded-[2rem]`, `rounded-3xl`, `rounded-full` (for pills and circular action triggers).

## 6. Color Palette
* **Main Background:** Clean, premium off-white canvas: `bg-[#FDFDFD]` (hex: `#FDFDFD`).
* **Typography & Primary Ink:** Dark slate/charcoal for text to avoid harsh black styling: `text-[#2A2A2A]` (hex: `#2A2A2A`).
* **Secondary Elements:** Light neutral grays for borders, subtitles, and disabled states.
* **Accent Color:** A single, vibrant primary color (e.g., Cool Teal or Warm Coral) applied **sparingly** for:
  * Call-to-actions (CTAs)
  * Active navigation states
  * Notification indicators
  * Important alerts
