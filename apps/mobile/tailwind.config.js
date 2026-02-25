/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Primary Brand Colors
        primary: {
          DEFAULT: '#6391F2',
          blue: '#6391F2',
          soft: '#B2CBEC',
          lavender: '#9CA9DE',
          foreground: '#FFFFFF',
        },

        // Backgrounds & Surfaces
        background: {
          DEFAULT: '#F2F1F8',
          main: '#F2F1F8',
          card: '#FFFFFF',
        },

        // Text & Contrast
        foreground: {
          DEFAULT: '#22232D',
          primary: '#22232D',
          secondary: '#2F354E',
          muted: '#9C9AA6',
        },

        // Secondary
        secondary: {
          DEFAULT: '#2F354E',
          foreground: '#FFFFFF',
        },

        // Muted
        muted: {
          DEFAULT: '#9C9AA6',
          foreground: '#22232D',
        },

        // Accent / Highlight Colors
        accent: {
          DEFAULT: '#F2D468',
          warm: '#F2D468',
          gold: '#E7D7A2',
          mutedBlueGrey: '#768CAB',
          foreground: '#22232D',
        },

        // Card
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#22232D',
        },

        // Border
        border: {
          DEFAULT: '#E5E5E5',
          light: '#F2F1F8',
          medium: '#9C9AA6',
        },

        // Input
        input: '#E5E5E5',

        // Ring (focus states)
        ring: '#6391F2',

        // Status Colors
        success: '#22c55e',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#6391F2',
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
        },

        // Legacy support (remove after migration)
        gold: {
          DEFAULT: '#F2D468',
          light: '#F9D77A',
          dark: '#C99412',
          secondary: '#E5A920',
        },
        luxury: {
          DEFAULT: '#0f0f0f',
          light: '#1a1a1a',
          lighter: '#262626',
        },
        text: {
          primary: '#22232D',
          secondary: '#2F354E',
          muted: '#9C9AA6',
          inverse: '#FFFFFF',
        },
        status: {
          success: '#22c55e',
          error: '#EF4444',
          warning: '#F59E0B',
          live: '#dc2626',
        },
      },

      fontFamily: {
        sans: ['SpaceGrotesk', 'Space Grotesk', 'sans-serif'],
        grotesk: ['SpaceGrotesk', 'Space Grotesk', 'sans-serif'],
      },

      borderRadius: {
        'round': '500px',
        'lg': '0.5rem',
        'md': '0.375rem',
        'sm': '0.25rem',
      },

      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
    },
  },
  plugins: [],
}
