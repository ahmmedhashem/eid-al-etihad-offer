<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Converts uploads to WebP, caps their size, and writes smaller copies for phones/tablets.
 *
 * Files are named "{id}-{width}w.webp" (e.g. "a1b2c3-2560w.webp"). Smaller copies use the same id with
 * each width from VARIANT_WIDTHS that is narrower than the original, so the frontend can rebuild the
 * srcset from the URL alone (see srcSetFor() in resources/js/landing/ui.tsx).
 */
class ImageOptimizer
{
    public const MAX_WIDTH = 2560;

    public const VARIANT_WIDTHS = [640, 1280, 1920];

    private const QUALITY = 80;

    /** Refuse absurdly large images before decoding them (GD needs ~4 bytes per pixel). */
    private const MAX_PIXELS = 40_000_000;

    private static function bytes(string|false $value): int
    {
        if ($value === false || $value === '-1') {
            return PHP_INT_MAX;
        }
        $n = (int) $value;

        return match (strtolower(substr(trim($value), -1))) {
            'g' => $n * 1024 ** 3,
            'm' => $n * 1024 ** 2,
            'k' => $n * 1024,
            default => $n,
        };
    }

    /** @return string Public URL of the full-size optimized image */
    public static function store(UploadedFile $file, string $dir = 'uploads'): string
    {
        // Decoding a large photo needs ~4 bytes per pixel plus the resized copies.
        if (self::bytes(ini_get('memory_limit')) < 512 * 1024 * 1024) {
            @ini_set('memory_limit', '512M');
        }

        $info = @getimagesize($file->getRealPath());
        if (! $info) {
            throw new RuntimeException('This file is not a readable image.');
        }
        [$width, $height] = $info;
        if ($width * $height > self::MAX_PIXELS) {
            throw new RuntimeException('Image is too large (over 40 megapixels). Please resize it first.');
        }

        $image = match ($info[2]) {
            IMAGETYPE_JPEG => imagecreatefromjpeg($file->getRealPath()),
            IMAGETYPE_PNG => imagecreatefrompng($file->getRealPath()),
            IMAGETYPE_WEBP => imagecreatefromwebp($file->getRealPath()),
            default => throw new RuntimeException('Only JPG, PNG and WebP images are supported.'),
        };
        if (! $image) {
            throw new RuntimeException('Could not read this image.');
        }

        $image = self::applyExifOrientation($image, $file, $info[2]);
        $width = imagesx($image);

        $id = Str::lower(Str::random(24));
        $disk = Storage::disk('public');

        $fullWidth = min($width, self::MAX_WIDTH);
        $disk->put("{$dir}/{$id}-{$fullWidth}w.webp", self::encode($image, $fullWidth));

        foreach (self::VARIANT_WIDTHS as $w) {
            if ($w < $fullWidth) {
                $disk->put("{$dir}/{$id}-{$w}w.webp", self::encode($image, $w));
            }
        }

        imagedestroy($image);

        return "/storage/{$dir}/{$id}-{$fullWidth}w.webp";
    }

    /** "url 640w, url 1280w, …" for an optimized upload, or null for other images. */
    public static function srcset(?string $url): ?string
    {
        if (! $url || ! preg_match('#^(/storage/[A-Za-z0-9/_-]+?)-(\d+)w\.webp$#', $url, $m)) {
            return null;
        }
        $full = (int) $m[2];
        $widths = array_filter(self::VARIANT_WIDTHS, fn ($w) => $w < $full);
        $widths[] = $full;

        return implode(', ', array_map(fn ($w) => "{$m[1]}-{$w}w.webp {$w}w", $widths));
    }

    private static function encode(\GdImage $source, int $targetWidth): string
    {
        $w = imagesx($source);
        $h = imagesy($source);
        if ($w === $targetWidth) {
            $img = $source;
            imagepalettetotruecolor($img);
        } else {
            // imagecopyresampled works on every GD build (imagescale's bicubic mode does not).
            $targetHeight = max(1, (int) round($h * $targetWidth / $w));
            $img = imagecreatetruecolor($targetWidth, $targetHeight);
            imagealphablending($img, false);
            imagefill($img, 0, 0, imagecolorallocatealpha($img, 0, 0, 0, 127));
            imagecopyresampled($img, $source, 0, 0, 0, 0, $targetWidth, $targetHeight, $w, $h);
        }
        imagealphablending($img, false);
        imagesavealpha($img, true); // keep logo transparency

        ob_start();
        imagewebp($img, null, self::QUALITY);
        $data = (string) ob_get_clean();

        if ($img !== $source) {
            imagedestroy($img);
        }

        return $data;
    }

    /** Phone photos are often stored sideways with an EXIF rotation flag; bake the rotation in. */
    private static function applyExifOrientation(\GdImage $image, UploadedFile $file, int $type): \GdImage
    {
        if ($type !== IMAGETYPE_JPEG || ! function_exists('exif_read_data')) {
            return $image;
        }
        $orientation = @exif_read_data($file->getRealPath())['Orientation'] ?? 1;
        $angle = match ((int) $orientation) {
            3 => 180,
            6 => -90,
            8 => 90,
            default => 0,
        };

        return $angle ? (imagerotate($image, $angle, 0) ?: $image) : $image;
    }
}
