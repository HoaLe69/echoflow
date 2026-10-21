import type { Config } from 'tailwindcss'

/**
 * Matcha Mochi design tokens.
 *
 * Base palette comes from the specs' DESIGN.md files; the extra accent colors and
 * shadows are the values the two screen prototypes use. Where the prototypes
 * disagreed (`mochi-pink` was both a blush surface and a rose accent), the
 * names below are the canonical set:
 *   mochi-blush  – soft pink surface
 *   mochi-rose   – pink accent / feedback
 */
const config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#f8faf5',
        'surface-dim': '#d8dbd6',
        'surface-bright': '#f8faf5',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f2f4ef',
        'surface-container': '#ecefea',
        'surface-container-high': '#e7e9e4',
        'surface-container-highest': '#e1e3de',
        'surface-variant': '#e1e3de',
        background: '#f8faf5',

        'on-surface': '#191c1a',
        'on-surface-variant': '#424840',
        'on-background': '#191c1a',
        'inverse-surface': '#2e312e',
        'inverse-on-surface': '#eff1ec',
        outline: '#73796f',
        'outline-variant': '#c2c8bd',

        primary: '#335331',
        'on-primary': '#ffffff',
        'primary-container': '#4a6b47',
        'on-primary-container': '#c4eabd',
        'inverse-primary': '#abd0a5',
        'primary-fixed': '#c7edbf',
        'primary-fixed-dim': '#abd0a5',
        'on-primary-fixed': '#022106',
        'on-primary-fixed-variant': '#2e4e2d',
        'surface-tint': '#466643',

        secondary: '#78583e',
        'on-secondary': '#ffffff',
        'secondary-container': '#fdd2b1',
        'on-secondary-container': '#78583f',
        'secondary-fixed': '#ffdcc2',
        'secondary-fixed-dim': '#e8be9f',
        'on-secondary-fixed': '#2c1603',
        'on-secondary-fixed-variant': '#5d4128',

        tertiary: '#783645',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#954d5c',
        'on-tertiary-container': '#ffd6db',
        'tertiary-fixed': '#ffd9de',
        'tertiary-fixed-dim': '#ffb2bf',
        'on-tertiary-fixed': '#3b0616',
        'on-tertiary-fixed-variant': '#733140',

        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',

        /* Matcha Mochi accents */
        'matcha-forest': '#1f2e1e',
        'matcha-sage': '#566854',
        'matcha-foam': '#e8f0e3',
        'matcha-cream': '#f4f7f1',
        'mochi-blush': '#fcebec',
        'mochi-rose': '#e68e9d',
        hojicha: '#7d624a',
        'hojicha-warm': '#a3704c',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'sans-serif'],
        headline: ['Plus Jakarta Sans', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        full: '9999px',
      },
      boxShadow: {
        card: '0 4px 20px rgba(51, 83, 49, 0.03)',
        'card-hover': '0 12px 28px rgba(51, 83, 49, 0.08)',
        header: '0 2px 12px rgba(51, 83, 49, 0.04)',
        dock: '0 -8px 24px rgba(51, 83, 49, 0.06)',
        mic: '0 8px 20px rgba(51, 83, 49, 0.28)',
      },
    },
  },
  plugins: [],
} satisfies Config

export default config
