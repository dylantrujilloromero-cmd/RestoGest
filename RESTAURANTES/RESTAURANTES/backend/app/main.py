"""
=============================================================================
BACKEND API REST - SISTEMA DE RESERVAS MULTIRESTAURANTE (FASTAPI + POSTGRESQL)
=============================================================================
Roles: JEFE y ADMINISTRADOR
Módulos: Restaurantes, Planes, Calendario y CRUD completo de Reservas
"""

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import os
import asyncpg
from datetime import date, time, datetime

# Configuración de variables de entorno para PostgreSQL
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres:postgres@localhost:5432/reservas_restaurantes"
)

app = FastAPI(
    title="Sistema de Reservas Multirestaurante API",
    description="API REST para la gestión de reservas para 4 restaurantes (Roles: Jefe y Administrador)",
    version="1.0.0"
)

# Habilitar CORS para el Frontend Vue.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------
# MODELOS PYDANTIC (VALIDACIONES DE ENTRADA Y SALIDA)
# -----------------------------------------------------------------------------
class ReservaCreate(BaseModel):
    restaurante_id: str
    plan_id: Optional[str] = None
    plan: Optional[str] = None
    fecha: date
    hora: str  # Formato 'HH:MM:SS' o 'HH:MM'
    numero_personas: int
    nombre_cliente: str
    telefono_contacto: str
    email_contacto: Optional[str] = None
    ocasion: str = "OTRO"
    descripcion_notas: Optional[str] = None
    postre_incluido: bool = False
    estado: str = "CONFIRMADA"
    creado_por_usuario_id: Optional[str] = None

class ReservaUpdate(BaseModel):
    plan_id: Optional[str] = None
    plan: Optional[str] = None
    fecha: Optional[date] = None
    hora: Optional[str] = None
    numero_personas: Optional[int] = None
    nombre_cliente: Optional[str] = None
    telefono_contacto: Optional[str] = None
    email_contacto: Optional[str] = None
    ocasion: Optional[str] = None
    descripcion_notas: Optional[str] = None
    postre_incluido: Optional[bool] = None
    estado: Optional[str] = None
    ultimo_editor_usuario_id: Optional[str] = None

class RestauranteUpdate(BaseModel):
    nombre: Optional[str] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    hora_apertura: Optional[str] = None
    hora_cierre: Optional[str] = None
    capacidad_maxima: Optional[int] = None
    activo: Optional[bool] = None

class RecuperarPasswordRequest(BaseModel):
    email: str

class NovedadCreate(BaseModel):
    restaurante_id: str
    nombre_realiza: str
    nombre_dirigida: str
    fecha: Optional[date] = None
    asunto: str
    descripcion: Optional[str] = None
    imagen_nombre: Optional[str] = None
    imagen_datos: Optional[str] = None
    prioridad: str
    tipo: str

class BriefingCreate(BaseModel):
    restaurante_id: str
    fecha: Optional[date] = None
    no_hay: Optional[str] = None
    por_acabarse: Optional[str] = None
    impulsar: Optional[str] = None
    organizacion_servicio: Optional[str] = None

# Pool de conexiones a PostgreSQL
db_pool: Optional[asyncpg.Pool] = None

@app.on_event("startup")
async def startup():
    global db_pool
    try:
        db_pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)
        print("Conectado exitosamente al pool de PostgreSQL")
    except Exception as e:
        print(f"Nota: PostgreSQL no conectado localmente aún: {e}")

@app.on_event("shutdown")
async def shutdown():
    global db_pool
    if db_pool:
        await db_pool.close()

# -----------------------------------------------------------------------------
# ENDPOINTS: RESTAURANTES
# -----------------------------------------------------------------------------
@app.get("/api/restaurantes", tags=["Restaurantes"])
async def listar_restaurantes():
    if not db_pool:
        raise HTTPException(status_code=503, detail="Servicio de base de datos no disponible")
    async with db_pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM restaurantes ORDER BY nombre ASC")
        return [dict(r) for r in rows]

