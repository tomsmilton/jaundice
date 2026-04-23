/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        reading: '#1f2937',
        photo: '#0369a1',
        exchange: '#6b21a8',
      },
    },
  },
  plugins: [],
};
