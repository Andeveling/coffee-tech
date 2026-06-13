## ADDED Requirements

### Requirement: Un visitante puede registrar una cuenta con nombre, email y contraseña

La vista `/register` DEBE permitir a un visitante crear una cuenta nueva enviando nombre, email y contraseña a `signUp.email` del cliente de `better-auth`. Al completarse el registro, el visitante queda autenticado y es redirigido a `/users`. Si el email ya está registrado, el visitante ve un mensaje de error en línea y la contraseña NO se envía al servidor. La contraseña DEBE tener al menos 8 caracteres y la confirmación de contraseña DEBE coincidir exactamente con la contraseña.

#### Scenario: Registro exitoso con datos válidos

- **WHEN** el visitante completa el formulario en `/register` con nombre "Ada Lovelace", un email no registrado y una contraseña de 8+ caracteres que coincide con su confirmación, y envía el formulario
- **THEN** el cliente invoca `signUp.email` con esos datos, better-auth persiste una fila nueva en la tabla `users`, establece la cookie de sesión y la vista redirige a `/users` donde se ve el email del visitante autenticado

#### Scenario: Email ya registrado

- **WHEN** el visitante envía el formulario en `/register` con un email que ya existe en la tabla `users`
- **THEN** la vista muestra un mensaje de error en línea (ej. "Este email ya está registrado") junto al campo email y NO redirige

#### Scenario: Contraseña demasiado corta

- **WHEN** el visitante envía el formulario con una contraseña de menos de 8 caracteres
- **THEN** la vista muestra un mensaje de error en línea junto al campo de contraseña y NO realiza la llamada a `signUp.email`

#### Scenario: Confirmación de contraseña no coincide

- **WHEN** el visitante completa el formulario con una contraseña y una confirmación diferente
- **THEN** la vista muestra un mensaje de error en línea junto al campo de confirmación y NO realiza la llamada a `signUp.email`

#### Scenario: Email con formato inválido

- **WHEN** el visitante completa el campo email con un string que no satisface `z.email()` (ej. "ada@", "sin-arroba", "")
- **THEN** la vista muestra un mensaje de error en línea junto al campo email y NO realiza la llamada a `signUp.email`

### Requirement: Un visitante puede iniciar sesión con email y contraseña

La vista `/login` DEBE permitir a un visitante autenticarse enviando email y contraseña a `signIn.email` del cliente de `better-auth`. Al completarse, el visitante es redirigido a `/users` y la cookie de sesión queda establecida. Si las credenciales no son válidas, el visitante ve un mensaje de error genérico en línea y NO se redirige.

#### Scenario: Login exitoso con credenciales válidas

- **WHEN** el visitante envía el formulario en `/login` con un email y contraseña que coinciden con una fila existente en la tabla `users`
- **THEN** better-auth establece la cookie de sesión y la vista redirige a `/users` donde se ve el email del visitante autenticado

#### Scenario: Credenciales inválidas

- **WHEN** el visitante envía credenciales que no coinciden con ninguna fila de la tabla `users`
- **THEN** la vista muestra un mensaje genérico de error en línea (ej. "Email o contraseña incorrectos") y NO redirige

#### Scenario: Formulario de login incompleto

- **WHEN** el visitante envía el formulario con el email o la contraseña vacíos
- **THEN** la vista muestra un mensaje de error en línea junto al/los campo(s) faltante(s) y NO realiza la llamada a `signIn.email`

#### Scenario: Enlace visible hacia registro

- **WHEN** el visitante abre `/login` sin tener cuenta
- **THEN** la vista muestra un enlace a `/register` (ej. "¿No tenés cuenta? Registrate") que navega al hacer click

### Requirement: Un usuario autenticado no puede ver los formularios de auth

Cuando un visitante con sesión activa intenta acceder a `/login` o `/register`, la aplicación DEBE redirigirlo automáticamente a `/users` sin mostrar el formulario.

#### Scenario: Visitante autenticado accede a /login

- **WHEN** el visitante tiene una cookie de sesión válida y navega a `/login`
- **THEN** la Server Component `app/(auth)/layout.tsx` invoca `auth.api.getSession` y, al recibir una sesión, llama `redirect("/users")` antes de renderizar el formulario

#### Scenario: Visitante autenticado accede a /register

- **WHEN** el visitante tiene una cookie de sesión válida y navega a `/register`
- **THEN** la Server Component `app/(auth)/layout.tsx` invoca `auth.api.getSession` y, al recibir una sesión, llama `redirect("/users")` antes de renderizar el formulario

### Requirement: Un usuario autenticado puede cerrar sesión desde /users

La página `/users` DEBE ofrecer un control visible para que el usuario autenticado cierre su sesión. Tras confirmar el cierre, la cookie de sesión se elimina y la vista redirige a `/login`.

#### Scenario: Logout desde /users

- **WHEN** el visitante autenticado hace click en el botón "Cerrar sesión" de `/users`
- **THEN** la Server Action `signOutAction` invoca `auth.api.signOut`, la cookie de sesión se elimina, y el navegador es redirigido a `/login`

#### Scenario: Estado pendiente durante el logout

- **WHEN** el visitante hace click en "Cerrar sesión" y la Server Action está en curso
- **THEN** el botón queda deshabilitado y muestra un estado de carga hasta completarse

### Requirement: Las variables de entorno de better-auth se validan al arrancar el módulo del servidor

`lib/auth.ts` DEBE leer `BETTER_AUTH_SECRET` y `BETTER_AUTH_URL` desde `process.env` al cargar el módulo. Si alguna falta o es string vacío, el módulo DEBE lanzar un error con un mensaje que indique cómo generar el secret y un placeholder de URL. La validación se ejecuta en el servidor (Route Handler, Server Component, Server Action); los Client Components NO necesitan estas env vars.

#### Scenario: Falta BETTER_AUTH_SECRET en runtime del servidor

- **WHEN** el módulo `lib/auth.ts` se evalúa con `process.env.BETTER_AUTH_SECRET` undefined o ""
- **THEN** el módulo lanza un `Error` con texto que menciona el nombre de la env var y sugiere `openssl rand -base64 32`

#### Scenario: Falta BETTER_AUTH_URL en runtime del servidor

- **WHEN** el módulo `lib/auth.ts` se evalúa con `process.env.BETTER_AUTH_URL` undefined o ""
- **THEN** el módulo lanza un `Error` con texto que menciona el nombre de la env var y un valor de ejemplo (ej. `http://localhost:3000`)

#### Scenario: Variables presentes

- **WHEN** `BETTER_AUTH_SECRET` y `BETTER_AUTH_URL` están definidas con valores no vacíos
- **THEN** el módulo se inicializa correctamente y el route handler en `/api/auth/[...all]` responde 200 a las requests de better-auth
