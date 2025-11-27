/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // NiceSchool color palette
        primary: {
          DEFAULT: '#0D6EFD',
          dark: '#0A58CA',
          light: '#3D8BFD',
          50: '#E7F1FF',
          100: '#CFE2FF',
          200: '#9EC5FE',
          300: '#6EA8FE',
          400: '#3D8BFD',
          500: '#0D6EFD',
          600: '#0A58CA',
          700: '#084298',
          800: '#052C65',
          900: '#031633'
        },
        secondary: {
          DEFAULT: '#6C757D',
          dark: '#495057',
          light: '#ADB5BD'
        },
        success: '#198754',
        danger: '#DC3545',
        warning: '#FFC107',
        info: '#0DCAF0',
        light: '#F8F9FA',
        dark: '#212529'
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        heading: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
      },
      boxShadow: {
        'card': '0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)',
        'card-hover': '0 0.5rem 1rem rgba(0, 0, 0, 0.15)',
        'nav': '0 0.5rem 1rem rgba(0, 0, 0, 0.15)'
      },
      borderRadius: {
        'card': '0.375rem'
      }
    },
  },
  plugins: [],
}
