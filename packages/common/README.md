# Afinia Common Library

Contains database schema, queries and external API schema types.

## Regenerate Up Banking API schema

When the Up Banking API specification changes, its schema will need to be regenerated.

```zsh
# If you use npm
npm generate:types

# If you use pnpm
pnpm generate:types

# 🚀 https://raw.githubusercontent.com/up-banking/api/refs/heads/master/v1/openapi.json -> providers/up/types.ts
```