@app.get("/api/restaurantes/{restaurante_id}", tags=["Restaurantes"])
async def obtener_restaurante(restaurante_id: str):
    if not db_pool:
        raise HTTPException(status_code=503, detail="Servicio de base de datos no disponible")
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM restaurantes WHERE id = $1", restaurante_id)
        if not row:
            raise HTTPException(status_code=404, detail="Restaurante no encontrado")
        return dict(row)

@app.put("/api/restaurantes/{restaurante_id}", tags=["Restaurantes (Rol Jefe)"])
async def actualizar_restaurante(restaurante_id: str, data: RestauranteUpdate):
    """Permite al rol JEFE editar los datos del restaurante."""
    if not db_pool:
        raise HTTPException(status_code=503, detail="Servicio de base de datos no disponible")
    async with db_pool.acquire() as conn:
        query = """
            UPDATE restaurantes
            SET nombre = COALESCE($2, nombre),
                direccion = COALESCE($3, direccion),
                telefono = COALESCE($4, telefono),
                email = COALESCE($5, email),
                capacidad_maxima = COALESCE($6, capacidad_maxima),
                activo = COALESCE($7, activo)
            WHERE id = $1
            RETURNING *
        """
        row = await conn.fetchrow(
            query, restaurante_id, data.nombre, data.direccion,
            data.telefono, data.email, data.capacidad_maxima, data.activo
        )
        if not row:
            raise HTTPException(status_code=404, detail="Restaurante no encontrado")
        return dict(row)

# -----------------------------------------------------------------------------
# ENDPOINTS: PLANES DE RESERVA
# -----------------------------------------------------------------------------
@app.get("/api/planes", tags=["Planes de Reserva"])
async def listar_planes(restaurante_id: Optional[str] = None):
    if not db_pool:
        raise HTTPException(status_code=503, detail="Servicio de base de datos no disponible")
    async with db_pool.acquire() as conn:
        if restaurante_id:
            rows = await conn.fetch(
                "SELECT * FROM planes_reserva WHERE restaurante_id = $1 OR restaurante_id IS NULL AND activo = true",
                restaurante_id
            )
        else:
            rows = await conn.fetch("SELECT * FROM planes_reserva WHERE activo = true")
        return [dict(r) for r in rows]

# -----------------------------------------------------------------------------
# ENDPOINTS: CRUD Y CALENDARIO DE RESERVAS (ADMINISTRADOR Y JEFE)
# -----------------------------------------------------------------------------
@app.get("/api/reservas", tags=["Reservas"])
async def listar_reservas(
    restaurante_id: str = Query(..., description="ID del restaurante a consultar"),
    fecha: Optional[date] = Query(None, description="Filtrar por fecha específica"),
    mes: Optional[int] = Query(None, description="Mes para visualización de calendario"),
    anio: Optional[int] = Query(None, description="Año para visualización de calendario")
):
    """
    Lista las reservas con los datos del plan y cliente.
    Optimizado para la vista de lista y de calendario del Administrador.
    """
    if not db_pool:
        raise HTTPException(status_code=503, detail="Servicio de base de datos no disponible")
    
    async with db_pool.acquire() as conn:
        if fecha:
            rows = await conn.fetch("""
                SELECT * FROM vista_reservas_calendario
                WHERE restaurante_id = $1 AND fecha = $2
                ORDER BY hora ASC
            """, restaurante_id, fecha)
        elif mes and anio:
            rows = await conn.fetch("""
                SELECT * FROM vista_reservas_calendario
                WHERE restaurante_id = $1 
                  AND EXTRACT(MONTH FROM fecha) = $2
                  AND EXTRACT(YEAR FROM fecha) = $3
                ORDER BY fecha ASC, hora ASC
            """, restaurante_id, mes, anio)
        else:
            rows = await conn.fetch("""
                SELECT * FROM vista_reservas_calendario
                WHERE restaurante_id = $1
                ORDER BY fecha DESC, hora ASC
                LIMIT 100
            """, restaurante_id)

        return [dict(r) for r in rows]

