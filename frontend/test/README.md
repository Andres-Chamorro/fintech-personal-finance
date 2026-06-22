# Frontend Tests

## Estructura

```
test/
├── unitarias/           # Pruebas unitarias (con mocks)
│   ├── Toast.test.tsx
│   └── transactions.service.test.ts
├── e2e/                 # Pruebas End-to-End (con Playwright)
│   ├── auth.spec.ts
│   ├── transactions.spec.ts
│   └── budgets.spec.ts
└── setup.ts             # Configuración de Vitest
```

## Ejecutar Pruebas

### Pruebas Unitarias
```bash
npm run test:unitarias
```

### Pruebas Unitarias con UI
```bash
npm run test:unitarias:ui
```

### Pruebas E2E
```bash
# Requiere backend corriendo
docker-compose up backend -d
npm run test:e2e
```

### Pruebas E2E con UI
```bash
npm run test:e2e:ui
```

### Pruebas E2E en modo debug
```bash
npm run test:e2e:debug
```

## Instalación de Playwright

```bash
npm install -D @playwright/test
npx playwright install
```
