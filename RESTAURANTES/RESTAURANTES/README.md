# Sistema de Gestión y Reservas Multirestaurante

Plataforma web centralizada desarrollada para la gestión de reservas de **4 restaurantes**, donde cada local opera de forma independiente y aislada bajo una única interfaz web moderna y responsiva.

---

## 🏗️ Arquitectura del Sistema

- **Frontend**: **Vue.js 3** con HTML5 y CSS3 personalizado.
  - Calendario interactivo mensual con cálculo dinámico de días y badges de reservas.
  - Panel diario con apertura de reservas por hora, nombre, contacto, plan, ocasión, notas y postre.
  - **Modal de Creación**: El administrador añade la reserva requerida por el cliente.
  - **Modal de Edición**: El administrador puede editar en cualquier momento cualquier reserva previamente creada.
  - Soporte de roles interactivo en tiempo real (**Jefe** y **Administradores de los 4 restaurantes**).
- **Base de Datos**: **PostgreSQL**
  - Modelo relacional optimizado sin facturación.
  - Tablas: `restaurantes`, `usuarios`, `planes_reserva`, `reservas` e `historial_ediciones_reservas`.
  - Vistas y disparadores (Triggers) de auditoría automática al crear o editar reservas.
- **Backend API**: **FastAPI (Python 3.11)** con `asyncpg` y endpoints REST.

---

## 👥 Roles del Sistema

### 1. Rol: JEFE (Superadministrador / Dueño)
- Acceso global a los 4 restaurantes.
- Ajusta y edita los datos de cada restaurante (nombre, dirección, teléfono, horario de apertura y cierre, capacidad de comensales, estado activo/inactivo).
- Supervisa los planes de reserva globales.
- Puede auditar y visualizar las reservas de todos los locales.

### 2. Rol: ADMINISTRADOR (Encargado de cada Restaurante)
- Es el **operador principal cotidiano** del sistema.
- Cada administrador tiene asignado su restaurante exclusivo.
- **Añadir Reservas**: Registra las reservas solicitadas por los clientes con todos los datos:
  - 📅 **Fecha**
  - ⏰ **Hora**
  - 👤 **Nombre del cliente**
  - 📞 **Contacto (teléfono y email)**
  - 👥 **Número de comensales**
  - 🌟 **Selector de Plan de Reserva** (específico de su restaurante)
  - 🎉 **Ocasión** (Cumpleaños, Aniversario, Cita Romántica, Negocios, Reunión Familiar, etc.)
  - 📝 **Descripción y peticiones especiales** (mesa preferida, alergias, requerimientos)
  - 🍰 **Postre Incluido (Sí / No)**: Conmutador claro y visible.
- **Editar Reservas**: Abre el formulario de edición de la reserva para cambiar la fecha, hora, personas, notas o postre.
- **Calendario Interactivo**: Visualiza por día, semana y mes la ocupación y reservas programadas.

---

## 📁 Estructura del Repositorio

```text
RESTAUTANTES/
├── database/
│   ├── schema.sql              # Estructura DDL en PostgreSQL (tablas, tipos, triggers, vistas)
│   ├── seeds.sql               # Datos iniciales (4 restaurantes, 5 usuarios, planes y reservas)
│   ├── queries_ejemplo.sql     # Consultas SQL para el calendario y CRUD
│   └── README.md               # Guía de instalación y ejecución en PostgreSQL
├── frontend/
│   ├── index.html              # Aplicación Vue.js 3 ejecutable de inmediato
│   ├── css/
│   │   └── styles.css          # Estilos CSS3 modernos y adaptables
│   └── js/
│       ├── api.js              # Capa de datos y persistencia (LocalStorage + API REST)
│       └── app.js              # Lógica reactiva de Vue.js (Calendario, modales, roles)
├── backend/
│   ├── app/
│   │   └── main.py             # API REST en FastAPI con todos los endpoints y validaciones
│   └── requirements.txt        # Dependencias de Python
└── README.md                   # Este documento
```

---

## 🚀 Cómo Probar el Proyecto de Inmediato

### 1. Ver y probar la interfaz en Vue.js (Inmediato)
No requiere compilar con npm ni dependencias complejas. Simplemente:
1. Haz doble clic en [`frontend/index.html`](file:///c:/Users/Dyane/Downloads/RESTAUTANTES/frontend/index.html) para abrirlo en tu navegador favorito (Chrome, Edge, Opera GX).
2. O ejecuta en la consola un servidor local liviano con Python:
   ```powershell
   python -m http.server 8000 --directory frontend
   ```
   Y abre en tu navegador: `http://localhost:8000`

### 2. Cargar la Base de Datos en PostgreSQL
1. Abre pgAdmin 4, DBeaver o la consola de `psql`.
2. Crea la base de datos `reservas_restaurantes`.
3. Ejecuta en orden:
   - [`database/schema.sql`](file:///c:/Users/Dyane/Downloads/RESTAUTANTES/database/schema.sql)
   - [`database/seeds.sql`](file:///c:/Users/Dyane/Downloads/RESTAUTANTES/database/seeds.sql)

### 3. Ejecutar la API del Backend (Opcional)
```powershell
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload --port 8000
```
La documentación interactiva Swagger estará disponible en `http://localhost:8000/docs`.

---

## 🍽️ Los 4 Restaurantes Configurados

1. **La Terraza Gourmet**: Especialidad mediterránea y vistas panorámicas.
2. **Bistro Mar & Fuego**: Pescados y mariscos a la brasa.
3. **Trattoria Bella Vista**: Pastas tradicionales italianas y horno de leña.
4. **Asador Don Fernando**: Carnes y cortes finos a la parrilla.
