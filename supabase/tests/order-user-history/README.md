# Ensayo reversible de Mis pedidos — solo Dev

## Estado y límites

El operador reportó PASS y ROLLBACK del ensayo estructural Dev. Durante la preparación local no se ejecutó SQL ni se consultaron servicios. Se contrastaron las migraciones Dev versionadas de checkout, reserva y proveedor. El trigger de proveedor solo observa `payment_provider`, y la reserva utiliza `%ROWTYPE` y columnas explícitas: la nueva columna nullable no modifica esos contratos.

El operador ejecutó `inspect-dev.sql` en Dev PostgreSQL 17.11 con exit code 0: reportó la reserva y no las tres firmas esperadas de vinculación/confirmación/expiración. La consulta original enumera por nombre todas las sobrecargas en `public`, no solo una firma fija. La inspección ampliada muestra además otros esquemas y las firmas exactas que usa la aplicación: si no hay ninguna fila de un nombre, falta en esos catálogos; si hay una firma distinta, no demuestra compatibilidad con el checkout actual.

**Las tres RPC ausentes no bloquean el ensayo estructural.** Ninguna aserción las invoca ni depende de su existencia. El hash de RPC solo incluye las que ya existen y verifica que se preservan. Se imprime el inventario de ausencias y el resultado final indica `STRUCTURAL ONLY`. No se instala ninguna función Stripe. La equivalencia financiera Dev/Production y la ejecución real de confirmación siguen sin verificarse.

Revisar antes de autorizar el ensayo: triggers/reglas de `orders`, event triggers, permisos y firmas del resultado de inspección. El ensayo rechaza triggers de fila no previstos; el trigger permitido `orders_payment_provider_immutable` debe conservar el cuerpo revisado. Mantener Dev sin otras escrituras durante la prueba para que la comparación de datos sea concluyente.

## Reversibilidad real

El instalador termina en COMMIT: **no se debe envolver ni incluir con `\i` dentro de un BEGIN/ROLLBACK externo**. `New-ReversibleProbe.ps1` comprueba el SHA-256 del instalador revisado, retira exactamente sus límites BEGIN/COMMIT y compone otro archivo con un solo BEGIN y un solo ROLLBACK, sin COMMIT. El cuerpo DDL no se reescribe.

Solo hay DDL transaccional normal, no `CREATE INDEX CONCURRENTLY`, operaciones externas ni instalación de extensiones. Los fixtures son pedidos nuevos con UUID aleatorios; no insertan productos, no usan secuencias y no llaman a reservas/confirmación ni modifican stock. Dos usuarios Auth **ficticios ya existentes en Dev** sirven de padres de FK y solo se leen. Si no existen, detenerse: este paquete no crea usuarios.

Hay concesiones temporales únicamente sobre tablas temporales propias para probar roles/guardas; no se amplían permisos de tablas comerciales. Al final se ejecuta ROLLBACK y se comparan hashes de datos y de las RPC existentes, además de la ausencia de los objetos nuevos. Los hashes no se imprimen ni exponen datos personales.

`SET ROLE` comprueba permisos de la guarda, no autenticación real. Las pruebas A/B SQL verifican el predicado de propietario; el aislamiento de la ruta HTTP se comprueba con mocks locales. Una aplicación en otra conexión no ve DDL/fixtures sin COMMIT: el ensayo no demuestra integración HTTP/Auth/SQL completa.

## Comandos exactos para el operador, después de autorizar Dev

Usar PowerShell con `$psql` y `$devConnection` ya configurados para Session pooler de Dev, puerto 5432 y TLS verify-full. No mostrar esas variables ni incluir contraseñas en ellas; `-W` solicita la contraseña de forma interactiva sin eco.

```powershell
Set-Location 'C:\Users\Donaldo\Proyectos\origen-performance-order-history'
if ($devConnection -notmatch '(?i)\bsslmode=verify-full\b' -or $devConnection -notmatch '\bport=5432\b') {
    throw 'Revisar la conexión Dev y TLS antes de continuar'
}
if ($devConnection -match '(?i)\bpassword\s*=') { throw 'No incluir contraseñas en la cadena de conexión' }

# SOLO LECTURA: revisar salida y destino Dev antes de continuar.
& $psql -X -W --dbname=$devConnection -v ON_ERROR_STOP=1 -f supabase/tests/order-user-history/inspect-dev.sql
if ($LASTEXITCODE -ne 0) { throw 'Detener: inspección fallida' }
```

**Parar aquí** si hay triggers/reglas/eventos inesperados, tipos incompatibles, falta de permisos o no existen dos usuarios Auth ficticios distintos de Dev. La ausencia de las tres RPC Stripe conocidas **no impide** continuar con el ensayo estructural, pero impide declarar validación financiera. Verificar manualmente el destino con el dashboard: `current_database()=postgres` y TLS no distinguen Dev de Production.

