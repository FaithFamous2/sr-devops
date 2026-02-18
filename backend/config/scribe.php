<?php

use Knuckles\Scribe\Extracting\Strategies;

return [
    'type' => 'static',
    'title' => 'Secure Drop API',
    'description' => 'Secure API for sharing sensitive information that self-destructs after being viewed.',
    'theme' => 'default',

    'static' => [
        'output_path' => 'public/docs',
    ],

    'laravel' => [
        'add_routes' => true,
        'docs_url' => '/docs',
        'middleware' => [],
    ],

    'auth' => [
        'enabled' => false,
        'default' => false,
        'in' => 'bearer',
        'name' => 'api_key',
        'use_value' => '',
        'placeholder' => '',
        'extra_info' => '',
    ],

    'intro_text' => <<<'INTRO'
This documentation describes the Secure Drop API.

## Introduction

Secure Drop allows you to securely share sensitive information (like passwords or API keys) that self-destructs after being viewed.

## Features

- **Burn on Read**: Secrets are deleted after being viewed
- **Time-based Expiration**: Optional TTL for secrets
- **View Limits**: Control how many times a secret can be viewed
- **Encryption at Rest**: All secrets are encrypted in the database
- **Secure IDs**: Non-sequential IDs prevent URL enumeration attacks

## Error Responses

All error responses follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```
INTRO,

    'example_languages' => ['bash', 'javascript'],
    'base_url' => env('APP_URL', 'http://localhost'),

    'strategies' => [
        'metadata' => [
            Strategies\Metadata\GetFromDocBlocks::class,
        ],
        'urlParameters' => [
            Strategies\UrlParameters\GetFromLaravelRoute::class,
            Strategies\UrlParameters\GetFromUrlParamTag::class,
        ],
        'queryParameters' => [
            Strategies\QueryParameters\GetFromFormRequest::class,
            Strategies\QueryParameters\GetFromQueryParamTag::class,
        ],
        'headers' => [
            Strategies\Headers\GetFromRouteRules::class,
            Strategies\Headers\GetFromHeaderTag::class,
        ],
        'bodyParameters' => [
            Strategies\BodyParameters\GetFromFormRequest::class,
            Strategies\BodyParameters\GetFromInlineValidator::class,
            Strategies\BodyParameters\GetFromBodyParamTag::class,
        ],
        'responses' => [
            Strategies\Responses\UseTransformerTags::class,
            Strategies\Responses\UseResponseTag::class,
            Strategies\Responses\UseResponseFileTag::class,
            Strategies\Responses\UseApiResourceTags::class,
            Strategies\Responses\UseJsonResourceTags::class,
            Strategies\Responses\ResponseCalls::class,
        ],
        'responseFields' => [
            Strategies\ResponseFields\GetFromResponseFieldTag::class,
        ],
    ],

    'routes' => [
        [
            'match' => [
                'prefixes' => ['api/*'],
            ],
            'include' => [],
            'exclude' => [],
            'apply' => [
                'headers' => [],
            ],
        ],
    ],

    'database_connections_to_transact' => [],
];
