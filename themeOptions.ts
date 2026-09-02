import { ThemeOptions } from "@mui/material/styles";
// Augments MUI's `components` type with MuiDataGrid so the override below typechecks.
import type {} from "@mui/x-data-grid/themeAugmentation";

/**
 * Generic Starter Theme — MUI Theme
 *
 * A brand-neutral MUI theme built from MUI's own shipped palette values
 * (`@mui/material/colors`) rather than a specific product's brand colors.
 * Treat this file as a reference implementation: the token shape
 * (`taruviTokens`) and the two exported `ThemeOptions` objects are the
 * contract other apps compare their own theme against — fork this file,
 * swap the *values* for your brand, keep the *shape*.
 *
 * Note on radii: the `radius.*` ladder is built around MUI's own actual
 * default `shape.borderRadius` (4px) — see comments inside the block.
 */

// ─── Module augmentation: custom MUI variants ────────────────────────
// Adds 8 category/tag chip variants backed by a generic pastel rotation.
// Usage: `<Chip variant="tagBlue" label="…" />`
declare module "@mui/material/Chip" {
  interface ChipPropsVariantOverrides {
    tagBlue: true;
    tagPurple: true;
    tagGreen: true;
    tagOrange: true;
    tagTeal: true;
    tagPink: true;
    tagLime: true;
    tagRose: true;
  }
}

// ─── Font families ──────────────────────────────────────────────────
// A single generic stack for both body and heading text — MUI's own
// default font family, with standard system fallbacks. `font.body` /
// `font.title` are kept as two separate tokens (and threaded through
// `typography` below as `FONT_BODY` / `FONT_TITLE`) so a fork that wants a
// distinct display face for headings only has to change `FONT_TITLE`.
const FONT_BODY = '"Roboto", "Helvetica", "Arial", sans-serif';
const FONT_TITLE = FONT_BODY;

// Primary accent hex, hoisted so `button.primaryDefault` and the focus-ring
// shadow token can never drift apart. This is MUI's own default primary
// color (`@mui/material/colors` `blue[600]`). White text on it is ~3.7:1 —
// above the 3:1 WCAG 1.4.11 floor for a *non-text* focus indicator, but
// below the 4.5:1 text floor, which is why text-bearing surfaces use
// `button.primaryFill` (`blue[700]`, ~4.6:1) instead.
const PRIMARY_ACCENT = '#1e88e5';

