import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  // Ports live in the root .env, shared with the API and Docker Compose.
  const env = loadEnv(mode, '../../', '');
  const apiPort = env.API_PORT || '4000';

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: Number(env.WEB_PORT || 5180),
      strictPort: true,
      proxy: { '/api': `http://localhost:${apiPort}` },
    },
  };
});
