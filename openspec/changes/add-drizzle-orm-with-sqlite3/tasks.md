## 1. Dependencies and tooling

- [x] 1.1 Instalar dependencias de runtime: `bun add drizzle-orm @libsql/client`
- [x] 1.2 Instalar dependencias de dev: `bun add -d drizzle-kit tsx`
- [x] 1.3 Agregar scripts `db:generate`, `db:migrate`, `db:push`, `db:studio`, `db:seed` en `package.json` usando `bunx --bun drizzle-kit` y `tsx` siguiendo el patrón existente de Biome

## 2. Configuration

- [x] 2.1 Crear `drizzle.config.ts` en la raíz del proyecto con `schema: "./db/schema.ts"`, `out: "./migrations"`, `dialect: "sqlite"`, `dbCredentials.url` desde `process.env.DATABASE_URL`, y requerir la env var
- [x] 2.2 Crear `.env.example` documentando `DATABASE_URL=file:./local.db`
- [x] 2.3 Actualizar `.gitignore` para excluir `*.db`, `*.db-journal`, `*.db-shm`, `*.db-wal` y asegurar que `.env` está ignorado

## 3. Schema and client

- [x] 3.1 Crear `db/schema.ts` con la tabla `users` (shape de better-auth: `id text pk`, `name text not null`, `email text unique not null`, `emailVerified integer (boolean) default false not null`, `image text`, `createdAt integer (timestamp_ms) not null`, `updatedAt integer (timestamp_ms) not null`)
- [x] 3.2 Crear `db/index.ts` exportando un cliente Drizzle tipado con singleton HMR-safe vía `globalThis.__coffeeTechDb ??= drizzle(...)`; lanzar error al cargar el módulo si falta `DATABASE_URL`; marcar el módulo como `"server-only"`
- [x] 3.3 Re-exportar las tablas del schema desde `db/index.ts` como `schema` para inferencia tipada de queries

## 4. Migrations and seed

- [x] 4.1 Crear `scripts/seed.ts` que abra el cliente de DB, sea no-op si `users` ya tiene filas, e inserte un único usuario demo en caso contrario
- [x] 4.2 Ejecutar `bun run db:generate` para producir la primera migración en `migrations/`
- [x] 4.3 Ejecutar `bun run db:migrate` contra `local.db` y verificar que la tabla `users` existe con `bunx --bun sqlite3 ./local.db ".tables"` o Drizzle Studio
- [x] 4.4 Ejecutar `bun run db:seed` y verificar que la fila se inserta

## 5. Verification

- [x] 5.1 `bunx --bun tsc --noEmit` pasa sin errores de tipo
- [x] 5.2 `bun run check` (Biome) no reporta issues nuevos en los archivos creados
- [x] 5.3 `git status` no lista `local.db` ni `.env` como untracked
- [x] 5.4 Un Server Component de prueba que ejecute `db.select().from(schema.users)` renderiza sin errores de runtime en `bun run dev`
