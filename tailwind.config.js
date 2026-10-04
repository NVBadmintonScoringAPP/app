/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // EXACT NV LOGO COLORS SAMPLED FROM LOGO PIXELS
        'nv-green': '#6bc33a',
        'nv-green-dark': '#56be32',
        'nv-red': '#e11e24',
        'nv-red-dark': '#cc191f',
        'nv-black': '#000000',
        'nv-dark': '#080808',
        'nv-card': '#0d0d0d',
        'nv-border': '#1e1e1e',
        // Anchor Tailwind's emerald and green to the exact logo lime-green (#6bc33a)
        emerald: {
          50: '#f5fcf0',
          100: '#e7f7dc',
          200: '#6bc33a',
          300: '#6bc33a',
          400: '#6bc33a', // exact logo green
          500: '#6bc33a', // exact logo green
          600: '#56be32', // exact logo secondary green
          700: '#439527',
          800: '#387624',
          900: '#2f6220',
          950: '#14370c',
        },
        green: {
          50: '#f5fcf0',
          100: '#e7f7dc',
          200: '#6bc33a',
          300: '#6bc33a',
          400: '#6bc33a', // exact logo green
          500: '#6bc33a', // exact logo green
          600: '#56be32', // exact logo secondary green
          700: '#439527',
          800: '#387624',
          900: '#2f6220',
          950: '#14370c',
        },
        // Anchor Tailwind's red and rose to the exact logo crimson-red (#e11e24)
        red: {
          50: '#fff1f1',
          100: '#ffe1e1',
          200: '#e11e24',
          300: '#e11e24',
          400: '#e11e24', // exact logo red
          500: '#e11e24', // exact logo red
          600: '#cc191f', // exact logo secondary red
          700: '#ab1318',
          800: '#8c1418',
          900: '#751619',
          950: '#420608',
        },
        rose: {
          50: '#fff1f1',
          100: '#ffe1e1',
          200: '#e11e24',
          300: '#e11e24',
          400: '#e11e24', // exact logo red
          500: '#e11e24', // exact logo red
          600: '#cc191f', // exact logo secondary red
          700: '#ab1318',
          800: '#8c1418',
          900: '#751619',
          950: '#420608',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
};
