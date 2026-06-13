## MODIFIED Requirements

### Requirement: El cliente de Drizzle se expone como un singleton tipado y queda cableado al adapter de better-auth

La aplicación DEBE exponer una única instancia tipada del cliente Drizzle ORM que pueda importarse desde código del servidor (Server Components, Server Actions, Route Handlers) sin crear conexiones duplicadas bajo HMR. Además, el módulo `lib/auth.ts` DEBE usar ese mismo cliente como adapter de `betterAuth({ database: drizzleAdapter(db, { provider: "sqlite", schema }) })` para que las operaciones de sign-up, sign-in, sign-out y get-session lean y escriban filas reales en la tabla `users` de `db/schema.ts`, reemplazando cualquier adapter en memoria.

#### Scenario: Importar el cliente en un módulo del servidor

- **WHEN** un módulo del servidor importa el cliente de base de datos (ej. `import { db } from "@/db"`)
- **THEN** recibe una instancia `LibSQLDatabase` completamente tipada y vinculada a la URL de conexión de `DATABASE_URL`

#### Scenario: HMR no filtra conexiones

- **WHEN** el dev server de Next.js recarga el módulo que crea el cliente de Drizzle
- **THEN** se reusa la misma conexión subyacente en lugar de abrir una nueva en cada recarga

#### Scenario: better-auth persiste usuarios en la tabla `users`

- **WHEN** un visitante completa el flujo de sign-up vía el endpoint `/api/auth/sign-up/email` con un email y contraseña válidos
- **THEN** better-auth escribe una fila nueva en la tabla `users` de la base SQLite apuntada por `DATABASE_URL` (no en memoria) y la fila sobrevive a un reinicio del dev server

#### Scenario: better-auth lee la sesión desde la tabla `users` (o su tabla de sesiones) y no de memoria

- **WHEN** un visitante con cookie de sesión válida navega a una página que invoca `auth.api.getSession({ headers })`
- **THEN** better-auth resuelve la sesión contra la base SQLite y la llamada retorna el usuario asociado a la cookie

#### Scenario: Reemplazo del memoryAdapter

- **WHEN** se inspecciona `lib/auth.ts`
- **THEN** la configuración de `betterAuth` usa `drizzleAdapter(db, { provider: "sqlite", schema })` y NO usa `memoryAdapter({})` ni ningún otro adapter en memoria

### Requirement: El schema se declara en una única fuente de verdad

Todas las definiciones de tablas DEBEN vivir en `db/schema.ts` y re-exportarse a través del módulo del cliente de base de datos, de modo que la llamada a `drizzle()` reciba el schema y la inferencia de tipos de fila se mantenga sincronizada. La tabla `users` existente cubre los campos requeridos por `emailAndPassword` de better-auth. Si en el futuro better-auth requiere tablas adicionales (`session`, `account`, `verification`), esas tablas se agregan al mismo `db/schema.ts` mediante un change que también ejecuta `db:generate` + `db:migrate`.

#### Scenario: Agregar una nueva tabla

- **WHEN** un desarrollador declara una nueva `sqliteTable(...)` en `db/schema.ts`
- **THEN** el tipo TypeScript de la fila está disponible automáticamente y el próximo `drizzle-kit generate` produce una migración para ella

#### Scenario: La tabla `users` coincide con la forma esperada por better-auth

- **WHEN** se inspecciona el schema
- **THEN** incluye una tabla `users` con columnas compatibles con el adaptador Drizzle de better-auth: `id` (text, primary key), `name` (text, not null), `email` (text, unique, not null), `emailVerified` (integer 0/1, not null), `image` (text), `createdAt` (integer ms epoch, not null), `updatedAt` (integer ms epoch, not null)

#### Scenario: Cambio de schema cubierto por migración versionada

- **WHEN** un change futuro agrega o modifica columnas de tablas existentes
- **THEN** ese change incluye tasks explícitas para `bun run db:generate` (produce SQL en `migrations/`) y `bun run db:migrate` (aplica la migración sobre `local.db`); no se usa `db:push` para aplicar migraciones sobre una base no vacía

### Requirement: La URL de conexión se configura por variable de entorno

La URL de conexión a la base de datos DEBE provenir de la variable de entorno `DATABASE_URL`. El desarrollo local DEBE usar por defecto una URL `file:./local.db` documentada en `.env.example`. La validación de la env var DEBE lanzar un error al cargar el módulo `db/index.ts` si falta, en lugar de caer silenciosamente a `:memory:` o a un default arbitrario.

#### Scenario: Falta la env var en producción

- **WHEN** `DATABASE_URL` es `undefined` y se evalúa el módulo del cliente de DB
- **THEN** el módulo lanza un error descriptivo al arrancar, en lugar de crear silenciosamente una conexión a `:memory:`

#### Scenario: URL a archivo local

- **WHEN** `.env` contiene `DATABASE_URL=file:./local.db`
- **THEN** el cliente se conecta a ese archivo y cualquier migración posterior crea el archivo si no existe

#### Scenario: Migración aplicada sobre una base de datos no vacía

- **WHEN** se ejecuta `bun run db:migrate` sobre `local.db` que ya contiene filas en la tabla `users`
- **THEN** las migraciones declaradas en `migrations/` que aún no se aplicaron se ejecutan en orden y las filas existentes se preservan (no hay DROP implícito)

#### Scenario: Schema drift entre código y migraciones

- **WHEN** un desarrollador modifica `db/schema.ts` sin ejecutar `bun run db:generate` antes de iniciar el dev server
- **THEN** `drizzle-kit` (al correr `db:push` o `db:generate`) reporta el drift con un diff explícito en lugar de sincronizar silenciosamente la base; el dev debe regenerar la migración y commitearla

### Requirement: La configuración de Drizzle Kit dirige las migraciones

`drizzle.config.ts` DEBE apuntar a `db/schema.ts` como fuente de schema y a `./migrations` como carpeta de salida, con `dialect: "sqlite"` y `dbCredentials.url` resuelto desde `process.env.DATABASE_URL`. La configuración NO DEBE usar una URL hardcodeada.

#### Scenario: Inspeccionar la configuración

- **WHEN** un desarrollador abre `drizzle.config.ts`
- **THEN** la URL de conexión se lee desde `process.env.DATABASE_URL` y el resto de los campos está alineado con la documentación oficial de drizzle-kit para SQLite