@app.get("/api/reservas/resumen-mes", tags=["Calendario"])
async def resumen_mes_calendario(
    restaurante_id: str,
    mes: int = Query(..., ge=1, le=12),
    anio: int = Query(...)
):
    """Devuelve el total de reservas agrupadas por día para mostrar badges en el calendario mensual."""
    if not db_pool:
        raise HTTPException(status_code=503, detail="Servicio de base de datos no disponible")
    async with db_pool.acquire() as conn:
        query = """
            SELECT 
                fecha,
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE estado = 'CONFIRMADA') AS confirmadas,
                COUNT(*) FILTER (WHERE estado = 'PENDIENTE') AS pendientes
            FROM reservas
            WHERE restaurante_id = $1
              AND EXTRACT(MONTH FROM fecha) = $2
              AND EXTRACT(YEAR FROM fecha) = $3
            GROUP BY fecha
            ORDER BY fecha ASC
        """
        rows = await conn.fetch(query, restaurante_id, mes, anio)
        return [dict(r) for r in rows]

@app.post("/api/reservas", status_code=status.HTTP_201_CREATED, tags=["Reservas (Administrador)"])
async def crear_reserva(reserva: ReservaCreate):
    """
    Permite al Administrador registrar una nueva reserva solicitada por un cliente.
    Guarda todos los campos: hora, fecha, nombre, contacto, selector de plan, ocasión,
    descripción/notas y postre incluido.
    """
    if not db_pool:
        raise HTTPException(status_code=503, detail="Servicio de base de datos no disponible")
    
    async with db_pool.acquire() as conn:
        query = """
            INSERT INTO reservas (
                restaurante_id, plan_id, plan, creado_por_usuario_id, ultimo_editor_usuario_id,
                fecha, hora, numero_personas, nombre_cliente, telefono_contacto, email_contacto,
                ocasion, descripcion_notas, postre_incluido, estado
            )
            VALUES ($1, $2, $3, $4, $4, $5, $6::TIME, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *
        """
        row = await conn.fetchrow(
            query,
            reserva.restaurante_id,
            reserva.plan_id,
            reserva.plan,
            reserva.creado_por_usuario_id,
            reserva.fecha,
            reserva.hora,
            reserva.numero_personas,
            reserva.nombre_cliente,
            reserva.telefono_contacto,
            reserva.email_contacto,
            reserva.ocasion,
            reserva.descripcion_notas,
            reserva.postre_incluido,
            reserva.estado
        )
        return dict(row)

@app.put("/api/reservas/{reserva_id}", tags=["Reservas (Administrador - Edición)"])
async def editar_reserva(reserva_id: str, reserva: ReservaUpdate):
    """
    Permite al Administrador EDITAR una reserva creada previamente.
    Actualiza fecha, hora, contacto, plan, postre incluido, ocasión, notas y estado.
    """
    if not db_pool:
        raise HTTPException(status_code=503, detail="Servicio de base de datos no disponible")
    
    async with db_pool.acquire() as conn:
        query = """
            UPDATE reservas
            SET 
                plan_id = COALESCE($2, plan_id),
                plan = COALESCE($3, plan),
                fecha = COALESCE($4, fecha),
                hora = CASE WHEN $5::VARCHAR IS NOT NULL THEN $5::TIME ELSE hora END,
                numero_personas = COALESCE($6, numero_personas),
                nombre_cliente = COALESCE($7, nombre_cliente),
                telefono_contacto = COALESCE($8, telefono_contacto),
                email_contacto = COALESCE($9, email_contacto),
                ocasion = COALESCE($10, ocasion),
                descripcion_notas = COALESCE($11, descripcion_notas),
                postre_incluido = COALESCE($12, postre_incluido),
                estado = COALESCE($13, estado),
                ultimo_editor_usuario_id = COALESCE($14, ultimo_editor_usuario_id)
            WHERE id = $1
            RETURNING *
        """
        row = await conn.fetchrow(
            query,
            reserva_id,
            reserva.plan_id,
            reserva.plan,
            reserva.fecha,
            reserva.hora,
            reserva.numero_personas,
            reserva.nombre_cliente,
            reserva.telefono_contacto,
            reserva.email_contacto,
            reserva.ocasion,
            reserva.descripcion_notas,
            reserva.postre_incluido,
            reserva.estado,
            reserva.ultimo_editor_usuario_id
        )
        if not row:
            raise HTTPException(status_code=404, detail="Reserva no encontrada")
        return dict(row)

