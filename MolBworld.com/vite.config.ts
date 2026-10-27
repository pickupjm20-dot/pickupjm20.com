/// <reference types="vitest/config" />
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/** 미리 안 받는 것 — 공유 미리보기 그림과 글꼴 허가서는 사이트가 쓰지 않는다. */
const SKIP = new Set(['sw.js', 'img/og.jpg', 'fonts/OFL.txt']);

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(join(dir, d.name)) : [join(dir, d.name)]));
}

/**
 * **오프라인 일꾼 짓기** — 빌드가 끝나면 dist/의 파일 목록과 그 내용의 해시로 `scripts/sw.template.js`를 채워 dist/sw.js를 쓴다.
 * 해시가 판이라 파일 하나만 바뀌어도 sw.js가 달라지고, 브라우저가 그것을 보고 새 판을 받는다. 플러그인을 따로 들이지 않은 것은
 * 할 일이 이것뿐이라서다(목록 · 해시 · 글 바꿔 쓰기).
 */
function offline(): Plugin {
  let root = process.cwd();
  let outDir = 'dist';
  return {
    name: 'molbworld-offline',
    apply: 'build',
    configResolved(config) {
      root = config.root;
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const files = walk(outDir)
        .map((f) => relative(outDir, f).split(sep).join('/'))
        .filter((f) => !SKIP.has(f) && !f.endsWith('.map'))
        .sort();
      const hash = createHash('sha256');
      for (const f of files) hash.update(f).update(readFileSync(join(outDir, f)));
      const template = readFileSync(resolve(root, 'scripts/sw.template.js'), 'utf8');
      // 자리표는 틀에 꼭 한 번씩 — 주석에 같은 글이 끼면 엉뚱한 데가 채워져 일꾼이 죽는다.
      for (const mark of ['__VERSION__', '__FILES__']) {
        if (template.split(mark).length !== 2) throw new Error(`sw.template.js: ${mark}가 한 번이어야 해요`);
      }
      const sw = template.replace('__VERSION__', hash.digest('hex').slice(0, 12)).replace('__FILES__', JSON.stringify(files));
      writeFileSync(join(outDir, 'sw.js'), sw);
    },
  };
}

// base를 './'로 둔다 — pickupjm20.com/MolBworld.com/ 같은 하위 경로에 올려도, 나중에 molbworld.com 뿌리에 올려도
// 같은 빌드가 돈다. 쪽 이동은 해시(#/blankbook)라 서버의 되돌림(rewrite) 설정이 필요 없다.
export default defineConfig({
  base: './',
  plugins: [react(), offline()],
  test: {
    environment: 'jsdom',
  },
});
