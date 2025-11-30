import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    // GitHub Pages 子路径（你的 repo 名）
    base: '/technology/',

    // build 输出到 docs 给 GitHub Pages 用
    build: {
      outDir: 'docs',
    },

    server: {
      port: 3000,
      host: '0.0.0.0',
    },

    plugins: [react()],

    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || '{}'),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '{}'),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
