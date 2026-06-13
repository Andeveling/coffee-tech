## 1. Variables de entorno y configuración

- [ ] 1.1 Actualizar `.env.example` para documentar `BETTER_AUTH_SECRET` (placeholder) y `BETTER_AUTH_URL=http://localhost:3000`, con un comentario que indique generar el secret con `openssl rand -base64 32`
- [ ] 1.2 Crear/actualizar `.env` local con `DATABASE_URL=file:./local.db`, `BETTER_AUTH_URL=http://localhost:3000` y un `BETTER_AUTH_SECRET` generado (no commitearlo); confirmar que `.env` está en `.gitignore`
- [ ] 1.3 Verificar que `.gitignore` cubre `.env`, `*.db`, `*.db-journal`, `*.db-shm`, `*.db-wal` (dejado por el change anterior; solo confirmar)

## 2. Cablear better-auth al cliente Drizzle

- [ ] 2.1 Modificar `lib/auth.ts` para reemplazar `memoryAdapter({})` por `drizzleAdapter(db, { provider: "sqlite", schema })`, importando `drizzleAdapter` desde `better-auth/adapters/drizzle` y `db` desde `@/db` (server-only)
- [ ] 2.2 En `lib/auth.ts`, agregar validación al cargar el módulo: si `process.env.BETTER_AUTH_SECRET` o `process.env.BETTER_AUTH_URL` son `undefined`/vacíos, lanzar un `Error` con texto que mencione la env var faltante y un ejemplo de valor
- [ ] 2.3 Verificar que `lib/auth-client.ts` no importa nada de `@/db` ni de `lib/auth.ts` server (boundary client/server del config); debe seguir consumiendo solo `createAuthClient` con `NEXT_PUBLIC_BETTER_AUTH_URL`
- [ ] 2.4 Confirmar que `app/api/auth/[...all]/route.ts` sigue exportando `GET`/`POST` desde `toNextJsHandler(auth)` sin cambios (ya está correcto)

## 3. Schemas Zod compartidos

- [ ] 3.1 Crear `lib/auth-schema.ts` exportando `loginSchema` (z.email() + z.string().min(1)) y `registerSchema` (z.string().min(1) name + z.email() + z.string().min(8) password + z.string() confirmPassword con refine de igualdad), usando los helpers de `zod-4`
- [ ] 3.2 Exportar también los tipos `LoginInput` y `RegisterInput` como `z.infer<typeof loginSchema>` / `z.infer<typeof registerSchema>` para tipar los `useState` de los formularios

## 4. Layout (auth) con redirección de sesión activa

- [ ] 4.1 Crear `app/(auth)/layout.tsx` como Server Component (sin `"use client"`) que: importe `auth` de `@/lib/auth` y `headers`/`redirect` de `next/navigation`; invoque `auth.api.getSession({ headers: await headers() })`; si la sesión existe, llame `redirect("/users")`
- [ ] 4.2 Renderizar un contenedor centrado (`<main>` con `min-h-[calc(100dvh-...)] flex items-center justify-center`) que envuelva `children` dentro de una `<section>` con borde y padding consistente; usar `cn()` de `lib/cn.utils.ts` para combinar clases Tailwind
- [ ] 4.3 Agregar `<h1>` o `<header>` con el texto "Coffee Tech" arriba del card para identificar la app (sin copy de marketing)

## 5. Vista de registro

- [ ] 5.1 Crear `app/(auth)/register/page.tsx` con `"use client"`; importar `signUp` de `@/lib/auth-client`, `useRouter` de `next/navigation`, `useState` de `react`, `Button` de `@/components/ui/button`, `cn` de `@/lib/cn.utils`
- [ ] 5.2 Definir `useState<RegisterInput>` para los campos `name`, `email`, `password`, `confirmPassword`, más `useState<{ field?: keyof RegisterInput; message: string } | null>` para errores en línea y `useState<boolean>` para estado de carga
- [ ] 5.3 Renderizar un `<form>` con cuatro `<input type>` correspondientes, cada uno con `<label>` asociado; mapear `error.field` para mostrar el mensaje de error bajo el input afectado con clases Tailwind (`text-sm text-red-600` o similar)
- [ ] 5.4 En `onSubmit`: validar con `registerSchema.safeParse`; si falla, setear `error` con `field` apuntando al primer error y `message` legible en español; si pasa, llamar a `signUp.email({ name, email, password })`; en éxito llamar `router.push("/users")`; en error mapear `error.code` a un mensaje user-friendly y setear `error.field = "email"` cuando aplique
- [ ] 5.5 Deshabilitar el `<Button>` y cambiar su texto a "Creando cuenta…" mientras `loading` es `true`
- [ ] 5.6 Agregar un enlace debajo del form: "¿Ya tenés cuenta? Iniciar sesión" → `/login`

