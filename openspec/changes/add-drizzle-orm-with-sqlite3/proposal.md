## Why

El proyecto no tiene una capa de persistencia: el `package.json` ya lista `better-auth` (que requiere un adaptador de base de datos) pero no hay ORM ni migraciones configuradas, por lo que auth y futuros modelos de dominio no tienen dónde vivir. Drizzle ORM con el driver `libsql` (SQLite local) ofrece un setup mínimo, tipado de extremo a extremo y migraciones reproducibles sin sumar un servicio externo.

## What Changes

- Agregar `drizzle-orm`, `@libsql/client` como dependencias de runtime y `drizzle-kit`, `tsx` como dependencias de desarrollo.
- Crear `drizzle.config.ts` en la raíz apuntando al schema en `db/schema.ts` y a la carpeta `migrations/` para artefactos de migración.
- Crear `db/schema.ts` con la tabla de usuarios (`users`) requerida por `better-auth` (id, name, email, emailVerified, image, createdAt, updatedAt).
- Crear `db/index.ts` que exporte el cliente `drizzle` configurado con `process.env.DATABASE_URL` (URL estilo `file:./local.db`) y re-exporte el schema.
- Agregar `.env.example` documentando `DATABASE_URL` y `.gitignore` para `*.db`, `*.db-journal`, `.env`.
- Agregar scripts npm: `db:generate` (drizzle-kit generate), `db:migrate` (drizzle-kit migrate), `db:push` (drizzle-kit push), `db:studio` (drizzle-kit studio) y `db:seed` (tsx scripts/seed.ts).

## Capabilities

### New Capabilities

- `data-persistence`: Configuración de Drizzle ORM con SQLite (libsql) para la app: conexión, esquema inicial, migraciones y scripts operativos.

### Modified Capabilities

_Ninguna._

## Impact

- _Sin breaking changes._ No hay código de aplicación que dependa de un esquema hoy.
- Nuevas dependencias de runtime: `drizzle-orm`, `@libsql/client`.
- Nuevas dependencias de dev: `drizzle-kit`, `tsx`.
- Se introducen los directorios `db/` (cliente + schema) y `migrations/` (SQL versionado por drizzle-kit).
