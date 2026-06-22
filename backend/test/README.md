# Backend Tests

## Estructura

```
test/
├── unitarias/           # Pruebas unitarias (con mocks)
│   ├── auth.service.spec.ts
│   ├── transactions.service.spec.ts
│   ├── budgets.service.spec.ts
│   └── categories.service.spec.ts
├── integracion/         # Pruebas de integración (con DB real)
│   ├── auth.integration-spec.ts
│   ├── transactions.integration-spec.ts
│   ├── budgets.integration-spec.ts
│   └── categories.integration-spec.ts
├── jest-unitarias.json
└── jest-integracion.json
```

## Ejecutar Pruebas

### Pruebas Unitarias
```bash
npm run test:unitarias
```

### Pruebas de Integración
```bash
# Requiere PostgreSQL corriendo
docker-compose up db -d
npm run test:integracion
```

### Todas las pruebas
```bash
npm test
```
