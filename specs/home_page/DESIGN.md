---
name: Matcha Mochi
colors:
  surface: '#f8faf5'
  surface-dim: '#d8dbd6'
  surface-bright: '#f8faf5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4ef'
  surface-container: '#ecefea'
  surface-container-high: '#e7e9e4'
  surface-container-highest: '#e1e3de'
  on-surface: '#191c1a'
  on-surface-variant: '#424840'
  inverse-surface: '#2e312e'
  inverse-on-surface: '#eff1ec'
  outline: '#73796f'
  outline-variant: '#c2c8bd'
  surface-tint: '#466643'
  primary: '#335331'
  on-primary: '#ffffff'
  primary-container: '#4a6b47'
  on-primary-container: '#c4eabd'
  inverse-primary: '#abd0a5'
  secondary: '#78583e'
  on-secondary: '#ffffff'
  secondary-container: '#fdd2b1'
  on-secondary-container: '#78583f'
  tertiary: '#783645'
  on-tertiary: '#ffffff'
  tertiary-container: '#954d5c'
  on-tertiary-container: '#ffd6db'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c7edbf'
  primary-fixed-dim: '#abd0a5'
  on-primary-fixed: '#022106'
  on-primary-fixed-variant: '#2e4e2d'
  secondary-fixed: '#ffdcc2'
  secondary-fixed-dim: '#e8be9f'
  on-secondary-fixed: '#2c1603'
  on-secondary-fixed-variant: '#5d4128'
  tertiary-fixed: '#ffd9de'
  tertiary-fixed-dim: '#ffb2bf'
  on-tertiary-fixed: '#3b0616'
  on-tertiary-fixed-variant: '#733140'
  background: '#f8faf5'
  on-background: '#191c1a'
  surface-variant: '#e1e3de'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '800'
    lineHeight: 38px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 30px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1.25rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system expresses a serene yet delightfully witty digital sanctuary for language acquisition. It reinterprets traditional matcha ritual aesthetics through the lens of modern, approachable minimalism—replacing anxious gamification tropes (shrieking mascots, aggressive streaks, high-friction red banners) with a calm, tactile, and gently humorous learning rhythm.

### Aesthetic Foundation
- **Tactile Warmth & Organic Modernism:** Soft milky hues, gently sculpted pill forms, and airy porcelain whites inspired by hand-glazed ceramic tea bowls (*chawan*) and whisked foam (*chasen* bubbles).
- **Wit Over Pressure:** Micro-moments and reward cues lean into dry, endearing self-awareness (e.g., "Matcha-fueled tongue twisters," "Zero 'umms' detected," "Native speaker illusion +10").
- **Zen Clarity:** Dense grammar tables and vocabulary drilling are broken into digestible floating cards with generous internal padding, low-contrast delineations, and low-cognitive-load layouts.

## Colors

The color palette centers on ceremonial matcha grades, toasted grains, warm milk froth, and sweet azuki confections. 

### Core Palette Roles
- **Primary (`#4A6B47` Matcha Green):** Drives main interactive actions, progress bars, correct answers, and confident typographic anchors. Deep variant (`#375335`) handles dark text and pressed button states; light variant (`#5B7F58`) serves hover highlights.
- **Secondary (`#8C6A4F` Hojicha / Roasted Rice):** Adds warmth, grounding review counters, audio playback controls, and listening comprehension modules.
- **Tertiary (`#E892A2` Azuki Blush):** Reserved for celebration milestones, witty badges, streak rewards, and playful corrective nudges. Soft companion tint (`#F8E2E7`) serves as badge background fill.
- **Neutral Canvas & Surfaces (`#F5F7F2` Cream Milk & `#FAFAF7` Porcelain White):** Replaces harsh standard whites with a warm, eye-soothing backdrop. Surface containers use gentle foam greens (`#EDF3E8`, `#E2ECE0`) to layer information without stark dividers.
- **Semantic Feedback:**
  - Success: `#4A6B47` (Matcha Pure)
  - Encouraging Review / Correction: `#8C6A4F` (Toasted Hojicha)
  - Delight / Bonus: `#E892A2` (Sweet Azuki)

## Typography

The typography utilizes **Plus Jakarta Sans** across all hierarchies. Its open geometry, friendly curves, and clean legibility evoke an informal, supportive demeanor while remaining structurally sound for complex grammatical scripts and foreign phonetic characters.