Tras revisar y aprobar esa salida:

```powershell
$probeUserA = Read-Host 'UUID de usuario Auth ficticio A ya existente en Dev'
$probeUserB = Read-Host 'UUID de usuario Auth ficticio B distinto, ya existente en Dev'
[void][guid]::Parse($probeUserA)
[void][guid]::Parse($probeUserB)
$probeSql = Join-Path $env:TEMP ('origen-order-history-' + [guid]::NewGuid().ToString('N') + '.sql')
& .\supabase\tests\order-user-history\New-ReversibleProbe.ps1 -ConfirmDev -OutputPath $probeSql
if ($LASTEXITCODE -ne 0) { throw 'No ejecutar si falla la generación' }
# Revisar el archivo generado: tiene ROLLBACK, no COMMIT.
& $psql -X -W --dbname=$devConnection -v ON_ERROR_STOP=1 -v "probe_user_a=$probeUserA" -v "probe_user_b=$probeUserB" -f $probeSql
if ($LASTEXITCODE -ne 0) { throw 'Ensayo fallido: no declarar validación' }
```

El generador solo escribe un archivo local; no inicia psql. Si PowerShell bloquea su ejecución, no cambiar políticas globales de seguridad: revisar/autorizar el script por el procedimiento local del operador.

## Aserciones del ensayo (PASS global reportado por el operador)

- Pedido sintético creado antes de la columna conserva NULL; invitado nuevo también.
- Dos pedidos vinculados a A/B, aunque tengan el mismo correo ficticio; el filtro de A no incluye B o invitados.
- INSERT del contrato anterior y UPDATE ordinario sobre un fixture siguen funcionando.
- FK desconocida: 23503 y constraint exacta `orders_user_id_fkey`.
- A→B, A→NULL y NULL→A: 23514 y mensaje exacto `ORDER_OWNER_IMMUTABLE`.
- Asignación ordinaria en la tabla temporal de prueba: 42501 y `ORDER_OWNER_SERVER_ONLY`.
- ROLLBACK explícito; `PASS: STRUCTURAL ONLY; migration and fixtures rolled back; data and existing RPC restored; financial RPC not executed` y exit code 0.

La FK se corrigió a `ON DELETE RESTRICT` para impedir también borrar una identidad vinculada. Esto bloquea eliminar cuentas con pedidos; no se ejecuta DELETE de usuarios ni se cambia la venta real.

## Recuperación y validaciones pendientes

Con `ON_ERROR_STOP`, un error en el archivo termina psql; el ensayo no contiene ninguna instrucción COMMIT. Si se usa una consola persistente y aparece una transacción abortada, emitir ROLLBACK. Tras interrupción o desconexión, no asumir éxito: confirmar que no existen columna, FK, índice, trigger y función nuevos antes de reintentar. El timeout de transacción ociosa limita sesiones retenidas.

Los RPC ausentes no se instalan desde este paquete. Confirmar versiones/triggers/ACL de Production por separado antes de publicar. Las pruebas locales de reintento y aislamiento están en `tests/checkout.test.mjs` y `tests/customer-order-history.test.mjs`; no se generan cargos para probarlas.


## Inspección separada de Production (solo lectura)

Archivo: `inspect-production.sql`. El operador reportó la revisión de las cuatro RPC en Production. Este asistente no ejecutó el archivo durante la preparación local. Enumera firmas exactas y alternativas, definiciones, propietarios/ACL, privilegios efectivos de tablas/columnas, roles, RLS, triggers/reglas y event triggers. No consulta pedidos ni datos personales y termina con ROLLBACK. Las tablas/privilegios declarados por una RPC SECURITY INVOKER deben contrastarse con su cuerpo real; `pg_depend` no sustituye esta revisión.

Solo tras autorización de lectura y verificación manual del destino, con `$productionConnection` ya configurada por el operador para Production y TLS verify-full, sin contraseña incrustada:

```powershell
& $psql -X -W --dbname=$productionConnection -v ON_ERROR_STOP=1 -f supabase/tests/order-user-history/inspect-production.sql
if ($LASTEXITCODE -ne 0) { throw 'Detener: inspección Production fallida' }
```

No usar esa conexión con el generador ni con el ensayo Dev. Detener publicación si falta una firma esperada, la RPC escribe/asigna `user_id`, hay INSERT sin lista de columnas incompatible, privilegios insuficientes o un trigger con contrato inesperado. La venta Live reportada no sustituye la inspección del nuevo campo.
