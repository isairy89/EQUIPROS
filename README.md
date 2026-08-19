# EQUIPROCI

Aplicación web centralizada: React/Vite + Express + PostgreSQL/Drizzle. Las cuatro PCs deben acceder a la misma URL; ninguna instala un ejecutable ni posee una base independiente.

## Operación local

1. Copie `.env.example` a `.env` y complete secretos reales. Genere el hash con `npm run password:hash`.
2. Instale dependencias: `npm ci`.
3. Tras realizar y verificar un backup, aplique la migración no destructiva: `npm run db:migrate`.
4. Desarrollo: `npm run dev`. Producción: `npm run build` y `npm start`.

No active `ALLOW_INITIAL_SEED` ni `ALLOW_DATA_RESET` en producción. El primero agrega datos de muestra a una base vacía; el segundo permite el único flujo que hace TRUNCATE.

## PostgreSQL, migraciones y backups

El proveedor no está fijado en código: debe ser PostgreSQL accesible con `SQL_HOST`, `SQL_PORT`, `SQL_DB_NAME`, `SQL_USER`, `SQL_PASSWORD` y, si corresponde, `SQL_SSL`. Drizzle usa `SQL_ADMIN_USER` y `SQL_ADMIN_PASSWORD` para migrar.

Ejemplo de backup, ejecutado desde una máquina segura con `pg_dump`:

`pg_dump --format=custom --no-owner --file=equiproci-AAAA-MM-DD.dump "$DATABASE_URL"`

Restauración en una base de destino previamente confirmada:

`pg_restore --clean --if-exists --no-owner --dbname="$DATABASE_URL" equiproci-AAAA-MM-DD.dump`

No hay backups automáticos configurados en este repositorio. Verifique el archivo y el destino antes de una restauración.