### Usage Principles
- **Headings & Pronunciation Hero Text:** Rendered with confident bold weights and snug tracking to project cheerful warmth.
- **Vocabulary Targets & Script Prompts:** Use `headline-md` or `headline-sm` with slightly boosted line-heights to support foreign accents and furigana/pinyin ruby annotations cleanly.
- **Witty Micro-Copy & Pill Badges:** Use `label-md` and `label-sm` in semi-bold and bold weights, setting cheeky observations in clear, rhythmic balance against larger interactive cards.

## Layout & Spacing

The layout is structured around an airy fluid grid with a centered content maximum of 1080px for desktop study sessions and a snug, ergonomic single-column focus layout for mobile thumb-reach.

### Breakpoints & Adaptive Rhythm
- **Mobile (< 640px):** Single-column layout with 4 columns, `1.25rem` margins, and `1rem` gutters. Interactive sentence-builder chips wrap fluidly with `space-sm` gaps. Sticky bottom action bar for instant response verification.
- **Tablet (640px – 1024px):** 8-column layout with `2rem` margins. Lesson modules and live phonetic breakdowns can sit side by side.
- **Desktop (> 1024px):** 12-column layout centered with `3rem` margins. The central interactive card remains intentionally constrained to 640px to retain prompt focus, flanked by tea-break vocabulary logs and streak milestones.

## Elevation & Depth

Visual hierarchy rejects harsh, generic drop shadows in favor of **tonal surface stacking** and **soft ambient matcha-tinted glows**.

### Stacking Model
- **Base Canvas (`Level 0`):** Porcelain White (`#FAFAF7`) or Milk Foam (`#F5F7F2`).
- **Container / Inactive Card (`Level 1`):** Gentle Foam Tint (`#EDF3E8`) with a fine, translucent border (`rgba(74, 107, 71, 0.08)`).
- **Interactive Elevated Tile (`Level 2`):** Pure White (`#FFFFFF`) with an ambient matcha-diffused shadow: `0px 4px 16px rgba(74, 107, 71, 0.06), 0px 1px 3px rgba(74, 107, 71, 0.04)`.
- **Active Focus & Modals (`Level 3`):** High-layer porcelain surface with a warm, pillow-like lift: `0px 12px 32px rgba(55, 83, 53, 0.12)`.

## Shapes

The design system embraces an organic, rounded aesthetic (`roundedness: 2`) with prominent radii:
- Standard interactive elements (buttons, inputs, vocabulary cards) feature `0.75rem` (`12px`) to `1rem` (`16px`) corners, giving them a soft, tactile confection-like feel.
- Interactive tags, sentence chips, and witty status badges use true pill geometry (`9999px` / `rounded-full`) to look welcoming, safe, and touchable.
- Visual framing avoids sharp 90-degree transitions, reinforcing a soothing, low-stress study zone.

## Components

### Buttons
- **Primary Button ("Sip & Proceed"):** Solid `#4A6B47` background with pure white text, pill or `1rem` corner rounding, and a subtle 2px bottom shadow inlay (`#375335`) that creates an inviting, squishy tactile depress upon click.
- **Secondary / Hojicha Button:** `#F3F7EE` background with `#4A6B47` or `#8C6A4F` text and an ultra-soft border. Used for audio re-listens and slow-speed speech replays.
- **Pill Badges & Delight Tags:** Soft blush `#F8E2E7` background with `#E892A2` text, displaying witty encouragement: `"matcha-powered speech reflexes"`, `"zero umms!"`, or `"brain-lag: 0.2s"`.

### Cards & Flash-Tiles
- Built with a white core on `#EDF3E8` surface backdrops.
- Generous padding (`space-lg`), with foreign script centered. Tap states yield an elastic 98% scale transformation before confirming pronunciation.

### Inputs & Sentence Assemblers
- **Text Entry:** Porcelain white background, generous height (52px), rounded at `1rem`, bordered in `rgba(74, 107, 71, 0.20)`. Transitions smoothly to a focused 2px outline in `#4A6B47` accompanied by an ambient foam blur.
- **Word Builder Chips:** Rounded pill chips in `#FFFFFF` with a 1.5px soft border in `#E2ECE0`. Once tapped into place, chips adopt a soft matcha tint (`#EDF3E8`) to signify active slotting.

### Audio & Speech Pronunciation Gauge
- A pill-shaped acoustic waveform container wrapped in `#EDF3E8`, using animated bars in `#4A6B47` paired with azuki pink (`#E892A2`) pitch-accent markers.