<?php
/**
 * Generate all PWA icon sizes from default-avatar.png
 * Run: php scripts/generate-icons.php
 */

$source = __DIR__ . '/../public/default-avatar.png';
$outputDir = __DIR__ . '/../public/icons';

$sizes = [16, 32, 72, 96, 128, 144, 152, 167, 180, 192, 384, 512];

// Create output directory
if (!is_dir($outputDir)) {
    mkdir($outputDir, 0755, true);
}

// Load source image
$srcImage = imagecreatefrompng($source);
if (!$srcImage) {
    die("Error: Could not load $source\n");
}

$srcW = imagesx($srcImage);
$srcH = imagesy($srcImage);

echo "Source: {$source} ({$srcW}x{$srcH})\n";
echo "Output: {$outputDir}\n";
echo "Generating " . count($sizes) . " icon sizes...\n\n";

foreach ($sizes as $size) {
    $filename = $size <= 32 ? "favicon-{$size}x{$size}.png" : "icon-{$size}x{$size}.png";
    $outputPath = $outputDir . '/' . $filename;

    // Create new image
    $dst = imagecreatetruecolor($size, $size);

    // Preserve transparency
    imagealphablending($dst, false);
    imagesavealpha($dst, true);
    $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
    imagefill($dst, 0, 0, $transparent);
    imagealphablending($dst, true);

    // Resize with high quality resampling
    imagecopyresampled($dst, $srcImage, 0, 0, 0, 0, $size, $size, $srcW, $srcH);

    // Save
    imagepng($dst, $outputPath, 9);
    imagedestroy($dst);

    echo "✓ {$filename} ({$size}x{$size})\n";
}

imagedestroy($srcImage);
echo "\nDone! All icons generated.\n";