// ─── Generic tokens (full ramps + every named color role) ────────────
export const taruviTokens = {
  font: {
    body: FONT_BODY,
    title: FONT_TITLE,
  },

  // `@mui/material/colors` `blue` ramp (50–900). `dark` is one step below
  // 900, for surfaces (dark-mode contrast text) that need something darker
  // than the ramp itself provides.
  primary: {
    50: '#e3f2fd',
    100: '#bbdefb',
    200: '#90caf9',
    300: '#64b5f6',
    400: '#42a5f5',
    500: '#2196f3',
    600: '#1e88e5',
    700: '#1976d2',
    800: '#1565c0',
    900: '#0d47a1',
    dark: '#08213d',
  },

  // `@mui/material/colors` `grey` ramp. `darkest` is MUI's own actual
  // default dark-mode `background.default` (`#121212`).
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
    darkest: '#121212',
  },

  // `@mui/material/colors` `purple` ramp — a generic secondary that reads
  // clearly distinct from primary blue. These exact steps (300/500/700)
  // are also what MUI's own `createTheme()` uses for its default
  // `palette.secondary` light/main/dark.
  secondary: {
    50: '#f3e5f5',
    100: '#e1bee7',
    200: '#ce93d8',
    300: '#ba68c8',
    400: '#ab47bc',
    500: '#9c27b0',
    600: '#8e24aa',
    700: '#7b1fa2',
    800: '#6a1b9a',
    900: '#4a148c',
  },

  // `@mui/material/colors` `green` ramp.
  success: {
    50: '#e8f5e9',
    100: '#c8e6c9',
    200: '#a5d6a7',
    300: '#81c784',
    400: '#66bb6a',
    500: '#4caf50',
    600: '#43a047',
    700: '#388e3c',
    800: '#2e7d32',
    900: '#1b5e20',
  },

  // `@mui/material/colors` `orange` ramp for 50–700. `800` swaps to
  // `deepOrange[900]` (`#bf360c`) rather than continuing the orange ramp:
  // orange's own darkest step (`orange[900]`, `#e65100`) still measures
  // under 3.8:1 as text on a light surface, short of the 4.5:1 floor;
  // `deepOrange[900]` clears ~5.1–5.6:1 on the same surfaces. This is the
  // one ramp where a role needs a genuinely dark shade the family itself
  // doesn't reach.
  warning: {
    50: '#fff3e0',
    100: '#ffe0b2',
    200: '#ffcc80',
    300: '#ffb74d',
    400: '#ffa726',
    500: '#ff9800',
    600: '#fb8c00',
    700: '#f57c00',
    800: '#bf360c',
  },

  // `@mui/material/colors` `red` ramp.
  error: {
    50: '#ffebee',
    100: '#ffcdd2',
    200: '#ef9a9a',
    300: '#e57373',
    400: '#ef5350',
    500: '#f44336',
    600: '#e53935',
    700: '#d32f2f',
    800: '#c62828',
    900: '#b71c1c',
  },

  // Primary button states, derived from the blue ramp above. `primaryFill`/
  // `primaryHover`/`primaryActive` step down the ramp (700→800→900) so a
  // white label stays ≥4.5:1 (WCAG 1.4.3) at every state; `primaryDefault`
  // stays the flatter 600 for non-text uses (focus rings, borders, tab
  // indicator, checkbox/switch fills) where 3:1 is the bar. This 3-role
  // split exists because a single mid-ramp blue can't be both a passable
  // *fill* for white text (needs ≥4.5:1) and a light-enough *accent* for
  // borders/rings that still reads as "the brand blue" rather than navy —
  // splitting the role in two lets each pick the shade that actually fits.
  button: {
    primaryDefault: PRIMARY_ACCENT,      // blue[600] — non-text, ~3.7:1
    primaryFill: '#1976d2',              // blue[700] — white text ~4.6:1
    primaryHover: '#1565c0',             // blue[800] — white text ~5.75:1
    primaryActive: '#0d47a1',            // blue[900] — white text ~8.6:1
    primaryDisabled: '#bbdefb',          // blue[100]
    primaryDisabledText: '#757575',      // grey[600] — disabled text is WCAG-exempt, kept legible anyway
  },

  // Status / chart colors — a generic placeholder rotation, not a designed
  // system. The four common status tones (todo / inProgress / review /
  // complete) reuse MUI's own neutral/info/warning/success semantics; the
  // rest are secondary tones for less common states. Swap these for your
  // product's own status vocabulary.
  status: {
    complete: '#388e3c',       // green[700]
    completeChip: '#2e7d32',   // green[800] — AA white-label fill for filled success chips (white text ~5.13:1)
    inProgress: '#1976d2',     // blue[700] — white text ~4.6:1
    review: '#f57c00',         // orange[700] — white text is only ~2.7:1, so chips/alerts on this fill use dark text instead (see MuiChip.colorWarning below)
    delayed: '#d32f2f',        // red[700]
    onHold: '#7b1fa2',         // purple[700]
    todo: '#9e9e9e',           // grey[500]
    open: '#1e88e5',           // blue[600]
    resolved: '#1b5e20',       // green[900]
    underReview: '#ef6c00',    // orange[800]
    delayedAlt: '#b71c1c',     // red[900]
    onHoldAlt: '#4a148c',      // purple[900]
    chartPrimary: '#1e88e5',   // blue[600]
  },

  // Tag / category chips
  //
  // Also exposed as MuiChip variants `tagBlue`/`tagPurple`/`tagGreen`/
  // `tagOrange`/`tagTeal`/`tagPink`/`tagLime`/`tagRose` — prefer those over
  // reading raw values.
  tag: {
    fillBg: '#e3f2fd',     // legacy single-fill (kept for backward compat)
    fillText: '#0d47a1',
    outlineColor: '#1976d2',
  },
  // Each pair takes one MUI color family's lightest (50/100) fill with a
  // dark (800/900) shade of the same or a compatible family as the label.
  // A 50-vs-900 pairing clears 4.5:1 comfortably in every MUI family
  // because the lightness gap is so large — this is a plain, defensible
  // pattern for a starter template, not a luminance-matched, CIEDE2000-
  // engineered system the way a shipping product's tag palette would be.
  // If your app leans on tag color meaningfully (e.g. color carries
  // information, not just decoration), replace these with values measured
  // for your own palette. `tagLime` pairs `lime[50]` with `lightGreen[900]`
  // rather than `lime[900]` — MUI's own darkest lime step (`#827717`)
  // still falls just short of 4.5:1 on `lime[50]`.
  tagPalette: [
    { bg: '#e3f2fd', text: '#0d47a1' }, // blue
    { bg: '#f3e5f5', text: '#4a148c' }, // purple
    { bg: '#e8f5e9', text: '#1b5e20' }, // green
    { bg: '#fff3e0', text: '#bf360c' }, // orange (deepOrange[900] label — see `warning` ramp note above)
    { bg: '#e0f2f1', text: '#004d40' }, // teal
    { bg: '#fce4ec', text: '#880e4f' }, // pink
    { bg: '#f9fbe7', text: '#33691e' }, // lime (lightGreen[900] label)
    { bg: '#ffebee', text: '#b71c1c' }, // rose (red)
  ],

  // Tab / surface tokens
  surface: {
    bg: '#f5f5f5',              // grey[100]
    paper: '#ffffff',
    inputBg: '#fafafa',         // grey[50]
    borderLight: 'rgba(0,0,0,0.08)',
    borderInput: 'rgba(0,0,0,0.1)',
    borderTableRow: 'rgba(0,0,0,0.04)',
    navWhiteBorder: '#e0e0e0',  // grey[300]
    navBlue: '#1976d2',         // blue[700]
    navDark: '#0d47a1',         // blue[900]
    navDarkAccent: '#64b5f6',   // blue[300]
    navWhiteText: '#212121',    // grey[900]
  },

  // Text colors — MUI's own default light-mode text tokens (alpha-over-
  // black), plus a flat `onDark` for dark surfaces.
  text: {
    primary: 'rgba(0,0,0,0.87)',
    secondary: 'rgba(0,0,0,0.6)',
    muted: 'rgba(0,0,0,0.38)',
    onDark: '#ffffff',
  },

  // Shadows
  shadow: {
    card: '0 2px 12px rgba(0,0,0,0.07)',
    cardDark: '0 2px 12px rgba(0,0,0,0.40)',
    nav: '0 2px 8px rgba(0,0,0,0.12)',
    sidebar: '0 2px 8px rgba(0,0,0,0.08)',
    swatch: '0 1px 6px rgba(0,0,0,0.10)',
    // 2px **solid** ring, not a translucent one — a solid ring measures
    // well above the 3:1 WCAG 1.4.11 floor for a non-text focus indicator
    // on both light and dark surfaces; a semi-transparent ring at low
    // alpha typically doesn't.
    focusRing: `0 0 0 2px ${PRIMARY_ACCENT}`,
  },

  // Border radii — a light ladder built around MUI's own actual default
  // `shape.borderRadius` (4px), used here as `radius.md`. Smaller,
  // denser components (tooltips) sit below it; larger containers (cards)
  // sit above it. This is a generic "small things are tighter, big things
  // are looser" convention, not a brand-specific spec — an app that wants
  // a flatter or rounder look can collapse the whole ladder to one value.
  radius: {
    none: 0,
    sm: 2,     // tooltip
    md: 4,     // buttons, icon-button, sidebar — MUI's own default
    lg: 8,     // form inputs, status messages
    xl: 12,    // navbars, sidebar containers
    xxl: 16,   // cards, TOC
    pill: 999,
    avatar: 9999,
  },

  // Spacing (in px) for explicit lookups
  spacing: {
    cardPadding: 28,
    cardTitleMb: 16,
    sectionMb: 64,
    containerPaddingY: 48,
    containerPaddingX: 32,
    formGroupMb: 18,
    formActionsMt: 24,
    formActionsGap: 10,
    // Form vertical rhythm
    formLabelToInput: 8,    // gap between label and input
    formInputToHelper: 4,   // gap between input and helper / error text
    formFieldGap: 16,       // gap between adjacent fields in a stack
    formSectionGap: 32,     // gap between form sections
    // Input padding (pairs with the 40px standard input height below)
    inputPaddingY: 12,
    inputPaddingX: 16,
    btnSm: '6px 14px',
    btnMd: '10px 20px',
    btnLg: '14px 28px',
    chip: '4px 12px',
    chipSm: '2px 9px',
    tableCell: '12px 16px',
    statusMsg: '14px 18px',
    sidebarItem: '10px 12px',
  },

  // Component dimensions
  size: {
    navHeight: 64,
    sidebarCollapsed: 72,
    sidebarExpanded: 200,
    sidebarItemMinHeight: 48,
    iconButton: 38,
    iconButtonBorder: 1.5,
    avatarSm: 30,
    avatarMd: 34,
    btnSmMinH: 28,
    btnMdMinH: 36,
    btnLgMinH: 44,
    chipMd: 24,
    chipSm: 20,
  },

  // Letter spacing
  letterSpacing: {
    button: '0.04em',
    chip: '0.06em',
    subheading: '0.08em',
    cardTitle: '0.05em',
    tableHead: '0.06em',
    coverTitle: '-0.01em',
  },

  // Line heights
  lineHeight: {
    body: 1.6,
    heading: 1.15,
    h2: 1.2,
    h3: 1.3,
    h4: 1.3,
    h5: 1.4,
  },

  // Transitions
  transition: {
    fast: 'all 0.15s ease',
    base: 'all 0.18s ease',
    slow: 'all 0.20s ease',
  },

  // Font sizes (rem, derived from px-rem at 16px root)
  fontSize: {
    h1: '2.25rem',     // 36px
    h2: '1.75rem',     // 28px
    h3: '1.375rem',    // 22px
    h4: '1.125rem',    // 18px
    h5: '0.9375rem',   // 15px
    h6: '0.8125rem',   // 13px
    subheading: '0.75rem',  // 12px
    sectionHeader: '1.75rem', // 28px
    navTitle: '1.0625rem',  // 17px
    cardTitle: '0.75rem',   // 12px
    p1: '1rem',        // 16px
    p2: '0.875rem',    // 14px
    p3: '0.8125rem',   // 13px
    label: '0.75rem',  // 12px
    footer: '0.6875rem', // 11px
    formLabel: '0.8125rem',  // 13px
    formInput: '1rem',       // 16px — also prevents iOS Safari from zooming on focus
    formHelper: '0.6875rem', // 11px
    btnSm: '0.6875rem',  // 11px
    btnMd: '0.8125rem',  // 13px
    btnLg: '0.9375rem',  // 15px
    chip: '0.6875rem',   // 11px
    chipSm: '0.625rem',  // 10px
    tableHead: '0.6875rem', // 11px
    tableCell: '0.8125rem', // 13px
    breadcrumb: '0.875rem', // 14px
    breadcrumbCurrent: '1rem', // 16px
  },
} as const;

