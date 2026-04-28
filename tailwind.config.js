/** @type {import('tailwindcss').Config} */
export default {
    // Mirrors the runtime config that previously lived in index.html
    // (loaded via cdn.tailwindcss.com). Defaults here are sufficient
    // for the simulator UI; the project uses Tailwind utility classes
    // directly in the HTML markup.
    content: [
        './index.html',
        './src/**/*.{js,jsx,ts,tsx}',
    ],
    theme: {
        extend: {},
    },
    plugins: [],
};
