## Context

- Stack: Next.js 16 (App Router, RSC + Server Actions, Route Handlers), React 19, TypeScript strict, Biome como linter/formateador, Bun como package manager. Ver `AGENTS.md` y las skills locales (`nextjs-16`, `react-19`, `tailwind-4`, `zod-4`, `typescript`) para patrones.
- Persistencia ya operativa: `db/schema.ts` define la tabla `users` con el shape que `better-auth` espera (id text pk, name text not null, email text unique not null, emailVerified integer 0/1, image text, createdAt/updatedAt integer timestamp_ms). `db/index.ts` exporta un cliente Drizzle singleton HMR-safe atado a `DATABASE_URL`, marcado `"server-only"`. Las migraciones viven en `migrations/` y `bun run db:generate` + `db:migrate` ya funcionan.
- Auth actual: `lib/auth.ts` instancia `betterAuth({ database: memoryAdapter({}), emailAndPassword: { enabled: true } })` — sin persistencia y sin `secret`. `lib/auth-client.ts` crea un `createAuthClient` con `baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL` y re-exporta `signIn`, `signUp`, `signOut`, `useSession`. El route handler `app/api/auth/[...all]/route.ts` envuelve `auth` con `toNextJsHandler`.
- UI actual: existen `app/(auth)/login/` y `app/(auth)/register/` como carpetas vacías. `app/users/page.tsx` ya muestra el email del usuario actual, pero solo funciona si existe sesión. `app/page.tsx` enlaza a `/users` y a `/login` (esto se valida al implementar). `components/ui/button.tsx` provee un `Button` con `cva`.
- `.env.example` documenta solo `DATABASE_URL=file:./local.db`. No hay `.env.local` aún, ni `BETTER_AUTH_SECRET`, ni `BETTER_AUTH_URL`.
- **Restricción clave del config**: los módulos server-only (cliente de DB, lecturas de `process.env`) NO DEBEN importarse desde Client Components; el boundary es la Server Action / Route Handler / Server Component.

## Goals / Non-Goals

**Goals:**

- Cablear `betterAuth` al cliente Drizzle existente para que sign-up y sign-in lean y escriban filas reales en la tabla `users`, con `BETTER_AUTH_SECRET` y `BETTER_AUTH_URL` validados al cargar el módulo.
- Entregar las vistas `/register` y `/login` como Client Components con formularios validados con Zod (`zod-4`), estados de carga y errores por campo, y redirección post-éxito a `/users`.
- Proteger el layout `(auth)` para redirigir usuarios ya autenticados a `/users` y dejar el flujo inverso (ir a `/login` o `/register` con sesión activa) como no permitido.
- Exponer una Server Action de logout invocable desde `/users` que cierre la sesión y redirija a `/login`.

**Non-Goals:**

- Verificación de email, recuperación de contraseña, OAuth social, magic links, 2FA.
- Modelo de roles, middleware de protección por rol o áreas restringidas (la página `/users` sigue siendo pública; solo refleja el estado de sesión).
- Server-Side Rendering de los formularios de auth: la decisión es que sean Client Components para usar `signIn`/`signUp` del cliente de better-auth y mantener bundle del cliente alineado con el SDK.
- Rotación de `BETTER_AUTH_SECRET`, firma de cookies en producción con KMS, ni estrategia de deploy más allá de `bun run dev` local.
- Tests automatizados (unit/e2e); la verificación es manual vía `bun run dev` + clicks.
- Cambios en la tabla `users` (no se agregan columnas en este change — el shape actual ya cubre `emailAndPassword`).

## Decisions

### Adapter de better-auth: `drizzleAdapter(db, { provider: "sqlite" })`

- **Por qué este adapter**: better-auth lo documenta oficialmente, mapea 1:1 con el schema actual (`provider: "sqlite"` selecciona el `users`/`sessions`/`accounts`/`verifications` shape ya presente) y evita reinventar la capa de sesiones.
- **Por qué no quedarse con `memoryAdapter`**: pierde todos los registros al recargar el dev server y rompe el flujo de `/users` que ya depende de una sesión real. El cambio se justifica porque el cliente Drizzle ya existe.
- **Por qué no un adapter custom**: agrega superficie a mantener sin valor; el oficial cubre emailAndPassword.

### Boundary server-only: el `auth` server-side importa `db`; el cliente NO

- `lib/auth.ts` queda como módulo server-only (importa `db` de `@/db` y lee `process.env.BETTER_AUTH_*`). Se ejecuta en Route Handlers y Server Components; nunca en el bundle del cliente.
- `lib/auth-client.ts` se mantiene libre de imports de `@/db` o `lib/auth.ts` server; solo usa `createAuthClient` con `baseURL`. El bundle del cliente queda pequeño.
- Las Server Actions (`app/(auth)/_actions.ts`) usan `'use server'` y delegan a `signIn`/`signUp` del `authClient`; en realidad se prefiere llamar a `signIn`/`signUp` directamente desde el Client Component porque el SDK ya maneja cookies vía el route handler, y mantener un wrapper duplica la API sin agregar type-safety. Decisión final: el Server Component `(auth)/layout.tsx` no usa Server Actions, solo `auth.api.getSession({ headers })` para chequear sesión; los formularios llaman directo al `authClient` del cliente.

### Validación de formularios: Zod 4 (`z.email()`, `z.string().min(8)`) en el cliente