## 6. Vista de login

- [ ] 6.1 Crear `app/(auth)/login/page.tsx` con `"use client"`; importar `signIn` de `@/lib/auth-client`, `useRouter` de `next/navigation`, `useState` de `react`, `Button` de `@/components/ui/button`, `cn` de `@/lib/cn.utils`
- [ ] 6.2 Definir `useState<LoginInput>` para `email` y `password`, más `useState` para errores en línea y `loading` siguiendo el mismo patrón que el registro
- [ ] 6.3 Renderizar `<form>` con dos inputs (email, password) usando `<label>` asociados y mostrar `error.message` debajo del card si el error no está asociado a un campo específico (caso "credenciales inválidas")
- [ ] 6.4 En `onSubmit`: validar con `loginSchema.safeParse`; si pasa, llamar `signIn.email({ email, password })`; en éxito `router.push("/users")`; en error mostrar "Email o contraseña incorrectos" en línea
- [ ] 6.5 Deshabilitar el `<Button>` y cambiar texto a "Ingresando…" durante `loading`
- [ ] 6.6 Agregar enlace "¿No tenés cuenta? Registrate" → `/register`

## 7. Logout desde /users

- [ ] 7.1 Crear `app/users/_actions.ts` con `"use server"` que exporte `signOutAction()`; internamente leer `headers()` (de `next/headers`), invocar `auth.api.signOut({ headers })`, y al terminar llamar `redirect("/login")`
- [ ] 7.2 Refactorizar `app/users/page.tsx` para que sea un Server Component que: lea la sesión con `auth.api.getSession({ headers: await headers() })`; si no hay sesión, llame `redirect("/login")`; si hay sesión, renderice el email del usuario y un Client Component `<LogoutButton />`
- [ ] 7.3 Crear `app/users/_components/logout-button.tsx` como Client Component con `"use client"` que: use `useTransition` de `react`; al hacer click llame `signOutAction` envuelto en `startTransition`; deshabilite el botón y muestre "Cerrando sesión…" mientras `isPending`

## 8. Verificación

- [ ] 8.1 Ejecutar `bunx --bun tsc --noEmit` y confirmar que pasa sin errores de tipo (cubre los nuevos módulos: `lib/auth-schema.ts`, `lib/auth.ts` con el adapter Drizzle, vistas Client Components y Server Actions)
- [ ] 8.2 Ejecutar `bun run check` (Biome) y resolver cualquier issue de formato/lint en los archivos creados o modificados
- [ ] 8.3 Ejecutar `git status` y verificar que `.env` y `local.db` (o el archivo SQLite equivalente) NO aparecen como untracked/staged — solo deben aparecer archivos bajo `app/(auth)/`, `app/users/`, `lib/`, `.env.example`
- [ ] 8.4 Smoke runtime manual: levantar `bun run dev`, abrir `/register`, registrar un usuario con email nuevo; verificar que la fila aparece en `local.db` (consultar con `bunx --bun sqlite3 ./local.db "select id, email from users"` o Drizzle Studio); cerrar sesión desde `/users`; iniciar sesión en `/login` con la misma cuenta; acceder a `/login` y `/register` con sesión activa y confirmar que redirige a `/users`; forzar un error de credenciales inválidas en `/login` y confirmar el mensaje en línea
- [ ] 8.5 Smoke de env vars faltantes: detener el dev server, comentar `BETTER_AUTH_SECRET` en `.env`, reiniciar `bun run dev` y confirmar que la request a `/login` (o el primer acceso que cargue `lib/auth.ts`) falla con el error claro que menciona la env var; restaurar la env var
