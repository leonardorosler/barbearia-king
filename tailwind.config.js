/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Tema principal — dourado sobre escuro (barbearia premium)
        brand: {
          50:  '#fdf8ee',
          100: '#f9edd0',
          200: '#f2d89d',
          300: '#e8bc61',
          400: '#dfa033',
          500: '#c8851a', // dourado principal
          600: '#a86512',
          700: '#864c12',
          800: '#6e3d15',
          900: '#5c3316',
          950: '#341a08',
        },
        // Tons de superfície — carvão refinado
        surface: {
          50:  '#f6f6f6',
          100: '#e7e7e7',
          200: '#d1d1d1',
          300: '#b0b0b0',
          400: '#888888',
          500: '#6d6d6d',
          600: '#5d5d5d',
          700: '#4f4f4f',
          800: '#454545',
          900: '#3d3d3d',
          950: '#1a1a1a', // fundo principal dark
        },
        // Cor de destaque — âmbar quente
        accent: {
          DEFAULT: '#e8a020',
          light:   '#f5c842',
          dark:    '#b87010',
        },
        // Status de agendamento
        status: {
          pendente:       '#d97706', // amarelo âmbar
          confirmado:     '#2563eb', // azul
          concluido:      '#16a34a', // verde
          cancelado:      '#dc2626', // vermelho
          naoCompareceu:  '#6b7280', // cinza
        },
        // Status de assinatura
        assinatura: {
          ativa:       '#16a34a',
          cancelada:   '#dc2626',
          inadimplente:'#ea580c',
          expirada:    '#6b7280',
        },
      },

      fontFamily: {
        // Display — títulos de impacto
        display: ['"Montserrat"', 'system-ui', 'sans-serif'],
        // Body — leitura limpa
        body:    ['"Inter"', 'system-ui', 'sans-serif'],
        // Mono — código / labels técnicos
        mono:    ['"JetBrains Mono"', 'monospace'],
      },

      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },

      borderRadius: {
        DEFAULT: '0.5rem',
        sm:  '0.25rem',
        md:  '0.5rem',
        lg:  '0.75rem',
        xl:  '1rem',
        '2xl': '1.5rem',
      },

      boxShadow: {
        'brand-sm': '0 1px 3px 0 rgb(200 133 26 / 0.2)',
        'brand':    '0 4px 14px 0 rgb(200 133 26 / 0.3)',
        'brand-lg': '0 10px 30px 0 rgb(200 133 26 / 0.25)',
        'glass':    '0 8px 32px 0 rgba(0,0,0,0.36)',
        'card':     '0 2px 12px 0 rgba(0,0,0,0.15)',
        'card-hover':'0 8px 24px 0 rgba(0,0,0,0.25)',
      },

      backgroundImage: {
        'brand-gradient':  'linear-gradient(135deg, #c8851a 0%, #e8bc61 100%)',
        'dark-gradient':   'linear-gradient(180deg, #1a1a1a 0%, #2a2a2a 100%)',
        'hero-pattern':    "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c8851a' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },

      animation: {
        'fade-in':      'fadeIn 0.3s ease-in-out',
        'fade-up':      'fadeUp 0.4s ease-out',
        'slide-in-right':'slideInRight 0.35s ease-out',
        'slide-in-left': 'slideInLeft 0.35s ease-out',
        'scale-in':     'scaleIn 0.2s ease-out',
        'spin-slow':    'spin 2s linear infinite',
        'pulse-brand':  'pulseBrand 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'shimmer':      'shimmer 1.8s infinite',
      },

      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%':   { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseBrand: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },

      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
      },

      zIndex: {
        'modal':   '1000',
        'toast':   '1100',
        'tooltip': '1200',
      },
    },
  },
  plugins: [],
}
