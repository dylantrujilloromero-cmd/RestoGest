-- Base de Datos Sistema de Reservas Multirestaurante
-- Se usa UUID para IDs y campos bien definidos.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TABLA: RESTAURANTES
-- ============================================================================
CREATE TABLE IF NOT EXISTS restaurantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    direccion VARCHAR(255),
    telefono VARCHAR(50),
    email VARCHAR(100),
    hora_apertura TIME,
    hora_cierre TIME,
    capacidad_maxima INTEGER,
    activo BOOLEAN DEFAULT true,
    carta_pdf_nombre VARCHAR(255),
    carta_pdf_datos TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. TABLA: USUARIOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE SET NULL,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('JEFE', 'ADMINISTRADOR', 'STAFF')),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. TABLA: PLANES DE RESERVA
-- ============================================================================
CREATE TABLE IF NOT EXISTS planes_reserva (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio FLOAT DEFAULT 0.0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. TABLA: RESERVAS
-- ============================================================================
CREATE TABLE IF NOT EXISTS reservas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES planes_reserva(id) ON DELETE SET NULL,
    plan VARCHAR(20) CHECK (plan IN ('30', '50', '60', '70', '80', 'No aplica')),
    creado_por_usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    ultimo_editor_usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    numero_personas INTEGER NOT NULL,
    nombre_cliente VARCHAR(150) NOT NULL,
    telefono_contacto VARCHAR(50) NOT NULL,
    email_contacto VARCHAR(100),
    ocasion VARCHAR(100) DEFAULT 'OTRO',
    descripcion_notas TEXT,
    postre_incluido BOOLEAN DEFAULT false,
    estado VARCHAR(50) DEFAULT 'CONFIRMADA' CHECK (estado IN ('PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'COMPLETADA', 'NO ASISTIO')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 5. TABLA: HISTORIAL DE EDICIONES DE RESERVAS
-- ============================================================================
CREATE TABLE IF NOT EXISTS historial_ediciones_reservas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reserva_id UUID REFERENCES reservas(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    campo_editado VARCHAR(100) NOT NULL,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    fecha_edicion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 6. NUEVA TABLA: NOVEDADES
-- ============================================================================
CREATE TABLE IF NOT EXISTS novedades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
    nombre_realiza VARCHAR(200) NOT NULL,
    nombre_dirigida VARCHAR(200) NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    asunto VARCHAR(300) NOT NULL,
    descripcion TEXT,
    imagen_nombre VARCHAR(255),
    imagen_datos TEXT,
    prioridad VARCHAR(10) NOT NULL CHECK (prioridad IN ('Alta', 'Media', 'Baja')),
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('Novedad del Personal', 'Novedad del Establecimiento')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 7. NUEVA TABLA: BRIEFINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS briefings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    no_hay TEXT,
    por_acabarse TEXT,
    impulsar TEXT,
    organizacion_servicio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 8. NUEVA TABLA: RECUPERAR PASSWORD
-- ============================================================================
CREATE TABLE IF NOT EXISTS recuperar_password (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    usado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 9. VISTA: vista_reservas_calendario
-- ============================================================================
CREATE OR REPLACE VIEW vista_reservas_calendario AS
SELECT 
    r.id,
    r.restaurante_id,
    r.plan_id,
    r.plan,
    r.creado_por_usuario_id,
    r.ultimo_editor_usuario_id,
    r.fecha,
    r.hora,
    r.numero_personas,
    r.nombre_cliente,
    r.telefono_contacto,
    r.email_contacto,
    r.ocasion,
    r.descripcion_notas,
    r.postre_incluido,
    r.estado,
    p.nombre AS nombre_plan,
    u.nombre AS nombre_usuario_creador
FROM reservas r
LEFT JOIN planes_reserva p ON r.plan_id = p.id
LEFT JOIN usuarios u ON r.creado_por_usuario_id = u.id;

-- ============================================================================
-- INSERCIÓN DE DATOS SEMILLA (SEED DATA)
-- ============================================================================

-- RESTAURANTES (4 oficiales: INNAMORATO FUSION, CIELO ROSA, CASA JUAREZ, LA BIRRIA)
INSERT INTO restaurantes (id, nombre, direccion, telefono, email, hora_apertura, hora_cierre, capacidad_maxima) VALUES
('11111111-1111-1111-1111-111111111111', 'INNAMORATO FUSION', 'Av. Primavera 1020, Miraflores', '+51 987 654 321', 'contacto@innamoratofusion.com', '12:30:00', '23:30:00', 70),
('22222222-2222-2222-2222-222222222222', 'CIELO ROSA', 'Calle Malecón de la Reserva 450', '+51 987 654 322', 'reservas@cielorosa.com', '12:00:00', '23:00:00', 50),
('33333333-3333-3333-3333-333333333333', 'CASA JUAREZ', 'Jr. Los Conquistadores 880, San Isidro', '+51 987 654 323', 'info@casajuarez.com', '13:00:00', '23:00:00', 65),
('44444444-4444-4444-4444-444444444444', 'LA BIRRIA', 'Av. Javier Prado Este 2140', '+51 987 654 324', 'administracion@labirria.com', '12:00:00', '23:45:00', 80)
ON CONFLICT DO NOTHING;

-- USUARIOS
-- USUARIOS (1 Jefe global + 4 Administradores, uno por restaurante)
INSERT INTO usuarios (id, restaurante_id, nombre, email, password_hash, rol) VALUES
('55555555-5555-5555-5555-555555555551', NULL, 'Jefe General', 'jefe_restaurantes@gmail.com', crypt('Jefe123', gen_salt('bf')), 'JEFE'),
('55555555-5555-5555-5555-555555555552', '11111111-1111-1111-1111-111111111111', 'Administrador Innamorato', 'admin.innamorato@reservas.com', crypt('admin123', gen_salt('bf')), 'ADMINISTRADOR'),
('55555555-5555-5555-5555-555555555553', '22222222-2222-2222-2222-222222222222', 'Administrador Cielo Rosa', 'admin.cielorosa@reservas.com', crypt('admin123', gen_salt('bf')), 'ADMINISTRADOR'),
('55555555-5555-5555-5555-555555555554', '33333333-3333-3333-3333-333333333333', 'Administrador Casa Juarez', 'admin.casajuarez@reservas.com', crypt('admin123', gen_salt('bf')), 'ADMINISTRADOR'),
('55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 'Administrador La Birria', 'admin.labirria@reservas.com', crypt('admin123', gen_salt('bf')), 'ADMINISTRADOR')
ON CONFLICT DO NOTHING;

-- PLANES DE RESERVA
INSERT INTO planes_reserva (id, restaurante_id, nombre, descripcion, precio) VALUES
('66666666-6666-6666-6666-666666666661', '11111111-1111-1111-1111-111111111111', 'Cumpleaños Birria', 'Plan especial de cumpleaños en La Birria', 30000),
('66666666-6666-6666-6666-666666666662', '22222222-2222-2222-2222-222222222222', 'Aniversario Verano', 'Decoración romántica', 50000)
ON CONFLICT DO NOTHING;

-- RESERVAS (Ejemplo)
INSERT INTO reservas (id, restaurante_id, plan_id, plan, creado_por_usuario_id, fecha, hora, numero_personas, nombre_cliente, telefono_contacto, email_contacto, ocasion) VALUES
('77777777-7777-7777-7777-777777777771', '11111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666661', '50', '55555555-5555-5555-5555-555555555555', CURRENT_DATE, '14:00:00', 4, 'Juan Perez', '3001234567', 'juan@example.com', 'CUMPLEAÑOS'),
('77777777-7777-7777-7777-777777777772', '22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666662', '80', '55555555-5555-5555-5555-555555555552', CURRENT_DATE + INTERVAL '1 day', '20:00:00', 2, 'Maria Gomez', '3109876543', 'maria@example.com', 'ANIVERSARIO')
ON CONFLICT DO NOTHING;