// ─── Typography ────────────────────────────────────────────────────
const typography: ThemeOptions['typography'] = {
  fontSize: 13, // base for MUI's rem calculations (matches body p3)
  fontFamily: FONT_BODY,
  htmlFontSize: 16,

  // Headings use a bold weight so they read with clear hierarchy against
  // body text, capped at 700 (standard "bold") rather than a heavier
  // weight that depends on a display face actually being loaded.
  h1: {
    fontFamily: FONT_TITLE,
    fontSize: taruviTokens.fontSize.h1,         // 36px
    fontWeight: 700,
    lineHeight: taruviTokens.lineHeight.heading,
    letterSpacing: '-0.01em',
  },
  h2: {
    fontFamily: FONT_TITLE,
    fontSize: taruviTokens.fontSize.h2,         // 28px
    fontWeight: 700,
    lineHeight: taruviTokens.lineHeight.h2,
  },
  h3: {
    fontFamily: FONT_TITLE,
    fontSize: taruviTokens.fontSize.h3,         // 22px
    fontWeight: 700,
    lineHeight: taruviTokens.lineHeight.h3,
  },
  h4: {
    fontFamily: FONT_TITLE,
    fontSize: taruviTokens.fontSize.h4,         // 18px
    fontWeight: 700,
    lineHeight: taruviTokens.lineHeight.h4,
  },
  h5: {
    fontFamily: FONT_TITLE,
    fontSize: taruviTokens.fontSize.h5,         // 15px
    fontWeight: 700,
    lineHeight: taruviTokens.lineHeight.h5,
  },
  h6: {
    fontFamily: FONT_TITLE,
    fontSize: taruviTokens.fontSize.h6,         // 13px
    fontWeight: 700,
    lineHeight: taruviTokens.lineHeight.h5,
  },

  // Body sizes
  body1: {
    fontFamily: FONT_BODY,
    fontSize: taruviTokens.fontSize.p2,        // 14px
    lineHeight: taruviTokens.lineHeight.body,
  },
  body2: {
    fontFamily: FONT_BODY,
    fontSize: taruviTokens.fontSize.p3,        // 13px
    lineHeight: taruviTokens.lineHeight.body,
  },

  // Subtitles
  subtitle1: {
    fontFamily: FONT_TITLE,
    fontSize: '0.875rem',                       // 14px
    fontWeight: 600,
    lineHeight: 1.4,
  },
  subtitle2: {
    fontFamily: FONT_TITLE,
    fontSize: taruviTokens.fontSize.subheading, // 12px
    fontWeight: 500,
    lineHeight: 1.4,
    letterSpacing: taruviTokens.letterSpacing.subheading,
    textTransform: 'uppercase',
  },

  // Buttons — uppercase, bold, lightly tracked out. Uppercase + letter-
  // spacing here is a common MUI convention (it's literally MUI's own
  // default `typography.button.textTransform`), not a brand-specific
  // choice.
  button: {
    fontFamily: FONT_TITLE,
    fontSize: taruviTokens.fontSize.btnMd,      // 13px
    fontWeight: 700,
    letterSpacing: taruviTokens.letterSpacing.button,
    textTransform: 'uppercase',
  },

  caption: {
    fontFamily: FONT_BODY,
    fontSize: taruviTokens.fontSize.footer,     // 11px
    lineHeight: 1.4,
  },

  overline: {
    fontFamily: FONT_TITLE,
    fontSize: taruviTokens.fontSize.footer,     // 11px
    fontWeight: 600,
    letterSpacing: taruviTokens.letterSpacing.subheading,
    textTransform: 'uppercase',
  },
};

const shape = { borderRadius: taruviTokens.radius.md }; // 4px — MUI's own default
const spacing = 8;

