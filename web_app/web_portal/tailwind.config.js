/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        header: ['"Palatino Linotype"', '"Book Antiqua"', 'Palatino', 'serif'],
        body: ['"Open Sans"', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f0f2fb',
          100: '#e1e5f7',
          200: '#c2cbef',
          300: '#a3b1e7',
          400: '#8497df',
          500: '#1a237e', // Primary Color from Dart app
          600: '#171f6f',
          700: '#131a5e',
          800: '#10164e',
          900: '#0d123d',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
