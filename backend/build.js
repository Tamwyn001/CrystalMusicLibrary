// build.js
import { compile } from 'nexe';

compile({
  input: 'server.js',
  target: 'windows-x64-22.2.0',
  output: 'CrazyMusicLibrary.exe',
  resources: [
    'dist/**/*',
    'db/CML_setup.sql'
  ],
  build: false // Set to true to build Node from source (slow!)
}).then(() => {
  console.log('✅ Build complete!');
});