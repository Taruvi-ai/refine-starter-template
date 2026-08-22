import { ThemeOptions } from "@mui/material/styles";
// Augments MUI's `components` type with MuiDataGrid so the override below typechecks.
import type {} from "@mui/x-data-grid/themeAugmentation";

/**
 * Taruvi Design System — MUI Theme
 * Source of truth: taruvi-design-system.html
 *
 * Every numeric value below is taken DIRECTLY from the design system
 * (font sizes, weights, paddings, radii, shadows, letter-spacings).
 *
 * Note on radii: the `radius.*` block intentionally runs ~50% softer than
 * the raw design-system values (see comments inside the block). Other
 * tokens stay faithful to the spec.
 */

// ─── Module augmentation: custom MUI variants ────────────────────────
// Adds 4 category/tag chip variants that match the design system's
// pastel rotation palette. Usage: `<Chip variant="tagBlue" label="…" />`
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
const FONT_BODY = "'Open Sans', sans-serif";
const FONT_TITLE = "'Quicksand', sans-serif";

// Primary accent hex, hoisted so `button.primaryDefault` and the focus-ring
// shadow token can never drift apart. Measured: 3.68:1 on white paper,
// 3.34:1 on the page background, 3.32:1 on the input fill, 4.04–5.03:1 on the
// dark surfaces — above the 3:1 WCAG 1.4.11 floor for a *non-text* focus
// indicator, but below the 4.5:1 text floor, which is why text-bearing
// surfaces use `button.primaryFill` instead.
const PRIMARY_ACCENT = '#1E88E5';

