## Context

- Stack actual: Next.js 16 (App Router, RSC + Server Actions), React 19, TypeScript strict, Biome, Bun como package manager.
- `better-auth@1.6.18` ya está en `dependencies` y `next.config.ts` lo marca en `serverExternalPackages`, lo que indica intención de persistir usuarios, pero el proyecto no tiene aún ORM ni driver de DB.
- No existen `db/`, `migrations/`, ni archivo `.env` committed (sí hay `.env` local no versionado).
- El proyecto aún no tiene tablas de dominio; esta propuesta introduce la primera capa de persistencia mínima viable con la única tabla que `better-auth` necesita para arrancar.
- Drizzle ORM con driver `libsql` se eligió porque: (a) corre embebido en Node (mismo runtime de Next), (b) tiene tipos generados sin code-gen separado, (c) `better-auth` documenta adaptador Drizzle oficial, (d) es portable a Turso/libSQL serverless sin reescritura.

## Goals / Non-Goals

**Goals**

- Proveer una conexión Drizzle/SQLite tipada y singleton usable desde Server Components, Server Actions y Route Handlers.
- Definir el esquema inicial con la tabla `users` alineada al modelo de `better-auth`, suficiente para que el adapter oficial de `better-auth` opere.
- Habilitar migraciones reproducibles con `drizzle-kit generate` + `drizzle-kit migrate` y un modo rápido de prototipado con `drizzle-kit push`.
- Mantener la DB local fuera de git (`*.db`, `*.db-journal`) y documentar la variable de entorno requerida.

**Non-Goals**

- No incluye adapter de `better-auth` (queda para un change posterior que conecte `auth.ts` con la tabla `users`).
- No incluye seeds con datos de negocio: el `db:seed` inserta un único usuario demo solo si la tabla está vacía, y nada más.
- No introduce Turso ni deploy serverless: la conexión es local con `file:./local.db`.
- No define API pública de queries/repositorios; el `db` se exporta crudo para que cada dominio construya sus propias queries.
- No introduce tablas de dominio adicionales (la tabla `todos` que se evaluó como placeholder queda fuera de scope — el seed/test debe operar sobre `users`).

## Decisions

### Driver: `@libsql/client` sobre `better-sqlite3` o `node:sqlite`

- **Por qué libsql**: API idéntica a SQLite estándar + compatible con Turso si el proyecto migra a serverless más adelante. Funciona en cualquier runtime Node ≥18 sin compilación nativa (a diferencia de `better-sqlite3`).
- **Por qué no `better-sqlite3`**: requiere `node-gyp`/build nativo, complica builds de Vercel/edge y no aporta nada frente a libsql para este caso.
- **Por qué no `node:sqlite`**: estable pero todavía reciente; libsql ya es la opción documentada de Drizzle para "nueva DB SQLite" y es lo que usaría el equipo si migra a Turso.

### Ubicación del esquema: `db/schema.ts` + `db/index.ts` en la raíz del repo

- La raíz (no `src/db/`) resuelve el import `@/db` que el seed y el cliente usan, gracias al alias `paths: { "@/*": ["./*"] }` de `tsconfig.json`.
- `index.ts` exporta el `db` ya configurado y re-exporta `schema` para inferencia tipada de queries (`db.select().from(schema.users)`).
- El módulo `db/index.ts` marca `"server-only"` para que un import accidental desde un Client Component falle en build, no en runtime.

### Carpeta de migraciones: `migrations/` (no `drizzle/`)

- Nombre neutro, alineado con la convención de otros ORMs y de la mayoría de los proyectos del ecosistema.
- `drizzle.config.ts` apunta `out: "./migrations"`; los archivos SQL y `meta/_journal.json` viven ahí y se commitean.

### Nombre del archivo SQLite: `local.db` en la raíz del proyecto

- Coincide con el ejemplo de la doc (`file:local.db`); el archivo queda ignorado por git.
- La variable de entorno `DATABASE_URL` lo sobrescribe para apuntar a Turso u otra ruta sin tocar código.

### Esquema inicial: solo `users` (better-auth)

- `users` con columnas `id text pk`, `name text not null`, `email text unique not null`, `emailVerified integer (boolean) not null default false`, `image text`, `createdAt integer (timestamp_ms) not null`, `updatedAt integer (timestamp_ms) not null` — mapea 1:1 con el esquema esperado por el adaptador Drizzle de better-auth.
- Sin tabla `todos` placeholder: la primera capa de persistencia no necesita smoke test propio; el smoke real es que `better-auth` pueda leer/escribir `users`, y eso se valida en el siguiente change que conecte el adapter.
- Timestamps almacenados como `integer` epoch ms (no `text`) para poder indexar y ordenar barato; al leer se convierten a `Date` por Drizzle (`mode: "timestamp_ms"`).

### Cliente singleton con guardas de HMR

- En `db/index.ts` se usa el patrón `globalThis.__coffeeTechDb ??= drizzle(...)` para evitar múltiples conexiones en dev bajo HMR de Next.
- En producción el módulo se evalúa una vez por proceso del server runtime, por lo que no hay fuga.

### Scripts npm vs. bunx directos

- `package.json` ya usa `bunx --bun @biomejs/biome …`; replico el patrón con `bunx --bun drizzle-kit …` en los scripts `db:*` para mantener coherencia.
- `db:seed` usa `tsx` (no `bun`) porque debe correr también en CI sin asumir Bun instalado.

## Risks / Trade-offs

- **Riesgo — conexión a archivo en serverless**: SQLite embebido no es ideal para deploy en Vercel Edge/Serverless (FS efímero). Si más adelante se quiere deploy serverless, hay que migrar a Turso. Mitigación: el contrato queda detrás de `DATABASE_URL`, el cambio es solo config.
- **Riesgo — divergencia con better-auth**: las columnas de `users` deben coincidir con lo que el adaptador Drizzle de better-auth espera. Si better-auth cambia su esquema, este change queda desincronizado. Mitigación: documentar la versión objetivo y dejar el adapter para el siguiente change donde se valida en runtime.
- **Trade-off — `db` exportado crudo**: cualquier consumidor puede escribir queries ad-hoc; no hay capa de repositorios. Aceptable en esta fase porque no hay dominio; se puede introducir un `db/repos/` cuando aparezcan ≥2 casos de uso con la misma tabla.
- **Trade-off — `push` en dev**: `drizzle-kit push` es cómodo para iterar pero puede divergir del historial de migraciones. Se documenta explícitamente que `push` es solo para prototipado local y `generate`+`migrate` es el flujo canónico.
