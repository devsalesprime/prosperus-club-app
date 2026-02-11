<?php
/**
 * Generate iOS PWA splash screens
 * Uses Prosperus brand colors with centered logo
 * Run: php -d extension=gd scripts/generate-splashes.php
 */

$logoSource = __DIR__ . '/../public/default-avatar.png';
$outputDir = __DIR__ . '/../public/splash';

// iOS splash screen sizes (width x height)
$splashSizes = [
    ['name' => 'iphone5_splash', 'w' => 640, 'h' => 1136],
    ['name' => 'iphone6_splash', 'w' => 750, 'h' => 1334],
    ['name' => 'iphoneplus_splash', 'w' => 1242, 'h' => 2208],
    ['name' => 'iphonex_splash', 'w' => 1125, 'h' => 2436],
    ['name' => 'iphonexr_splash', 'w' => 828, 'h' => 1792],
    ['name' => 'iphonexsmax_splash', 'w' => 1242, 'h' => 2688],
    ['name' => 'ipad_splash', 'w' => 1536, 'h' => 2048],
    ['name' => 'ipadpro1_splash', 'w' => 1668, 'h' => 2224],
    ['name' => 'ipadpro2_splash', 'w' => 2048, 'h' => 2732],
];

// Prosperus brand colors
$bgColor = [3, 26, 43]; // #031A2B (prosperus-navy)

// Create output directory
if (!is_dir($outputDir)) {
    mkdir($outputDir, 0755, true);
}

// Load logo
$logo = imagecreatefrompng($logoSource);
if (!$logo) {
    die("Error: Could not load $logoSource\n");
}
$logoW = imagesx($logo);
$logoH = imagesy($logo);

echo "Logo: {$logoSource} ({$logoW}x{$logoH})\n";
echo "Output: {$outputDir}\n";
echo "Generating " . count($splashSizes) . " splash screens...\n\n";

foreach ($splashSizes as $splash) {
    $name = $splash['name'];
    $w = $splash['w'];
    $h = $splash['h'];
    $outputPath = $outputDir . '/' . $name . '.png';

    // Create canvas with background color
    $img = imagecreatetruecolor($w, $h);
    $bg = imagecolorallocate($img, $bgColor[0], $bgColor[1], $bgColor[2]);
    imagefill($img, 0, 0, $bg);

    // Calculate logo size (~30% of the smaller dimension)
    $logoSize = (int) (min($w, $h) * 0.3);
    $logoX = (int) (($w - $logoSize) / 2);
    $logoY = (int) (($h - $logoSize) / 2) - (int) ($h * 0.05); // Slightly above center

    // Enable alpha blending for transparent areas
    imagealphablending($img, true);

    // Resize and paste logo centered
    imagecopyresampled($img, $logo, $logoX, $logoY, 0, 0, $logoSize, $logoSize, $logoW, $logoH);

    // Save
    imagepng($img, $outputPath, 6);
    imagedestroy($img);

    echo "✓ {$name}.png ({$w}x{$h})\n";
}

imagedestroy($logo);
echo "\nDone! All splash screens generated.\n";
