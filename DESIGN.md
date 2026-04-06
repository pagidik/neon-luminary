# Design System Specification: High-End AI Editorial

## 1. Overview & Creative North Star: "The Neon Luminary"
This design system is built to move the AI news and tools space away from generic SaaS "dashboards" and toward a high-end, editorial experience. Our Creative North Star is **The Neon Luminary**: an aesthetic that blends the precision of deep-space tech with the tactility of physical layers.

We reject the "flat" web. Instead, we embrace **Dimensional Depth**. By combining Neo-brutalism’s bold confidence with Glassmorphism’s ethereal lightness, we create a UI that feels alive. This is achieved through intentional asymmetry—such as oversized headlines paired with compact metadata—and a "No-Line" philosophy that uses light and shadow to define boundaries rather than rigid strokes.

---

## 2. Colors & Atmospheric Depth

The palette is rooted in the `background` (#0e0e0f), a void that allows our vibrant neon accents to vibrate.

### Core Palette
- **background:** `#0e0e0f`
- **surface:** `#0e0e0f`
- **surface-container-low:** `#131314`
- **surface-container:** `#19191b`
- **surface-container-high:** `#1f1f22`
- **surface-container-highest:** `#262627`
- **surface-variant:** `#202125`
- **surface-bright:** `#2c2d31`
- **on-surface:** `#f3f4f6`
- **on-surface-variant:** `#adaaab`
- **outline-variant:** `#484849`
- **primary:** `#2D5BFF`
- **primary-dim:** `#3e65ff`
- **secondary:** `#A855F7`
- **tertiary:** `#00FF9F`
- **error:** `#ff5c7a`
- **warning:** `#ffb84d`
- **info:** `#66b3ff`

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section content. Boundaries are defined by shifting between `surface` tiers.
- **Example:** A news feed item should not have a border; it should be a `surface-container-low` card resting on the `surface` background.

### Surface Hierarchy & Nesting
Treat the UI as a series of nested, frosted layers.
- **Base:** `surface` (#0e0e0f)
- **Sectioning:** `surface-container-low` (#131314) for large background areas.
- **Component Level:** `surface-container` (#19191b) for cards and main modules.
- **Active/Elevated:** `surface-container-highest` (#262627) for hovered states or modal overlays.

### The "Glass & Gradient" Rule
To achieve the "High-End" feel, use **Glassmorphism** for floating UI (navigation bars, tooltips, and context menus).
- **Formula:** `surface-variant` at 60% opacity + `backdrop-filter: blur(20px)`.
- **Signature Textures:** For primary CTAs, use a linear gradient from `primary` (#2D5BFF) to `primary-dim` (#3e65ff) at a 135° angle. This adds a "liquid" soul to the tech-heavy interface.

---

## 3. Typography: The Editorial Voice

We utilize a dual-font strategy to balance technical precision with aggressive, modern headlines.

- **Display & Headlines:** `Space Grotesk`. This is our "Brutalist" edge. Use `display-lg` for hero AI news titles to command attention. The wide apertures and geometric shapes feel tech-forward.
- **Body & UI Labels:** `Inter`. This is our functional core. It provides maximum readability for long-form AI tool descriptions and dense news feeds.
- **Optional Mono:** `Geist Mono` for timestamps, small counters, and token-like metadata.

### Type Scale
- **display-lg:** 52px / 1.02 / -0.04em
- **display-md:** 40px / 1.05 / -0.03em
- **display-sm:** 32px / 1.08 / -0.02em
- **headline:** 24px / 1.15 / -0.01em
- **title:** 18px / 1.25
- **body-lg:** 16px / 1.7
- **body-md:** 14px / 1.65
- **label-md:** 11px / uppercase / 0.16em
- **mono-meta:** 11px / 0.02em

### Hierarchy Intent
Use extreme scale contrast. A `display-sm` headline should often sit directly above a `label-md` category tag in `tertiary` (#00FF9F) to create an editorial, high-fashion layout.

---

## 4. Elevation & Depth: Tonal Layering

Traditional shadows are too heavy for this system. We use **Tonal Layering** and **Light Leaks**.

- **The Layering Principle:** Instead of a drop shadow, lift a card by moving it from `surface-container-low` to `surface-container-high`.
- **Ambient Shadows:** When a true float is required (e.g. a tooltip), use a 32px blur with 6% opacity. Use a tinted shadow: `rgba(151, 169, 255, 0.08)`—this incorporates the `primary` hue into the shadow itself, simulating a neon glow.
- **The Ghost Border Fallback:** If a container lacks contrast on mobile, use `outline-variant` (#484849) at **15% opacity**. Never use a 100% opaque stroke.
- **Subtle Glows:** Elements using `secondary` (#A855F7) should have a soft outer glow (`box-shadow: 0 0 15px rgba(168, 85, 247, 0.3)`) to simulate active AI processing.

---

## 5. Components

### Buttons
- **Primary:** Gradient of `primary` to `primary-dim`. Roundedness: `md` (0.75rem). Text: dark/near-black for contrast.
- **Secondary:** Ghost style. Transparent background with a Ghost Border and `primary` text.
- **Tertiary:** Text-only using `tertiary` (#00FF9F) with an underlined hover state.

### Cards & Feed Items
- **Strict Rule:** No dividers. Separate articles using `xl` (1.5rem) vertical spacing or a subtle background shift to `surface-container-low`.
- **Interaction:** On hover, a card should transition its background from `surface-container` to `surface-bright` and scale by `1.02`.
- **Corner radius:** `lg` (1rem) for primary feed cards.

### AI Input Fields
- **Style:** darkest sink effect using the base background.
- **Focus State:** A 1px Ghost Border using `secondary` (#A855F7) at 40% opacity with a soft 4px outer glow.

### The "Intelligence Pulse" (Chips)
Used for AI categories (e.g. LLM, Generative Art, Robotics).
- **Style:** `surface-variant` background, pill radius, with a leading 4px dot of `tertiary` (#00FF9F) that can pulse subtly.

### Floating Navigation
- **Style:** glass bar using `surface-variant` at 60% opacity with `blur(20px)`.
- **Behavior:** should feel suspended above content, not boxed in.

---

## 6. Motion

- **General:** soft, premium, never bouncy.
- **Duration:** 160ms micro / 240ms standard / 360ms feature.
- **Easing:** `cubic-bezier(0.22, 1, 0.36, 1)` for entrances, `ease-out` for hover.
- **Hover:** cards can scale to `1.02`; buttons to `1.01`.
- **Glow transitions:** animate opacity, blur, and background—not hard borders.

---

## 7. Roundedness Scale
- **Small (`sm`):** 0.25rem — focus rings, tiny pills
- **Default (`md`):** 0.75rem — standard buttons and controls
- **Large (`lg`):** 1rem — cards
- **Extra Large (`xl`):** 1.5rem — hero panels and modals

---

## 8. Do’s and Don’ts

### Do
- **DO** use whitespace as a structural element. If in doubt, add more padding.
- **DO** use `tertiary` (#00FF9F) for live/signal indicators.
- **DO** create depth through layered surfaces, blur, and glows.
- **DO** let headlines feel oversized and slightly brutalist.

### Don’t
- **DON'T** use pure white for dense body text; use `on-surface-variant`.
- **DON'T** use hard section dividers as the main organizing device.
- **DON'T** use sharp 90-degree corners.
- **DON'T** default back to generic SaaS dashboard styling.
