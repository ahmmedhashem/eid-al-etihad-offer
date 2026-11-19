<?php

namespace App\Http\Controllers;

use App\Support\LandingContent;
use Inertia\Inertia;
use Inertia\Response;

class LandingController extends Controller
{
    public function arabic(): Response
    {
        return $this->show('ar');
    }

    public function english(): Response
    {
        return $this->show('en');
    }

    private function show(string $locale): Response
    {
        $content = LandingContent::forPublic($locale);
        // Real pixel sizes of the hero photos, so the page reserves their space before they load (no layout jump).
        $content['hero']['image_size'] = $this->imageSize($content['hero']['image']);
        $content['hero']['image_mobile_size'] = $this->imageSize($content['hero']['image_mobile']);
        $alternates = ['ar' => url('/'), 'en' => url('/en')];

        return Inertia::render('landing', [
            'content' => $content,
            'locale' => $locale,
            'alternates' => $alternates,
        ])
            // SEO + ad-pixel tags are rendered server-side in app.blade.php so crawlers and link previews see them.
            ->withViewData([
                'landing' => [
                    'locale' => $locale,
                    'alternates' => $alternates,
                    'seo' => $content['seo'],
                    'tracking' => $content['tracking'],
                    'og_image' => $content['seo']['og_image'] ?: $content['hero']['image'],
                    'hero_image' => $content['hero']['image'],
                    'hero_image_mobile' => $content['hero']['image_mobile'],
                    'site_name' => $content['brand']['name'],
                    'schema' => $this->schema($content, $locale, $alternates),
                ],
            ]);
    }

    /** [width, height] of an uploaded image, or null. */
    private function imageSize(?string $url): ?array
    {
        if (! $url || ! str_starts_with($url, '/storage/uploads/')) {
            return null;
        }
        $size = @getimagesize(public_path($url));

        return $size ? [$size[0], $size[1]] : null;
    }

    /**
     * schema.org JSON-LD: the business, this page, and the FAQ. Values that still contain a
     * "[placeholder]" are left out so search engines never see unfinished text.
     */
    private function schema(array $c, string $locale, array $alternates): array
    {
        $real = fn ($v) => is_string($v) && trim($v) !== '' && ! preg_match('/\[[^\]]*\]/', $v);
        $abs = fn ($path) => $path ? url($path) : null;

        $org = array_filter([
            '@type' => 'RealEstateAgent',
            '@id' => url('/').'#organization',
            'name' => $c['brand']['name'],
            'url' => $alternates[$locale],
            'telephone' => $real($c['brand']['phone']) ? $c['brand']['phone'] : null,
            'email' => $real($c['brand']['email']) ? $c['brand']['email'] : null,
            'logo' => $abs($c['brand']['logo']),
            'image' => $abs($c['hero']['image']),
            'address' => $real($c['brand']['address'])
                ? ['@type' => 'PostalAddress', 'streetAddress' => $c['brand']['address'], 'addressCountry' => 'AE']
                : ['@type' => 'PostalAddress', 'addressCountry' => 'AE'],
            'areaServed' => ['Sharjah', 'Ajman'],
        ]);

        $page = array_filter([
            '@type' => 'WebPage',
            '@id' => $alternates[$locale].'#webpage',
            'url' => $alternates[$locale],
            'name' => $c['seo']['title'],
            'description' => $c['seo']['description'],
            'inLanguage' => $locale,
            'about' => ['@id' => url('/').'#organization'],
            'primaryImageOfPage' => $abs($c['seo']['og_image'] ?: $c['hero']['image']),
        ]);

        $faq = collect($c['faq']['items'] ?? [])
            ->filter(fn ($i) => $real($i['q'] ?? '') && $real($i['a'] ?? ''))
            ->map(fn ($i) => ['@type' => 'Question', 'name' => $i['q'], 'acceptedAnswer' => ['@type' => 'Answer', 'text' => $i['a']]])
            ->values()->all();

        $graph = [$org, $page];
        if ($faq) {
            $graph[] = ['@type' => 'FAQPage', '@id' => $alternates[$locale].'#faq', 'inLanguage' => $locale, 'mainEntity' => $faq];
        }

        return ['@context' => 'https://schema.org', '@graph' => $graph];
    }
}
