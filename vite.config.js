import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    host: '0.0.0.0',
    allowedHosts: ['localhost', 'fxcffs-5173.csb.app'],
  },
});
