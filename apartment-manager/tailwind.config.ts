import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont',
          '"Segoe UI"', '"Noto Sans"', 'Helvetica', 'Arial', 'sans-serif',
        ],
      },
      colors: {
        primary: {
          50:  '#E1F5EE',
          100: '#9FE1CB',
          200: '#5DCAA5',
          500: '#1D9E75',
          600: '#0F6E56',
          700: '#085041',
          800: '#04342C',
        },
      },
    },
  },
  plugins: [],
}
export default config
