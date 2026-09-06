import { tokens } from "./tokens";

export const tailwindPreset = {
  theme: {
    extend: {
      colors: {
        paper: tokens.color.paper,
        card: tokens.color.card,
        navy: tokens.color.navy,
        ocean: tokens.color.ocean,
        status: tokens.color.green,
        hairline: tokens.color.hairline,
        wash: tokens.color.wash,
        risk: tokens.color.risk,
      },
      fontFamily: {
        display: ["var(--font-display)", tokens.type.display, "Georgia", "serif"],
        ui: ["var(--font-ui)", tokens.type.uiFallback, "system-ui", "sans-serif"],
      },
      letterSpacing: {
        label: "0.14em",
      },
      boxShadow: {
        none: "none",
        wash: "0 0 0 1px rgba(11, 31, 51, 0.06)",
      },
    },
  },
};
