/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#030504',
          900: '#070B08',
          850: '#0D130F',
          800: '#121C15',
          700: '#1B2A20',
          600: '#253B2D',
        },
        brand: {
          green: '#00FF66',
          greenDark: '#00CC52',
          cyan: '#00FF66', // Electric green mapped to cyan classes
          blue: '#10B981', // Accent emerald
          emerald: '#10B981',
          teal: '#00FF66',
          amber: '#F59E0B',
          red: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'cyan-glow': '0 0 25px rgba(0, 255, 102, 0.25)',
        'green-glow': '0 0 25px rgba(0, 255, 102, 0.35)',
        'blue-glow': '0 0 25px rgba(16, 185, 129, 0.25)',
      }
    },
  },
  plugins: [],
}

