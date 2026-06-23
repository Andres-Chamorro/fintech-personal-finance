import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['./test/unitarias/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/services/**', 'src/lib/format.ts', 'src/components/Toast.tsx'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