- **Por qué Zod en el cliente y no en Server Action**: la validación previa al submit reduce requests fallidos y permite mensajes de error por campo. El servidor better-auth re-valida, así que la seguridad no depende del cliente.
- **Por qué no `react-hook-form`**: para dos campos (login) y cuatro (register) un `useState` por campo es suficiente; el form de Zod en `react-19` se hace con `useForm` de `react-hook-form` solo si se justifica; aquí se decide manual con `useState` y `zod` para mantener el bundle limpio.
- Schema en `lib/auth-schema.ts` exportado como `loginSchema` y `registerSchema` con tipo `z.infer<...>` para tipar el `useState` del form.

### `BETTER_AUTH_SECRET` requerido y validado al cargar `lib/auth.ts`

- better-auth rechaza arrancar sin `secret` (lanza `Missing secret`). Para fallar rápido y con mensaje claro, `lib/auth.ts` lee `process.env.BETTER_AUTH_SECRET` y, si es `undefined` o vacío, lanza un `Error` con texto que explique cómo generarlo (`openssl rand -base64 32`).
- `BETTER_AUTH_URL` se valida igual: si falta, error al cargar. Esto evita que `authClient` apunte a `undefined` en runtime.
- `.env.example` documenta ambas con valores placeholder y un comentario que indica que `BETTER_AUTH_SECRET` debe regenerarse.

### Ruteo y redirección post-auth

- Server Component `app/(auth)/layout.tsx`: invoca `auth.api.getSession({ headers: await headers() })` y, si hay sesión, llama `redirect("/users")`. Esto evita que un usuario ya logueado vea el formulario.
- Formularios: usan `useRouter().push("/users")` tras `signIn`/`signUp` exitoso. En error, el `error.code` de better-auth se mapea a un mensaje user-friendly ("Email o contraseña incorrectos", "Este email ya está registrado", etc.).
- Estado de carga: cada submit deshabilita el botón y muestra texto "Creando cuenta…" / "Ingresando…" usando el `<Button disabled>` existente.

### Logout como Server Action

- `app/users/_actions.ts` (con `'use server'`) exporta `signOutAction()` que llama `auth.api.signOut({ headers: await headers() })` y luego `redirect("/login")`.
- El botón en `app/users/page.tsx` pasa de ser Server Component puro a Server Component que envuelve un Client Component pequeño (`<LogoutButton />`) con `useTransition` para manejar el pending y disparar la action.

### Estrategia de migración del schema

- **No se modifica el schema de `users`**: el shape actual cubre emailAndPassword. No se ejecuta `db:generate` ni `db:migrate` en este change.
- Si al aplicar el change better-auth requiere tablas adicionales (`sessions`, `accounts`, `verifications`), se documenta en Open Questions y se aborda en un change de seguimiento; la regla de "no agregar tablas fuera de scope" prevalece.
- **Rollback del schema**: ninguna migración que revertir. Si el adapter falla, el `lib/auth.ts` se devuelve a `memoryAdapter` (diff de 4 líneas) y se borran los archivos UI; la tabla `users` queda intacta.

### Convenciones UI

- Las vistas usan Tailwind 4 con `cn()` de `lib/cn.utils.ts` y el `<Button>` de `components/ui/button.tsx`. Sin nuevos componentes UI (no se necesita `Input`/`Card` en este change; un `<div>` con clases utilitarias es suficiente y evita un PR de shadcn).
- Idiomas: copy de la UI en español (consistente con la propuesta), placeholders en español, mensajes de error mapeados al español.

## Risks / Trade-offs

- **Riesgo — `BETTER_AUTH_SECRET` débil o commiteado**: si el dev usa un valor predecible o lo commitea, las sesiones son falsificables. Mitigación: `.env` ya está en `.gitignore`; `.env.example` lleva un placeholder y un comentario explícito "regenerar con `openssl rand -base64 32`".
- **Riesgo — better-auth requiere tablas extra (`session`, `account`, `verification`)** que el schema actual no define. Mitigación: la fase de Verification incluye un smoke real contra el endpoint `/api/auth/sign-up`; si better-auth exige las tablas, el change queda bloqueado y se abre un change de seguimiento que extiende `db/schema.ts` y corre `db:generate` + `db:migrate`.
- **Riesgo — TypeScript strict y `process.env`**: las env vars no tipadas rompen el build. Mitigación: declarar `BETTER_AUTH_SECRET` y `BETTER_AUTH_URL` en un `lib/env.ts` con `zod` que valide al cargar, o usar la validación inline en `lib/auth.ts` con un `throw` claro. Decisión: validación inline para no introducir un nuevo módulo.
- **Trade-off — Client Component para los formularios**: pierde SSR del form (peor TTFB en `/login` en frío), pero gana acceso directo al SDK `authClient` y a `useState` para errores en línea. Aceptable para una página de auth de 1 campo vs 4.
- **Trade-off — No usar `react-hook-form`**: más código manual, pero menos dependencias y menos superficie de tipos. Aceptable con 2-4 campos.
- **Trade-off — No extraer `<Input>` a `components/ui/`**: copia de clases Tailwind entre los dos formularios. Mitigación aceptable: el patrón es trivial y evitar shadcn-local acelera el change; si surge un tercer form, se refactoriza.
- **Riesgo — HMR del cliente de DB bajo `auth.api.getSession`**: si `auth` re-evalúa el adapter en cada HMR, podría abrir conexiones duplicadas. Mitigación: el `db` ya tiene guard HMR (`globalThis.__coffeeTechDb ??=`), y `lib/auth.ts` solo lo importa una vez por proceso.
