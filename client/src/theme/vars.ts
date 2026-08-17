// The full list of themeable CSS custom properties. Every theme manifest must supply
// a value for every key here — that's what makes "add a 3rd theme" a pure data change
// (a new manifest object + its assets) with zero component code touched.
//
// Naming: camelCase key -> `--kebab-case` CSS custom property, applied to the app
// root by ThemeProvider. Components reference them as `var(--kebab-case)` in CSS.

export const THEME_VAR_KEYS = [
  // base palette
  "bg",
  "bgElevated",
  "panel",
  "border",
  "borderStrong",
  "text",
  "textMuted",
  "textDim",
  "accent",
  "accentSoft",
  "danger",
  "success",
  "warning",
  "gold",
  "overlay",
  "shadowColor",

  // typography
  "fontDisplay",
  "fontBody",
  "fontMono",
  "letterSpacingWide",

  // card shell (shared across all card types)
  "cardRadius",
  "cardbackBg",
  "cardbackLine",
  "cardbackBorder",
  "frameBg",
  "frameBorder",

  // per-CardType accent (used on both the front frame stripe and the back glyph)
  "typeBaseRole",
  "typePersona",
  "typeAction",
  "typeKit",
  "typeFlag",
  "typeToken",

  // per-ActionSubtype / KitSubtype accent (suit icon tint)
  "subAttack",
  "subDefend",
  "subDeny",
  "subLucky",
  "subPhishing",
  "subRansomware",
  "subZeroday",
  "subBitcoin",
  "subIncidentResponse",
  "subKernCoerce",
  "subKernBadLuck",
  "subKernCaesar",
  "subEnergyDrink",
  "subUpgrade",
  "subKernSuperUpgrade",

  // decorative effect intensities (0..1), consumed by CSS animations/filters
  "scanlineOpacity",
  "glitchOpacity",
  "glowStrength",
] as const;

export type ThemeVarKey = (typeof THEME_VAR_KEYS)[number];
export type ThemeVars = Record<ThemeVarKey, string>;

export function cssVarName(key: ThemeVarKey): string {
  return `--${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`;
}
