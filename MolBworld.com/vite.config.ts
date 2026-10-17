/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base를 './'로 둔다 — pickupjm20.com/MolBworld.com/ 같은 하위 경로에 올려도, 나중에 molbworld.com 뿌리에 올려도
// 같은 빌드가 돈다. 쪽 이동은 해시(#/blankbook)라 서버의 되돌림(rewrite) 설정이 필요 없다.
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
  },
});
