import type { Config } from "tailwindcss";
import { tailwindPreset } from "@investri/ui";

export default {
  content: ["./app/**/*.{ts,tsx}"],
  presets: [tailwindPreset as unknown as Config],
} satisfies Config;
