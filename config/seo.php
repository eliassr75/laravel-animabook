<?php

return [
    'global' => [
        'site_name' => env('SEO_SITE_NAME', 'Animabook'),
        'title_suffix' => env('SEO_TITLE_SUFFIX', ' | Animabook'),
        'default_title' => env('SEO_DEFAULT_TITLE', 'Animabook'),
        'default_description' => env('SEO_DEFAULT_DESCRIPTION', 'Descubra, organize e acompanhe animes e mangás no Animabook.'),
        'default_image' => env('SEO_DEFAULT_IMAGE', '/img/ico.png'),
        'robots_default' => env('SEO_ROBOTS_DEFAULT', 'index,follow'),
        'twitter_site' => env('SEO_TWITTER_SITE', ''),
        'noindex_query_pages' => env('SEO_NOINDEX_QUERY_PAGES', true),
    ],

    'static' => [
        '/' => [
            'title' => 'Início',
            'description' => 'Explore animes e mangás, acompanhe tendências e organize sua lista.',
        ],
        '/anime' => [
            'title' => 'Animes',
            'description' => 'Catálogo de animes com filtros avançados, ranking e busca rápida.',
        ],
        '/manga' => [
            'title' => 'Mangás',
            'description' => 'Catálogo de mangás com filtros por status, ano, gênero e popularidade.',
        ],
        '/news' => [
            'title' => 'Notícias',
            'description' => 'Notícias recentes de anime e mangá em um único lugar.',
        ],
        '/seasons' => [
            'title' => 'Temporadas',
            'description' => 'Acompanhe os animes por temporada e ano.',
        ],
        '/top' => [
            'title' => 'Ranking',
            'description' => 'Veja os animes mais bem avaliados da base.',
        ],
        '/genres' => [
            'title' => 'Gêneros',
            'description' => 'Navegue por gêneros e descubra novos títulos.',
        ],
        '/characters' => [
            'title' => 'Personagens',
            'description' => 'Descubra personagens populares e seus títulos relacionados.',
        ],
        '/people' => [
            'title' => 'Pessoas',
            'description' => 'Conheça dubladores, diretores e artistas da indústria.',
        ],
        '/producers' => [
            'title' => 'Produtores',
            'description' => 'Explore estúdios e produtoras do universo anime.',
        ],
        '/magazines' => [
            'title' => 'Revistas',
            'description' => 'Veja revistas e publicações do mundo dos mangás.',
        ],
        '/clubs' => [
            'title' => 'Clubes',
            'description' => 'Descubra clubes e comunidades sobre anime e mangá.',
        ],
        '/watch' => [
            'title' => 'Onde Assistir',
            'description' => 'Encontre plataformas e links para assistir seus títulos favoritos.',
        ],
    ],

    'dynamic' => [
        'anime' => [
            'title' => '{title}',
            'description' => 'Detalhes completos, personagens, notícias e avaliações de {title}.',
        ],
        'manga' => [
            'title' => '{title}',
            'description' => 'Detalhes completos, personagens, notícias e avaliações de {title}.',
        ],
        'character' => [
            'title' => '{title}',
            'description' => 'Veja informações e obras relacionadas ao personagem {title}.',
        ],
        'person' => [
            'title' => '{title}',
            'description' => 'Veja informações e obras relacionadas à pessoa {title}.',
        ],
        'genre' => [
            'title' => '{title}',
            'description' => 'Títulos e informações relacionados ao gênero {title}.',
        ],
        'producer' => [
            'title' => '{title}',
            'description' => 'Títulos e informações relacionados ao produtor {title}.',
        ],
        'magazine' => [
            'title' => '{title}',
            'description' => 'Títulos e informações relacionados à revista {title}.',
        ],
        'club' => [
            'title' => '{title}',
            'description' => 'Informações e títulos relacionados ao clube {title}.',
        ],
        'watch' => [
            'title' => '{title}',
            'description' => 'Onde assistir e dados relacionados a {title}.',
        ],
    ],

    'sitemap' => [
        'cache_minutes' => 30,
        'max_urls' => 50000,
        'include_types' => ['anime', 'manga', 'character', 'person', 'genre', 'producer', 'magazine', 'club', 'watch'],
        'static_paths' => [
            '/',
            '/anime',
            '/manga',
            '/news',
            '/seasons',
            '/top',
            '/genres',
            '/characters',
            '/people',
            '/producers',
            '/magazines',
            '/clubs',
            '/watch',
        ],
    ],
];
