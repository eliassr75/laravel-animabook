<!DOCTYPE html>
<html lang="pt-BR" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    @php
        $seo = data_get($page ?? [], 'props.seo', []);
        $seoTitle = trim((string) data_get($seo, 'title', config('app.name', 'Animabook')));
        $seoDescription = trim((string) data_get($seo, 'description', ''));
        $seoCanonical = trim((string) data_get($seo, 'canonical', request()->fullUrl()));
        $seoImage = trim((string) data_get($seo, 'image', ''));
        $seoRobots = trim((string) data_get($seo, 'robots', 'index,follow'));
        $seoOgType = trim((string) data_get($seo, 'ogType', 'website'));
        $seoSiteName = trim((string) data_get($seo, 'siteName', config('app.name', 'Animabook')));
        $seoTwitterSite = trim((string) data_get($seo, 'twitterSite', ''));
        $iconVersion = (string) (@filemtime(public_path('favicon.ico')) ?: '');
    @endphp
    <head>

        <!-- Google tag (gtag.js) -->
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-C40BX029S8"></script>
        <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-C40BX029S8');
        </script>

        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="robots" content="{{ $seoRobots !== '' ? $seoRobots : 'index,follow' }}">
        @if($seoDescription !== '')
            <meta name="description" content="{{ $seoDescription }}">
        @endif
        @if($seoCanonical !== '')
            <link rel="canonical" href="{{ $seoCanonical }}">
        @endif
        <meta property="og:type" content="{{ $seoOgType !== '' ? $seoOgType : 'website' }}">
        <meta property="og:title" content="{{ $seoTitle !== '' ? $seoTitle : config('app.name', 'Animabook') }}">
        @if($seoDescription !== '')
            <meta property="og:description" content="{{ $seoDescription }}">
        @endif
        @if($seoCanonical !== '')
            <meta property="og:url" content="{{ $seoCanonical }}">
        @endif
        @if($seoSiteName !== '')
            <meta property="og:site_name" content="{{ $seoSiteName }}">
        @endif
        @if($seoImage !== '')
            <meta property="og:image" content="{{ $seoImage }}">
        @endif
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="{{ $seoTitle !== '' ? $seoTitle : config('app.name', 'Animabook') }}">
        @if($seoDescription !== '')
            <meta name="twitter:description" content="{{ $seoDescription }}">
        @endif
        @if($seoImage !== '')
            <meta name="twitter:image" content="{{ $seoImage }}">
        @endif
        @if($seoTwitterSite !== '')
            <meta name="twitter:site" content="{{ $seoTwitterSite }}">
        @endif

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <title inertia>{{ $seoTitle !== '' ? $seoTitle : config('app.name', 'Animabook') }}</title>

        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png{{ $iconVersion !== '' ? '?v='.$iconVersion : '' }}">
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png{{ $iconVersion !== '' ? '?v='.$iconVersion : '' }}">
        <link rel="icon" href="/favicon.ico{{ $iconVersion !== '' ? '?v='.$iconVersion : '' }}" sizes="any">
        <link rel="icon" type="image/svg+xml" href="/favicon.svg{{ $iconVersion !== '' ? '?v='.$iconVersion : '' }}">
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png{{ $iconVersion !== '' ? '?v='.$iconVersion : '' }}">

        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
