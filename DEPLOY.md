# Cómo desplegar el sistema en Render

Esta guía asume que ya probaste el sistema en tu computadora (`npm run dev`) y
que tu proyecto de Supabase ya tiene las 12 tablas y todas las partes del
esquema SQL (`supabase/sql/01` a `07`) corridas. Si te falta correr alguna,
hazlo antes de desplegar — el sitio en línea usa la misma base de datos de
Supabase que usas en local, no una copia.

No necesitas tocar código para nada de esto — son pasos en páginas web.

---

## 1. Sube el código a GitHub

Si tu proyecto todavía no está en GitHub:

1. Ve a [github.com](https://github.com) y crea un repositorio nuevo (puede
   ser privado — de hecho, para un sistema con datos de pacientes,
   **recomendado que sea privado**).
2. En tu computadora, dentro de la carpeta del proyecto, corre:
   ```bash
   git remote add origin https://github.com/TU-USUARIO/TU-REPOSITORIO.git
   git push -u origin main
   ```
   (Reemplaza la URL por la que te dé GitHub al crear el repositorio.)

Si ya lo tienes en GitHub, solo asegúrate de que la rama `main` tenga todos
los cambios más recientes (`git push`).

---

## 2. Crea una cuenta en Render y el servicio web

1. Ve a [render.com](https://render.com) y crea una cuenta (puedes entrar con
   tu cuenta de GitHub directamente, es lo más fácil).
2. En el panel de Render, haz clic en **New +** → **Web Service**.
3. Elige **Build and deploy from a Git repository** y conecta tu cuenta de
   GitHub si te lo pide. Selecciona el repositorio de este proyecto.
4. Completa la configuración así:
   - **Name**: el nombre que quieras (ej. `medicina-regenerativa`).
   - **Region**: la más cercana a Costa Rica (usualmente `Ohio (US East)`).
   - **Branch**: `main`.
   - **Root Directory**: déjalo vacío.
   - **Runtime**: `Node`.
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start`
   - **Instance Type**: para empezar, el plan gratuito o el más económico
     está bien. Puedes subir de plan después si el sitio se siente lento.

No hagas clic en "Create Web Service" todavía — primero configura las
variables de entorno del siguiente paso (Render te deja agregarlas antes de
crear el servicio, en la misma pantalla, en la sección **Environment
Variables**).

---

## 3. Variables de entorno

Agrega estas variables (los mismos valores que tienes en tu `.env.local`,
cópialos de ahí — **no los compartas ni los subas a GitHub**):

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | La URL de tu proyecto de Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Tu llave "publishable" de Supabase |
| `NEXT_PUBLIC_APP_TZ` | `America/Costa_Rica` |
| `RESEND_API_KEY` | Tu llave de Resend (Fase 8D, correo al confirmar cita) |
| `RESEND_FROM_EMAIL` | `onboarding@resend.dev` mientras no verifiques tu propio dominio en Resend |
| `GOOGLE_CLIENT_ID` | Client ID de Google Cloud Console (Fase 8E, Google Calendar) |
| `GOOGLE_CLIENT_SECRET` | Client secret de Google Cloud Console |
| `GOOGLE_REDIRECT_URI` | `https://TU-DOMINIO-DE-RENDER.onrender.com/api/integraciones/google/callback` — debe coincidir exacto con el "Authorized redirect URI" que registraste en Google Cloud Console |
| `NODE_VERSION` | `22` |

`SUPABASE_SECRET_KEY` **no hace falta** para esta app — ningún archivo del
proyecto la usa hoy (todo corre con la llave "publishable" + RLS). Puedes
dejarla fuera de Render; si algún día agregamos algo que sí la necesite
(un script de administración, por ejemplo), se documentará en ese momento.

Ahora sí, haz clic en **Create Web Service**. Render va a instalar todo y
correr `npm run build` — la primera vez puede tardar unos minutos. Cuando
termine, te da una URL pública como `https://medicina-regenerativa.onrender.com`.

---

## 4. Ajusta Supabase para producción

1. En Supabase, ve a **Authentication → URL Configuration**.
2. Cambia el **Site URL** a la URL que te dio Render (ej.
   `https://medicina-regenerativa.onrender.com`).
3. Si en el futuro agregas recuperación de contraseña por correo u otro flujo
   que envíe enlaces, también agrégala en **Redirect URLs**.

Esto no afecta el login actual (usuario y contraseña), pero sí a cualquier
correo que Supabase envíe en el futuro (confirmaciones, recuperación de
contraseña, etc.) — sin esto, esos enlaces apuntarían a `localhost`.

---

## 5. Activa backups automáticos en Supabase

Muy importante antes de usar el sistema con pacientes reales:

1. Ve a tu proyecto en Supabase → **Database → Backups**.
2. En el **plan gratuito de Supabase, no hay backups automáticos** — si algo
   sale mal, no hay forma de recuperar los datos.
3. Para tener backups diarios necesitas subir al **plan Pro** de Supabase
   (tiene un costo mensual). Ahí puedes ver el historial de backups y
   restaurar a un punto anterior.
4. Si quieres más seguridad todavía (poder restaurar a cualquier minuto
   exacto, no solo al backup diario), Supabase ofrece **Point-in-Time
   Recovery (PITR)** como complemento adicional de pago.

Con datos clínicos reales, no recomendamos quedarte en el plan gratuito de
Supabase a largo plazo.

---

## 6. Después de desplegar: lista de verificación

Entra a la URL de Render y prueba:

- [ ] Iniciar sesión como médico → llegas a `/dashboard` y ves "Rol: medico".
- [ ] Iniciar sesión como asistente → en la ficha de un paciente, **no**
      deberías ver historia clínica ni notas de evolución.
- [ ] Crear un paciente de prueba y agendar una cita.
- [ ] Entrar a `/agendar` sin haber iniciado sesión y agendar una cita como
      lo haría un paciente.
- [ ] Revisar que el catálogo de servicios y el horario de atención tengan
      datos (si no los configuraste todavía, hazlo ahí mismo en producción).

Cuando termines de probar, borra los pacientes/citas de prueba que hayas
creado.

---

## 7. Cómo actualizar el sitio después

Cada vez que quieras publicar un cambio nuevo:

1. Asegúrate de que el cambio esté en tu rama `main` de GitHub
   (`git push origin main`).
2. Render detecta el cambio automáticamente y vuelve a desplegar solo. Puedes
   ver el progreso en la pestaña **Logs** de tu servicio en Render.

Si el cambio incluye un archivo nuevo en `supabase/sql/`, ese paso **no lo
hace Render automáticamente** — sigues corriéndolo tú a mano en el SQL
Editor de Supabase, como has venido haciendo.

---

## 8. Dominio propio (opcional)

Si más adelante quieres usar tu propio dominio (ej.
`expediente.tuclinica.com`) en vez de la URL de Render, en tu servicio de
Render ve a **Settings → Custom Domains** y sigue las instrucciones — te van
a pedir agregar un registro DNS en donde compraste el dominio.
