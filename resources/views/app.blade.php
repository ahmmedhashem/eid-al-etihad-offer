@php
    $isLanding = ($page['component'] ?? '') === 'landing';
    $locale = $landing['locale'] ?? 'ar';
    $isEn = $isLanding && $locale === 'en';
    $alternates = $landing['alternates'] ?? [];
    $seo = $landing['seo'] ?? null;
    $tracking = $landing['tracking'] ?? [];
    $ogImage = isset($landing['og_image']) && $landing['og_image'] ? url($landing['og_image']) : null;
    // IDs are validated server-side (UpdateContentRequest) before they can reach these tags.
    $gtm = $tracking['gtm_id'] ?? '';
    $metaPixel = $tracking['meta_pixel_id'] ?? '';
    $tiktok = $tracking['tiktok_pixel_id'] ?? '';
    $snap = $tracking['snap_pixel_id'] ?? '';

    // Server-side rendering (Inertia SSR) for the public landing page only, so the headline and text are in the
    // first HTML response (faster first paint, fully crawlable). If the SSR process isn't running this returns
    // null and the page falls back to normal client rendering. @inertiaHead / @inertia reuse this result.
    $__inertiaSsrDispatched = true;
    $__inertiaSsrResponse = $isLanding ? app(\Inertia\Ssr\Gateway::class)->dispatch($page) : null;
    $heroImage = $landing['hero_image'] ?? null;
@endphp
<!DOCTYPE html>
<html lang="{{ $isLanding ? $locale : 'en' }}" dir="{{ $isLanding && ! $isEn ? 'rtl' : 'ltr' }}" @if ($isLanding) data-landing @endif>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="theme-color" content="#a9563f">
        <link rel="icon" href="/favicon.ico" type="image/x-icon" sizes="32x32">

        @if ($isLanding && $seo)
            @unless ($__inertiaSsrResponse)
                <title inertia>{{ $seo['title'] }}</title>
            @endunless
            <meta name="description" content="{{ $seo['description'] }}">
            <meta property="og:type" content="website">
            <meta property="og:locale" content="{{ $isEn ? 'en_AE' : 'ar_AE' }}">
            <meta property="og:locale:alternate" content="{{ $isEn ? 'ar_AE' : 'en_AE' }}">
            <meta property="og:title" content="{{ $seo['title'] }}">
            <meta property="og:description" content="{{ $seo['description'] }}">
            <meta property="og:url" content="{{ $alternates[$locale] ?? url('/') }}">
            <meta property="og:site_name" content="{{ $landing['site_name'] ?? '' }}">
            <meta name="twitter:title" content="{{ $seo['title'] }}">
            <meta name="twitter:description" content="{{ $seo['description'] }}">
            @if ($ogImage)
                <meta property="og:image" content="{{ $ogImage }}">
                <meta name="twitter:card" content="summary_large_image">
            @endif
            <link rel="canonical" href="{{ $alternates[$locale] ?? url('/') }}">
            @foreach ($alternates as $lang => $href)
                <link rel="alternate" hreflang="{{ $lang }}" href="{{ $href }}">
            @endforeach
            <link rel="alternate" hreflang="x-default" href="{{ $alternates['ar'] ?? url('/') }}">
            @if (! empty($landing['schema']))
                {{-- JSON_HEX_TAG escapes < and > so admin text can never close this script tag --}}
                <script type="application/ld+json">{!! json_encode($landing['schema'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP) !!}</script>
            @endif
        @else
            <title inertia>{{ config('app.name', 'Laravel') }}</title>
            <meta name="robots" content="noindex, nofollow">
        @endif

        @if ($isLanding && $heroImage)
            {{-- Largest element on the page: start downloading it before CSS/JS are parsed (phone version if set) --}}
            @php $heroMobile = $landing['hero_image_mobile'] ?? null; @endphp
            @foreach (array_filter([[$heroImage, $heroMobile ? '(min-width: 768px)' : null], [$heroMobile, '(max-width: 767px)']], fn ($i) => $i[0]) as [$src, $media])
                <link rel="preload" as="image" href="{{ $src }}" fetchpriority="high" @if ($media) media="{{ $media }}" @endif
                    @if ($set = \App\Support\ImageOptimizer::srcset($src)) imagesrcset="{{ $set }}" imagesizes="100vw" @endif>
            @endforeach
        @endif
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        @if ($isEn)
            {{-- Brand guidelines: Oswald (primary English) for headings, Noto Sans (secondary English) for text --}}
            @php $fontCss = 'https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&family=Noto+Sans+Arabic:wght@600&family=Oswald:wght@600&display=swap'; @endphp
            <link rel="preload" as="style" href="{{ $fontCss }}" onload="this.onload=null;this.rel='stylesheet'">
            <noscript><link rel="stylesheet" href="{{ $fontCss }}"></noscript>
        @elseif ($isLanding)
            @php $fontCss = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;600;700;800&family=Oswald:wght@600&display=swap'; @endphp
            <link rel="preload" as="style" href="{{ $fontCss }}" onload="this.onload=null;this.rel='stylesheet'">
            <noscript><link rel="stylesheet" href="{{ $fontCss }}"></noscript>
        @else
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet">
        @endif

        @if ($isLanding && $gtm)
            <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','{{ $gtm }}');</script>
        @endif
        @if ($isLanding && $metaPixel)
            <script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','{{ $metaPixel }}');fbq('track','PageView');</script>
        @endif
        @if ($isLanding && $tiktok)
            <script>!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=d.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('{{ $tiktok }}');ttq.page();}(window,document,'ttq');</script>
        @endif
        @if ($isLanding && $snap)
            <script>(function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s='script';var r=t.createElement(s);r.async=!0;r.src=n;var u=t.getElementsByTagName(s)[0];u.parentNode.insertBefore(r,u);})(window,document,'https://sc-static.net/scevent.min.js');snaptr('init','{{ $snap }}',{});snaptr('track','PAGE_VIEW');</script>
        @endif

        @unless ($isLanding)
            @routes
        @endunless
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @if ($isLanding && $gtm)
            <noscript><iframe src="https://www.googletagmanager.com/ns.html?id={{ $gtm }}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
        @endif
        @inertia
    </body>
</html>
