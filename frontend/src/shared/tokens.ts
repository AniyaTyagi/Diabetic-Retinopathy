export const C = {
  navy: "#060F29",
  navyDark: "#03081A",
  navyBanner: "#0D1A40",
  navyCard: "#1A2457",
  bg: "#F6FAFC",
  card: "#FFFFFF",
  border: "#DBE3ED",
  borderLight: "#EBF1F7",
  textPrimary: "#121C2E",
  textSecondary: "#637385",

  // Figma primary brand violet / purple (#6129C7)
  indigo: "#6129C7",
  indigoHover: "#511DB5",
  indigoLight: "#F3EFFC",
  indigoDim: "#DDD0F7",
  purple: "#6129C7",
  purpleLight: "#F3EFFC",
  purpleDark: "#4D1FA3",

  // Figma Accents
  success: "#1AA16B",
  successLight: "#E8F7F0",
  successText: "#15803D",

  warning: "#F57A0F",
  warningLight: "#FEF4EB",
  warningText: "#B45309",

  danger: "#E83340",
  dangerLight: "#FDECED",
  dangerText: "#B91C1C",

  // Slate scales (aligned to Figma UI)
  slate50: "#F6FAFC",
  slate100: "#EEF3F8",
  slate200: "#DBE3ED",
  slate300: "#CBD5E1",
  slate400: "#94A3B8",
  slate500: "#637385",
  slate600: "#475569",
  slate700: "#334155",
  slate800: "#1E293B",
  slate900: "#121C2E",

  white: "#FFFFFF",
};

export const DR = [
  { level: 0, label: "No DR",            sublabel: "Normal",    short: "L0", color: "#1AA16B", bg: "#E8F7F0", text: "#15803D", referable: false },
  { level: 1, label: "Mild NPDR",        sublabel: "Mild",      short: "L1", color: "#65A30D", bg: "#ECFCCB", text: "#4D7C0F", referable: false },
  { level: 2, label: "Moderate NPDR",    sublabel: "Moderate",  short: "L2", color: "#F57A0F", bg: "#FEF4EB", text: "#B45309", referable: true  },
  { level: 3, label: "Severe NPDR",      sublabel: "Severe",    short: "L3", color: "#EA580C", bg: "#FEE2D5", text: "#C2410C", referable: true  },
  { level: 4, label: "Proliferative DR", sublabel: "PDR",       short: "L4", color: "#E83340", bg: "#FDECED", text: "#B91C1C", referable: true  },
] as const;
