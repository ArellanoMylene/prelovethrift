# Pre-Loved Thrift API

This optional Express API uses the existing Supabase Auth and PostgreSQL project. It does not create or alter tables, change migrations, or use a service-role key. Authenticated requests are executed with the caller's Supabase access token, so the existing database row-level security policies remain in force.

The current Vue app is unchanged and continues to call Supabase directly. This API can be used independently; switching the app to call it would require frontend changes.

## Run locally

1. Copy `.env.example` to `.env` in this folder.
2. Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` to the same project values as the frontend's Supabase settings.
3. From this folder, run:

   ```sh
   npm install
   npm run dev
   ```

The API listens only on `127.0.0.1:3000` by default, so it is reachable only from this computer. Set `HOST` explicitly only when you intend to expose it on another interface. `CLIENT_ORIGIN` accepts a comma-separated list of allowed browser origins.

## Endpoints

| Method | Path | Access |
| --- | --- | --- |
| `GET` | `/api/health` | Public |
| `GET` | `/api/products` | Public; active products with stock |
| `GET` | `/api/me` | Signed-in user |
| `PATCH` | `/api/me` | Signed-in user; `full_name`, `phone`, `address`, `avatar` |
| `GET` | `/api/seller/products` | Seller |
| `POST` | `/api/seller/products` | Seller |
| `PATCH` | `/api/seller/products/:id` | Seller; `price`, `stock`, `reorderPoint`, `autoReorder` |
| `DELETE` | `/api/seller/products/:id` | Seller |

Send the Supabase session access token on authenticated requests:

```http
Authorization: Bearer <supabase-access-token>
```

The server uses the Supabase anon key only. Never put a Supabase service-role key in this API's environment.
