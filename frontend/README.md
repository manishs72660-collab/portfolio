# Setup
npm install && npm run dev
1. public/hero.png  -> home ki baithi hui character image
2. public/contact.png -> "Hi!" wali phone image
3. vite.config.js me backend port set karein (default 5000)
4. src/components.jsx me SOCIAL links, src/pages.jsx me EDU edit karein

Vercel deployment me `vercel.json` SPA routes (for example `/admin`) ko `index.html` par rewrite karta hai, so direct links and refreshes work.
