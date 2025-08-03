/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Paleta Pastel Personalizada
      colors: {
        pastel: {
          // Roxos suaves
          purple: {
            50: '#f8f4ff',
            100: '#f0e8ff',
            200: '#e8d5ff',
            300: '#d8b9ff',
            400: '#c49eff',
            500: '#a855f7',
            600: '#8b5cf6',
            700: '#7c3aed',
            800: '#6d28d9',
            900: '#5b21b6',
            custom: '#7d4dfe',
          },
          // Rosas suaves
          pink: {
            50: '#fef7f7',
            100: '#feeaea',
            200: '#fdd8d8',
            300: '#fbb8b8',
            400: '#f78a8a',
            500: '#f06292',
            600: '#ec407a',
            700: '#e91e63',
            800: '#c2185b',
            900: '#ad1457',
          },
          // Azuis suaves
          blue: {
            50: '#f0f9ff',
            100: '#e0f2fe',
            200: '#bae6fd',
            300: '#7dd3fc',
            400: '#38bdf8',
            500: '#0ea5e9',
            600: '#0284c7',
            700: '#0369a1',
            800: '#075985',
            900: '#0c4a6e',
          },
          // Verdes suaves
          green: {
            50: '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: '#22c55e',
            600: '#16a34a',
            700: '#15803d',
            800: '#166534',
            900: '#14532d',
          },
          // Laranjas suaves
          orange: {
            50: '#fff7ed',
            100: '#ffedd5',
            200: '#fed7aa',
            300: '#fdba74',
            400: '#fb923c',
            500: '#f97316',
            600: '#ea580c',
            700: '#c2410c',
            800: '#9a3412',
            900: '#7c2d12',
          },
          // Amarelos suaves
          yellow: {
            50: '#fefce8',
            100: '#fef9c3',
            200: '#fef08a',
            300: '#fde047',
            400: '#facc15',
            500: '#eab308',
            600: '#ca8a04',
            700: '#a16207',
            800: '#854d0e',
            900: '#713f12',
          },
        },
        // Cores neutras suaves
        soft: {
          white: '#fefefe',
          gray: {
            50: '#fafafa',
            100: '#f5f5f5',
            200: '#e5e5e5',
            300: '#d4d4d4',
            400: '#a3a3a3',
            500: '#737373',
            600: '#525252',
            700: '#404040',
            800: '#262626',
            900: '#171717',
            dark: '#302f32',
          }
        },
        // Cores específicas para modo escuro pastel
        dark: {
          // Fundos escuros com toque pastel
          bg: {
            primary: '#0f0f23',
            secondary: '#1a1a2e',
            tertiary: '#16213e',
            card: '#1e1e3f',
            glass: '#252550',
          },
          // Textos em tons pastel suaves
          text: {
            primary: '#e8e8f5',
            secondary: '#c4c4d6',
            tertiary: '#a0a0b8',
            muted: '#8080a0',
          },
          // Bordas sutis
          border: {
            primary: '#2d2d5a',
            secondary: '#3a3a6b',
            accent: '#4a4a7c',
          },
          // Acentos pastel para modo escuro
          accent: {
            purple: '#9d8df1',
            pink: '#f8a5c2',
            blue: '#7dd3fc',
            green: '#86efac',
            orange: '#fdba74',
            yellow: '#fde047',
          }
        }
      },
      // Gradientes personalizados
      backgroundImage: {
        'pastel-gradient': 'linear-gradient(135deg, #f8f4ff 0%, #feeaea 25%, #fff7ed 50%, #f0f9ff 75%, #f0fdf4 100%)',
        'pastel-gradient-dark': 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 25%, #16213e 50%, #1e1e3f 75%, #252550 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(248, 244, 255, 0.8) 0%, rgba(254, 234, 234, 0.8) 100%)',
        'card-gradient-dark': 'linear-gradient(135deg, rgba(30, 30, 63, 0.6) 0%, rgba(37, 37, 80, 0.6) 100%)',
        'button-gradient': 'linear-gradient(135deg, #c49eff 0%, #f78a8a 100%)',
        'button-gradient-dark': 'linear-gradient(135deg, #9d8df1 0%, #f8a5c2 100%)',
        'hero-gradient': 'linear-gradient(135deg, #f8f4ff 0%, #e0f2fe 50%, #f0fdf4 100%)',
        'hero-gradient-dark': 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
        'glass-dark': 'linear-gradient(135deg, rgba(157, 141, 241, 0.1) 0%, rgba(248, 165, 194, 0.1) 100%)',
      },
      // Sombras suaves
      boxShadow: {
        'pastel': '0 4px 20px rgba(196, 158, 255, 0.15)',
        'pastel-lg': '0 8px 32px rgba(196, 158, 255, 0.2)',
        'pastel-xl': '0 12px 40px rgba(196, 158, 255, 0.25)',
        'soft': '0 2px 12px rgba(0, 0, 0, 0.08)',
        'soft-lg': '0 4px 20px rgba(0, 0, 0, 0.1)',
        'dark-soft': '0 4px 20px rgba(157, 141, 241, 0.15)',
        'dark-soft-lg': '0 8px 32px rgba(157, 141, 241, 0.2)',
      },
      // Animacoes suaves
      keyframes: {
        gradient: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        gradient: 'gradient 8s linear infinite',
        float: 'float 3s ease-in-out infinite',
        pulse: 'pulse 2s ease-in-out infinite',
        shimmer: 'shimmer 2s infinite',
      },
      // Tipografia
      fontFamily: {
        'display': ['Simonetta', 'serif'],
        'body': ['Glacial Indifference', 'sans-serif'],
        'handwriting': ['Milky Walky', 'cursive'],
      },
      // Espacamentos personalizados
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      // Border radius suaves
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '2.5rem',
      },
    },
  },
  plugins: [],
};