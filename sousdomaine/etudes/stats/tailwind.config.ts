import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary:  '#1A7A3C',
        accent:   '#2D9CDB',
        danger:   '#E53935',
        card:     '#F8F9FA',
        textMain: '#111827',
      },
      borderRadius: { xl2: '16px' },
      boxShadow: { card: '0 2px 12px rgba(0,0,0,0.08)' },
      fontFamily: { sans: ['var(--font-inter)', 'Inter', 'Manrope', 'sans-serif'] },
    },
  },
  plugins: [],
}
export default config
