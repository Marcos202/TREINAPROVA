import type { Config } from "tailwindcss";
import nativewindPreset from "nativewind/preset";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  important: "html",
  presets: [nativewindPreset],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;
