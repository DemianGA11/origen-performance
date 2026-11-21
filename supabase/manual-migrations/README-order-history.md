# Mis pedidos — candidato local

## Alcance

Base: `origin/main` en `e9d1a851d2db9dc7fe8ab31f14d89f32f7f7adf1`.

Se añade una relación nullable para nuevos pedidos autenticados y una lectura privada de los últimos 50 pedidos. No se cambian importes, Stripe Sessions, webhook, reservas, confirmación ni datos históricos. Las partidas se muestran cuando existen; un pedido pendiente puede no tener partidas confirmadas.

## Estado reportado por el operador ? 21 de noviembre de 2026

- Migración instalada en Production: `orders.user_id` UUID nullable; 19 pedidos históricos y ninguno asociado. No se atribuyeron por correo.
- Ensayo estructural Dev reportado PASS con ROLLBACK. No demuestra ejecución financiera completa en Dev, donde faltan tres RPC Stripe.
- Las cuatro RPC Stripe de Production y sus definiciones fueron revisadas por el operador sin conflicto directo con el nuevo campo.
- Estos son resultados proporcionados por el operador. No se abrieron conexiones ni se ejecutó SQL durante la preparación de publicación.
- No volver a ejecutar el instalador en Production: su preflight rechaza objetos existentes. Los pasos siguientes describen revisión/reproducción en otra base autorizada.

## Instalación manual en una base nueva (requiere autorización)

1. Revisar primero el esquema real, roles, RLS y ACL de Production con las consultas de solo lectura siguientes. No se han ejecutado en esta tarea.
2. Revisar la migración y probarla primero en un entorno autorizado no productivo. Usar dos cuentas ficticias distintas y pedidos de prueba sin pagos reales.
3. Aprobar explícitamente el destino y el horario antes de ejecutar `supabase/manual-migrations/20261120000100_order_user_history.sql`. No es una migración automática. Ejecución completa como `postgres`, `psql -X -v ON_ERROR_STOP=1`; si falla, cerrar la conexión o emitir ROLLBACK. El script usa BEGIN/COMMIT y timeouts de DDL finitos.
4. Instalar la estructura **antes** de desplegar el código candidato. El código consulta `orders.user_id`: sin la migración, checkout devuelve error de consulta y el historial falla de manera segura.
5. Validar con cuentas A/B e invitado, sin nuevos cobros. La prueba integrada real de checkout debe realizarse en Stripe Test y en base de prueba autorizada, nunca simulando pago en Production.
6. Solo después autorizar publicación. No se ha hecho push ni deploy.

## Consulta de solo lectura para el operador

```sql
BEGIN READ ONLY;
SELECT table_schema, table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE (table_schema = 'public' AND table_name IN ('orders','order_items'))
   OR (table_schema = 'auth' AND table_name = 'users' AND column_name = 'id')
ORDER BY table_schema, table_name, ordinal_position;

SELECT c.oid::regclass AS tabla, pg_get_userbyid(c.relowner) AS propietario,
       c.relrowsecurity, c.relforcerowsecurity
FROM pg_class c
WHERE c.oid IN ('public.orders'::regclass, 'public.order_items'::regclass);

SELECT policyname, tablename, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname='public' AND tablename IN ('orders','order_items');

SELECT grantee, table_name, privilege_type
FROM information_schema.table_privileges
WHERE table_schema='public' AND table_name IN ('orders','order_items');

SELECT conrelid::regclass AS tabla, conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid IN ('public.orders'::regclass,'public.order_items'::regclass,'auth.users'::regclass)
  AND contype IN ('p','u','f');

SELECT tgname, pg_get_triggerdef(oid)
FROM pg_trigger WHERE tgrelid='public.orders'::regclass AND NOT tgisinternal;
ROLLBACK;
```

