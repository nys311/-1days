import React from "react";
import { ActionSubtype, BaseRoleId, CardType, KitSubtype } from "@minus1days/shared";

// Hand-authored, flat/geometric SVG icon set. Deliberately NOT photorealistic — this
// keeps the game legally clean (no scraped/stock art) and trivially re-themeable:
// every icon paints with `currentColor`, so a parent element's CSS `color`
// (usually one of the theme's `--type-*` / `--sub-*` vars) fully retints it.

export type IconComponent = React.FC<{ className?: string; style?: React.CSSProperties }>;

function Svg({
  className,
  style,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={style}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

// ---------- ACTION subtypes ----------

export const IconAttack: IconComponent = ({ className, style }) => (
  <Svg className={className} style={style}>
    <path d="M5 19 L17 7" />
    <path d="M13 5 L19 5 L19 11" />
    <path d="M19 5 L9 15" strokeWidth={1.1} opacity={0.5} />
  </Svg>
);

export const IconDefend: IconComponent = ({ className, style }) => (
  <Svg className={className} style={style}>
    <path d="M12 3 L19 6 V11 C19 16 16 19.5 12 21 C8 19.5 5 16 5 11 V6 Z" fill="currentColor" fillOpacity={0.12} />
    <path d="M9 12 L11 14 L15 9" />
  </Svg>
);

export const IconDeny: IconComponent = ({ className, style }) => (
  <Svg className={className} style={style}>
    <path d="M8 8 V5 M16 8 V5" />
    <rect x="6" y="8" width="12" height="7" rx="1.5" />
    <path d="M12 15 V19" />
    <path d="M4 20 L20 4" strokeWidth={2} />
  </Svg>
);

export const IconLucky: IconComponent = ({ className, style }) => (
  <Svg className={className} style={style}>
    <path d="M12 12 C12 8 9 6 6 7 C6 10 8 12.5 12 12 Z" />
    <path d="M12 12 C12 8 15 6 18 7 C18 10 16 12.5 12 12 Z" />
    <path d="M12 12 C12 16 9 18 6 17 C6 14 8 11.5 12 12 Z" />
    <path d="M12 12 C12 16 15 18 18 17 C18 14 16 11.5 12 12 Z" />
    <path d="M12 12 V21" />
  </Svg>
);

export const IconPhishing: IconComponent = ({ className, style }) => (
  <Svg className={className} style={style}>
    <rect x="3.5" y="6" width="17" height="12" rx="1.5" />
    <path d="M4 7 L12 13 L20 7" />
    <path d="M15 15.5 C15.5 14 17 13.6 17.8 14.4 C18.6 15.2 18 17 16 18.2" strokeWidth={1.2} opacity={0.7} />
  </Svg>
);

export const IconRansomware: IconComponent = ({ className, style }) => (
  <Svg className={className} style={style}>
    <rect x="5" y="11" width="14" height="9" rx="1.5" />
    <path d="M8 11 V7.5 A4 4 0 0 1 16 7.5 V11" />
    <path d="M12 14.5 V17" strokeWidth={2.2} />
  </Svg>
);

export const IconZeroday: IconComponent = ({ className, style }) => (
  <Svg className={className} style={style}>
    <ellipse cx="12" cy="13" rx="5" ry="6" />
    <path d="M9 8 L7 5 M15 8 L17 5 M7 13 H3 M21 13 H17 M9 18 L7 21 M15 18 L17 21" />
    <path d="M12 9 V17" strokeWidth={1.1} opacity={0.6} />
  </Svg>
);

export const IconBitcoin: IconComponent = ({ className, style }) => (
  <Svg className={className} style={style}>
    <circle cx="12" cy="12" r="8.5" />
    <path
      d="M10 7.5h3.2c1.4 0 2.3.7 2.3 1.9 0 1-.6 1.6-1.5 1.9 1.1.2 1.9.9 1.9 2.1 0 1.4-1.1 2.1-2.7 2.1H10M9.5 7.5v9M12.3 7.5v9M9 7.5H9M11 10.8h2.1M11 13.7h2.4"
      strokeWidth={1.2}
    />
  </Svg>
);

export const IconIncidentResponse: IconComponent = ({ className, style }) => (
  <Svg className={className} style={style}>
    <path d="M12 5 V19 M5 12 H19" strokeWidth={2.4} />
  </Svg>
);

// ---------- THE KERN special ACTION subtypes ----------

export const IconKernCoerce: IconComponent = ({ className, style }) => (
  <Svg className={className} style={style}>
    <circle cx="12" cy="8" r="3.2" />
    <path d="M6 20 C6 15.5 8.7 13 12 13 C15.3 13 18 15.5 18 20" />
    <path d="M3.5 15.5 L6.5 17 M20.5 15.5 L17.5 17" strokeWidth={1.2} opacity={0.7} />
  </Svg>
);

export const IconKernBadLuck: IconComponent = ({ className, style }) => (
  <Svg className={className} style={style}>
    <path d="M7 20 C4 20 4 16 7 16 C7 12 12 12 12 16 C12 12 17 12 17 16 C20 16 20 20 17 20" />
    <path d="M4 5 L9 9 M9 5 L4 9" strokeWidth={1.3} />
  </Svg>
);

export const IconKernCaesar: IconComponent = ({ className, style }) => (
  <Svg className={className} style={style}>
    <rect x="5" y="5" width="6.5" height="6.5" rx="1.2" />
    <rect x="12.5" y="12.5" width="6.5" height="6.5" rx="1.2" />
    <circle cx="8.25" cy="8.25" r="0.9" fill="currentColor" />
    <circle cx="15.75" cy="15.75" r="0.9" fill="currentColor" />
    <circle cx="15.75" cy="8.25" r="0.9" fill="currentColor" opacity={0.4} />
    <circle cx="8.25" cy="15.75" r="0.9" fill="currentColor" opacity={0.4} />
  </Svg>
);

// ---------- KIT subtypes ----------

export const IconEnergyDrink: IconComponent = ({ className, style }) => (
  <Svg className={className} style={style}>
    <rect x="8" y="5" width="8" height="15" rx="2" />
    <path d="M8 9 H16" opacity={0.5} />
    <path d="M13 9 L10.5 13 H13 L11 17" strokeWidth={1.4} />
  </Svg>
);

export const IconUpgrade: IconComponent = ({ className, style }) => (
  <Svg className={className} style={style}>
    <path d="M12 19 V6" strokeWidth={2} />
    <path d="M6.5 11.5 L12 6 L17.5 11.5" strokeWidth={2} />
  </Svg>
);

export const IconKernSuperUpgrade: IconComponent = ({ className, style }) => (
  <Svg className={className} style={style}>
    <path d="M12 20 V11" strokeWidth={2} />
    <path d="M7 15 L12 10 L17 15" strokeWidth={2} />
    <path d="M12 10 V4" strokeWidth={2} />
    <path d="M8.5 7 L12 4 L15.5 7" strokeWidth={2} />
  </Svg>
);

// ---------- generic per-CardType glyphs (used on back faces + fallbacks) ----------

export const IconBaseRoleGeneric: IconComponent = ({ className, style }) => (
  <Svg className={className} style={style}>
    <path d="M4 9 L12 4 L20 9 L12 14 Z" />
    <path d="M7 11 V16 C7 18 9.5 19.5 12 20 C14.5 19.5 17 18 17 16 V11" />
  </Svg>
);

export const IconPersonaGeneric: IconComponent = ({ className, style }) => (
  <Svg className={className} style={style}>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M5 20 C5 15.5 8 13 12 13 C16 13 19 15.5 19 20" />
  </Svg>
);

export const IconActionGeneric: IconComponent = ({ className, style }) => (
  <Svg className={className} style={style}>
    <path d="M13 3 L5 13 H11 L9.5 21 L19 10 H13 Z" />
  </Svg>
);

export const IconKitGeneric: IconComponent = ({ className, style }) => (
  <Svg className={className} style={style}>
    <path d="M9 4 L15 4 L15 7 L18 7 L18 20 L6 20 L6 7 L9 7 Z" />
    <path d="M9 7 V4 M15 7 V4" />
  </Svg>
);

export const IconFlag: IconComponent = ({ className, style }) => (
  <Svg className={className} style={style}>
    <path d="M6 3 V21" strokeWidth={2} />
    <path d="M6 4 H17 L14.5 7.5 L17 11 H6" fill="currentColor" fillOpacity={0.18} />
  </Svg>
);

export const IconTokenGeneric: IconComponent = ({ className, style }) => (
  <Svg className={className} style={style}>
    <path d="M2.5 12 C5 7 9 5 12 5 C15 5 19 7 21.5 12 C19 17 15 19 12 19 C9 19 5 17 2.5 12 Z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

// ---------- base roles ----------

export const IconWhitehat: IconComponent = ({ className, style }) => (
  <Svg className={className} style={style}>
    <path d="M4 15 C4 10 7.5 7 12 7 C16.5 7 20 10 20 15" fill="currentColor" fillOpacity={0.15} />
    <path d="M3 15 H21" strokeWidth={2} />
    <path d="M9 7 C9 5 10 3.5 12 3.5 C14 3.5 15 5 15 7" />
  </Svg>
);

export const IconBlackhat: IconComponent = ({ className, style }) => (
  <Svg className={className} style={style}>
    <path d="M4 15 C4 10 7.5 7 12 7 C16.5 7 20 10 20 15" fill="currentColor" fillOpacity={0.55} />
    <path d="M3 15 H21" strokeWidth={2} />
    <path d="M9 7 C9 5 10 3.5 12 3.5 C14 3.5 15 5 15 7" fill="currentColor" fillOpacity={0.55} />
  </Svg>
);

export const IconInspector: IconComponent = ({ className, style }) => (
  <Svg className={className} style={style}>
    <circle cx="10.5" cy="10.5" r="6" />
    <path d="M15 15 L20.5 20.5" strokeWidth={2.2} />
  </Svg>
);

export const IconInsider: IconComponent = ({ className, style }) => (
  <Svg className={className} style={style}>
    <path d="M4 10 C4 7 7.5 5 12 5 C16.5 5 20 7 20 10 C20 14 17 15.5 17 18 C17 19.5 15.5 20 14 19 L12 17.5 L10 19 C8.5 20 7 19.5 7 18 C7 15.5 4 14 4 10 Z" />
    <circle cx="9.3" cy="10.5" r="1" fill="currentColor" />
    <circle cx="14.7" cy="10.5" r="1" fill="currentColor" />
  </Svg>
);

// ---------- zone backdrops ----------

export const IconKernCore: IconComponent = ({ className, style }) => (
  <Svg className={className} style={style}>
    <rect x="7" y="7" width="10" height="10" rx="1.5" />
    <path d="M12 3 V7 M12 17 V21 M3 12 H7 M17 12 H21 M5.5 5.5 L8 8 M18.5 5.5 L16 8 M5.5 18.5 L8 16 M18.5 18.5 L16 16" />
    <circle cx="12" cy="12" r="2" />
  </Svg>
);

export const IconServerCore: IconComponent = ({ className, style }) => (
  <Svg className={className} style={style}>
    <rect x="4" y="4" width="16" height="6" rx="1.2" />
    <rect x="4" y="14" width="16" height="6" rx="1.2" />
    <circle cx="7.5" cy="7" r="0.8" fill="currentColor" />
    <circle cx="7.5" cy="17" r="0.8" fill="currentColor" />
    <path d="M11 7 H17 M11 17 H17" opacity={0.6} />
  </Svg>
);

// ---------- lookup helpers ----------

export function getActionSubtypeIcon(subtype: ActionSubtype): IconComponent {
  switch (subtype) {
    case ActionSubtype.ATTACK:
      return IconAttack;
    case ActionSubtype.DEFEND:
      return IconDefend;
    case ActionSubtype.DENY:
      return IconDeny;
    case ActionSubtype.LUCKY:
      return IconLucky;
    case ActionSubtype.PHISHING:
      return IconPhishing;
    case ActionSubtype.RANSOMWARE:
      return IconRansomware;
    case ActionSubtype.ZERODAY:
      return IconZeroday;
    case ActionSubtype.BITCOIN:
      return IconBitcoin;
    case ActionSubtype.INCIDENT_RESPONSE:
      return IconIncidentResponse;
    case ActionSubtype.KERN_COERCE:
      return IconKernCoerce;
    case ActionSubtype.KERN_BAD_LUCK:
      return IconKernBadLuck;
    case ActionSubtype.KERN_CAESAR:
      return IconKernCaesar;
    default:
      return IconActionGeneric;
  }
}

export function getKitSubtypeIcon(subtype: KitSubtype): IconComponent {
  switch (subtype) {
    case KitSubtype.ENERGY_DRINK:
      return IconEnergyDrink;
    case KitSubtype.UPGRADE:
      return IconUpgrade;
    case KitSubtype.KERN_SUPER_UPGRADE:
      return IconKernSuperUpgrade;
    default:
      return IconKitGeneric;
  }
}

export function getCardTypeIcon(type: CardType): IconComponent {
  switch (type) {
    case CardType.BASE_ROLE:
      return IconBaseRoleGeneric;
    case CardType.PERSONA:
      return IconPersonaGeneric;
    case CardType.ACTION:
      return IconActionGeneric;
    case CardType.KIT:
      return IconKitGeneric;
    case CardType.FLAG:
      return IconFlag;
    case CardType.TOKEN:
      return IconTokenGeneric;
    default:
      return IconActionGeneric;
  }
}

export function getBaseRoleIcon(id: BaseRoleId): IconComponent {
  switch (id) {
    case BaseRoleId.WHITEHAT:
      return IconWhitehat;
    case BaseRoleId.BLACKHAT:
      return IconBlackhat;
    case BaseRoleId.INSPECTOR:
      return IconInspector;
    case BaseRoleId.INSIDER:
      return IconInsider;
    default:
      return IconBaseRoleGeneric;
  }
}
