export const tokens = {
  color: {
    paper: "#F7F4EF",
    card: "#FFFFFF",
    navy: "#0B1F33",
    navyMuted: "rgba(11, 31, 51, 0.72)",
    ocean: "#1F4E6B",
    green: "#2F6F5E",
    ink: "#0B1F33",
    muted: "rgba(11, 31, 51, 0.62)",
    hairline: "rgba(11, 31, 51, 0.10)",
    hairlineStrong: "rgba(11, 31, 51, 0.16)",
    wash: "rgba(11, 31, 51, 0.03)",
    overlayEnd: "rgba(11, 31, 51, 0.70)",
    overlayStart: "rgba(11, 31, 51, 0.00)",
    risk: "#8A3B2F",
    white: "#FFFFFF",
  },
  space: {
    8: 8,
    12: 12,
    16: 16,
    24: 24,
    32: 32,
    48: 48,
  },
  radius: {
    sm: 2,
    md: 4,
    lg: 8,
  },
  type: {
    display: "Newsreader",
    ui: "Geist",
    uiFallback: "Inter",
    labelTracking: 1.4,
  },
  photo: {
    cardRatio: 4 / 5,
    detailRatio: 16 / 9,
  },
  allocation: [
    { key: "housing", label: "Housing / workforce housing", color: "#1F4E6B" },
    { key: "lending", label: "Small business lending", color: "#3C6E8F" },
    { key: "historic", label: "Historic redevelopment", color: "#6B8A9A" },
    { key: "manufacturing", label: "Manufacturing", color: "#0B1F33" },
    { key: "innovation", label: "Innovation", color: "#2F6F5E" },
    { key: "resiliency", label: "Resiliency / clean energy", color: "#8AA3B0" },
  ],
} as const;

export type DesignTokens = typeof tokens;
