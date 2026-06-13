## Why

La aplicación ya tiene `better-auth` instalado, un route handler en `app/api/auth/[...all]/route.ts` y la carpeta del route group `app/(auth)/` con subcarpetas `login/` y `register/` vacías, pero no existe ninguna vista ni flujo de cliente para que un visitante cree cuenta o inicie sesión. Sin esas vistas el adapter actual de better-auth (`memoryAdapter`) es inaccesible desde el navegador y el proyecto no puede demostrar el ciclo completo de autenticación.

## What Changes

- Conectar `lib/auth.ts` al driver Drizzle/SQLite existente apuntando a la tabla `users` de `db/schema.ts`, reemplazando el `memoryAdapter` actual, de modo que los registros e inicios de sesión persistan en `local.db`.
- Agregar la variable de entorno `BETTER_AUTH_SECRET` (requerida para firmar sesiones) y `BETTER_AUTH_URL` (ya consumida por `lib/auth-client.ts`), documentarlas en `.env.example` y validarlas al arrancar el módulo de auth.
- Crear la vista de registro en `app/(auth)/register/page.tsx` como Client Component con un formulario controlado (nombre, email, password, confirmación de password) que invoca `signUp.email(...)` del `authClient`, muestra estados de carga y errores por campo, y redirige a `/users` al éxito.
- Crear la vista de login en `app/(auth)/login/page.tsx` como Client Component con un formulario (email, password) que invoca `signIn.email(...)`, muestra errores en línea y redirige a `/users` al éxito; incluye un enlace a `/register` para usuarios sin cuenta.
- Agregar un Server Component `app/(auth)/layout.tsx` que centre el formulario en una tarjeta, provea un layout visual consistente y redirija a `/users` si el visitante ya tiene sesión activa.
- Agregar acción de logout invocable desde la página `/users` (Client Component) que use `signOut()` y redirija a `/login`.

## Capabilities

### New Capabilities

- `user-auth`: flujo de registro, inicio y cierre de sesión de usuarios contra la tabla `users` mediante better-auth + Drizzle/SQLite, con vistas accesibles en `/register` y `/login`, manejo de errores en línea y redirección post-auth a `/users`.

### Modified Capabilities

- `data-persistence`: la capacidad deja de limitarse a "exponer un cliente Drizzle tipado" y pasa a exigir que `lib/auth.ts` use ese cliente como adapter de `betterAuth({ database: drizzleAdapter(...) })`, leyendo y escribiendo filas en la tabla `users` real (no en memoria).

## Impact

- **BREAKING** para `lib/auth.ts`: la firma exportada no cambia, pero el adapter deja de ser `memoryAdapter` y pasa a ser `drizzleAdapter(db, { provider: "sqlite", schema })`; cualquier test o import que asumiera estado en memoria se invalida (no hay tests hoy, así que el impacto real es de configuración).
- Nuevas dependencias de runtime: ninguna (todas las piezas ya están en `package.json`: `better-auth`, `drizzle-orm`, `@libsql/client`).
- Nuevas dependencias de dev: ninguna.
- Nuevas variables de entorno: `BETTER_AUTH_SECRET` (string, requerida en runtime) y `BETTER_AUTH_URL` (URL, ya consumida por `lib/auth-client.ts`; pasa a ser requerida también del lado servidor).
- Archivos nuevos: `app/(auth)/layout.tsx`, `app/(auth)/register/page.tsx`, `app/(auth)/login/page.tsx`, `app/(auth)/_actions.ts` (o equivalente con `signIn`/`signUp` wrappers tipados), `lib/auth-schema.ts` (schemas Zod compartidos) y un Client Component para logout.
- Archivos modificados: `lib/auth.ts` (adapter Drizzle, validación de env), `lib/auth-client.ts` (sin cambios estructurales), `.env.example` (agregar `BETTER_AUTH_SECRET` y `BETTER_AUTH_URL`), `app/users/page.tsx` (botón de logout y render condicional según sesión).
- **Non-goals explícitos** (no se hace en este change):
  - Verificación de email, recuperación de contraseña, OAuth social (Google/GitHub), magic links, 2FA.
  - Roles, permisos o páginas protegidas por rol (admin/member); `/users` sigue siendo pública para mostrar el estado de sesión.
  - Migración de sesiones, cookies firmadas con clave rotativa o producción real del secret (se deja la generación local con `openssl rand`).
  - Tests unitarios o e2e automatizados del flujo de auth; la verificación es manual en `bun run dev`.
  - Internacionalización, theming dedicado para la pantalla de auth, animaciones o copy marketing más allá de un encabezado y un subtítulo cortos.
