import type { Config } from "tailwindcss";
import animatePlugin from "tailwindcss-animate";
import plugin from "tailwindcss/plugin";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
        'cairo': ['Cairo', 'Noto Sans Arabic', 'Arial Unicode MS', 'sans-serif'],
        'arabic': ['Noto Sans Arabic', 'Cairo', 'Arial Unicode MS', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        'dark-bg': "hsl(var(--dark-bg))",
        'light-bg': "hsl(var(--light-bg))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          dark: "hsl(var(--primary-dark))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fade-in": {
          "0%": {
            opacity: "0",
            transform: "translate3d(0, 20px, 0)"
          },
          "100%": {
            opacity: "1",
            transform: "translate3d(0, 0, 0)"
          }
        },
        "scale-in": {
          "0%": {
            transform: "scale3d(0.95, 0.95, 1)",
            opacity: "0"
          },
          "100%": {
            transform: "scale3d(1, 1, 1)",
            opacity: "1"
          }
        },
        "slide-in-right": {
          "0%": { 
            transform: "translate3d(100%, 0, 0)",
            opacity: "0"
          },
          "100%": { 
            transform: "translate3d(0, 0, 0)",
            opacity: "1"
          }
        },
        "fade-in-up": {
          "0%": {
            opacity: "0",
            transform: "translate3d(0, 30px, 0)"
          },
          "100%": {
            opacity: "1",
            transform: "translate3d(0, 0, 0)"
          }
        },
        "pulse-glow": {
          "0%, 100%": {
            boxShadow: "0 0 20px hsl(var(--primary) / 0.4)"
          },
          "50%": {
            boxShadow: "0 0 40px hsl(var(--primary) / 0.8)"
          }
        },
        "skeleton": {
          "0%": {
            backgroundPosition: "200% 0"
          },
          "100%": {
            backgroundPosition: "-200% 0"
          }
        },
        "shimmer": {
          "0%": {
            transform: "translateX(-100%)"
          },
          "100%": {
            transform: "translateX(100%)"
          }
        },
        "bounce-soft": {
          "0%, 100%": {
            transform: "translateY(0) scale(1)",
            opacity: "1"
          },
          "50%": {
            transform: "translateY(-10px) scale(1.05)",
            opacity: "0.8"
          }
        },
        "draw-check": {
          "0%": {
            strokeDasharray: "0 20",
            opacity: "0"
          },
          "50%": {
            strokeDasharray: "20 20",
            opacity: "1"
          },
          "100%": {
            strokeDasharray: "20 0",
            opacity: "1"
          }
        },
        "text-reveal": {
          "0%": {
            clipPath: "inset(0 100% 0 0)"
          },
          "100%": {
            clipPath: "inset(0 0 0 0)"
          }
        },
        "gradient-flow": {
          "0%": {
            backgroundPosition: "0% 50%"
          },
          "50%": {
            backgroundPosition: "100% 50%"
          },
          "100%": {
            backgroundPosition: "0% 50%"
          }
        },
        "magnetic-pull": {
          "0%": {
            transform: "scale(1) rotate(0deg)"
          },
          "50%": {
            transform: "scale(1.1) rotate(2deg)"
          },
          "100%": {
            transform: "scale(1) rotate(0deg)"
          }
        },
        "breathe": {
          "0%, 100%": {
            transform: "scale(1)",
            opacity: "0.8"
          },
          "50%": {
            transform: "scale(1.05)",
            opacity: "1"
          }
        },
        "float-gentle": {
          "0%, 100%": {
            transform: "translateY(0px) rotate(0deg)"
          },
          "50%": {
            transform: "translateY(-10px) rotate(2deg)"
          }
        },
        "morph-blob": {
          "0%, 100%": {
            borderRadius: "50% 50% 50% 50%"
          },
          "25%": {
            borderRadius: "60% 40% 60% 40%"
          },
          "50%": {
            borderRadius: "40% 60% 40% 60%"
          },
          "75%": {
            borderRadius: "50% 50% 40% 60%"
          }
        },
        "slide-up-bounce": {
          "0%": {
            transform: "translateY(100%) scale(0.95)",
            opacity: "0"
          },
          "60%": {
            transform: "translateY(-5%) scale(1.02)",
            opacity: "1"
          },
          "100%": {
            transform: "translateY(0%) scale(1)",
            opacity: "1"
          }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.6s ease-out both",
        "scale-in": "scale-in 0.5s ease-out both",
        "slide-in-right": "slide-in-right 0.7s ease-out both",
        "fade-in-up": "fade-in-up 0.8s ease-out both",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "skeleton": "skeleton 1.5s ease-in-out infinite",
        "shimmer": "shimmer 2s ease-in-out infinite",
        "bounce-soft": "bounce-soft 2s ease-in-out infinite",
        "draw-check": "draw-check 0.8s ease-out forwards",
        "text-reveal": "text-reveal 1s ease-out forwards",
        "gradient-flow": "gradient-flow 3s ease-in-out infinite",
        "magnetic-pull": "magnetic-pull 0.3s ease-out",
        "breathe": "breathe 4s ease-in-out infinite",
        "float-gentle": "float-gentle 6s ease-in-out infinite",
        "morph-blob": "morph-blob 8s ease-in-out infinite",
        "slide-up-bounce": "slide-up-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both",
      },
    },
  },
  plugins: [
    animatePlugin,
    // Logical properties plugin for RTL support
    plugin(function({ addUtilities }) {
      addUtilities({
        // Margin logical properties
        '.ms-0': { 'margin-inline-start': '0' },
        '.ms-1': { 'margin-inline-start': '0.25rem' },
        '.ms-2': { 'margin-inline-start': '0.5rem' },
        '.ms-3': { 'margin-inline-start': '0.75rem' },
        '.ms-4': { 'margin-inline-start': '1rem' },
        '.ms-6': { 'margin-inline-start': '1.5rem' },
        '.ms-8': { 'margin-inline-start': '2rem' },
        '.ms-auto': { 'margin-inline-start': 'auto' },
        '.-ms-1': { 'margin-inline-start': '-0.25rem' },
        '.-ms-2': { 'margin-inline-start': '-0.5rem' },
        
        '.me-0': { 'margin-inline-end': '0' },
        '.me-1': { 'margin-inline-end': '0.25rem' },
        '.me-2': { 'margin-inline-end': '0.5rem' },
        '.me-3': { 'margin-inline-end': '0.75rem' },
        '.me-4': { 'margin-inline-end': '1rem' },
        '.me-6': { 'margin-inline-end': '1.5rem' },
        '.me-8': { 'margin-inline-end': '2rem' },
        '.me-auto': { 'margin-inline-end': 'auto' },
        
        // Padding logical properties
        '.ps-0': { 'padding-inline-start': '0' },
        '.ps-1': { 'padding-inline-start': '0.25rem' },
        '.ps-2': { 'padding-inline-start': '0.5rem' },
        '.ps-3': { 'padding-inline-start': '0.75rem' },
        '.ps-4': { 'padding-inline-start': '1rem' },
        '.ps-6': { 'padding-inline-start': '1.5rem' },
        '.ps-8': { 'padding-inline-start': '2rem' },
        
        '.pe-0': { 'padding-inline-end': '0' },
        '.pe-1': { 'padding-inline-end': '0.25rem' },
        '.pe-2': { 'padding-inline-end': '0.5rem' },
        '.pe-3': { 'padding-inline-end': '0.75rem' },
        '.pe-4': { 'padding-inline-end': '1rem' },
        '.pe-6': { 'padding-inline-end': '1.5rem' },
        '.pe-8': { 'padding-inline-end': '2rem' },
        
        // Position logical properties
        '.start-0': { 'inset-inline-start': '0' },
        '.start-1': { 'inset-inline-start': '0.25rem' },
        '.start-2': { 'inset-inline-start': '0.5rem' },
        '.start-3': { 'inset-inline-start': '0.75rem' },
        '.start-4': { 'inset-inline-start': '1rem' },
        '.start-6': { 'inset-inline-start': '1.5rem' },
        
        '.end-0': { 'inset-inline-end': '0' },
        '.end-1': { 'inset-inline-end': '0.25rem' },
        '.end-2': { 'inset-inline-end': '0.5rem' },
        '.end-3': { 'inset-inline-end': '0.75rem' },
        '.end-4': { 'inset-inline-end': '1rem' },
        '.end-6': { 'inset-inline-end': '1.5rem' },
        
        // Text alignment
        '.text-start': { 'text-align': 'start' },
        '.text-end': { 'text-align': 'end' },
        
        // Border logical properties
        '.border-s': { 'border-inline-start-width': '1px' },
        '.border-e': { 'border-inline-end-width': '1px' },
      });
    }),
  ],
} satisfies Config;
