import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'primary':                    '#cffffb',
        'primary-container':          '#00D4FF',
        'on-primary':                 '#003735',
        'on-primary-container':       '#006a66',
        'secondary':                  '#adc6ff',
        'secondary-container':        '#4b8eff',
        'surface':                    '#131313',
        'surface-dim':                '#131313',
        'surface-bright':             '#393939',
        'surface-container-lowest':   '#0e0e0e',
        'surface-container-low':      '#1c1b1b',
        'surface-container':          '#201f1f',
        'surface-container-high':     '#2a2a2a',
        'surface-container-highest':  '#353534',
        'surface-variant':            '#353534',
        'on-surface':                 '#e5e2e1',
        'on-surface-variant':         '#b9cac8',
        'outline':                    '#849492',
        'outline-variant':            '#3a4a48',
        'error':                      '#ffb4ab',
        'error-container':            '#93000a',
        'on-error':                   '#690005',
        'background':                 '#131313',
        'on-background':              '#e5e2e1',
      },
      spacing: {
        'xs':     '4px',
        'sm':     '8px',
        'md':     '16px',
        'lg':     '24px',
        'xl':     '32px',
        'xxl':    '48px',
        'margin': '32px',
        'gutter': '24px',
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg:      '0.5rem',
        xl:      '0.75rem',
        full:    '9999px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'label-sm':   ['12px', { lineHeight: '1.2', letterSpacing: '0.03em', fontWeight: '600' }],
        'label-md':   ['14px', { lineHeight: '1.4', letterSpacing: '0.01em', fontWeight: '500' }],
        'body-md':    ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-lg':    ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        'headline-md':['24px', { lineHeight: '1.3', fontWeight: '600' }],
        'headline-lg':['32px', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
        'display':    ['48px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease-out forwards',
        'pulse':   'pulse 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
