import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const useHttps = env.HTTPS_DEV === 'true';
  const apiPort = process.env.PORT || env.PORT || 8787;
  const webPort = Number(process.env.VITE_PORT || env.VITE_PORT || 5173);

  return {
    plugins: useHttps ? [basicSsl()] : [],
    server: {
      port: webPort,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${apiPort}`,
          changeOrigin: true
        }
      }
    }
  };
});
