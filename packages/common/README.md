# Afinia Common Library

## Regenerate Up Banking API schema

When the Up Banking API specification changes, its schema will need to be regenerated.

```zsh
# If you use npm
npx openapi-typescript https://raw.githubusercontent.com/up-banking/api/refs/heads/master/v1/openapi.json -o types/up-api.ts

# If you use pnpm
pnpm exec openapi-typescript https://raw.githubusercontent.com/up-banking/api/refs/heads/master/v1/openapi.json -o types/up-api.ts

# 🚀 https://raw.githubusercontent.com/up-banking/api/refs/heads/master/v1/openapi.json -> types/up-api.ts
```
