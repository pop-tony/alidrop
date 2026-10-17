/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: { trade: { ink: '#1f2937', blue: '#1565c0', orange: '#ff6a00', canvas: '#f8fafc', line: '#e6ebf1', green: '#167c61' } },
      fontFamily: { sans: ['DM Sans', 'sans-serif'], display: ['Manrope', 'sans-serif'] },
      boxShadow: { card: '0 12px 35px rgba(23, 43, 77, .09)' },
    },
  },
  plugins: [],
};
