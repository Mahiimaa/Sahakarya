/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
    colors: {
      'p': '#6C77EE',
      's': '#FF9800',
      'white': '#FFFFFF', 
      'dark-grey': '#212121', 
      'light-grey': '#F5F5F5',
      't': '#F5F5F5',
      'error': '#FF0000',
      'success': '#4CAF50',
      'iborder' : "#babfbb"
    },
    fontFamily: {
      'poppins': ['Poppins', 'sans-serif'],
    },
    fontSize: {
      main: ['36px', { lineHeight: '1.1' }],
      h1: ['32px', { lineHeight: '1.2' }],
        h2: ['24px', { lineHeight: '1.3' }],
        h3: ['18px', { lineHeight: '1.4' }],
        body: ['16px', { lineHeight: '1.5' }],
        small: ['14px', { lineHeight: '1.4' }],
    },
    fontWeight: {
      'bold': '700',
      'semi-bold': '600',
      'regular': '400', 
    },
    screens: {
      'mob': '0px',
      'desk': '768px',
    },
  },
  plugins: [],
}