@app.delete("/api/reservas/{reserva_id}", tags=["Reservas (Administrador)"])
async def cancelar_reserva(reserva_id: str):
    """Marca la reserva como CANCELADA."""
    if not db_pool:
        raise HTTPException(status_code=503, detail="Servicio de base de datos no disponible")
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow(
            "UPDATE reservas SET estado = 'CANCELADA' WHERE id = $1 RETURNING *",
            reserva_id
        )
        if not row:
            raise HTTPException(status_code=404, detail="Reserva no encontrada")
        return {"mensaje": "Reserva cancelada exitosamente", "reserva": dict(row)}

# -----------------------------------------------------------------------------
# NUEVOS ENDPOINTS: NOVEDADES, BRIEFINGS, RECUPERAR CONTRASEÑA
# -----------------------------------------------------------------------------

@app.post("/api/recuperar-password", tags=["Autenticación"])
async def recuperar_password(req: RecuperarPasswordRequest):
    if not db_pool:
        raise HTTPException(status_code=503, detail="Servicio de base de datos no disponible")
    
    # En un sistema real, aquí se generaría un token y se enviaría un correo.
    # Por ahora, solo retornamos éxito simulando el envío.
    return {"mensaje": "Si el correo está registrado, se han enviado las instrucciones de recuperación."}


@app.get("/api/novedades", tags=["Novedades"])
async def listar_novedades(restaurante_id: str = Query(..., description="ID del restaurante")):
    if not db_pool:
        raise HTTPException(status_code=503, detail="Servicio de base de datos no disponible")
    async with db_pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM novedades WHERE restaurante_id = $1 ORDER BY created_at DESC", restaurante_id)
        return [dict(r) for r in rows]

@app.post("/api/novedades", status_code=status.HTTP_201_CREATED, tags=["Novedades"])
async def crear_novedad(novedad: NovedadCreate):
    if not db_pool:
        raise HTTPException(status_code=503, detail="Servicio de base de datos no disponible")
    
    async with db_pool.acquire() as conn:
        query = """
            INSERT INTO novedades (
                restaurante_id, nombre_realiza, nombre_dirigida, fecha, asunto, 
                descripcion, imagen_nombre, imagen_datos, prioridad, tipo
            )
            VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE), $5, $6, $7, $8, $9, $10)
            RETURNING *
        """
        row = await conn.fetchrow(
            query,
            novedad.restaurante_id,
            novedad.nombre_realiza,
            novedad.nombre_dirigida,
            novedad.fecha,
            novedad.asunto,
            novedad.descripcion,
            novedad.imagen_nombre,
            novedad.imagen_datos,
            novedad.prioridad,
            novedad.tipo
        )
        return dict(row)

@app.get("/api/briefings", tags=["Briefings"])
async def listar_briefings(restaurante_id: str = Query(..., description="ID del restaurante")):
    if not db_pool:
        raise HTTPException(status_code=503, detail="Servicio de base de datos no disponible")
    async with db_pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM briefings WHERE restaurante_id = $1 ORDER BY created_at DESC", restaurante_id)
        return [dict(r) for r in rows]

@app.post("/api/briefings", status_code=status.HTTP_201_CREATED, tags=["Briefings"])
async def crear_briefing(briefing: BriefingCreate):
    if not db_pool:
        raise HTTPException(status_code=503, detail="Servicio de base de datos no disponible")
    
    async with db_pool.acquire() as conn:
        query = """
            INSERT INTO briefings (
                restaurante_id, fecha, no_hay, por_acabarse, impulsar, organizacion_servicio
            )
            VALUES ($1, COALESCE($2, CURRENT_DATE), $3, $4, $5, $6)
            RETURNING *
        """
        row = await conn.fetchrow(
            query,
            briefing.restaurante_id,
            briefing.fecha,
            briefing.no_hay,
            briefing.por_acabarse,
            briefing.impulsar,
            briefing.organizacion_servicio
        )
        return dict(row)
