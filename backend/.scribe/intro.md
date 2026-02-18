# Introduction

Secure API for sharing sensitive information that self-destructs after being viewed.

<aside>
    <strong>Base URL</strong>: <code>http://secure-drop.localhost</code>
</aside>

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

