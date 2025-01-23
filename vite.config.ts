import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';

dotenv.config();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {
      BINANCE_API_KEY: JSON.stringify(process.env.BINANCE_API_KEY),
      BINANCE_API_SECRET: JSON.stringify(process.env.BINANCE_API_SECRET),
      GNEWS_API_KEY: JSON.stringify(process.env.GNEWS_API_KEY)
    }
  },
});
