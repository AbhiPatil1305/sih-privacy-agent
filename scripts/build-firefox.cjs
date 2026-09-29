const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('[Firefox Build] Building Chrome extension bundle via Vite...');
execSync('npm run build', { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });

const distDir = path.resolve(__dirname, '../dist');
const firefoxDistDir = path.resolve(__dirname, '../dist-firefox');

if (!fs.existsSync(distDir)) {
  console.error('[Firefox Build] Error: dist directory does not exist.');
  process.exit(1);
}

// Ensure dist-firefox clean directory
if (fs.existsSync(firefoxDistDir)) {
  fs.rmSync(firefoxDistDir, { recursive: true, force: true });
}

// Copy dist to dist-firefox recursively
function copyFolderRecursive(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
  const files = fs.readdirSync(source);
  files.forEach(file => {
    const curSource = path.join(source, file);
    const curTarget = path.join(target, file);
    if (fs.lstatSync(curSource).isDirectory()) {
      copyFolderRecursive(curSource, curTarget);
    } else {
      fs.copyFileSync(curSource, curTarget);
    }
  });
}

copyFolderRecursive(distDir, firefoxDistDir);

// Transform manifest.json for Firefox MV3 compatibility
const chromeManifestPath = path.join(firefoxDistDir, 'manifest.json');
if (fs.existsSync(chromeManifestPath)) {
  const chromeManifest = JSON.parse(fs.readFileSync(chromeManifestPath, 'utf8'));

  const firefoxManifest = {
    ...chromeManifest,
    browser_specific_settings: {
      gecko: {
        id: 'privacy-agent@sih2026.isro',
        strict_min_version: '109.0'
      }
    },
    // Filter out Chrome-specific permissions
    permissions: (chromeManifest.permissions || []).filter(p => p !== 'sidePanel'),
    action: {
      default_title: chromeManifest.action?.default_title || 'Open Privacy Dashboard',
      default_popup: 'index.html'
    }
  };

  // Remove side_panel key if present
  delete firefoxManifest.side_panel;

  fs.writeFileSync(chromeManifestPath, JSON.stringify(firefoxManifest, null, 2), 'utf8');
  console.log('[Firefox Build] Firefox-compatible manifest.json generated in dist-firefox/manifest.json');
}

console.log('[Firefox Build] Firefox-compatible build package created successfully in dist-firefox/');
