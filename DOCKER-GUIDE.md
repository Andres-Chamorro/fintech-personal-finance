# 🐳 Guía Docker - Fintech Personal Finance

Esta guía explica cómo ejecutar todo el proyecto completamente dockerizado (sin necesidad de instalar Node.js localmente).

---

## 📋 Requisitos Previos

**Solo necesitas Docker:**
- ✅ [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado
- ✅ Docker corriendo (verificar con `docker --version`)

**NO necesitas:**
- ❌ Node.js
- ❌ npm
- ❌ PostgreSQL local

---

## 🚀 Inicio Rápido

### Opción 1: Modo Desarrollo (Recomendado)

**Con hot-reload** - Los cambios en el código se reflejan automáticamente:

#### Windows:
```bash
# Doble clic en:
start-docker-dev.bat

# O desde terminal:
docker-compose -f docker-compose.dev.yml up --build
```

#### Linux/Mac:
```bash
docker-compose -f docker-compose.dev.yml up --build
```

### Opción 2: Modo Producción

Build optimizado (más rápido, pero sin hot-reload):

#### Windows:
```bash
# Doble clic en:
start-docker.bat

# O desde terminal:
docker-compose up --build
```

#### Linux/Mac:
```bash
docker-compose up --build
```

---

## 🌐 URLs de Acceso

Una vez levantado, accede a:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Swagger Docs**: http://localhost:3001/api/docs
- **Base de Datos**: localhost:5432

---

## 🛑 Detener Servicios

### Detener y mantener datos
```bash
docker-compose down
# O para dev:
docker-compose -f docker-compose.dev.yml down
```

### Detener y eliminar TODO (incluyendo datos de BD)
```bash
npm run docker:clean
# O manualmente:
docker-compose down -v
docker-compose -f docker-compose.dev.yml down -v
```

---

## 📊 Comandos Útiles

### Ver logs en tiempo real
```bash
# Todos los servicios
docker-compose logs -f

# Solo backend
docker-compose logs -f backend

# Solo frontend
docker-compose logs -f frontend

# Solo base de datos
docker-compose logs -f postgres
```

### Ver estado de contenedores
```bash
docker-compose ps
```

### Reconstruir imágenes (después de cambios en dependencias)
```bash
docker-compose up --build
```

### Entrar a un contenedor
```bash
# Backend
docker exec -it fintech-backend sh

# Frontend
docker exec -it fintech-frontend sh

# Base de datos
docker exec -it fintech-db psql -U fintech_user -d fintech_db
```

---

## 🔧 Troubleshooting

### Problema: "Port already in use"

**Solución**: Algún servicio está usando el puerto

```bash
# Windows - Ver qué usa el puerto 3000
netstat -ano | findstr :3000

# Matar el proceso (reemplaza PID)
taskkill /PID <PID> /F

# O cambiar el puerto en docker-compose.yml:
ports:
  - "3002:3000"  # Ahora accedes en :3002
```

### Problema: "Cannot connect to database"

**Solución**: Esperar a que PostgreSQL esté listo

```bash
# Ver logs de la base de datos
docker-compose logs postgres

# Debe decir: "database system is ready to accept connections"
```

### Problema: Cambios no se reflejan

**Solución para modo desarrollo**:
```bash
# 1. Detener
docker-compose -f docker-compose.dev.yml down

# 2. Reconstruir
docker-compose -f docker-compose.dev.yml up --build
```

**Solución para modo producción**:
```bash
# SIEMPRE usar --build en producción
docker-compose up --build
```

### Problema: "Out of space" / Disco lleno

**Solución**: Limpiar Docker

```bash
# Limpiar imágenes no usadas
docker system prune -a

# Limpiar volúmenes huérfanos
docker volume prune
```

---

## 📦 Arquitectura Docker

```
┌─────────────────────────────────────────┐
│  Frontend Container (Next.js)           │
│  Port: 3000                             │
│  Network: fintech-network               │
└─────────────┬───────────────────────────┘
              │
              ↓ HTTP
┌─────────────────────────────────────────┐
│  Backend Container (NestJS)             │
│  Port: 3001                             │
│  Network: fintech-network               │
└─────────────┬───────────────────────────┘
              │
              ↓ PostgreSQL Protocol
┌─────────────────────────────────────────┐
│  PostgreSQL Container                   │
│  Port: 5432                             │
│  Volume: postgres_data                  │
│  Network: fintech-network               │
└─────────────────────────────────────────┘
```

---

## 🆚 Modo Desarrollo vs Producción

### Modo Desarrollo (`docker-compose.dev.yml`)

✅ **Ventajas**:
- Hot reload (cambios en código = recarga automática)
- Volúmenes montados (editas local, se refleja en contenedor)
- Logs detallados
- Depuración fácil

❌ **Desventajas**:
- Más lento en inicio
- Mayor uso de CPU
- No optimizado

**Uso**: Mientras desarrollas

### Modo Producción (`docker-compose.yml`)

✅ **Ventajas**:
- Build optimizado (multi-stage)
- Imagen más pequeña
- Solo dependencias de producción
- Más rápido en ejecución

❌ **Desventajas**:
- Sin hot reload
- Para ver cambios, debes reconstruir

**Uso**: Para demos o producción

---

## 🔑 Variables de Entorno

Ya están configuradas en `docker-compose.yml` y `docker-compose.dev.yml`.

Si necesitas cambiar algo:

```yaml
# En docker-compose.yml
services:
  backend:
    environment:
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      JWT_SECRET: tu-nuevo-secret  # Cambiar esto
```

---

## 📝 Flujo de Trabajo Recomendado

### Para Desarrollo Diario:

1. **Iniciar**:
   ```bash
   docker-compose -f docker-compose.dev.yml up
   ```

2. **Desarrollar**: Edita archivos en `frontend/src` o `backend/src`
   - Los cambios se reflejan automáticamente

3. **Detener** (Ctrl+C):
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

### Para Probar Build de Producción:

1. **Build y ejecutar**:
   ```bash
   docker-compose up --build
   ```

2. **Probar**: http://localhost:3000

3. **Detener**:
   ```bash
   docker-compose down
   ```

---

## ✅ Verificación de Instalación

Después de `docker-compose up`, verifica:

```bash
# Backend responde
curl http://localhost:3001/api

# Frontend responde
curl http://localhost:3000

# Base de datos responde
docker exec -it fintech-db psql -U fintech_user -d fintech_db -c "SELECT 1;"
```

Deberías ver respuestas exitosas en todos.

---

## 🎯 Scripts NPM (Opcionales)

Si prefieres usar npm en lugar de docker-compose directamente:

```bash
# Modo desarrollo con Docker
npm run docker:dev

# Modo producción con Docker
npm run docker:prod

# Detener desarrollo
npm run docker:dev:down

# Detener producción
npm run docker:prod:down

# Limpiar TODO (incluye volúmenes)
npm run docker:clean
```

---

## 🚀 Despliegue en Cloud

### AWS ECS / Azure Container Instances / Google Cloud Run

1. **Tag de imágenes**:
   ```bash
   docker tag fintech-personal-finance_backend:latest tu-registry/fintech-backend:1.0.0
   docker tag fintech-personal-finance_frontend:latest tu-registry/fintech-frontend:1.0.0
   ```

2. **Push a registry**:
   ```bash
   docker push tu-registry/fintech-backend:1.0.0
   docker push tu-registry/fintech-frontend:1.0.0
   ```

3. **Configurar variables de entorno** en tu servicio cloud

4. **Usar base de datos managed** (RDS, Azure Database, Cloud SQL)

---

## ❓ FAQ

**P: ¿Necesito instalar Node.js?**  
R: No, Docker incluye Node.js en las imágenes.

**P: ¿Los datos persisten al reiniciar?**  
R: Sí, gracias a los volúmenes Docker. Usa `down -v` para borrar.

**P: ¿Puedo usar mi PostgreSQL local en lugar del contenedor?**  
R: Sí, comenta el servicio `postgres` en docker-compose y cambia `DATABASE_HOST` a `host.docker.internal` (Windows/Mac) o tu IP local (Linux).

**P: ¿Cómo actualizar dependencias?**  
R: Modifica `package.json` y reconstruye con `--build`.

---

## 📚 Recursos

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Best Practices for Node.js in Docker](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

---

**¡Listo!** 🎉 Ahora tienes todo el proyecto corriendo en Docker sin configuraciones complicadas.
