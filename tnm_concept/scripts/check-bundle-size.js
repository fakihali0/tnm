import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAX_BUNDLE_SIZE = 800 * 1024; // 800KB in bytes
const MAX_CHUNK_SIZE = 250 * 1024; // 250KB in bytes

function checkBundleSize() {
  const distPath = path.join(process.cwd(), 'dist', 'assets');
  
  if (!fs.existsSync(distPath)) {
    console.error('❌ Build not found. Run "npm run build" first.');
    process.exit(1);
  }

  const files = fs.readdirSync(distPath);
  let totalSize = 0;
  let hasErrors = false;
  
  files.forEach(file => {
    if (file.endsWith('.js')) {
      const filePath = path.join(distPath, file);
      const size = fs.statSync(filePath).size;
      totalSize += size;
      
      if (size > MAX_CHUNK_SIZE) {
        console.error(`❌ ${file} exceeds max chunk size: ${(size / 1024).toFixed(2)} KB > ${MAX_CHUNK_SIZE / 1024} KB`);
        hasErrors = true;
      }
    }
  });
  
  if (totalSize > MAX_BUNDLE_SIZE) {
    console.error(`❌ Total bundle size exceeds limit: ${(totalSize / 1024).toFixed(2)} KB > ${MAX_BUNDLE_SIZE / 1024} KB`);
    hasErrors = true;
  }
  
  if (hasErrors) {
    process.exit(1);
  }
  
  console.log(`✅ Bundle size check passed: ${(totalSize / 1024).toFixed(2)} KB`);
}

checkBundleSize();