Verificar también membresías y privilegios efectivos de las identidades reales; la consulta de grants no sustituye una prueba de RLS ni contempla por sí sola todos los privilegios heredados. No se añaden políticas ni permisos de lectura públicos: la ruta servidor usa el cliente privilegiado **después** de verificar Auth y siempre filtra por `user_id = user.id`. Los permisos previos de acceso directo deben seguir impidiendo consultar otros pedidos.

## Propiedad e invitados

- `auth.getUser()` del cliente SSR verifica al usuario en servidor. Se ignoran `user_id`, IDs de pedido y correos enviados por el navegador como autorización.
- Invitado sin sesión: nuevo pedido con `user_id=NULL`. Un fallo de validación de Auth distinto de sesión ausente detiene el checkout, sin convertir silenciosamente al usuario en invitado.
- Un intento de checkout de otra cuenta, o de invitado al que ahora llega un usuario autenticado, devuelve conflicto. Debe iniciarse un intento nuevo; no se reclama el pedido antiguo.
- La FK usa `ON DELETE RESTRICT`: borrar una cuenta con pedidos queda bloqueado. La identidad no se puede cambiar ni borrar; no se puede reclamar un pedido histórico NULL. Una futura política de borrado requiere aprobación.
- La guarda impide asignaciones iniciales desde escrituras ordinarias. `postgres` y `service_role` siguen siendo identidades de confianza; el código servidor es quien decide la identidad. No protege frente a una credencial privilegiada comprometida.
- El endpoint no acepta propietario arbitrario ni devuelve contactos, dirección o datos Stripe. Responde `private, no-store`; el cliente no cachea la lectura y aborta al desmontarse.

## Pruebas pendientes en PostgreSQL y entorno integrado

- Instalar/revertir estructura en entorno de prueba; comprobar que los pedidos anteriores siguen NULL y las RPC financieras conservan definición/ACL.
- A puede leer únicamente sus pedidos; B no puede leer los de A, incluso enviando parámetros manipulados. Un invitado recibe 401.
- Compra Test nueva autenticada conserva user_id; invitado conserva NULL. Coincidir por email no añade propiedad.
- La FK rechaza UUID que no exista en Auth. SQLSTATE 23503.
- La guarda rechaza una asignación inicial ordinaria con `ORDER_OWNER_SERVER_ONLY`/42501 y una reasignación, incluso de NULL a usuario, con `ORDER_OWNER_IMMUTABLE`/23514. Un rechazo por otra política no demuestra por sí solo la guarda.
- Duplicados/reintentos conservan propietario y no crean un pedido adicional; cambiar de cuenta produce conflicto.
- Verificar coexistencia con triggers existentes y rechazo del borrado de cuentas con pedidos. No se elimina ni desvincula el pedido.
- Todo fixture SQL debe ser reversible o permanecer exclusivamente en una base de prueba aprobada. No alterar la venta real ni realizar un pago nuevo para probar historial.

Durante la preparación local no se ejecutó SQL. Las ejecuciones y verificaciones anteriores de Dev/Production son las reportadas por el operador. Antes de revertir estructura, volver al código anterior. Si ya existen vínculos de usuarios, no eliminar la columna sin un plan aprobado para conservarlos. No se incluye rollback destructivo automático.


## Validaciones locales del candidato

21 de noviembre de 2026: 48 pruebas enfocadas PASS, TypeScript, ESLint y build optimizado con webpack PASS. El build usó valores sintéticos, sin archivos de entorno ni credenciales reales, con red bloqueada salvo descargas de fuentes de Google. No constituye una prueba integrada contra Production.

Herramientas locales: Node.js 24.14.0, TypeScript 5.9.3 y Next.js 16.4.3 disponible en el entorno. El lockfile de la rama mantiene Next.js 16.4.0 sin cambios; el despliegue deberá completar su build con ese lockfile.

Tras publicar con autorización: comprobar login y lista vacía (los 19 históricos no aparecerán), 401 sin sesión y aislamiento entre dos cuentas. No generar un cargo Live para producir historial; cualquier prueba integrada de nuevos pedidos debe aprobarse por separado en un entorno Test.
