/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        border: 'var(--border)',
        muted: 'var(--text-muted)',
        brand: {
          50: 'var(--brand-50)',
          100: 'var(--brand-100)',
          400: 'var(--brand-400)',
          500: 'var(--brand-500)',
          600: 'var(--brand-600)',
          700: 'var(--brand-700)',
        },
      },
      backgroundImage: {
        'brand-gradient': 'var(--brand-gradient)',
      },
      boxShadow: {
        soft: '0 4px 24px rgba(37, 99, 235, 0.1)',
        card: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(37, 99, 235, 0.06)',
      },
    },
  },
  plugins: [],
};
