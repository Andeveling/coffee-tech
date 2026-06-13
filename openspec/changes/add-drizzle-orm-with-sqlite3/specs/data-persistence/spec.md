# Capability: data-persistence

Configuración base de Drizzle ORM con SQLite (libsql) que provee conexión tipada, esquema inicial y migraciones reproducibles para la aplicación.

## ADDED Requirements

### Requirement: El cliente de Drizzle se expone como un singleton tipado

La aplicación DEBE exponer una única instancia tipada del cliente Drizzle ORM que pueda importarse desde código del servidor (Server Components, Server Actions, Route Handlers) sin crear conexiones duplicadas bajo HMR.

#### Scenario: Importar el cliente en un módulo del servidor

- **WHEN** un módulo del servidor importa el cliente de base de datos (ej. `import { db } from "@/db"`)
- **THEN** recibe una instancia `LibSQLDatabase` completamente tipada y vinculada a la URL de conexión de `DATABASE_URL`

#### Scenario: HMR no filtra conexiones

- **WHEN** el dev server de Next.js recarga el módulo que crea el cliente de Drizzle
- **THEN** se reusa la misma conexión subyacente en lugar de abrir una nueva en cada recarga

### Requirement: El schema se declara en una única fuente de verdad

Todas las definiciones de tablas DEBEN vivir en `db/schema.ts` y re-exportarse a través del módulo del cliente de base de datos, de modo que la llamada a `drizzle()` reciba el schema y la inferencia de tipos de fila se mantenga sincronizada.

#### Scenario: Agregar una nueva tabla

- **WHEN** un desarrollador declara una nueva `sqliteTable(...)` en `db/schema.ts`
- **THEN** el tipo TypeScript de la fila está disponible automáticamente y el próximo `drizzle-kit generate` produce una migración para ella

#### Scenario: La tabla `users` coincide con la forma esperada por better-auth

- **WHEN** se inspecciona el schema
- **THEN** incluye una tabla `users` con columnas compatibles con el adaptador Drizzle de better-auth: `id` (text, primary key), `name` (text, not null), `email` (text, unique, not null), `emailVerified` (integer 0/1, not null), `image` (text), `createdAt` (integer ms epoch, not null), `updatedAt` (integer ms epoch, not null)

### Requirement: La URL de conexión se configura por variable de entorno

La URL de conexión a la base de datos DEBE provenir de la variable de entorno `DATABASE_URL`. El desarrollo local DEBE usar por defecto una URL `file:./local.db` documentada en `.env.example`.

#### Scenario: Falta la env var en producción

- **WHEN** `DATABASE_URL` es `undefined` y se evalúa el módulo del cliente de DB
- **THEN** el módulo lanza un error descriptivo al arrancar, en lugar de crear silenciosamente una conexión a `:memory:`

#### Scenario: URL a archivo local

- **WHEN** `.env` contiene `DATABASE_URL=file:./local.db`
- **THEN** el cliente se conecta a ese archivo y cualquier migración posterior crea el archivo si no existe

### Requirement: La configuración de Drizzle Kit dirige las migraciones

Debe existir un archivo `drizzle.config.ts` en la raíz del proyecto que apunte a `db/schema.ts` para el schema y a `migrations/` para la carpeta de salida de migraciones, de modo que `drizzle-kit generate` produzca archivos SQL deterministas y revisables.

#### Scenario: Generar una migración

- **WHEN** un desarrollador ejecuta `bun run db:generate` después de cambiar el schema
- **THEN** aparece un nuevo archivo `.sql` con timestamp en `migrations/` junto con un snapshot actualizado de `meta/_journal.json`

#### Scenario: Aplicar migraciones a una base de datos nueva

- **WHEN** un desarrollador ejecuta `bun run db:migrate` contra un `local.db` inexistente
- **THEN** se crea el archivo de base de datos y todas las migraciones previamente generadas se aplican en orden

### Requirement: Los artefactos locales de la base de datos son ignorados por git

El `.gitignore` DEBE excluir `*.db`, `*.db-journal`, `*.db-shm`, `*.db-wal` y el archivo local `.env`. El archivo `.env.example` DEBE commitearse como contrato de las variables de entorno requeridas.

#### Scenario: Un desarrollador crea una DB local

- **WHEN** corren las migraciones y se crea `local.db`
- **THEN** `git status` no lista el archivo como untracked

#### Scenario: Onboarding de un nuevo desarrollador

- **WHEN** un nuevo desarrollador clona el repo y copia `.env.example` a `.env`
- **THEN** `bun run db:migrate` finaliza correctamente sin configuración adicional

### Requirement: Los scripts de base de datos se exponen en package.json

El `package.json` DEBE incluir los scripts `db:generate`, `db:migrate`, `db:push`, `db:studio` (todos invocando `drizzle-kit`) y `db:seed` (invocando `tsx scripts/seed.ts`), de modo que el flujo de trabajo de la base de datos sea descubrible sin consultar la documentación.

#### Scenario: Inspeccionar package.json

- **WHEN** un desarrollador lee la sección `scripts`
- **THEN** lista los cinco scripts `db:*` mencionados con las invocaciones documentadas

#### Scenario: Ejecutar el seed sobre una base de datos vacía

- **WHEN** se ejecuta `bun run db:seed` después de `bun run db:migrate`
- **THEN** el script inserta un usuario demo si la tabla `users` está vacía, y es no-op en caso contrario
