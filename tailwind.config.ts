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
        teal: {
          DEFAULT: '#0F766E',
          soft: '#CCFBF1',
          hover: '#0D9488',
        },
        charcoal: '#15202B',
        ink: '#0F172A',
        slate: { DEFAULT: '#475569' },
        snow: '#F8FAFC',
        line: {
          DEFAULT: '#E2E8F0',
          soft: '#F1F5F9',
        },
        ok: '#059669',
        warn: '#D97706',
        danger: '#DC2626',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Source Sans 3', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Source Serif 4', 'Georgia', 'serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false, // Disable Tailwind's reset to avoid conflicts with MUI
  },
};

export default config;
