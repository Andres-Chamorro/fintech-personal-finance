# Contexto del Proyecto: MVP de Gestión Financiera Personal (Fintech 2026)

Actúa como un Ingeniero de Software Senior y Arquitecto de Soluciones experto en el ecosistema Fintech. Vamos a desarrollar el MVP de un módulo de gestión de movimientos financieros personales para una fintech colombiana.

Este código no es un prototipo: debe estar listo para producción, revisión de pares (Code Review), pasar análisis de calidad automatizado y desplegarse de forma real.

---

## 🚫 Restricciones Técnicas Innegociables
Cualquier propuesta de código debe cumplir estrictamente con:
1. **Persistencia Real:** No se acepta almacenamiento en memoria (`in-memory`) ni `mocks` para datos de negocio.
2. **Seguridad Financiera:** Manejo adecuado de datos sensibles y control estricto de acceso (un usuario solo puede ver y modificar sus propios datos).
3. **Automatización:** Debe incluir pruebas automatizadas (unitarias/integración) y configuración para un pipeline de CI/CD funcional con análisis de calidad de código.
4. **Script de Inicio:** Un único comando debe levantar todo el ecosistema (Base de datos, Backend y Frontend).

---

## 🛠️ Requerimientos Funcionales por Módulos

### Módulo 1: Autenticación y Gestión de Sesión
* **Registro:** Usuario se registra con correo y contraseña.
* **Login:** Autenticación segura para acceder a las funcionalidades.
* **Seguridad:** Sesión segura con duración controlada (JWT o similar con expiración).
* **Aislamiento:** Un usuario solo puede interactuar con sus propios datos.

### Módulo 2: Movimientos Financieros
* **Registro de movimientos:** Tipo (ingreso / egreso), valor, descripción, categoría y fecha.
* **CRUD:** Editar y eliminar movimientos propios.
* **Listado Avanzado:** Paginación y ordenamiento por fecha.
* **Filtros:** Filtrar por tipo, categoría y rango de fechas.
* **Balance:** Resumen del balance actual en tiempo real ($\text{Total Ingresos} - \text{Total Egresos}$).

### Módulo 3: Categorías y Presupuestos
* **Gestión de Categorías:** Crear y administrar categorías personalizadas de gasto.
* **Presupuesto Mensual:** Asignar un tope o presupuesto máximo mensual por categoría.
* **Alertas Tempranas:** La API debe retornar una alerta/notificación en la respuesta cuando el gasto acumulado de la categoría supere el **80%** y el **100%** de su presupuesto.
* **Dashboard/Estado:** Ver estado de cada categoría indicando: presupuesto total, gastado y porcentaje de uso.

---

## 🤖 Reglas de Interacción contigo (Uso de IA)
Para cumplir con la evaluación, necesito mantener el criterio de ingeniería. Por lo tanto:
* **Justificación:** Cada decisión de arquitectura, patrón de diseño o librería que propongas debe venir con su sustento técnico orientado a Fintech (seguridad, escalabilidad, mantenibilidad).
* **Transparencia:** Si propones una solución, adviérteme de las alternativas o posibles fallos para yo tomar la decisión final. Esto es vital para documentar la sección "AI Usage" de mi README.

---

## 🎯 ¿Qué haremos primero?
Antes de escribir código, propónme:
1. El **Stack Tecnológico** ideal (Backend, Frontend, Base de Datos) justificando por qué es adecuado para este entorno Fintech.
2. La **Estructura de Carpetas/Arquitectura** del proyecto (ej. Clean Architecture, Hexagonal, o MVC Robusto) que permita separar el frontend, backend y la base de datos de manera limpia para cumplir con el script de inicio único.