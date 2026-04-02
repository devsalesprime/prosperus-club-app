/**
 * Generate all PWA icon sizes from default-avatar.png
 * Run: node scripts/generate-icons.js
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SOURCE = path.resolve(__dirname, '../public/default-avatar.png');
const OUTPUT_DIR = path.resolve(__dirname, '../public/icons');

// All required sizes
const ICON_SIZES = [16, 32, 72, 96, 128, 144, 152, 167, 180, 192, 384, 512];

async function generate() {
  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`Source: ${SOURCE}`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log(`Generating ${ICON_SIZES.length} icon sizes...\n`);

  for (const size of ICON_SIZES) {
    const filename = size <= 32 ? `favicon-${size}x${size}.png` : `icon-${size}x${size}.png`;
    const outputPath = path.join(OUTPUT_DIR, filename);

    await sharp(SOURCE)
      .resize(size, size, { fit: 'cover' })
      .png({ quality: 90 })
      .toFile(outputPath);

    console.log(`✓ ${filename} (${size}x${size})`);
  }

  console.log('\nDone! All icons generated.');
}

generate().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