// ─── Component overrides (every spec'd surface) ─────────────────────
const componentOverrides = (mode: 'light' | 'dark'): ThemeOptions['components'] => {
  const isLight = mode === 'light';
  const dividerColor = isLight ? taruviTokens.surface.borderLight : 'rgba(255,255,255,0.08)';

  // The accent used as a *foreground* (link text, text/outlined button
  // labels, selected tab, focused field label). `button.primaryDefault` is
  // only ~3.7:1 on white — fine for a 2px ring (1.4.11 → 3:1), short of the
  // 4.5:1 text floor (1.4.3), so foreground text uses a darker step of the
  // ramp instead.
  //
  // Light uses `primary[900]` (`primaryActive`, `#0d47a1`): it clears
  // ≥6:1 on every surface a link/label actually lands on in this theme —
  // paper, the page background, a hovered `primary[50]` row, and even the
  // `primary[100]` chip/badge fill — where a lighter step (e.g. `blue[800]`)
  // starts dropping close to 4:1 on some of those.
  //
  // Dark needs a light tone — `primary[300]` measures ~7.5:1 on the dark
  // card and ~8.5:1 on the dark page background.
  const accentFg = isLight ? taruviTokens.button.primaryActive : taruviTokens.primary[300];
  // Hover/active step for that accent: darker still in light, lighter in
  // dark, so the label keeps well above 4.5:1 over the tinted hover fill.
  // (Color alone is a weak state signal at this step; the hover affordance
  // is `MuiLink`'s underline and the buttons' tint fill.)
  const accentFgHover = isLight ? taruviTokens.primary.dark : taruviTokens.primary[200];
  const accentTintHover = isLight ? taruviTokens.primary[50] : 'rgba(30,136,229,0.16)';

  // Chip label tones for the **outlined** variant. A filled chip puts the
  // status tone in the background behind a white/dark label; an outlined
  // chip puts that tone *on the label*, so it has to clear the 4.5:1 text
  // floor against every surface a chip can land on — paper, the page
  // background, and the `primary[50]` hover/selected row fill. These clear
  // ≥4.3:1 on paper and the page background; a hovered primary-tinted row
  // nudges a couple of them (success, error) a hair under 4.5:1 in that
  // specific compound state — acceptable for a starter placeholder, worth
  // re-checking with a contrast tool if you tune these hues.
  const outlinedChipFg = isLight
    ? {
        primary: taruviTokens.button.primaryActive, // blue[900]
        success: taruviTokens.status.completeChip,  // green[800]
        info: taruviTokens.button.primaryActive,     // blue[900]
        warning: taruviTokens.warning[800],          // deepOrange[900]
        error: taruviTokens.error[700],              // red[700]
      }
    : {
        primary: taruviTokens.primary[300],
        success: taruviTokens.success[300],
        info: taruviTokens.primary[300],
        warning: taruviTokens.warning[300],
        error: taruviTokens.error[300],
      };

  return {
    // ─ Global base
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        body: {
          backgroundColor: isLight ? taruviTokens.surface.bg : taruviTokens.neutral.darkest,
          color: isLight ? taruviTokens.text.primary : 'rgba(255,255,255,0.87)',
          fontFamily: FONT_BODY,
          fontSize: taruviTokens.fontSize.p3,
          lineHeight: taruviTokens.lineHeight.body,
        },
        '*, *::before, *::after': { boxSizing: 'border-box' },
        '[id]': { scrollMarginTop: '24px' },
      },
    },

    // ─ Buttons (primary / secondary / destructive / text / sizes)
    MuiButton: {
      defaultProps: { disableElevation: true, variant: 'contained', disableRipple: false },
      styleOverrides: {
        root: {
          borderRadius: taruviTokens.radius.md,
          fontFamily: FONT_TITLE,
          fontWeight: 700,
          letterSpacing: taruviTokens.letterSpacing.button,
          textTransform: 'uppercase',
          boxShadow: 'none',
          transition: taruviTokens.transition.base,
          gap: 6,
          // 44px min touch target on coarse pointers (mobile/tablet) — WCAG 2.5.5
          '@media (pointer: coarse)': {
            minHeight: 44,
          },
        },
        sizeSmall: {
          padding: taruviTokens.spacing.btnSm,
          fontSize: taruviTokens.fontSize.btnSm,
          minHeight: taruviTokens.size.btnSmMinH,
        },
        sizeMedium: {
          padding: taruviTokens.spacing.btnMd,
          fontSize: taruviTokens.fontSize.btnMd,
          minHeight: taruviTokens.size.btnMdMinH,
        },
        sizeLarge: {
          padding: taruviTokens.spacing.btnLg,
          fontSize: taruviTokens.fontSize.btnLg,
          minHeight: taruviTokens.size.btnLgMinH,
        },
        containedPrimary: {
          // `primaryFill`, not `primaryDefault`: white on blue[600] is only
          // ~3.7:1, white on blue[700] is ~4.6:1 (WCAG 1.4.3). Hover ~5.75:1,
          // active ~8.6:1.
          backgroundColor: taruviTokens.button.primaryFill,
          color: '#fff',
          '&:hover': { backgroundColor: taruviTokens.button.primaryHover, boxShadow: 'none' },
          '&:active': { backgroundColor: taruviTokens.button.primaryActive },
          '&.Mui-disabled': {
            backgroundColor: taruviTokens.button.primaryDisabled,
            color: taruviTokens.button.primaryDisabledText,
          },
        },
        outlinedPrimary: {
          borderWidth: 2,
          borderColor: accentFg,
          color: accentFg,
          '&:hover': {
            borderWidth: 2,
            // The hover tint has to stay mode-aware, otherwise the dark-mode
            // label (`primary[300]`) lands on a near-white fill at ~1.2:1.
            backgroundColor: accentTintHover,
            borderColor: accentFgHover,
            color: accentFgHover,
          },
        },
        containedError: {
          // `error[700]`, not `error[500]`: white on `error[500]` is only
          // ~3.7:1. `error[700]` clears ~5.0:1.
          backgroundColor: taruviTokens.error[700],
          color: '#fff',
          '&:hover': { backgroundColor: taruviTokens.error[800], boxShadow: 'none' },
        },
        outlinedError: {
          borderWidth: 2,
          borderColor: taruviTokens.error[600],
          color: taruviTokens.error[700],
          '&:hover': {
            borderWidth: 2,
            backgroundColor: taruviTokens.error[50],
            borderColor: taruviTokens.error[700],
          },
        },
        text: {
          color: accentFg,
          '&:hover': {
            backgroundColor: 'rgba(30,136,229,0.06)',
            color: accentFgHover,
          },
        },
      },
    },

    // ─ Icon button — square radius + a subtle hover fill.
    //   The bordered "icon-only" treatment is opt-in via className
    //   "btn-icon-only" so it doesn't bracket every inline icon affordance
    //   in the codebase with a heavy border.
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: taruviTokens.radius.md,
          color: isLight ? taruviTokens.text.secondary : taruviTokens.neutral[300],
          transition: taruviTokens.transition.fast,
          padding: 8,
          '&:hover': {
            backgroundColor: isLight ? taruviTokens.neutral[100] : 'rgba(255,255,255,0.06)',
          },
          '&.btn-icon-only': {
            width: taruviTokens.size.iconButton,
            height: taruviTokens.size.iconButton,
            border: `${taruviTokens.size.iconButtonBorder}px solid ${dividerColor}`,
          },
        },
        sizeSmall: { padding: 4 },
        colorError: { color: taruviTokens.error[700] },
      },
    },

    // ─ Chips (pill, bold uppercase)
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: taruviTokens.radius.pill,
          fontFamily: FONT_TITLE,
          fontWeight: 700,
          fontSize: taruviTokens.fontSize.chip,        // 11px
          letterSpacing: taruviTokens.letterSpacing.chip,
          textTransform: 'uppercase',
          height: taruviTokens.size.chipMd,            // 24px
          paddingLeft: 4,
          paddingRight: 4,
        },
        sizeSmall: {
          height: taruviTokens.size.chipSm,            // 20px
          fontSize: taruviTokens.fontSize.chipSm,      // 10px
        },
        outlined: { borderWidth: 1.5 },
        label: { paddingLeft: 8, paddingRight: 8 },
        // Color variants line up with MUI's color="success"/etc. These are
        // the **filled** treatments; the `variants` block below re-states
        // the outlined ones, because a `colorX` styleOverride also lands on
        // outlined chips (MUI's overridesResolver emits `color${Color}`
        // before `${variant}${Color}`) and would otherwise paint an
        // outlined chip with a fill it was never designed to carry.
        colorSuccess: {
          // white on `status.complete` (green[700]) is ~4.12:1 at the 11px
          // chip label size; `completeChip` (green[800]) takes it to
          // ~5.13:1 (WCAG 1.4.3).
          backgroundColor: taruviTokens.status.completeChip,
          color: '#fff',
        },
        colorInfo: { backgroundColor: taruviTokens.status.inProgress, color: '#fff' }, // ~4.6:1
        colorWarning: {
          backgroundColor: taruviTokens.status.review,
          // Dark label on the orange fill: white on this fill is only
          // ~2.7:1, while near-black text clears it comfortably — the same
          // fix pattern MuiAlert's `standardWarning` below uses.
          color: taruviTokens.text.primary,
          '& .MuiChip-deleteIcon': { color: taruviTokens.text.primary },
        },
        colorError: { backgroundColor: taruviTokens.error[700], color: '#fff' }, // ~5.0:1
      },
      // `theme.components.MuiChip.variants` is resolved *after*
      // `styleOverrides`, so these win over the `colorX` fills above — that
      // ordering is what makes the outlined entries effective.
      variants: [
        // Outlined chips: transparent fill, the tone moves onto the label
        // and border, mode-aware so it clears 4.5:1 in both themes. See
        // `outlinedChipFg` above for the reasoning.
        {
          props: { variant: 'outlined' as const, color: 'primary' as const },
          style: { backgroundColor: 'transparent', color: outlinedChipFg.primary, borderColor: outlinedChipFg.primary },
        },
        {
          props: { variant: 'outlined' as const, color: 'success' as const },
          style: { backgroundColor: 'transparent', color: outlinedChipFg.success, borderColor: outlinedChipFg.success },
        },
        {
          props: { variant: 'outlined' as const, color: 'info' as const },
          style: { backgroundColor: 'transparent', color: outlinedChipFg.info, borderColor: outlinedChipFg.info },
        },
        {
          props: { variant: 'outlined' as const, color: 'warning' as const },
          style: { backgroundColor: 'transparent', color: outlinedChipFg.warning, borderColor: outlinedChipFg.warning },
        },
        {
          props: { variant: 'outlined' as const, color: 'error' as const },
          style: { backgroundColor: 'transparent', color: outlinedChipFg.error, borderColor: outlinedChipFg.error },
        },
        // Tag-chip rotation palette — pastel fill + same-family dark label,
        // 8 entries. Pick one explicitly (`variant="tagBlue"`) or hash the
        // tag name to an index for deterministic per-name assignment (a
        // small `tagVariant()` helper). Values live in
        // `taruviTokens.tagPalette`.
        { props: { variant: 'tagBlue' as const },   style: { backgroundColor: taruviTokens.tagPalette[0].bg, color: taruviTokens.tagPalette[0].text, textTransform: 'none' } },
        { props: { variant: 'tagPurple' as const }, style: { backgroundColor: taruviTokens.tagPalette[1].bg, color: taruviTokens.tagPalette[1].text, textTransform: 'none' } },
        { props: { variant: 'tagGreen' as const },  style: { backgroundColor: taruviTokens.tagPalette[2].bg, color: taruviTokens.tagPalette[2].text, textTransform: 'none' } },
        { props: { variant: 'tagOrange' as const }, style: { backgroundColor: taruviTokens.tagPalette[3].bg, color: taruviTokens.tagPalette[3].text, textTransform: 'none' } },
        { props: { variant: 'tagTeal' as const },   style: { backgroundColor: taruviTokens.tagPalette[4].bg, color: taruviTokens.tagPalette[4].text, textTransform: 'none' } },
        { props: { variant: 'tagPink' as const },   style: { backgroundColor: taruviTokens.tagPalette[5].bg, color: taruviTokens.tagPalette[5].text, textTransform: 'none' } },
        { props: { variant: 'tagLime' as const },   style: { backgroundColor: taruviTokens.tagPalette[6].bg, color: taruviTokens.tagPalette[6].text, textTransform: 'none' } },
        { props: { variant: 'tagRose' as const },   style: { backgroundColor: taruviTokens.tagPalette[7].bg, color: taruviTokens.tagPalette[7].text, textTransform: 'none' } },
      ],
    },

    // ─ Cards
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: taruviTokens.radius.xxl,        // 16px
          padding: taruviTokens.spacing.cardPadding,    // 28px
          boxShadow: isLight ? taruviTokens.shadow.card : taruviTokens.shadow.cardDark,
          backgroundImage: 'none',
          backgroundColor: isLight ? taruviTokens.surface.paper : '#1e1e1e',
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: { padding: 0, marginBottom: taruviTokens.spacing.cardTitleMb },
        title: {
          fontFamily: FONT_TITLE,
          fontSize: taruviTokens.fontSize.cardTitle,    // 12px
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: taruviTokens.letterSpacing.cardTitle,
          color: isLight ? taruviTokens.text.secondary : taruviTokens.neutral[300],
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: { padding: 0, '&:last-child': { paddingBottom: 0 } },
      },
    },

    // ─ Generic surface
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: 'none' },
        rounded: { borderRadius: taruviTokens.radius.xl }, // 12px default
      },
    },

    // ─ Form fields
    MuiTextField: {
      defaultProps: { size: 'small', variant: 'outlined' },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: taruviTokens.radius.lg,        // 8px
          backgroundColor: isLight ? taruviTokens.surface.inputBg : 'rgba(255,255,255,0.04)',
          fontFamily: FONT_BODY,
          fontSize: taruviTokens.fontSize.formInput,   // 16px
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: isLight ? taruviTokens.surface.borderInput : 'rgba(255,255,255,0.12)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: taruviTokens.button.primaryDefault,
            borderWidth: 1,
          },
          '&.Mui-focused': { boxShadow: taruviTokens.shadow.focusRing },
          '&.Mui-error .MuiOutlinedInput-notchedOutline': {
            borderColor: taruviTokens.error[700],
            borderWidth: 1,
          },
          // Disabled = reduced opacity, no pointer events
          '&.Mui-disabled': {
            opacity: 0.5,
            pointerEvents: 'none',
          },
          // Read-only = muted background, no border
          '&.Mui-readOnly': {
            backgroundColor: isLight ? taruviTokens.neutral[100] : 'rgba(255,255,255,0.06)',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
          },
        },
        input: {
          padding: `${taruviTokens.spacing.inputPaddingY}px ${taruviTokens.spacing.inputPaddingX}px`,
        },
        multiline: { padding: 0 },
      },
    },
    MuiFilledInput: {
      styleOverrides: {
        root: {
          borderRadius: taruviTokens.radius.lg,
          backgroundColor: isLight ? taruviTokens.surface.inputBg : 'rgba(255,255,255,0.04)',
          '&:hover': { backgroundColor: isLight ? '#eeeeee' : 'rgba(255,255,255,0.06)' },
          '&.Mui-focused': {
            backgroundColor: isLight ? taruviTokens.surface.inputBg : 'rgba(255,255,255,0.04)',
            boxShadow: taruviTokens.shadow.focusRing,
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontFamily: FONT_BODY,
          fontSize: taruviTokens.fontSize.formInput,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontFamily: FONT_BODY,
          fontSize: taruviTokens.fontSize.formLabel,    // 13px
          fontWeight: 600,
          color: isLight ? taruviTokens.text.primary : 'rgba(255,255,255,0.87)',
          '&.Mui-focused': { color: accentFg },
          '&.Mui-error': { color: taruviTokens.error[700] },
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontFamily: FONT_BODY,
          fontSize: taruviTokens.fontSize.formLabel,
          fontWeight: 600,
          '& .MuiFormLabel-asterisk': { color: taruviTokens.error[700], marginLeft: 2 },
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          fontFamily: FONT_BODY,
          fontSize: taruviTokens.fontSize.formHelper,   // 11px
          marginLeft: 4,
          marginTop: 4,
          color: isLight ? taruviTokens.text.muted : taruviTokens.neutral[400],
          '&.Mui-error': { color: taruviTokens.error[700] },
        },
      },
    },
    MuiSelect: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        select: {
          padding: `${taruviTokens.spacing.inputPaddingY}px ${taruviTokens.spacing.inputPaddingX}px`,
        },
      },
    },

    // ─ Tables
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: taruviTokens.radius.xl,        // 12px
          border: `1px solid ${dividerColor}`,
          backgroundColor: isLight ? taruviTokens.surface.paper : '#1e1e1e',
          overflowX: 'auto',
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: { borderCollapse: 'collapse' },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: isLight ? taruviTokens.neutral[50] : 'rgba(255,255,255,0.04)',
          borderBottom: `1px solid ${dividerColor}`,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontFamily: FONT_BODY,
          fontSize: taruviTokens.fontSize.tableCell,   // 13px
          padding: taruviTokens.spacing.tableCell,     // 12px 16px
          borderBottom: `1px solid ${isLight ? taruviTokens.surface.borderTableRow : 'rgba(255,255,255,0.06)'}`,
          color: isLight ? taruviTokens.text.primary : 'rgba(255,255,255,0.87)',
          verticalAlign: 'middle',
        },
        head: {
          fontFamily: FONT_TITLE,
          fontSize: taruviTokens.fontSize.tableHead,   // 11px
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: taruviTokens.letterSpacing.tableHead,
          color: isLight ? taruviTokens.text.muted : taruviTokens.neutral[400],
        },
        body: {
          fontFamily: FONT_BODY,
          fontSize: taruviTokens.fontSize.tableCell,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: isLight ? taruviTokens.primary[50] : 'rgba(30,136,229,0.08)',
          },
          // Selected row = primary-50 fill + 2px primary-default left border
          '&.Mui-selected': {
            backgroundColor: isLight ? taruviTokens.primary[50] : 'rgba(30,136,229,0.12)',
            boxShadow: `inset 2px 0 0 ${taruviTokens.button.primaryDefault}`,
            '&:hover': {
              backgroundColor: isLight ? taruviTokens.primary[100] : 'rgba(30,136,229,0.18)',
            },
          },
          '&:last-child td': { borderBottom: 'none' },
        },
      },
    },

    // ─ DataGrid (mirrors MuiTable* styling so DataGrid-based list pages
    //   and hand-rolled <Table> pages look identical)
    MuiDataGrid: {
      // v7 takes the header height from the `columnHeaderHeight` **prop**
      // (default 56), not from CSS: `.MuiDataGrid-columnHeaders` carries only
      // `width`, so the `minHeight`/`maxHeight`/`lineHeight` this block used to
      // declare on that slot were inert and the header rendered at 56px.
      //
      // `defaultProps` is honoured, not just `styleOverrides`:
      // `useDataGridProps` runs `getThemeProps({ name: 'MuiDataGrid' })` and
      // only falls back to `DATA_GRID_PROPS_DEFAULT_VALUES` for keys the theme
      // left unset — so all three list grids pick up 44px without repeating
      // the prop per page.
      defaultProps: {
        columnHeaderHeight: 44,
      },
      styleOverrides: {
        root: {
          borderRadius: taruviTokens.radius.xl,
          border: `1px solid ${dividerColor}`,
          backgroundColor: isLight ? taruviTokens.surface.paper : '#1e1e1e',
          fontFamily: FONT_BODY,
          fontSize: taruviTokens.fontSize.tableCell,                     // 13px
          // The header band's tint belongs on this variable, not on the
          // `columnHeaders` slot. v7 paints every `[role=row]` inside
          // `.MuiDataGrid-container--top` with `--DataGrid-containerBackground`
          // (default `palette.background.default`), and the header row
          // *is* one of those rows — it is a child of `.MuiDataGrid-columnHeaders`,
          // so it painted the default background straight over any tint set
          // on its parent. Colouring the variable tints the element that
          // actually ends up on top.
          //
          // Scope-checked in the installed source: this variable is read in
          // exactly one rule (`container--top` / `container--bottom` rows).
          // Pinned cells read a separate `--DataGrid-pinnedBackground`, so this
          // cannot leak into them.
          //
          // The dark value is translucent, which is safe only because every list
          // uses `autoHeight`: the header's container is `position: sticky`, but
          // with `autoHeight` the scroller never scrolls vertically, so no row
          // ever passes under it. A grid with a fixed height needs an opaque
          // value here or rows will show through the header band.
          '--DataGrid-containerBackground': isLight
            ? taruviTokens.neutral[50]
            : 'rgba(255,255,255,0.04)',
          // List pages use `autoHeight` (no fixed pixel height), and
          // `autoHeight` collapses DataGrid overlays to 0px. That silently
          // hides the loading skeleton and every empty state rendered
          // through `slots.noRowsOverlay` — a real regression, not a
          // cosmetic one. Reserving the height here rather than per page
          // keeps every grid from drifting to a different value. Only the
          // overlay is sized; the grid itself still grows with its rows.
          '--DataGrid-overlayHeight': '320px',
          // Keyboard cell/header navigation must be visible — WCAG 2.4.7. This
          // used to be `outline: 'none'` with no replacement, which made
          // arrow-key navigation invisible in every grid.
          //
          // Deliberately `:focus` / `:focus-within` rather than `:focus-visible`:
          // DataGrid moves focus programmatically as you arrow around, and
          // whether `:focus-visible` matches a scripted `.focus()` is a browser
          // heuristic we can't verify here. A stray ring after a mouse click is
          // a cosmetic cost; a missing ring for keyboard users is a blocker.
          //
          // MUI's own default is a 1px ring at alpha 0.5 (well under the 3:1
          // floor); 2px solid measures ~3.2–3.7:1 in light (paper / header /
          // selected row) and ~4.5–5.1:1 in dark — above the 3:1 non-text
          // floor throughout.
          '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within':
            {
              outline: `2px solid ${taruviTokens.button.primaryDefault}`,
              outlineOffset: '-2px',
            },
        },
        // Height now comes from `defaultProps.columnHeaderHeight`, and the tint
        // from `--DataGrid-containerBackground` on `root`. All this slot still
        // owns is the divider under the header, which draws on this element's
        // own bottom edge — below the header row, so it stays visible.
        columnHeaders: {
          borderBottom: `1px solid ${dividerColor}`,
        },
        // Header labels share the cells' 16px inset (see `cell` below), which is
        // also what `MuiTableCell` uses for both head and body — the parity this
        // whole block exists for. v7 ships `padding: 0 10px` on headers and
        // cells alike, so before this the header inset was 10px against the
        // cells' 16px.
        //
        // Worth knowing: for the *centred* columns this is cosmetically neutral
        // (a symmetric inset doesn't move the centre) and it costs 12px of label
        // room, since `GridColumnHeaderTitle` truncates with an ellipsis. It
        // only bites on a narrow right-aligned column — e.g. a 72px actions
        // column leaves ~40px for "ACTIONS", which needs ~57px at 11px/0.06em
        // and so was already truncating at the old 10px inset.
        columnHeader: {
          // 16px matches the `cell` inset above, so a header label sits on the
          // same leading edge as the values under it. v7 ships `0 10px` on both,
          // and this block's job is `MuiTableCell` parity (16px head and body).
          //
          // No horizontal alignment override: headers inherit v7's left default
          // and line up with the left-aligned values. A previous revision
          // centred the title container here — reverted. Note if you ever
          // reconsider: `headerAlign` has no default (the string column type
          // sets `align: 'left'` but leaves `headerAlign` undefined, and
          // `GridColumnHeaderItem` only adds `columnHeader--alignLeft` when
          // it is *explicitly* `'left'`), so a rule hung on `--alignLeft`
          // silently matches nothing.
          paddingLeft: 16,
          paddingRight: 16,
        },
        columnHeaderTitle: {
          fontFamily: FONT_TITLE,
          fontSize: taruviTokens.fontSize.tableHead,                     // 11px
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: taruviTokens.letterSpacing.tableHead,
          color: isLight ? taruviTokens.text.muted : taruviTokens.neutral[400],
        },
        // Horizontal padding only. v7 ships `padding: 0 10px` on cells on
        // purpose: it centres content vertically via
        // `line-height: calc(var(--height) - 1px)`, so vertical padding shifts
        // text down by that amount — the old `12px 16px` sat every row of every
        // list ~11px low. Vertical centring here comes from `alignItems`
        // instead, which is why `lineHeight` is handed back to `inherit`; the
        // two mechanisms must not both be live.
        //
        // `display: flex` is exactly what v7's own `cell--flex` class does for
        // `column.display: 'flex'`, applied to every cell rather than per
        // column. It is what makes the alignment slots below work at all:
        // `.MuiDataGrid-cell` is `flex: 0 0 auto`, a flex *item* of the row and
        // not a container, so the `justifyContent` on `cell--text*` is inert
        // until the cell becomes a container. Flex was chosen over
        // `text-align: center` because it is the only one of the two that also
        // centres block-level children — several `renderCell`s return a
        // `<Stack>`, which `text-align` would leave hugging the left edge and
        // the top of the row.
        //
        // Trade-off: a flex cell no longer applies its own
        // `text-overflow: ellipsis` to a bare string child. Nothing here relies
        // on that — all data columns render through `renderCell` — but a new
        // column that emits long unwrapped text (or a bare `valueFormatter`
        // string) must ellipsize in its own element.
        cell: {
          display: 'flex',
          alignItems: 'center',
          lineHeight: 'inherit',
          padding: '0 16px',
          borderBottom: `1px solid ${isLight ? taruviTokens.surface.borderTableRow : 'rgba(255,255,255,0.06)'}`,
        },
        // Horizontal alignment is deliberately left to v7's own rules — it
        // already ships `justify-content: flex-start / center / flex-end` on
        // `cell--textLeft / --textCenter / --textRight`, and left is the default.
        // So list values hug the leading edge while the `alignItems: center`
        // above keeps them centred in the row.
        //
        // There is deliberately no `cell--textLeft` override here. An earlier
        // revision centred it horizontally; that was reverted as a house-style
        // decision. Don't re-add it — set `align`/`headerAlign` on the specific
        // column instead if one genuinely needs centring.
        row: {
          '&:hover': {
            backgroundColor: isLight ? taruviTokens.primary[50] : 'rgba(30,136,229,0.08)',
          },
          '&.Mui-selected': {
            backgroundColor: isLight ? taruviTokens.primary[50] : 'rgba(30,136,229,0.12)',
            boxShadow: `inset 2px 0 0 ${taruviTokens.button.primaryDefault}`,
            '&:hover': {
              backgroundColor: isLight ? taruviTokens.primary[100] : 'rgba(30,136,229,0.18)',
            },
          },
        },
        footerContainer: {
          borderTop: `1px solid ${dividerColor}`,
          minHeight: 44,
        },
        checkboxInput: {
          color: isLight ? taruviTokens.neutral[400] : taruviTokens.neutral[500],
          '&.Mui-checked': { color: taruviTokens.button.primaryDefault },
        },
      },
    },

    // ─ Navigation (AppBar + Drawer)
    MuiAppBar: {
      defaultProps: { elevation: 0, color: 'inherit' },
      styleOverrides: {
        root: {
          minHeight: taruviTokens.size.navHeight,      // 64px
          boxShadow: taruviTokens.shadow.nav,
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: taruviTokens.size.navHeight,
          gap: 16,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          borderRight: `1px solid ${dividerColor}`,
          boxShadow: taruviTokens.shadow.sidebar,
        },
      },
    },

    // ─ Sidebar list items
    MuiListItem: {
      styleOverrides: {
        root: { padding: 0 },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: taruviTokens.radius.md,
          fontFamily: FONT_TITLE,
          fontWeight: 600,
          fontSize: taruviTokens.fontSize.h6,          // 13px
          padding: taruviTokens.spacing.sidebarItem,   // 10px 12px
          minHeight: taruviTokens.size.sidebarItemMinHeight,
          color: isLight ? taruviTokens.text.secondary : taruviTokens.neutral[300],
          transition: taruviTokens.transition.fast,
          '&.Mui-selected': {
            backgroundColor: taruviTokens.status.inProgress, // blue[700]
            color: '#fff',
            '& .MuiListItemIcon-root': { color: '#fff' },
            '&:hover': { backgroundColor: taruviTokens.button.primaryHover },
          },
          '&:hover': {
            backgroundColor: isLight ? taruviTokens.neutral[100] : 'rgba(255,255,255,0.06)',
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: isLight ? taruviTokens.text.muted : taruviTokens.neutral[400],
          minWidth: 36,
          fontSize: 20,
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          fontFamily: FONT_BODY,
          fontWeight: 400,
          fontSize: taruviTokens.fontSize.h6,
        },
      },
    },

    // ─ Breadcrumbs
    MuiBreadcrumbs: {
      styleOverrides: {
        root: {
          fontFamily: FONT_BODY,
          fontSize: taruviTokens.fontSize.breadcrumb,  // 14px
          padding: '10px 0',
        },
        separator: {
          color: isLight ? taruviTokens.text.muted : taruviTokens.neutral[400],
        },
        li: {
          '&:last-child': {
            fontSize: taruviTokens.fontSize.breadcrumbCurrent, // 16px
            fontWeight: 600,
            color: isLight ? taruviTokens.text.primary : 'rgba(255,255,255,0.87)',
          },
        },
      },
    },

    // ─ Status / alert messages
    MuiAlert: {
      defaultProps: { variant: 'standard' },
      styleOverrides: {
        root: {
          borderRadius: taruviTokens.radius.lg,         // 8px
          fontFamily: FONT_BODY,
          fontSize: taruviTokens.fontSize.p2,          // 14px
          padding: taruviTokens.spacing.statusMsg,     // 14px 18px
          borderLeft: '4px solid',
          alignItems: 'flex-start',
        },
        icon: { fontSize: 20, marginTop: 1 },
        message: { padding: 0 },
        standardSuccess: {
          backgroundColor: taruviTokens.success[50],
          // `completeChip`, not `complete`: the alert icon is a meaningful
          // graphic (WCAG 1.4.11 → 3:1) and green[700] on this tint is only
          // ~3.7:1; green[800] gives ~4.6:1.
          borderLeftColor: taruviTokens.status.completeChip,
          color: isLight ? taruviTokens.text.primary : 'rgba(255,255,255,0.87)',
          '& .MuiAlert-icon': { color: taruviTokens.status.completeChip },
        },
        standardError: {
          backgroundColor: taruviTokens.error[50],
          borderLeftColor: taruviTokens.error[700],
          color: isLight ? taruviTokens.text.primary : 'rgba(255,255,255,0.87)',
          '& .MuiAlert-icon': { color: taruviTokens.error[700] },
        },
        standardInfo: {
          backgroundColor: taruviTokens.primary[100],
          borderLeftColor: taruviTokens.status.inProgress,
          color: isLight ? taruviTokens.text.primary : 'rgba(255,255,255,0.87)',
          '& .MuiAlert-icon': { color: taruviTokens.status.inProgress },
        },
        standardWarning: {
          backgroundColor: taruviTokens.warning[50],
          // `warning[500]` (orange[500]) on this tint is under the 3:1 floor
          // for the icon (1.4.11); `warning[800]` (`deepOrange[900]`) gives
          // ~5.1:1.
          borderLeftColor: taruviTokens.warning[800],
          color: isLight ? taruviTokens.text.primary : 'rgba(255,255,255,0.87)',
          '& .MuiAlert-icon': { color: taruviTokens.warning[800] },
        },
      },
    },
    MuiAlertTitle: {
      styleOverrides: {
        root: { fontFamily: FONT_TITLE, fontWeight: 700, fontSize: '0.875rem' },
      },
    },

    // ─ Tooltip
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: taruviTokens.neutral[900],
          color: '#fff',
          fontFamily: FONT_BODY,
          fontSize: '0.75rem',
          borderRadius: taruviTokens.radius.sm,        // 2px
          padding: '6px 10px',
        },
        arrow: { color: taruviTokens.neutral[900] },
      },
    },

    // ─ Divider
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: dividerColor },
      },
    },

    // ─ Links
    MuiLink: {
      defaultProps: { underline: 'hover' },
      styleOverrides: {
        root: {
          // Mode-aware via `accentFg`: ≥6:1 in light, ≥7.5:1 in dark, on
          // every surface links land on in this theme. A single hex pinned
          // across both modes would fail one of them — a mid-ramp blue that
          // passes on a light card typically drops under 4.5:1 on a dark one.
          color: accentFg,
          fontWeight: 500,
          fontFamily: FONT_BODY,
        },
      },
    },

    // ─ Avatars
    MuiAvatar: {
      styleOverrides: {
        root: {
          width: taruviTokens.size.avatarMd,
          height: taruviTokens.size.avatarMd,
          fontFamily: FONT_TITLE,
          fontWeight: 700,
          fontSize: taruviTokens.fontSize.h6,
        },
      },
    },

    // ─ Accordion (collapsible form section)
    // Flat by default: no shadow, no top divider line, no extra margin
    // when expanded. Pair with `<ExpandMoreRoundedIcon />`.
    MuiAccordion: {
      defaultProps: { elevation: 0, disableGutters: true },
      styleOverrides: {
        root: {
          boxShadow: 'none',
          border: `1px solid ${dividerColor}`,
          borderRadius: taruviTokens.radius.lg,
          backgroundImage: 'none',
          // Hide the default 1px line on top of every accordion
          '&::before': { display: 'none' },
          '&:not(:last-child)': { marginBottom: 8 },
          '&.Mui-expanded': { margin: '0 0 8px 0' },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          minHeight: 48,
          fontFamily: FONT_BODY,
          fontWeight: 600,
          fontSize: taruviTokens.fontSize.formLabel,   // 13px
          '&.Mui-expanded': { minHeight: 48 },
        },
        content: {
          '&.Mui-expanded': { margin: '12px 0' },
        },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          padding: '0 16px 16px',
        },
      },
    },

    // ─ Dialog / modal
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: taruviTokens.radius.xxl,
          padding: taruviTokens.spacing.cardPadding,
          boxShadow: isLight ? taruviTokens.shadow.card : taruviTokens.shadow.cardDark,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontFamily: FONT_TITLE,
          fontSize: taruviTokens.fontSize.h4,          // 18px
          fontWeight: 700,
          padding: 0,
          marginBottom: 16,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: { root: { padding: 0 } },
    },
    // Confirmation-dialog body — body2 size, secondary color
    MuiDialogContentText: {
      styleOverrides: {
        root: {
          fontFamily: FONT_BODY,
          fontSize: taruviTokens.fontSize.p2,        // 14px
          lineHeight: taruviTokens.lineHeight.body,
          color: isLight ? taruviTokens.text.secondary : taruviTokens.neutral[300],
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: 0,
          marginTop: taruviTokens.spacing.formActionsMt,
          gap: taruviTokens.spacing.formActionsGap,
          justifyContent: 'flex-end',
        },
      },
    },

    // ─ Tabs
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 40,
          borderBottom: `1px solid ${dividerColor}`,
        },
        indicator: { backgroundColor: taruviTokens.button.primaryDefault, height: 3 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontFamily: FONT_TITLE,
          fontSize: taruviTokens.fontSize.btnMd,       // 13px
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: taruviTokens.letterSpacing.button,
          minHeight: 40,
          // The 3px indicator below stays on `primaryDefault` (non-text, 3:1);
          // the selected *label* is text, so it takes the AA accent.
          '&.Mui-selected': { color: accentFg },
        },
      },
    },

    // ─ Checkboxes / switches
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: isLight ? taruviTokens.neutral[400] : taruviTokens.neutral[500],
          '&.Mui-checked': { color: taruviTokens.button.primaryDefault },
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          color: isLight ? taruviTokens.neutral[400] : taruviTokens.neutral[500],
          '&.Mui-checked': { color: taruviTokens.button.primaryDefault },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          '&.Mui-checked': {
            color: taruviTokens.button.primaryDefault,
            '& + .MuiSwitch-track': { backgroundColor: taruviTokens.button.primaryDefault },
          },
        },
      },
    },

    // ─ Progress
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: taruviTokens.radius.sm, height: 6 },
        bar: { borderRadius: taruviTokens.radius.sm },
      },
    },
    MuiCircularProgress: {
      defaultProps: { color: 'primary' },
    },

    // ─ Skeleton loader
    MuiSkeleton: {
      defaultProps: { animation: 'wave' },
      styleOverrides: {
        root: {
          backgroundColor: isLight ? taruviTokens.neutral[100] : 'rgba(255,255,255,0.08)',
        },
        text: {
          borderRadius: taruviTokens.radius.sm,
        },
        rounded: {
          borderRadius: taruviTokens.radius.xl,
        },
      },
    },
  };
};

