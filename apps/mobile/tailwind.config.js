/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Brand Colors - Gold
        gold: {
          DEFAULT: '#F4C542',
          light: '#F9D77A',
          dark: '#C99412',
          secondary: '#E5A920',
        },
        
        // Luxury Dark Backgrounds
        luxury: {
          DEFAULT: '#0f0f0f',
          light: '#1a1a1a',
          lighter: '#262626',
        },
        
        // Background Colors
        background: {
          primary: '#0f0f0f',      // Main background
          secondary: '#1a1a1a',    // Cards
          tertiary: '#262626',     // Elevated surfaces
          nav: '#121212',          // Navigation
          card: '#1a1a1a',         // Cards
          surface: '#2a2a2a',      // Input backgrounds
        },
        
        // Text Colors
        text: {
          primary: '#ffffff',      // Main text
          secondary: '#9ca3af',    // Secondary text
          muted: '#6b7280',        // Muted text
          darkMuted: '#4b5563',    // Dark muted
          inverse: '#0f0f0f',      // Text on gold
        },
        
        // Border Colors
        border: {
          light: 'rgba(255, 255, 255, 0.05)',
          medium: '#333333',
          strong: '#F4C542',
        },
        
        // Status Colors
        status: {
          success: '#22c55e',
          error: '#EF4444',
          warning: '#F59E0B',
          live: '#dc2626',
        },
        
        // Legacy mappings (for backwards compatibility during migration)
        primary: {
          DEFAULT: '#F4C542',
          50: '#2a2210',
          100: '#3d3015',
          200: '#5c4818',
          300: '#7a601c',
          400: '#9a7a20',
          500: '#C99412',
          600: '#E5A920',
          700: '#F4C542',
          800: '#F9D77A',
          900: '#fceeb0',
          950: '#fff9e0',
        },
      },
      
      fontFamily: {
        sans: ['PlusJakartaSans', 'Plus Jakarta Sans', 'sans-serif'],
        jakarta: ['PlusJakartaSans', 'Plus Jakarta Sans', 'sans-serif'],
      },
      
      borderRadius: {
        'round': '500px',
      },
      
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
      
      boxShadow: {
        'gold-glow': '0 0 20px rgba(244, 197, 66, 0.2)',
        'gold-glow-strong': '0 0 30px rgba(244, 197, 66, 0.4)',
      },
    },
  },
  plugins: [],
}
