import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
// Backend port yaha change karein
const T = 'http://localhost:5000';
export default defineConfig({ plugins: [react(), tailwindcss()], server: { proxy: { '/api': T, '/uploads': T } } });
