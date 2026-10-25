import esbuild from 'esbuild';
import fs from 'node:fs';

const banner = fs.readFileSync('src/header.txt', 'utf8').trim();

await esbuild.build({
  entryPoints: ['src/main.js'],
  bundle: true,
  outfile: 'dist/video-speed.user.js',
  format: 'iife',
  platform: 'browser',
  target: ['chrome100', 'firefox100'],
  minify: false,
  banner: { js: banner },
  logLevel: 'info'
});

console.log('构建完成 -> dist/video-speed.user.js');