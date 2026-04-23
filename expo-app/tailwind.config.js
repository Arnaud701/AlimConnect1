/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './context/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // hsl(145, 45%, 22%) → #1F5134
        primary: {
          DEFAULT: '#1F5134',
          foreground: '#FFFFFF',
        },
        // hsl(140, 25%, 94%) → #ECF4EE
        secondary: {
          DEFAULT: '#ECF4EE',
          foreground: '#1F5134',
        },
        // hsl(145, 35%, 88%) → #D6EBDE
        accent: {
          DEFAULT: '#D6EBDE',
          foreground: '#1A4528',
        },
        // hsl(140, 15%, 95%) → #F0F4F2
        muted: {
          DEFAULT: '#F0F4F2',
          foreground: '#677E73',
        },
        destructive: {
          DEFAULT: '#DC2828',
          foreground: '#FFFFFF',
        },
        // hsl(140, 15%, 90%) → #E2E9E6
        border: '#E2E9E6',
        // hsl(0, 0%, 99%) → #FCFCFC
        background: '#FCFCFC',
        // hsl(150, 20%, 10%) → #141F1A
        foreground: '#141F1A',
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#141F1A',
        },
        // hsl(38, 92%, 50%) → #F59F0A
        warning: '#F59F0A',
        // hsl(145, 60%, 40%) → #29A35C
        success: '#29A35C',
      },
      fontFamily: {
        sans: ['DMSans_400Regular'],
        display: ['PlayfairDisplay_700Bold'],
      },
    },
  },
  plugins: [],
};
