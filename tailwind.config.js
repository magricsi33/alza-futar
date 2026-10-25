/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./resources/**/*.blade.php",
    "./resources/**/*.js",
  ],
  theme: {
    extend: {
      container: {
        center: true,
        screens: {
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1350px',
        },
      },
      colors: {
        // New design system colors (provided by user)
        primary: {
          DEFAULT: '#4828d7',
          50: "#ede9fb",
          100: "#dad4f7",
          200: "#b6a9ef",
          300: "#917ee7",
          400: "#6c53df",
          500: "#4828d7",
          600: "#3920ac",
          700: "#2b1881",
          800: "#1d1056",
          900: "#0e082b",
          950: "#0a061e"
        },
        secondary: {
          DEFAULT: '#21ab7b',
          50: "#eafbf5",
          100: "#d4f7eb",
          200: "#a9efd6",
          300: "#7ee7c2",
          400: "#54deae",
          500: "#29d69a",
          600: "#21ab7b",
          700: "#18815c",
          800: "#10563d",
          900: "#082b1f",
          950: "#061e15"
        },
        tertiary: {
          DEFAULT: '#ebdbf0',
          50: "#f5edf8",
          100: "#ebdbf0",
          200: "#d8b6e2",
          300: "#c492d3",
          400: "#b06dc5",
          500: "#9d49b6",
          600: "#7d3a92",
          700: "#5e2c6d",
          800: "#3f1d49",
          900: "#1f0f24",
          950: "#160a1a"
        },
        success: {
          DEFAULT: '#D4FE60',
          50: '#f7ffec',
          100: '#f0ffd6',
          200: '#e0ffad',
          300: '#c6ff75',
          400: '#acff4d',
          500: '#D4FE60',
          600: '#b9e64f',
          700: '#8fb43a',
          800: '#617f27',
          900: '#364b13',
        },
        highlight : {
          DEFAULT: '#FAAB42',
          50: '#fff4e6',
          100: '#ffe8cc',
          200: '#ffd199',
          300: '#ffb966',
          400: '#ffa033',
          500: '#FAAB42',
          600: '#cc8835',
          700: '#99662a',
          800: '#664419',
          900: '#33220c',
        },
        background: {
          DEFAULT: '#ffffff',
        },
      },
    },
  },
  plugins: [],
}