// ─── Light theme ─────────────────────────────────────────────────────
export const lightThemeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      // `primaryFill` (blue[700]), not `primaryDefault` (blue[600]):
      // `primary.main` is what MUI pairs with `contrastText` for every
      // `color="primary"` surface it derives itself — filled/outlined
      // primary chips (the active-filter chip row on every list page) and
      // the bulk-selection toolbar among them. White on blue[600] is
      // ~3.7:1; on blue[700] it is ~4.6:1.
      main: taruviTokens.button.primaryFill,     // blue[700]
      light: taruviTokens.primary[400],
      dark: taruviTokens.button.primaryHover,    // blue[800]
      contrastText: '#ffffff',
    },
    secondary: {
      main: taruviTokens.secondary[700],         // purple[700]
      light: taruviTokens.secondary[300],
      dark: taruviTokens.secondary[900],
      contrastText: '#ffffff',
    },
    error: {
      // `error[700]`, not `error[500]` (MUI's own literal default `error.main`):
      // white on `error[500]` is only ~3.7:1. `error[700]` clears ~5.0:1.
      main: taruviTokens.error[700],
      light: taruviTokens.error[300],
      dark: taruviTokens.error[800],
      contrastText: '#ffffff',
    },
    warning: {
      // `warning[800]` (`deepOrange[900]`), not a mid-ramp orange: white
      // text on any true "orange" shade light enough to still read as
      // orange lands well under 4.5:1 — this is the one role in the
      // palette where MUI's own literal default (`#ed6c02`, ~3.1:1) also
      // falls short, so this theme picks a shade that actually passes
      // rather than reproducing that gap.
      main: taruviTokens.warning[800],
      light: taruviTokens.warning[200],
      dark: '#8a2409',
      contrastText: '#ffffff',
    },
    info: {
      main: taruviTokens.status.inProgress,      // blue[700] — aliases primary; ~4.6:1
      light: taruviTokens.primary[300],
      dark: taruviTokens.button.primaryHover,
      contrastText: '#ffffff',
    },
    success: {
      main: taruviTokens.success[800],           // green[800] — white text ~5.1:1
      light: taruviTokens.success[300],
      dark: taruviTokens.success[900],
      contrastText: '#ffffff',
    },
    grey: {
      50: taruviTokens.neutral[50],
      100: taruviTokens.neutral[100],
      200: taruviTokens.neutral[200],
      300: taruviTokens.neutral[300],
      400: taruviTokens.neutral[400],
      500: taruviTokens.neutral[500],
      600: taruviTokens.neutral[600],
      700: taruviTokens.neutral[700],
      800: taruviTokens.neutral[800],
      900: taruviTokens.neutral[900],
    },
    background: {
      default: taruviTokens.surface.bg,          // grey[100]
      paper: taruviTokens.surface.paper,         // white
    },
    text: {
      primary: taruviTokens.text.primary,        // rgba(0,0,0,0.87) — MUI's own default
      secondary: taruviTokens.text.secondary,    // rgba(0,0,0,0.6) — MUI's own default
      disabled: taruviTokens.neutral[400],
    },
    divider: taruviTokens.surface.borderLight,
  },
  typography,
  shape,
  spacing,
  components: componentOverrides('light'),
};

