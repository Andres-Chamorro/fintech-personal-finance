# Guía de Pruebas - Fintech Personal Finance

Este documento describe cómo ejecutar las pruebas unitarias, de integración y E2E del proyecto.

---

## 📁 Estructura de Pruebas

### Backend
```
backend/
└── test/
    ├── unitarias/                    # Pruebas unitarias (con mocks)
    │   ├── transactions.service.spec.ts
    │   └── budgets.service.spec.ts
    ├── integracion/                  # Pruebas de integración (con DB real)
    │   ├── auth.integration-spec.ts
    │   ├── transactions.integration-spec.ts
    │   └── budgets.integration-spec.ts
    ├── jest-unitarias.json
    ├── jest-integracion.json
    └── README.md
```

### Frontend
```
frontend/
└── test/
    ├── unitarias/                    # Pruebas unitarias (con mocks)
    │   ├── Toast.test.tsx
    │   └── transactions.service.test.ts
    ├── e2e/                          # Pruebas E2E (Playwright)
    │   ├── auth.spec.ts
    │   ├── transactions.spec.ts
    │   └── budgets.spec.ts
    ├── setup.ts
    └── README.md
```

---

## Backend (NestJS + Jest)

### Pruebas Unitarias

Las pruebas unitarias verifican el comportamiento de servicios individuales de forma aislada usando mocks.

**Ubicación**: `backend/test/unitarias/*.spec.ts`

**Pruebas implementadas**:
- ✅ `transactions.service.spec.ts` - Servicio de transacciones
  - Crear transacciones (con y sin categoría)
  - Obtener transacciones
  - Actualizar transacciones (incluyendo cambio de categoría)
  - Eliminar transacciones
  - Calcular balance
  - Validación de propiedad del usuario

- ✅ `budgets.service.spec.ts` - Servicio de presupuestos
  - Crear presupuestos
  - Prevenir duplicados
  - Calcular gastos y alertas (80%, 100%)
  - Obtener presupuestos con datos calculados
  - Eliminar presupuestos

**Ejecutar pruebas unitarias**:
```bash
cd backend
npm run test:unitarias
```

**Con cobertura**:
```bash
npm run test:cov
```

**Modo watch (desarrollo)**:
```bash
npm run test:watch
```

---

### Pruebas de Integración

Las pruebas de integración verifican el flujo completo de la API con base de datos real y todas las capas integradas.

**Ubicación**: `backend/test/integracion/*.integration-spec.ts`

**Pruebas implementadas**:
- ✅ `auth.integration-spec.ts` - Autenticación
  - Registro de usuarios
  - Login con credenciales válidas/inválidas
  - Validaciones de email y contraseña

- ✅ `transactions.integration-spec.ts` - Transacciones
  - CRUD completo de transacciones
  - Validación de fechas futuras (debe fallar)
  - Filtros por tipo, categoría, rango de fechas
  - Paginación y ordenamiento
  - Cálculo de balance
  - Protección de rutas (autenticación requerida)
  - Verificación de propiedad de recursos

- ✅ `budgets.integration-spec.ts` - Presupuestos
  - CRUD completo de presupuestos
  - Validación de meses pasados (debe fallar)
  - Prevención de duplicados
  - Validación de montos mínimos
  - Alertas al 80% y 100%
  - Cálculo de gastos en tiempo real

**Ejecutar pruebas de integración**:
```bash
cd backend
npm run test:integration
```

**NOTA**: Las pruebas de integración requieren que la base de datos PostgreSQL esté corriendo. Puedes usar Docker:
```bash
# Desde la raíz del proyecto
docker-compose up db -d
```

---

## Frontend (React + Vitest + Playwright)

### Pruebas Unitarias

Las pruebas unitarias verifican componentes y servicios individuales de forma aislada usando mocks.

**Ubicación**: `frontend/src/**/*.test.{ts,tsx}`

**Pruebas implementadas**:
- ✅ `Toast.test.tsx` - Componente Toast
  - Renderizado de toasts success/error/info
  - Colores correctos según tipo (verde/rojo/azul)
  - Auto-cierre después de duración
  - Cierre manual con botón
  - Iconos correctos

- ✅ `transactions.service.test.ts` - Servicio de transacciones
  - Obtener todas las transacciones con filtros
  - Crear transacción
  - Actualizar transacción
  - Eliminar transacción
  - Obtener balance

**Ejecutar pruebas unitarias**:
```bash
cd frontend
npm test
```

**Con interfaz UI**:
```bash
npm run test:ui
```

---

### Pruebas E2E (Playwright)

Las pruebas E2E verifican el flujo completo de la aplicación desde la perspectiva del usuario, interactuando con el navegador real.

**Ubicación**: `frontend/e2e/\*.spec.ts`

**Pruebas implementadas**:
- ✅ `auth.spec.ts` - Flujo de autenticación (5 pruebas)
  - Registro exitoso de usuario
  - Validación de email inválido
  - Login con credenciales válidas
  - Error con credenciales incorrectas (toast rojo)
  - Logout exitoso

- ✅ `transactions.spec.ts` - Gestión de transacciones (7 pruebas)
  - Crear nueva transacción (toast verde)
  - Prevenir fechas futuras (toast rojo)
  - Editar transacción existente
  - Eliminar transacción
  - Filtrar por tipo (income/expense)
  - Navegación con botón "Volver"
  - Verificar cambio de categoryId

