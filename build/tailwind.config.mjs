/** @type {import('tailwindcss').Config} */
export default {
  prefix: 'wod-',
  important: '#wod5e-hud-root',
  corePlugins: {
    preflight: false
  },
  content: ['../templates/**/*.hbs', '../scripts/**/*.{mjs,js}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#09090b',
        void: '#111115',
        surface: '#18181f',
        blood: {
          deep: '#450a0a',
          primary: '#8a0303',
          bright: '#dc2626',
          pulse: 'rgba(220, 38, 38, 0.45)'
        },
        willpower: {
          primary: '#1d4ed8',
          bright: '#3b82f6',
          glow: 'rgba(59, 130, 246, 0.4)'
        },
        creature: {
          vampire: '#8a0303',
          mortal: '#64748b',
          ghoul: '#991b1b',
          werewolf: '#b45309',
          hunter: '#d97706'
        },
        bone: '#f4f4f5',
        ash: '#a1a1aa',
        gold: '#c8aa6e'
      },
      fontFamily: {
        display: ['Cinzel', 'Cormorant Garamond', 'Georgia', 'serif'],
        body: ['Inter', 'Signika', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        'glow-blood': '0 0 14px rgba(220,38,38,0.45)',
        'glow-willpower': '0 0 12px rgba(59,130,246,0.4)',
        'glow-gold': '0 0 10px rgba(200,170,110,0.35)',
        'inner-glass': 'inset 0 1px 0 rgba(255,255,255,0.07)'
      },
      backdropBlur: {
        glass: '12px'
      },
      keyframes: {
        'blood-pulse': {
          '0%, 100%': { opacity: '0.65' },
          '50%': { opacity: '1' }
        },
        'soft-flicker': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' }
        }
      },
      animation: {
        'blood-pulse': 'blood-pulse 2.2s ease-in-out infinite',
        'soft-flicker': 'soft-flicker 1.4s ease-in-out infinite'
      }
    }
  },
  safelist: []
}
