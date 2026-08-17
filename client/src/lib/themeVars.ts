import type { CardType } from "@minus1days/shared";

// Both `THEME_VAR_KEYS` (see theme/vars.ts) and the shared enums use the same
// PascalCase/UPPER_SNAKE naming, so a card's CardType/ActionSubtype/KitSubtype value
// maps straight onto its CSS custom property name — no per-value lookup table to keep
// in sync as the catalog grows (e.g. a future 4th persona reversal ability, a new
// action subtype, etc. all "just work" as long as the theme manifest defines the var).

function toKebab(value: string): string {
  return value.toLowerCase().replace(/_/g, "-");
}

export function typeAccentVar(type: CardType): string {
  return `var(--type-${toKebab(type)})`;
}

export function subtypeAccentVar(subtype: string): string {
  return `var(--sub-${toKebab(subtype)})`;
}
