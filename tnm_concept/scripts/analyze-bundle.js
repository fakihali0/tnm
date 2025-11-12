import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BUNDLE_LIMITS = {
  'index': 250, // Main bundle max 250KB
  'vendor': 150, // Vendor bundle max 150KB
  'router': 80,  // Router bundle max 80KB
  'ui': 120,     // UI bundle max 120KB
  'charts': 100, // Charts bundle max 100KB (lazy loaded)
  'total': 800,  // Total max 800KB
};

function formatSize(kb) {
  if (kb > 1024) {
    return `${(kb / 1024).toFixed(2)} MB`;
  }
  return `${kb.toFixed(2)} KB`;
}

function analyzeBundleSize() {
  const distPath = path.join(process.cwd(), 'dist', 'assets');
  
  if (!fs.existsSync(distPath)) {
    console.error('❌ dist/assets directory not found. Run "npm run build" first.');
    process.exit(1);
  }

  const files = fs.readdirSync(distPath);
  
  let totalSize = 0;
  const bundles = {};
  const fileList = [];
  
  files.forEach(file => {
    if (file.endsWith('.js')) {
      const filePath = path.join(distPath, file);
      const size = fs.statSync(filePath).size / 1024; // KB
      totalSize += size;
      
      // Categorize by chunk name
      const chunkName = file.split('-')[0] || 'other';
      bundles[chunkName] = (bundles[chunkName] || 0) + size;
      
      fileList.push({ name: file, size, type: chunkName });
    }
  });
  
  console.log('\n📦 Bundle Size Analysis Report');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  
  // Sort by size
  const sortedBundles = Object.entries(bundles).sort((a, b) => b[1] - a[1]);
  
  console.log('📊 Chunks by Size:');
  console.log('───────────────────────────────────────────────────────────');
  
  sortedBundles.forEach(([name, size]) => {
    const limit = BUNDLE_LIMITS[name];
    const percentage = (size / totalSize * 100).toFixed(1);
    
    let status = '🟢';
    if (limit && size > limit * 1.2) {
      status = '🔴'; // Exceeds by 20%
    } else if (limit && size > limit) {
      status = '🟡'; // Exceeds limit
    }
    
    const sizeBar = '█'.repeat(Math.floor(size / 10));
    const limitInfo = limit ? `(limit: ${limit} KB)` : '';
    
    console.log(`${status} ${name.padEnd(20)} ${formatSize(size).padEnd(12)} ${percentage.padStart(5)}% ${limitInfo}`);
    console.log(`   ${sizeBar}`);
  });
  
  console.log('───────────────────────────────────────────────────────────');
  console.log(`📦 Total Bundle Size: ${formatSize(totalSize)}`);
  console.log('');
  
  // Top 10 largest files
  const largestFiles = fileList.sort((a, b) => b.size - a.size).slice(0, 10);
  
  console.log('📄 Top 10 Largest Files:');
  console.log('───────────────────────────────────────────────────────────');
  largestFiles.forEach((file, index) => {
    console.log(`${(index + 1).toString().padStart(2)}. ${file.name.padEnd(40)} ${formatSize(file.size)}`);
  });
  console.log('');
  
  // Check if any limits are exceeded
  let hasErrors = false;
  let hasWarnings = false;
  
  Object.entries(bundles).forEach(([name, size]) => {
    if (BUNDLE_LIMITS[name] && size > BUNDLE_LIMITS[name] * 1.2) {
      console.error(`❌ CRITICAL: ${name} exceeds limit by 20%+: ${formatSize(size)} > ${BUNDLE_LIMITS[name]} KB`);
      hasErrors = true;
    } else if (BUNDLE_LIMITS[name] && size > BUNDLE_LIMITS[name]) {
      console.warn(`⚠️  WARNING: ${name} exceeds limit: ${formatSize(size)} > ${BUNDLE_LIMITS[name]} KB`);
      hasWarnings = true;
    }
  });
  
  if (totalSize > BUNDLE_LIMITS.total) {
    console.error(`❌ CRITICAL: Total bundle size exceeds limit: ${formatSize(totalSize)} > ${BUNDLE_LIMITS.total} KB`);
    hasErrors = true;
  }
  
  console.log('═══════════════════════════════════════════════════════════');
  
  if (hasErrors) {
    console.log('❌ Bundle size check FAILED - Critical limits exceeded!\n');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️  Bundle size check passed with warnings\n');
    process.exit(0);
  } else {
    console.log('✅ All bundle size checks passed!\n');
    process.exit(0);
  }
}

analyzeBundleSize();
