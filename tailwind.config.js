// tailwind.config.js
export default {
    content: [
       "./src/app/**/*.{js,ts,jsx,tsx}",   // ✅ this targets your pages/layouts
    "./src/components/**/*.{js,ts,jsx,tsx}", // 
    ],
    theme: {
      extend: {
        colors: {
          primary: "#6366f1",
          primaryDark: "#4f46e5",
          secondary: "#10b981",
          dark: "#0f172a",
          darker: "#0b1120",
          light: "#f8fafc",
          gray: "#94a3b8",
          darkGray: "#0a0e15",
          darkGrey: "#6f7378",
        },
        fontFamily: {
          poppins: ["Poppins", "sans-serif"],
        },
        animation: {
          float: "float 6s ease-in-out infinite",
          gradientBG: "gradientBG 15s ease infinite",
          fadeIn: "fadeIn 0.6s ease-in-out",
        },
        keyframes: {
          gradientBG: {
            "0%": { backgroundPosition: "0% 50%" },
            "50%": { backgroundPosition: "100% 50%" },
            "100%": { backgroundPosition: "0% 50%" },
          },
          float: {
            "0%": { transform: "translateY(0px)" },
            "50%": { transform: "translateY(-10px)" },
            "100%": { transform: "translateY(0px)" },
          },
          fadeIn: {
            from: { opacity: "0", transform: "translateY(20px)" },
            to: { opacity: "1", transform: "translateY(0)" },
          },
        },
      },
    },
    plugins: [],
  };
  