// ─── Dark theme ──────────────────────────────────────────────────────
export const darkThemeOptions: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: taruviTokens.primary[400],
      light: taruviTokens.primary[300],
      dark: taruviTokens.primary[700],
      contrastText: taruviTokens.primary.dark,
    },
    secondary: {
      main: taruviTokens.secondary[300],
      light: taruviTokens.secondary[100],
      dark: taruviTokens.secondary[600],
      contrastText: '#000000',
    },
    error: {
      main: taruviTokens.error[300],
      light: taruviTokens.error[200],
      dark: taruviTokens.error[600],
      contrastText: '#000000',
    },
    warning: {
      main: taruviTokens.warning[300],
      light: taruviTokens.warning[200],
      dark: taruviTokens.warning[600],
      contrastText: '#000000',
    },
    info: {
      main: taruviTokens.primary[300],
      light: taruviTokens.primary[200],
      dark: taruviTokens.primary[600],
      contrastText: '#000000',
    },
    success: {
      main: taruviTokens.success[400],
      light: taruviTokens.success[200],
      dark: taruviTokens.success[700],
      contrastText: '#000000',
    },
    grey: {
      50: taruviTokens.neutral[50],
      100: taruviTokens.neutral[100],
      200: taruviTokens.neutral[200],
      300: taruviTokens.neutral[300],
      400: taruviTokens.neutral[400],
      500: taruviTokens.neutral[500],
      600: taruviTokens.neutral[600],
      700: taruviTokens.neutral[700],
      800: taruviTokens.neutral[800],
      900: taruviTokens.neutral[900],
    },
    background: {
      default: taruviTokens.neutral.darkest,     // #121212 — MUI's own actual dark-mode default
      paper: '#1e1e1e',                          // conventional Material dark-surface elevation tone
    },
    text: {
      primary: 'rgba(255,255,255,0.87)',         // MUI's own default dark-mode text.primary
      secondary: taruviTokens.neutral[300],
      disabled: taruviTokens.neutral[500],
    },
    divider: 'rgba(255,255,255,0.08)',
  },
  typography,
  shape,
  spacing,
  components: componentOverrides('dark'),
};
