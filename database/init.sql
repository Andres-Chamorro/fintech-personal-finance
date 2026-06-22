-- Script de inicialización de base de datos
-- Este script se ejecuta automáticamente cuando se crea el contenedor

-- Asegurar que la base de datos use UTF-8
ALTER DATABASE fintech_db SET timezone TO 'America/Bogota';

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Comentario de inicialización
COMMENT ON DATABASE fintech_db IS 'Base de datos para sistema de gestión financiera personal - Fintech Colombia 2026';
