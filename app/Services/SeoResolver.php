<?php

namespace App\Services;

use App\Models\CatalogEntity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SeoResolver
{
    public function __construct(
        private readonly SeoSettingsService $settings,
    ) {
    }

    public function resolve(Request $request): array
    {
        $config = $this->settings->getConfig();
        $global = is_array($config['global'] ?? null) ? $config['global'] : [];
        $static = is_array($config['static'] ?? null) ? $config['static'] : [];
        $dynamic = is_array($config['dynamic'] ?? null) ? $config['dynamic'] : [];

        $path = '/'.ltrim($request->path(), '/');
        if ($path === '/index.php') {
            $path = '/';
        }

        $defaultTitle = (string) ($global['default_title'] ?? 'Animabook');
        $defaultDescription = (string) ($global['default_description'] ?? '');
        $titleSuffix = (string) ($global['title_suffix'] ?? '');
        $defaultImage = $this->absoluteUrl((string) ($global['default_image'] ?? '/img/ico.png'));
        $robots = (string) ($global['robots_default'] ?? 'index,follow');

        $title = $defaultTitle;
        $description = $defaultDescription;
        $image = $defaultImage;
        $ogType = 'website';

        $staticSeo = $static[$path] ?? null;
        if (is_array($staticSeo)) {
            $title = (string) ($staticSeo['title'] ?? $title);
            $description = (string) ($staticSeo['description'] ?? $description);
            if (! empty($staticSeo['image'])) {
                $image = $this->absoluteUrl((string) $staticSeo['image']);
            }
            if (! empty($staticSeo['robots'])) {
                $robots = (string) $staticSeo['robots'];
            }
        }

        $dynamicHit = $this->dynamicEntityForPath($path);
        if ($dynamicHit !== null) {
            [$entityType, $malId] = $dynamicHit;
            $entity = $this->loadEntity($entityType, $malId);

            if ($entity) {
                $template = is_array($dynamic[$entityType] ?? null)
                    ? $dynamic[$entityType]
                    : [];

                $entityTitle = $entity->title ?: 'Detalhes';
                $title = $this->applyTemplate(
                    (string) ($template['title'] ?? '{title}'),
                    [
                        'title' => $entityTitle,
                        'type' => $entityType,
                    ],
                );

                $descriptionTemplate = (string) ($template['description'] ?? '');
                if ($descriptionTemplate !== '') {
                    $description = $this->applyTemplate($descriptionTemplate, [
                        'title' => $entityTitle,
                        'type' => $entityType,
                    ]);
                } elseif (is_string($entity->synopsis_short) && trim($entity->synopsis_short) !== '') {
                    $description = mb_substr(trim($entity->synopsis_short), 0, 220);
                }

                $entityImage = $entity->imageUrl();
                if (is_string($entityImage) && trim($entityImage) !== '') {
                    $image = $this->absoluteUrl($entityImage);
                }

                $ogType = in_array($entityType, ['anime', 'manga'], true) ? 'article' : 'website';
            }
        }

        $hasQuery = count($request->query()) > 0;
        if ($hasQuery && (bool) ($global['noindex_query_pages'] ?? true)) {
            $robots = 'noindex,follow';
        }

        $siteName = (string) ($global['site_name'] ?? 'Animabook');
        $fullTitle = $title;
        if ($titleSuffix !== '' && ! str_contains(mb_strtolower($title), mb_strtolower($siteName))) {
            $fullTitle .= $titleSuffix;
        }

        return [
            'title' => trim($fullTitle) !== '' ? $fullTitle : $defaultTitle,
            'description' => $description !== '' ? $description : $defaultDescription,
            'canonical' => $request->url(),
            'image' => $image,
            'robots' => $robots,
            'ogType' => $ogType,
            'siteName' => $siteName,
            'twitterSite' => (string) ($global['twitter_site'] ?? ''),
        ];
    }

    private function dynamicEntityForPath(string $path): ?array
    {
        if (! preg_match('#^/([a-z]+)/(\d+)$#', $path, $matches)) {
            return null;
        }

        $segment = strtolower((string) ($matches[1] ?? ''));
        $malId = (int) ($matches[2] ?? 0);
        if ($malId <= 0) {
            return null;
        }

        $type = match ($segment) {
            'anime' => 'anime',
            'manga' => 'manga',
            'characters' => 'character',
            'people' => 'person',
            'genres' => 'genre',
            'producers' => 'producer',
            'magazines' => 'magazine',
            'clubs' => 'club',
            'watch' => 'watch',
            default => null,
        };

        if ($type === null) {
            return null;
        }

        return [$type, $malId];
    }

    private function loadEntity(string $entityType, int $malId): ?CatalogEntity
    {
        $cacheKey = "seo:entity:{$entityType}:{$malId}";

        return Cache::remember($cacheKey, now()->addMinutes(15), function () use ($entityType, $malId): ?CatalogEntity {
            return CatalogEntity::query()
                ->where('entity_type', $entityType)
                ->where('mal_id', $malId)
                ->first();
        });
    }

    private function applyTemplate(string $template, array $params): string
    {
        $result = $template;
        foreach ($params as $key => $value) {
            $result = str_replace('{'.$key.'}', (string) $value, $result);
        }

        return $result;
    }

    private function absoluteUrl(string $url): string
    {
        $trim = trim($url);
        if ($trim === '') {
            return '';
        }

        if (str_starts_with($trim, 'http://') || str_starts_with($trim, 'https://')) {
            return $trim;
        }

        return rtrim((string) config('app.url'), '/').'/'.ltrim($trim, '/');
    }
}
