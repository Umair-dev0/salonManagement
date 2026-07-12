---
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#4e4639'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#7f7667'
  outline-variant: '#d1c5b4'
  surface-tint: '#775a19'
  primary: '#775a19'
  on-primary: '#ffffff'
  primary-container: '#c5a059'
  on-primary-container: '#4e3700'
  inverse-primary: '#e9c176'
  secondary: '#5e5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e4e2e2'
  on-secondary-container: '#646464'
  tertiary: '#5e5e5d'
  on-tertiary: '#ffffff'
  tertiary-container: '#a5a5a3'
  on-tertiary-container: '#3a3b3a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdea5'
  primary-fixed-dim: '#e9c176'
  on-primary-fixed: '#261900'
  on-primary-fixed-variant: '#5d4201'
  secondary-fixed: '#e4e2e2'
  secondary-fixed-dim: '#c8c6c6'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#474747'
  tertiary-fixed: '#e3e2e0'
  tertiary-fixed-dim: '#c7c6c5'
  on-tertiary-fixed: '#1a1c1b'
  on-tertiary-fixed-variant: '#464746'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-lg:
    fontFamily: Libre Caslon Text
    fontSize: 48px
    fontWeight: '400'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Libre Caslon Text
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Libre Caslon Text
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 40px
  headline-sm:
    fontFamily: Libre Caslon Text
    fontSize: 24px
    fontWeight: '400'
    lineHeight: 32px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style

The design system is engineered for the high-end salon industry, where the digital experience must reflect the tactile luxury of a physical spa or boutique. The brand personality is poised, meticulous, and serene. It targets salon owners and professionals who require a sophisticated workspace that reduces cognitive load through intentional clarity.

The visual style is **Modern Corporate with a Minimalist lean**. It leverages generous white space (negative space) to create a sense of "air" and premium positioning. The interface avoids loud trends in favor of timeless elegance, utilizing a refined mix of serif and sans-serif typography to balance editorial beauty with functional utility. The emotional response should be one of calm confidence and effortless control.

## Colors

The palette is rooted in soft neutrals to evoke a sense of cleanliness and calm. 

- **Primary (Champagne Gold):** Used sparingly for key actions, active states, and brand moments. It conveys luxury without being ostentatious.
- **Secondary (Warm Grey):** Used for secondary UI elements, borders, and icons to maintain a soft contrast.
- **Tertiary (Ivory):** The primary background color. It is warmer than pure white, reducing eye strain and feeling more "organic."
- **Neutral (Deep Charcoal):** Reserved for primary text and high-contrast headlines to ensure maximum readability and a grounded feel.
- **Surface Tints:** Use a 50% opacity of the secondary grey for subtle dividers and disabled states.

## Typography

The typographic scale uses a high-contrast pairing to establish a clear hierarchy. 

**Headlines (Libre Caslon Text):** This serif font is used for page titles, section headers, and featured numbers. It brings a literary, editorial feel to the data-heavy application.
**Interface & Body (Hanken Grotesk):** A sharp, contemporary sans-serif used for all functional elements. Its high legibility is critical for booking calendars, client lists, and financial reports.

Maintain a strict vertical rhythm by adhering to the defined line heights. All labels should use the uppercase styling with tracking (letter spacing) to differentiate them from body text.

## Layout & Spacing

This design system utilizes a **Fixed Grid** for desktop and a **Fluid Grid** for mobile devices. 

- **Desktop:** 12-column grid, 1200px max-width, 24px gutters.
- **Tablet:** 8-column grid, fluid width, 24px gutters.
- **Mobile:** 4-column grid, fluid width, 16px gutters.

Spacing follows an 8px geometric scale. To achieve the "premium" feel, prioritize the `lg` and `xl` spacing tokens for container padding and section margins. Layouts should never feel cramped; if in doubt, increase the whitespace. Information density should be kept moderate to low, especially on dashboard views.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Ambient Shadows**. 

1. **Base Level:** Ivory background (#F9F8F6).
2. **Surface Level:** White cards (#FFFFFF) with a very soft, diffused shadow (0px 4px 20px rgba(0, 0, 0, 0.03)).
3. **Interactive Level:** Elements like buttons or active dropdowns use a slightly more pronounced shadow (0px 8px 30px rgba(197, 160, 89, 0.1)) to indicate clickability and depth.

Avoid heavy borders. Use subtle 1px lines in the secondary color at 20% opacity for table row separators and input field outlines.

## Shapes

The shape language is "Rounded," striking a balance between the organic nature of beauty and the structural precision of management software.

- **Primary Components:** (Buttons, Cards, Inputs) use the `rounded` token (0.5rem).
- **Secondary Components:** (Chips, Tags) use the `rounded-xl` token (1.5rem) to create a pill-like visual contrast against the more structured cards.
- **Imagery:** Profile photos and gallery previews should use the `rounded-lg` token (1rem) to feel soft and approachable.

## Components

### Buttons
- **Primary:** Champagne Gold background, White text. No border. Use for the "Main" action on a page (e.g., "Book Appointment").
- **Secondary:** Deep Charcoal text, 1px border of Deep Charcoal. Transparent background.
- **Ghost:** Warm Grey text. Used for "Cancel" or "Back" actions.

### Data Cards
Cards should be white with a 0.5rem corner radius and the "Surface Level" ambient shadow. Padding should be `md` (24px) internally. Titles within cards must use `headline-sm`.

### Tables
Tables are the backbone of the management system. They should be "borderless" in style—only using horizontal separators. Header rows should use `label-md` with a subtle Ivory background tint. Row hover states should be a 5% opacity of Champagne Gold.

### Input Fields
Inputs use a 1px border in Warm Grey. On focus, the border transitions to Champagne Gold with a soft glow effect. Labels are always positioned above the field using `label-sm`.

### Chips & Status Indicators
Status indicators (e.g., "Confirmed," "Cancelled") use a small dot followed by text. Backgrounds for chips should be high-transparency versions of the status color (e.g., a soft sage green for "Confirmed") to maintain the neutral aesthetic of the system.