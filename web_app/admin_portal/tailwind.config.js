/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#38a9f6',
          500: '#0e8ce1',
          600: '#066fc0',
          700: '#06599c',
          800: '#0a4c80',
          900: '#0e406a',
          950: '#092946',
        },
      },
    },
  },
  plugins: [],
}
