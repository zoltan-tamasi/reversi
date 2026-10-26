import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: ['localhost', '127.0.0.1', 'seismic-egotistic-rotunda.ngrok-free.dev'],
    port: 5173
  },
});
