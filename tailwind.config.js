/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
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
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
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
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        "gradient-shift": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        float: {
          "0%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
          "100%": { transform: "translateY(0px)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 5px rgba(var(--primary-rgb), 0.2)" },
          "50%": { boxShadow: "0 0 20px rgba(var(--primary-rgb), 0.6)" },
        },
        "bounce-slow": {
          "0%, 100%": {
            transform: "translateY(0)",
            animationTimingFunction: "cubic-bezier(0.8, 0, 1, 1)"
          },
          "50%": {
            transform: "translateY(-25%)",
            animationTimingFunction: "cubic-bezier(0, 0, 0.2, 1)"
          }
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" }
        },
        "pulse-gentle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.85" }
        },
        "twinkle": {
          "0%, 100%": { opacity: "0.2" },
          "50%": { opacity: "0.8" }
        },
        "twinkle-random": {
          "0%": { opacity: "0.3" },
          "25%": { opacity: "0.8" },
          "50%": { opacity: "0.2" },
          "75%": { opacity: "0.6" },
          "100%": { opacity: "0.3" }
        },
        "meteor": {
          "0%": {
            transform: "translateX(0) translateY(0) rotate(-45deg)",
            opacity: "0",
            width: "0"
          },
          "1%": {
            opacity: "1"
          },
          "5%": {
            width: "50px",
            opacity: "1"
          },
          "10%": {
            width: "100px",
            opacity: "1"
          },
          "80%": {
            opacity: "1"
          },
          "100%": {
            transform: "translateX(1000px) translateY(1000px) rotate(-45deg)",
            opacity: "0",
            width: "150px"
          }
        },
        "meteor-glow": {
          "0%": {
            boxShadow: "0 0 0px 0px rgba(255, 255, 255, 0)",
          },
          "10%": {
            boxShadow: "0 0 2px 1px rgba(255, 255, 255, 0.5)",
          },
          "50%": {
            boxShadow: "0 0 5px 2px rgba(255, 255, 255, 0.8)",
          },
          "100%": {
            boxShadow: "0 0 2px 1px rgba(255, 255, 255, 0.5)",
          }
        },
        "flare": {
          "0%": {
            transform: "scale(1)",
            opacity: "0.3",
          },
          "25%": {
            transform: "scale(1.5)",
            opacity: "0.7",
          },
          "50%": {
            transform: "scale(1)",
            opacity: "0.3",
          },
          "75%": {
            transform: "scale(1.2)",
            opacity: "0.5",
          },
          "100%": {
            transform: "scale(1)",
            opacity: "0.3",
          }
        },
        "galaxy-rotate": {
          "0%": {
            transform: "rotate(0deg)",
          },
          "100%": {
            transform: "rotate(360deg)",
          }
        },
        "galaxy-fade": {
          "0%": {
            opacity: "0.05",
          },
          "50%": {
            opacity: "0.1",
          },
          "100%": {
            opacity: "0.05",
          }
        },
        "text-glow": {
          "0%": {
            textShadow: "0 0 4px rgba(66, 133, 244, 0.6), 0 0 8px rgba(66, 133, 244, 0.4)"
          },
          "50%": {
            textShadow: "0 0 16px rgba(66, 133, 244, 0.8), 0 0 30px rgba(66, 133, 244, 0.6)"
          },
          "100%": {
            textShadow: "0 0 4px rgba(66, 133, 244, 0.6), 0 0 8px rgba(66, 133, 244, 0.4)"
          }
        },
        "letter-float": {
          "0%": { transform: "translateY(0px)" },
          "33%": { transform: "translateY(-4px)" },
          "66%": { transform: "translateY(2px)" },
          "100%": { transform: "translateY(0px)" }
        },
        "title-reveal": {
          "0%": {
            clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)",
            opacity: "0"
          },
          "100%": {
            clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
            opacity: "1"
          }
        },
        "neon-pulse": {
          "0%, 100%": {
            textShadow: "0 0 2px #fff, 0 0 4px #fff, 0 0 6px #fff, 0 0 10px #0e65ff, 0 0 20px #0e65ff, 0 0 30px #0e65ff"
          },
          "50%": {
            textShadow: "0 0 2px #fff, 0 0 2px #fff, 0 0 2px #fff, 0 0 4px #0e65ff, 0 0 10px #0e65ff, 0 0 15px #0e65ff"
          }
        },
        "shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" }
        },
        "light-sweep": {
          "0%": {
            transform: "translateX(-100%)",
            background: "linear-gradient(90deg, transparent, rgba(79, 70, 229, 0.4) 50%, transparent 100%)"
          },
          "20%": {
            background: "linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.5) 50%, transparent 100%)"
          },
          "40%": {
            transform: "translateX(80%)",
            background: "linear-gradient(90deg, transparent, rgba(129, 140, 248, 0.5) 50%, transparent 100%)"
          },
          "40.001%": { opacity: "0.7" },
          "40.002%": {
            transform: "translateX(-100%)",
            opacity: "0.7",
            background: "linear-gradient(90deg, transparent, rgba(79, 70, 229, 0.4) 50%, transparent 100%)"
          },
          "100%": { opacity: "0.7" }
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "blink": "blink 1s infinite",
        "gradient-shift": "gradient-shift 6s ease infinite",
        "float": "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s infinite",
        "bounce-slow": "bounce-slow 2s infinite",
        "pulse-slow": "pulse-slow 3s infinite",
        "pulse-gentle": "pulse-gentle 4s infinite",
        "twinkle": "twinkle 3s ease-in-out infinite",
        "twinkle-random": "twinkle-random 5s ease-in-out infinite",
        "meteor": "meteor 5s linear infinite",
        "meteor-glow": "meteor-glow 5s linear infinite",
        "flare": "flare 8s ease-in-out infinite",
        "galaxy-rotate": "galaxy-rotate 60s linear infinite",
        "galaxy-fade": "galaxy-fade 8s ease-in-out infinite",
        "text-glow": "text-glow 2s ease-in-out infinite",
        "letter-float": "letter-float 3s ease-in-out infinite",
        "title-reveal": "title-reveal 0.8s cubic-bezier(0.25, 1, 0.3, 1) forwards",
        "neon-pulse": "neon-pulse 1.5s ease-in-out infinite",
        "shimmer": "shimmer 2s ease-in-out infinite",
        "light-sweep": "light-sweep 3s ease-in-out infinite",
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '100%',
            color: 'inherit',
            a: {
              color: 'hsl(var(--primary))',
              '&:hover': {
                color: 'hsl(var(--primary)/0.8)',
              },
            },
            code: {
              color: 'inherit',
              backgroundColor: 'hsl(var(--muted))',
              padding: '0.25rem 0.375rem',
              borderRadius: '0.25rem',
              fontWeight: '500',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            pre: {
              backgroundColor: 'hsl(var(--muted))',
              color: 'hsl(var(--muted-foreground))',
              borderRadius: '0.375rem',
              padding: '0.75rem 1rem',
            },
            blockquote: {
              borderLeftColor: 'hsl(var(--primary)/0.2)',
            },
          },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require('@tailwindcss/typography'),
  ],
}
