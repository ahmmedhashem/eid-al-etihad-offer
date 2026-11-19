<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Response;

class SeoController extends Controller
{
    /** Dynamic so the sitemap URL always matches APP_URL (the static public/robots.txt was removed). */
    public function robots(): Response
    {
        $lines = app()->isProduction()
            ? ['User-agent: *', 'Allow: /', 'Disallow: /dashboard', 'Disallow: /login', 'Disallow: /settings', 'Disallow: /forgot-password', 'Disallow: /reset-password', '', 'Sitemap: '.url('/sitemap.xml')]
            : ['User-agent: *', 'Disallow: /']; // never let staging/local copies get indexed

        return response(implode("\n", $lines)."\n", 200, ['Content-Type' => 'text/plain; charset=UTF-8']);
    }

    public function sitemap(): Response
    {
        $updated = Setting::whereIn('key', ['landing', 'landing_en'])->max('updated_at');
        $lastmod = $updated ? date('Y-m-d', strtotime($updated)) : now()->toDateString();
        $urls = ['ar' => url('/'), 'en' => url('/en')];

        $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'."\n";
        foreach ($urls as $loc) {
            $xml .= "  <url>\n    <loc>".e($loc)."</loc>\n    <lastmod>{$lastmod}</lastmod>\n";
            foreach ($urls as $lang => $href) {
                $xml .= '    <xhtml:link rel="alternate" hreflang="'.$lang.'" href="'.e($href).'"/>'."\n";
            }
            $xml .= '    <xhtml:link rel="alternate" hreflang="x-default" href="'.e($urls['ar']).'"/>'."\n  </url>\n";
        }
        $xml .= "</urlset>\n";

        return response($xml, 200, ['Content-Type' => 'application/xml; charset=UTF-8']);
    }
}