- ✅ `budgets.spec.ts` - Gestión de presupuestos (8 pruebas)
  - Crear nuevo presupuesto (toast verde)
  - Prevenir meses pasados (toast rojo)
  - Prevenir presupuestos duplicados (toast rojo)
  - Eliminar presupuesto
  - Alertas al 80% de gasto
  - Valores visibles (no en blanco)
  - Navegación con botón "Volver"

**Ejecutar pruebas E2E**:
```bash
cd frontend

# Primero instalar Playwright
npm install -D @playwright/test
npx playwright install

# Ejecutar pruebas
npm run test:e2e
```

**Con interfaz UI**:
```bash
npm run test:e2e:ui
```

**Modo debug**:
```bash
npm run test:e2e:debug
```

**NOTA**: Las pruebas E2E requieren que tanto el backend como el frontend estén corriendo. Playwright iniciará automáticamente el frontend, pero necesitas el backend:
```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Pruebas E2E
cd frontend
npm run test:e2e
```

O usa Docker:
```bash
docker-compose up backend -d
cd frontend
npm run test:e2e
```

---

## Cobertura de Pruebas

### Backend

**Módulos probados**:
- ✅ Auth (Integración)
- ✅ Transactions (Unitarias + Integración)
- ✅ Budgets (Unitarias + Integración)
- ⚠️ Categories (Integración básico en auth, falta unitarias dedicadas)

**Funcionalidades clave probadas**:
- ✅ Validación de fechas futuras en transacciones ❌
- ✅ Validación de meses pasados en presupuestos ❌
- ✅ Prevención de presupuestos duplicados ❌
- ✅ Alertas al 80% y 100% del presupuesto
- ✅ Actualización de categoryId en transacciones
- ✅ Cálculo de balance
- ✅ Filtros y paginación
- ✅ Autenticación y autorización

### Frontend

**Componentes/Servicios probados (Unitarias)**:
- ✅ Toast (completo)
- ✅ TransactionsService (completo)
- ⚠️ BudgetsService (pendiente)
- ⚠️ CategoriesService (pendiente)

**Flujos E2E probados (Playwright)**:
- ✅ Auth completo (registro, login, logout, validaciones)
- ✅ Transacciones (CRUD, validaciones, filtros, navegación)
- ✅ Presupuestos (CRUD, validaciones, alertas, navegación)
- ✅ Toasts con colores correctos (verde/rojo)
- ✅ Botones "Volver" funcionando
- ✅ Valores visibles en presupuestos (no blancos)

---

## Ejecutar Todas las Pruebas

### Backend
```bash
cd backend

# Unitarias
npm test

# Integración (requiere DB)
npm run test:integration

# Todo con cobertura
npm run test:cov
```

### Frontend
```bash
cd frontend

# Unitarias
npm test

# E2E con Playwright (requiere backend corriendo)
npm run test:e2e

# E2E con UI interactiva
npm run test:e2e:ui
```

### Todas las pruebas del proyecto
```bash
# Terminal 1 - Levantar servicios
docker-compose up -d

# Terminal 2 - Backend
cd backend
npm test && npm run test:integration

# Terminal 3 - Frontend
cd frontend
npm test && npm run test:e2e
```

---

## Interpretación de Resultados

### Jest (Backend)
```
PASS  src/modules/transactions/transactions.service.spec.ts
  TransactionsService
    ✓ should create a transaction successfully (15 ms)
    ✓ should update categoryId (10 ms)
    ...
    
Test Suites: 3 passed, 3 total
Tests:       28 passed, 28 total
```

### Vitest (Frontend)
```
✓ src/components/Toast.test.tsx (8 tests)
✓ src/services/transactions.service.test.ts (5 tests)

Test Files  2 passed (2)
     Tests  13 passed (13)
```

---

## Buenas Prácticas

1. **Ejecutar pruebas antes de commit**:
   ```bash
   cd backend && npm test && cd ../frontend && npm test
   ```

2. **Agregar pruebas para nuevas funcionalidades**:
   - Nueva feature = nueva prueba unitaria + E2E

3. **Mantener cobertura alta**:
   - Objetivo: >80% cobertura en servicios críticos

4. **Usar mocks apropiadamente**:
   - Unitarias: Mock todo (DB, APIs externas)
   - E2E: Real DB, real HTTP

5. **Nombres descriptivos**:
   ```typescript
   it('should reject future dates in transactions', ...)
   it('should show warning alert at 80% budget', ...)
   ```

---

## Próximos Pasos

### Backend
- [ ] Agregar pruebas unitarias para CategoriesService
- [ ] Agregar pruebas E2E para Categories
- [ ] Pruebas de carga/rendimiento con k6 o Artillery
- [ ] Pruebas de seguridad (SQL injection, XSS)

### Frontend
- [ ] Completar pruebas unitarias de services restantes
- [ ] Agregar pruebas de componentes (TransactionsPage, BudgetsPage)
- [ ] Configurar Playwright para E2E completo
- [ ] Pruebas de accesibilidad con axe-core
- [ ] Pruebas de responsive design

---

## Troubleshooting

### Backend - "Cannot find module"
```bash
cd backend
npm install
```

### Backend - "Port 5432 already in use"
```bash
docker-compose down
docker-compose up db -d
```

### Frontend - "Module not found: @testing-library/jest-dom"
```bash
cd frontend
npm install -D @testing-library/jest-dom @testing-library/react vitest @vitejs/plugin-react
```

### E2E - "Database connection failed"
Asegúrate de que las variables de entorno en `.env` apunten a la DB de test:
```
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=fintech_test
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd backend && npm install
      - run: cd backend && npm test
      - run: cd backend && npm run test:e2e

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd frontend && npm install
      - run: cd frontend && npm test
```

---

## Recursos

- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
