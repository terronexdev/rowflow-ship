import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          main: '#4caf50',
          light: '#81c784',
          dark: '#388e3c',
        },
        secondary: {
          main: '#2196f3',
          light: '#64b5f6',
          dark: '#1976d2',
        },
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false, // Disable Tailwind's reset to avoid conflicts with MUI
  },
};

export default config;

