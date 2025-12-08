// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    // CRUCIAL: Must include the paths to your JSX files
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", 
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}