// ─── Brand tokens (full ramps + every named color from the spec) ────
export const taruviTokens = {
  font: {
    body: FONT_BODY,
    title: FONT_TITLE,
  },

  primary: {
    50: '#F2FBFF',
    100: '#E0F6FE',
    200: '#C6EFFD',
    300: '#9DE5FD',
    400: '#6ED8FB',
    500: '#3EC7F5',
    600: '#0A93C4',
    700: '#1AB3E6',
    800: '#056A8F',
    900: '#003652',
    dark: '#002A3C',
  },

  neutral: {
    50: '#FAFAFA',
    100: '#F4F5F5',
    200: '#E9EBEC',
    300: '#C9CECF',
    400: '#B8BFC1',
    500: '#929C9F',
    600: '#7E8A8D',
    700: '#596365',
    800: '#363B3D',
    900: '#121414',
    darkest: '#00090B',
  },

  secondary: {
    50: '#E6F0F5',
    100: '#BFDAE8',
    200: '#99C4DB',
    300: '#73ADCE',
    400: '#4D97C1',
    500: '#2680B4',
    600: '#00699A',
    700: '#004369',
    800: '#03435B',
    900: '#002A3C',
  },

  success: {
    50: '#e6f4ef',
    100: '#c1e6d8',
    200: '#9ad7c0',
    300: '#81c784',
    400: '#4caf50',
    500: '#10B981',
    600: '#0a7d5a',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },

  warning: {
    50: '#fff8e1',
    100: '#ffecb3',
    200: '#ffd54f',
    300: '#ffca28',
    400: '#f59e0b',
    500: '#f57c00',
    600: '#ef6c00',
    700: '#e65100',
    800: '#bf360c',
  },

  error: {
    50: '#fce4ec',
    100: '#f8bbd0',
    200: '#f48fb1',
    300: '#f06292',
    400: '#ec407a',
    500: '#d81b60',
    600: '#c2185b',
    700: '#ad1457',
    800: '#880e4f',
    900: '#560027',
  },

  // Primary button states (filled blue button system)
  button: {
    primaryDefault: PRIMARY_ACCENT,
    // AA fill/foreground for *text-bearing* primary surfaces. White on
    // #1E88E5 is only 3.68:1 (WCAG 1.4.3 wants 4.5:1); white on #1976d2 is
    // 4.60:1. Same value as `status.inProgress` — the design system's chip /
    // link blue — exposed here under a button-semantic name. `primaryDefault`
    // stays the brand accent for non-text uses (focus rings, borders, the tab
    // indicator, checkbox/switch fills) where 3:1 is the bar.
    primaryFill: '#1976d2',
    primaryHover: '#1565C0',
    primaryActive: '#0D47A1',
    primaryDisabled: '#BBDEFB',
    primaryDisabledText: '#999999',
  },

  // Status / chart colors
  status: {
    complete: '#388e3c',
    // `complete` carries a white chip label at only 4.12:1. `completeChip` is
    // the AA fill for filled success chips and the success-alert accent
    // (white on #2e7d32 = 5.13:1; #2e7d32 on the success-alert tint = 4.53:1).
    // Same Material green family, one step darker. Keep `complete` for
    // non-text uses (chart marks, borders).
    completeChip: '#2e7d32',
    inProgress: '#1976d2',
    review: '#f57c00',
    delayed: '#c2185b',
    onHold: '#7b1fa2',
    todo: '#00acc1',
    open: '#19b3e5',
    resolved: '#008751',
    underReview: '#FF8C00',
    delayedAlt: '#C71585',
    onHoldAlt: '#8B1A72',
    chartPrimary: '#1e88f5',
  },

  // Tag / category chips
  //
  // The design system uses a **pastel rotation palette** for category chips
  // (pastel fill + same-hue dark label). Extended from 4 to 8 entries so a
  // tenant with more than four categories can still give each one a distinct
  // preset. Also exposed as MuiChip variants `tagBlue`/`tagPurple`/`tagGreen`/
  // `tagOrange`/`tagTeal`/`tagPink`/`tagLime`/`tagRose` — prefer those over
  // reading raw values. Index order here matches that variant order, and
  // entries 0–3 keep their original values so any colour already assigned to
  // a category stays put.
  tag: {
    fillBg: '#E0F6FE',     // legacy single-fill (kept for backward compat)
    fillText: '#004369',
    outlineColor: '#1976d2',
  },
  // Every pair is ≥4.5:1 label-on-fill (measured, WCAG 1.4.3), the fills are
  // all L*93–96 / C*8–16 so the set reads as one family, and the minimum
  // pairwise CIEDE2000 between any two fills is 7.5 (tagPurple↔tagPink) —
  // comfortably above the ~2.3 just-noticeable threshold. Every fill is ≥24
  // ΔE2000 from every saturated `status.*` chip tone, so a category chip can't
  // be mistaken for a status chip. Entries 4–7 were placed at the four widest
  // gaps in the original four's Lab hue circle (h110 / h190 / h330 / h35).
  tagPalette: [
    { bg: '#E0F6FE', text: '#004369' }, // blue   — 9.36:1
    { bg: '#EDE7F6', text: '#4527A0' }, // purple — 8.47:1
    { bg: '#E8F5E9', text: '#1B5E20' }, // green  — 7.00:1
    { bg: '#FFF3E0', text: '#BF360C' }, // orange — 5.11:1 (was #E65100, only 3.46:1)
    { bg: '#C8F7F3', text: '#00514D' }, // teal   — 7.90:1
    { bg: '#FFE5FB', text: '#68315B' }, // pink   — 8.19:1
    { bg: '#EFF0D1', text: '#41480E' }, // lime   — 8.37:1
    { bg: '#FFE4DF', text: '#732F2C' }, // rose   — 8.02:1
  ],

  // Tab / surface tokens
  surface: {
    bg: '#f3f4f6',
    paper: '#ffffff',
    inputBg: '#F3F3F5',
    borderLight: 'rgba(0,0,0,0.08)',
    borderInput: 'rgba(0,0,0,0.1)',
    borderTableRow: 'rgba(0,0,0,0.04)',
    navWhiteBorder: '#e5e7eb',
    navBlue: '#2b97ff',
    navDark: '#004369',
    navDarkAccent: '#9de5fd',
    navWhiteText: '#101828',
  },

  // Text colors
  text: {
    primary: '#121414',
    secondary: '#596365',
    muted: '#929C9F',
    onDark: '#ffffff',
  },

  // Shadows
  shadow: {
    card: '0 2px 12px rgba(0,0,0,0.07)',
    cardDark: '0 2px 12px rgba(0,0,0,0.40)',
    nav: '0 2px 8px rgba(0,0,0,0.12)',
    sidebar: '0 2px 8px rgba(0,0,0,0.08)',
    swatch: '0 1px 6px rgba(0,0,0,0.10)',
    // 2px **solid** ring — design calls for "ring outline (2px, --ring-color)".
    // It used to be rgba(30,136,229,0.35), which composited to 1.53:1 against
    // white and 1.49:1 against the input fill: far under the 3:1 WCAG 1.4.11
    // floor for a focus indicator. Solid measures 3.68:1 on paper, 3.34:1 on
    // the page background, 3.32:1 on the input fill, and 4.04–5.03:1 on the
    // dark surfaces.
    focusRing: `0 0 0 2px ${PRIMARY_ACCENT}`,
  },

  // Border radii (toned down ~50% from the design-system defaults)
  radius: {
    none: 0,
    sm: 3,    // tooltip                          (orig 6)
    md: 4,    // buttons, icon-button, sidebar    (orig 8)
    lg: 6,    // form inputs, status messages     (orig 10)
    xl: 8,    // navbars, sidebar containers      (orig 12)
    xxl: 10,  // cards, TOC                       (orig 16)
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
    // Design spec: form vertical rhythm
    formLabelToInput: 8,    // gap between label and input
    formInputToHelper: 4,   // gap between input and helper / error text
    formFieldGap: 16,       // gap between adjacent fields in a stack
    formSectionGap: 32,     // gap between form sections
    // Design spec: input padding 12×16 (pairs with 40px standard input height)
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
    formInput: '1rem',       // 16px — design spec (also prevents iOS Safari from zooming on focus)
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

// ─── Typography (precise design system spec) ────────────────────────
const typography: ThemeOptions['typography'] = {
  fontSize: 13, // base for MUI's rem calculations (matches body p3)
  fontFamily: FONT_BODY,
  htmlFontSize: 16,

  // Headings — Quicksand. Spec gives semi-bold (600) and bold/extra-bold variants;
  // we use the heavier of the pair so headings read with brand weight.
  h1: {
    fontFamily: FONT_TITLE,
    fontSize: taruviTokens.fontSize.h1,         // 36px
    fontWeight: 800,                            // extra-bold
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

  // Body sizes (Open Sans)
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

  // Subtitles ≈ Quicksand subheading rules
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

  // Buttons — Quicksand uppercase 700, 0.04em
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

const shape = { borderRadius: taruviTokens.radius.md }; // 8px default
const spacing = 8;

// ─── Component overrides (every spec'd surface) ─────────────────────
const componentOverrides = (mode: 'light' | 'dark'): ThemeOptions['components'] => {
  const isLight = mode === 'light';
  const dividerColor = isLight ? taruviTokens.surface.borderLight : 'rgba(255,255,255,0.08)';

  // The accent used as a *foreground* (link text, text/outlined button labels,
  // selected tab, focused field label). `button.primaryDefault` is only
  // 3.68:1 on white — fine for a 2px ring (1.4.11 → 3:1), short of the 4.5:1
  // text floor (1.4.3).
  //
  // Light uses `button.primaryHover` (#1565C0), not `primaryFill` (#1976d2).
  // #1976d2 clears 4.5:1 only on paper (4.60:1) and drops to 4.18:1 on
  // `background.default` and 4.39:1 on a hovered `primary[50]` row — and this
  // app puts blue foregrounds on exactly those surfaces (chart-legend links,
  // the ticket-number column and other in-row links, mailto/tel links). A tone
  // that passes only on paper is a latent failure that returns the moment
  // someone hovers a row. #1565C0 measures 5.75 paper / 5.22 page bg / 5.48
  // hovered row / 5.14 primary[100] — uniformly passing, no per-surface caveat.
  // `primaryFill` stays the AA *fill* for white-on-blue (contained buttons,
  // `palette.primary.main`); this is its foreground counterpart.
  //
  // Dark needs a light tone — `primary[300]` is 11.92:1 on the dark card,
  // 13.27:1 on the dark page background, 10.85:1 on a hovered row.
  const accentFg = isLight ? taruviTokens.button.primaryHover : taruviTokens.primary[300];
  // Hover/active step for that accent: darker in light, lighter in dark, so the
  // label keeps ≥4.5:1 over the tinted hover fill — measured 7.45–8.23:1 in
  // light, 11.00:1 in dark. (Colour alone is a weak state signal at this step;
  // the hover affordance is `MuiLink`'s underline and the buttons' tint fill.)
  const accentFgHover = isLight ? taruviTokens.button.primaryActive : taruviTokens.primary[200];
  const accentTintHover = isLight ? '#e3f0fb' : 'rgba(30,136,229,0.16)';

  // Chip label tones for the **outlined** variant. A filled chip puts the
  // design-system tone in the background behind a white/dark label; an
  // outlined chip puts that tone *on the label*, so it has to clear the 4.5:1
  // text floor against every surface a chip can land on — paper, the page
  // background, and the `primary[50]` hover/selected row fill. Worst-case
  // measurements are in the comments; the lowest of the eight is 4.66:1.
  const outlinedChipFg = isLight
    ? {
        primary: taruviTokens.button.primaryHover, // 5.75 / 5.22 / 5.48
        success: taruviTokens.status.completeChip, // 5.13 paper / 4.66 page bg / 4.89 row
        info: taruviTokens.button.primaryHover,    // 5.75 / 5.22 / 5.48 — status.inProgress is only 4.18 on the page bg
        warning: taruviTokens.warning[800],        // 5.60 / 5.09 / 5.34
        error: taruviTokens.error[600],            // 5.87 / 5.34 / 5.60
      }
    : {
        primary: taruviTokens.primary[300],  // 11.92 / 10.30
        success: taruviTokens.success[300],  // 8.26 dark paper / 7.14 dark selected row
        info: taruviTokens.primary[300],     // 11.92 / 10.30
        warning: taruviTokens.warning[300],  // 10.86 / 9.39
        error: taruviTokens.error[300],      // 5.43 / 4.70
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
          backgroundColor: isLight ? taruviTokens.surface.bg : '#0b1518',
          color: isLight ? taruviTokens.text.primary : '#f8fafc',
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
          borderRadius: taruviTokens.radius.md,           // 8px (toned via radius block)
          fontFamily: FONT_TITLE,
          fontWeight: 700,
          letterSpacing: taruviTokens.letterSpacing.button,
          textTransform: 'uppercase',
          boxShadow: 'none',
          transition: taruviTokens.transition.base,
          gap: 6,
          // Design spec: 44px min touch target on coarse pointers (mobile/tablet) — WCAG 2.5.5
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
          // `primaryFill`, not `primaryDefault`: white on #1E88E5 is 3.68:1,
          // white on #1976d2 is 4.60:1 (WCAG 1.4.3). Hover 5.75:1, active 8.63:1.
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
            // label (`primary[300]`) lands on a near-white fill at 1.20:1.
            backgroundColor: accentTintHover,
            borderColor: accentFgHover,
            color: accentFgHover,
          },
        },
        containedError: {
          backgroundColor: taruviTokens.error[600],
          color: '#fff',
          '&:hover': { backgroundColor: taruviTokens.error[800], boxShadow: 'none' },
        },
        outlinedError: {
          borderWidth: 2,
          borderColor: taruviTokens.error[600],
          color: taruviTokens.error[600],
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
            color: accentFgHover, // 5.37:1 on the light tint, 11.12:1 on the dark one
          },
        },
      },
    },

    // ─ Icon button — 8px radius + design-system hover.
    //   The design system's "Icon-Only Button" (38×38 with a 1.5px border)
    //   is opt-in via className "btn-icon-only" so we don't bracket every
    //   inline icon affordance in the codebase with a heavy border.
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
        colorError: { color: taruviTokens.error[600] },
      },
    },

    // ─ Chips (pill, Quicksand 700 uppercase, 0.06em)
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
        // Color variants line up with MUI's color="success"/etc. These are the
        // **filled** treatments; the `variants` block below re-states the
        // outlined ones, because a `colorX` styleOverride also lands on
        // outlined chips (MUI's overridesResolver emits `color${Color}` before
        // `${variant}${Color}`) and would otherwise paint an outlined chip with
        // a fill it was never designed to carry.
        colorSuccess: {
          // white on `status.complete` #388e3c is 4.12:1 at the 11px chip label
          // size; `completeChip` #2e7d32 takes it to 5.13:1 (WCAG 1.4.3).
          backgroundColor: taruviTokens.status.completeChip,
          color: '#fff',
        },
        colorInfo: { backgroundColor: taruviTokens.status.inProgress, color: '#fff' }, // 4.60:1
        colorWarning: {
          backgroundColor: taruviTokens.status.review,
          // Dark label on the orange fill: white on #f57c00 is 2.70:1, whereas
          // `text.primary` on it is 6.84:1. This is the fix UI_Guidelines §3
          // prescribed for this token ("use dark text on that fill").
          color: taruviTokens.text.primary,
          '& .MuiChip-deleteIcon': { color: taruviTokens.text.primary },
        },
        colorError: { backgroundColor: taruviTokens.error[600], color: '#fff' }, // 5.87:1
      },
      // `theme.components.MuiChip.variants` is resolved *after* `styleOverrides`,
      // so these win over the `colorX` fills above — that ordering is what makes
      // the outlined entries effective.
      variants: [
        // Outlined chips (priority chips — UI_Guidelines §2): transparent fill,
        // the tone moves onto the label and border, mode-aware so it clears
        // 4.5:1 in both themes. See `outlinedChipFg` for the measurements.
        {
          // The active-filter chip row (§4.1) is `variant="outlined" color="primary"`
          // and often sits on the page background, where `primary.main` is 4.18:1.
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
        // Tag-chip rotation palette (UI_Guidelines §2) — pastel fill + same-hue
        // dark label, 8 entries. Pick one explicitly (`variant="tagBlue"`) or
        // hash the tag name to an index for deterministic per-name assignment
        // (a small `tagVariant()` helper). Values and their measured label
        // contrast live in `taruviTokens.tagPalette`.
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

    // ─ Cards (16px radius, 28px padding, soft shadow)
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: taruviTokens.radius.xxl,        // 16px
          padding: taruviTokens.spacing.cardPadding,    // 28px
          boxShadow: isLight ? taruviTokens.shadow.card : taruviTokens.shadow.cardDark,
          backgroundImage: 'none',
          backgroundColor: isLight ? taruviTokens.surface.paper : '#11202a',
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
          borderRadius: taruviTokens.radius.lg,        // 10px
          backgroundColor: isLight ? taruviTokens.surface.inputBg : 'rgba(255,255,255,0.04)',
          fontFamily: FONT_BODY,
          fontSize: taruviTokens.fontSize.formInput,   // 14px
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
            borderColor: taruviTokens.error[600],
            borderWidth: 1,
          },
          // Design spec: disabled = opacity 0.5, no pointer events
          '&.Mui-disabled': {
            opacity: 0.5,
            pointerEvents: 'none',
          },
          // Design spec: read-only = muted background, no border
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
          '&:hover': { backgroundColor: isLight ? '#ECECEF' : 'rgba(255,255,255,0.06)' },
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
          color: isLight ? taruviTokens.text.primary : '#f8fafc',
          '&.Mui-focused': { color: accentFg },
          '&.Mui-error': { color: taruviTokens.error[600] },
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontFamily: FONT_BODY,
          fontSize: taruviTokens.fontSize.formLabel,
          fontWeight: 600,
          '& .MuiFormLabel-asterisk': { color: taruviTokens.error[600], marginLeft: 2 },
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
          '&.Mui-error': { color: taruviTokens.error[600] },
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
          backgroundColor: isLight ? taruviTokens.surface.paper : '#11202a',
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
          color: isLight ? taruviTokens.text.primary : '#f8fafc',
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
          // Design spec: selected row = primary-50 fill + 2px primary-default left border
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
    //   and hand-rolled <Table> pages look identical — UI_Guidelines §4.7)
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
          borderRadius: taruviTokens.radius.xl,                          // 8px (toned)
          border: `1px solid ${dividerColor}`,
          backgroundColor: isLight ? taruviTokens.surface.paper : '#11202a',
          fontFamily: FONT_BODY,
          fontSize: taruviTokens.fontSize.tableCell,                     // 13px
          // The header band's tint belongs on this variable, not on the
          // `columnHeaders` slot. v7 paints every `[role=row]` inside
          // `.MuiDataGrid-container--top` with `--DataGrid-containerBackground`
          // (default `palette.background.default` = #f3f4f6), and the header row
          // *is* one of those rows — it is a child of `.MuiDataGrid-columnHeaders`,
          // so it painted #f3f4f6 straight over any tint set on its parent.
          // Colouring the variable tints the element that actually ends up on top.
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
          // List pages use `autoHeight` (UI_Guidelines §4.1 — no fixed pixel
          // height), and `autoHeight` collapses DataGrid overlays to 0px. That
          // silently hides the loading skeleton and every §4.5 empty state
          // rendered through `slots.noRowsOverlay` — a real regression, not a
          // cosmetic one. Reserving the height here rather than per page keeps
          // three grids from drifting to three different values. Only the
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
          // MUI's own default is a 1px ring at alpha 0.5 (≈1.9:1 on white,
          // under the 3:1 floor); 2px solid measures 3.51–3.68:1 in light
          // (paper / header / selected row) and 3.90–4.52:1 in dark.
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
          // and line up with the left-aligned values (UI_Guidelines §4.7). A
          // previous revision centred the title container here — reverted. Note
          // if you ever reconsider: `headerAlign` has no default (the string
          // column type sets `align: 'left'` but leaves `headerAlign` undefined,
          // and `GridColumnHeaderItem` only adds `columnHeader--alignLeft` when
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
        // on that — all 21 data columns across the three lists render through
        // `renderCell` — but a new column that emits long unwrapped text (or a
        // bare `valueFormatter` string) must ellipsize in its own element.
        // See UI_Guidelines §4.7.
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
        // So list values hug the leading edge (UI_Guidelines §4.7) while the
        // `alignItems: center` above keeps them centred in the row.
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
            backgroundColor: taruviTokens.status.inProgress, // #1976d2
            color: '#fff',
            '& .MuiListItemIcon-root': { color: '#fff' },
            '&:hover': { backgroundColor: '#1565c0' },
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
            color: isLight ? taruviTokens.text.primary : '#f8fafc',
          },
        },
      },
    },

    // ─ Status / alert messages
    MuiAlert: {
      defaultProps: { variant: 'standard' },
      styleOverrides: {
        root: {
          borderRadius: taruviTokens.radius.lg,         // 10px
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
          // `completeChip` over `complete`: the alert icon is a meaningful
          // graphic (WCAG 1.4.11 → 3:1) and #388e3c on this tint is only
          // 3.64:1; #2e7d32 gives 4.53:1.
          borderLeftColor: taruviTokens.status.completeChip,
          color: isLight ? taruviTokens.text.primary : '#f8fafc',
          '& .MuiAlert-icon': { color: taruviTokens.status.completeChip },
        },
        standardError: {
          backgroundColor: taruviTokens.error[50],
          borderLeftColor: taruviTokens.error[600],
          color: isLight ? taruviTokens.text.primary : '#f8fafc',
          '& .MuiAlert-icon': { color: taruviTokens.error[600] },
        },
        standardInfo: {
          backgroundColor: taruviTokens.primary[100],
          borderLeftColor: taruviTokens.status.inProgress,
          color: isLight ? taruviTokens.text.primary : '#f8fafc',
          '& .MuiAlert-icon': { color: taruviTokens.status.inProgress },
        },
        standardWarning: {
          backgroundColor: taruviTokens.warning[50],
          // `warning[500]` #f57c00 on this tint is 2.55:1 — under the 3:1 floor
          // for the icon (1.4.11). `warning[800]` gives 5.27:1.
          borderLeftColor: taruviTokens.warning[800],
          color: isLight ? taruviTokens.text.primary : '#f8fafc',
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
          borderRadius: taruviTokens.radius.sm,        // 6px
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
          // Was pinned to #1976d2 in both modes: 3.61:1 on the dark card
          // (#11202a) — a text failure everywhere links appear in dark mode —
          // and only 4.18:1 on the light page background / 4.39:1 on a hovered
          // row. Now mode-aware via `accentFg`: 5.22–5.75:1 light, 10.85–13.27:1
          // dark, on every surface links actually land on in this app.
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

    // ─ Accordion (collapsible form section — UI_Guidelines §4.3)
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
    // Confirmation-dialog body (UI_Guidelines §4.8) — body2 size, secondary color
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

    // ─ Skeleton loader (UI_Guidelines §4.10)
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
      // `primaryFill` (#1976d2), not `primaryDefault` (#1E88E5): `primary.main`
      // is what MUI pairs with `contrastText` for every `color="primary"`
      // surface it derives itself — filled/outlined primary chips (the
      // active-filter chip row on every list page) and the bulk-selection
      // toolbar among them. White on #1E88E5 is 3.68:1; on #1976d2 it is
      // 4.60:1, and #1976d2 as a label on paper is likewise 4.60:1.
      main: taruviTokens.button.primaryFill,     // #1976d2
      light: taruviTokens.primary[300],
      dark: taruviTokens.button.primaryActive,
      contrastText: '#ffffff',
    },
    secondary: {
      main: taruviTokens.secondary[700],         // #004369
      light: taruviTokens.secondary[300],
      dark: taruviTokens.secondary[900],
      contrastText: '#ffffff',
    },
    error: {
      main: taruviTokens.error[600],             // #c2185b
      light: taruviTokens.error[200],
      dark: taruviTokens.error[800],
      contrastText: '#ffffff',
    },
    warning: {
      main: taruviTokens.warning[500],           // #f57c00
      light: taruviTokens.warning[200],
      dark: taruviTokens.warning[700],
      contrastText: '#ffffff',
    },
    info: {
      main: taruviTokens.status.inProgress,      // #1976d2
      light: taruviTokens.primary[300],
      dark: taruviTokens.secondary[700],
      contrastText: '#ffffff',
    },
    success: {
      main: taruviTokens.success[500],           // #10B981
      light: taruviTokens.success[200],
      dark: taruviTokens.success[700],
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
      default: taruviTokens.surface.bg,          // #f3f4f6
      paper: taruviTokens.surface.paper,         // #ffffff
    },
    text: {
      primary: taruviTokens.text.primary,        // #121414
      secondary: taruviTokens.text.secondary,    // #596365
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
      contrastText: taruviTokens.secondary[900],
    },
    error: {
      main: taruviTokens.error[300],
      light: taruviTokens.error[200],
      dark: taruviTokens.error[600],
      contrastText: '#000000',
    },
    warning: {
      main: taruviTokens.warning[400],
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
      default: '#0b1518',
      paper: '#11202a',
    },
    text: {
      primary: '#f8fafc',
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
