import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_BINANCE_API_KEY': JSON.stringify(process.env.VITE_BINANCE_API_KEY),
    'import.meta.env.VITE_BINANCE_API_SECRET': JSON.stringify(process.env.VITE_BINANCE_API_SECRET),
    'import.meta.env.VITE_OPENAI_API_KEY': JSON.stringify(process.env.VITE_OPENAI_API_KEY),
    'import.meta.env.VITE_SERPAPI_API_KEY': JSON.stringify(process.env.VITE_SERPAPI_API_KEY)
    }
  }
});
