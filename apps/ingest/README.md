# Afinia Ingest

A data ingestion service to power Afinia. Currently supports Up.

## Setup

1. Setup your Supabase database and copy your database connection string: https://supabase.com/docs/guides/database/connecting-to-postgres
2. Setup your Up API token: https://developer.up.com.au/#getting-started
3. Copy these values into a newly created `.env` file, see `.env.example` for guidance.
4. Run `db:generate`. This will generate SQL files that will be used to setup your database. You can inspect them under `drizzle/`.
5. Run `db:migrate`. This will setup the tables in your database. You should see:

```zsh
[✓] migrations applied successfully!
```

5. Run `db:seed`. This will begin the initial data load to import all current accounts, categories, tags and transactions from Up API.

If you make any changes to accounts, tags and transactions (e.g. _making a purchase or paying someone_) while the initial data load is running, you will need to run it again.
