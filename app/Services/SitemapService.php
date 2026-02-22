<?php

namespace App\Services;

use App\Models\CatalogEntity;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;

class SitemapService
{
    private const CACHE_KEY = 'seo:sitemap:xml:v1';

    public function __construct(
        private readonly SeoSettingsService $settings,
    ) {
    }

    public function generate(bool $force = false): string
    {
        $config = $this->settings->getConfig();
        $cacheMinutes = (int) data_get($config, 'sitemap.cache_minutes', 30);
        $ttl = now()->addMinutes(max(1, $cacheMinutes));

        if ($force) {
            Cache::forget(self::CACHE_KEY);
        }

        return Cache::remember(self::CACHE_KEY, $ttl, function () use ($config): string {
            $entries = $this->entries($config);

            return $this->toXml($entries);
        });
    }

    public function refresh(bool $writeFile = false): array
    {
        $config = $this->settings->getConfig();
        $entries = $this->entries($config);
        $xml = $this->toXml($entries);

        $cacheMinutes = (int) data_get($config, 'sitemap.cache_minutes', 30);
        Cache::put(self::CACHE_KEY, $xml, now()->addMinutes(max(1, $cacheMinutes)));

        if ($writeFile) {
            File::put(public_path('sitemap.xml'), $xml);
        }

        return [
            'url_count' => $entries->count(),
            'written' => $writeFile,
        ];
    }

    public function entries(array $config): Collection
    {
        $baseUrl = rtrim((string) config('app.url'), '/');
        $maxUrls = (int) data_get($config, 'sitemap.max_urls', 50000);
        $staticPaths = collect(data_get($config, 'sitemap.static_paths', []))
            ->filter(fn ($path) => is_string($path) && trim($path) !== '')
            ->unique()
            ->values();

        $entries = collect();

        foreach ($staticPaths as $path) {
            $entries->push([
                'loc' => $baseUrl.'/'.ltrim((string) $path, '/'),
                'lastmod' => now()->toDateString(),
                'changefreq' => 'daily',
                'priority' => ((string) $path === '/' ? '1.0' : '0.8'),
            ]);
        }

        $typeMap = [
            'anime' => '/anime/%d',
            'manga' => '/manga/%d',
            'character' => '/characters/%d',
            'person' => '/people/%d',
            'genre' => '/genres/%d',
            'producer' => '/producers/%d',
            'magazine' => '/magazines/%d',
            'club' => '/clubs/%d',
            'watch' => '/watch/%d',
        ];

        $includeTypes = collect(data_get($config, 'sitemap.include_types', array_keys($typeMap)))
            ->filter(fn ($type) => is_string($type) && isset($typeMap[$type]))
            ->values();

        if ($includeTypes->isEmpty()) {
            return $entries->take($maxUrls);
        }

        CatalogEntity::query()
            ->select(['entity_type', 'mal_id', 'updated_at'])
            ->whereIn('entity_type', $includeTypes->all())
            ->orderBy('entity_type')
            ->orderByDesc('updated_at')
            ->chunk(1000, function ($rows) use (&$entries, $typeMap, $baseUrl, $maxUrls): void {
                foreach ($rows as $row) {
                    if ($entries->count() >= $maxUrls) {
                        break;
                    }

                    $pattern = $typeMap[$row->entity_type] ?? null;
                    if (! $pattern) {
                        continue;
                    }

                    $path = sprintf($pattern, (int) $row->mal_id);
                    $entries->push([
                        'loc' => $baseUrl.$path,
                        'lastmod' => optional($row->updated_at)->toDateString() ?? now()->toDateString(),
                        'changefreq' => in_array($row->entity_type, ['anime', 'manga'], true) ? 'daily' : 'weekly',
                        'priority' => in_array($row->entity_type, ['anime', 'manga'], true) ? '0.7' : '0.6',
                    ]);
                }
            });

        return $entries->take($maxUrls)->values();
    }

    public function toXml(Collection $entries): string
    {
        $xml = [];
        $xml[] = '<?xml version="1.0" encoding="UTF-8"?>';
        $xml[] = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

        foreach ($entries as $entry) {
            $loc = $this->escapeXml((string) ($entry['loc'] ?? ''));
            if ($loc === '') {
                continue;
            }

            $xml[] = '  <url>';
            $xml[] = '    <loc>'.$loc.'</loc>';

            $lastmod = $this->escapeXml((string) ($entry['lastmod'] ?? ''));
            if ($lastmod !== '') {
                $xml[] = '    <lastmod>'.$lastmod.'</lastmod>';
            }

            $changefreq = $this->escapeXml((string) ($entry['changefreq'] ?? ''));
            if ($changefreq !== '') {
                $xml[] = '    <changefreq>'.$changefreq.'</changefreq>';
            }

            $priority = $this->escapeXml((string) ($entry['priority'] ?? ''));
            if ($priority !== '') {
                $xml[] = '    <priority>'.$priority.'</priority>';
            }

            $xml[] = '  </url>';
        }

        $xml[] = '</urlset>';

        return implode("\n", $xml)."\n";
    }

    private function escapeXml(string $value): string
    {
        return htmlspecialchars($value, ENT_XML1 | ENT_COMPAT, 'UTF-8');
    }
}
