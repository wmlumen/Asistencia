-- ============================================
-- BASE DE DATOS: centuria_asistencia
-- Tabla: planificaciones
-- Propósito: Respaldo local de datos de Google Sheets
-- NO sincronizar con GitHub (datos sensibles)
-- ============================================

CREATE DATABASE IF NOT EXISTS centuria_asistencia 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE centuria_asistencia;

-- ============================================
-- TABLA: planificaciones
-- ============================================
CREATE TABLE IF NOT EXISTS planificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE COMMENT 'CÉDULA-COD_ASIG-COD_SEC-CORRELATIVO',
    cedula VARCHAR(20) NOT NULL,
    nombre_apellido VARCHAR(200) NOT NULL,
    cod_asignatura VARCHAR(50) NOT NULL,
    cod_seccion VARCHAR(50) NOT NULL,
    cod_carrera VARCHAR(100) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_cierre DATE NOT NULL,
    sala VARCHAR(100) DEFAULT NULL,
    sede VARCHAR(100) DEFAULT NULL,
    modalidad ENUM('Presencial', 'Virtual', 'Híbrida') DEFAULT NULL,
    observaciones TEXT DEFAULT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    fuente VARCHAR(20) DEFAULT 'sheets' COMMENT 'sheets, local, csv',
    INDEX idx_cedula (cedula),
    INDEX idx_codigo (codigo),
    INDEX idx_asignatura (cod_asignatura),
    INDEX idx_seccion (cod_seccion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: asistencias (para futura migración)
-- ============================================
CREATE TABLE IF NOT EXISTS asistencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    cedula VARCHAR(20) NOT NULL,
    carrera VARCHAR(100) NOT NULL,
    seccion VARCHAR(50) NOT NULL,
    observacion TEXT DEFAULT NULL,
    estado ENUM('Presente', 'Ausente', 'Ausencia Justificada', 'Tarde') DEFAULT 'Presente',
    marca_temporal DATETIME DEFAULT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_cedula (cedula),
    INDEX idx_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: catalogos (asignaturas, secciones, carreras)
-- ============================================
CREATE TABLE IF NOT EXISTS catalogos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('asignatura', 'seccion', 'carrera') NOT NULL,
    codigo VARCHAR(20) NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_tipo_codigo (tipo, codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- VISTA: resumen_planificaciones
-- ============================================
CREATE OR REPLACE VIEW resumen_planificaciones AS
SELECT 
    cod_asignatura,
    cod_seccion,
    cod_carrera,
    COUNT(*) as total_planificaciones,
    MIN(fecha_inicio) as fecha_inicio_min,
    MAX(fecha_cierre) as fecha_cierre_max
FROM planificaciones
GROUP BY cod_asignatura, cod_seccion, cod_carrera;

-- ============================================
-- DATOS DE EJEMPLO (opcional, para pruebas)
-- ============================================
-- INSERT INTO planificaciones (codigo, cedula, nombre_apellido, cod_asignatura, cod_seccion, cod_carrera, fecha_inicio, fecha_cierre, sala, sede, modalidad)
-- VALUES 
-- ('1340130-01-01-01', '1340130', 'CHRISTHIAN JOSE RAUL KEIM', '01-Sociologia', '01-S026', '01-Licenciatura Administracion de Empresas', '2026-06-01', '2026-06-30', 'Aula 1', 'Sede Central', 'Presencial');
