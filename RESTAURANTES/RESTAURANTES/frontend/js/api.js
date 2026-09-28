// =============================================================================
// CAPA DE DATOS Y PERSISTENCIA (SOPORTE LOCALSTORAGE + API REST POSTGRES)
// =============================================================================

const STORAGE_KEY_RESTAURANTES = 'app_reservas_restaurantes_v2';
const STORAGE_KEY_RESERVAS     = 'app_reservas_datos_v2';
const STORAGE_KEY_PLANES       = 'app_reservas_planes_v2';
const STORAGE_KEY_USUARIOS     = 'app_reservas_usuarios_v2';
const STORAGE_KEY_NOVEDADES    = 'app_novedades_v1';
const STORAGE_KEY_BRIEFINGS    = 'app_briefings_v1';

// 4 Restaurantes Iniciales (nombres oficiales)
const INITIAL_RESTAURANTS = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    nombre: 'INNAMORATO FUSION',
    slug: 'innamorato-fusion',
    descripcion: 'Cocina fusión de autor con ambiente romántico y sabores únicos del mundo.',
    direccion: 'Av. Primavera 1020, Miraflores',
    telefono: '+51 987 654 321',
    email: 'contacto@innamoratofusion.com',
    hora_apertura: '12:30',
    hora_cierre: '23:30',
    capacidad_maxima: 70,
    activo: true
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    nombre: 'CIELO ROSA',
    slug: 'cielo-rosa',
    descripcion: 'Experiencia gastronómica sofisticada con vista panorámica y cocina de temporada.',
    direccion: 'Calle Malecón de la Reserva 450',
    telefono: '+51 987 654 322',
    email: 'reservas@cielorosa.com',
    hora_apertura: '12:00',
    hora_cierre: '23:00',
    capacidad_maxima: 50,
    activo: true
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    nombre: 'CASA JUAREZ',
    slug: 'casa-juarez',
    descripcion: 'Tradición y sabor en cada platillo, con recetas auténticas y ambiente familiar.',
    direccion: 'Jr. Los Conquistadores 880, San Isidro',
    telefono: '+51 987 654 323',
    email: 'info@casajuarez.com',
    hora_apertura: '13:00',
    hora_cierre: '23:00',
    capacidad_maxima: 65,
    activo: true
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    nombre: 'LA BIRRIA',
    slug: 'la-birria',
    descripcion: 'Auténtica birria con sabor tradicional, ideal para compartir en familia.',
    direccion: 'Av. Javier Prado Este 2140',
    telefono: '+51 987 654 324',
    email: 'administracion@labirria.com',
    hora_apertura: '12:00',
    hora_cierre: '23:45',
    capacidad_maxima: 80,
    activo: true
  }
];

// Usuarios Iniciales del Sistema (con contraseñas)
const INITIAL_USERS = [
  {
    id: 'u-jefe',
    nombre_completo: 'Jefe General',
    email: 'jefe_restaurantes@gmail.com',
    password: 'Jefe123',
    rol: 'JEFE',
    restaurante_id: null
  },
  {
    id: 'u-admin1',
    nombre_completo: 'Administrador Innamorato',
    email: 'admin.innamorato@reservas.com',
    password: 'admin123',
    rol: 'ADMINISTRADOR',
    restaurante_id: '11111111-1111-1111-1111-111111111111'
  },
  {
    id: 'u-admin2',
    nombre_completo: 'Administrador Cielo Rosa',
    email: 'admin.cielorosa@reservas.com',
    password: 'admin123',
    rol: 'ADMINISTRADOR',
    restaurante_id: '22222222-2222-2222-2222-222222222222'
  },
  {
    id: 'u-admin3',
    nombre_completo: 'Administrador Casa Juarez',
    email: 'admin.casajuarez@reservas.com',
    password: 'admin123',
    rol: 'ADMINISTRADOR',
    restaurante_id: '33333333-3333-3333-3333-333333333333'
  },
  {
    id: 'u-admin4',
    nombre_completo: 'Administrador La Birria',
    email: 'admin.labirria@reservas.com',
    password: 'admin123',
    rol: 'ADMINISTRADOR',
    restaurante_id: '44444444-4444-4444-4444-444444444444'
  }
];

// Planes de Reserva actualizados con los nuevos nombres
const INITIAL_PLANS = [
  { id: 'plan-1', restaurante_id: '11111111-1111-1111-1111-111111111111', nombre: 'Plan Romántico Fusión', incluye_postre: true },
  { id: 'plan-2', restaurante_id: '11111111-1111-1111-1111-111111111111', nombre: 'Plan Degustación Innamorato', incluye_postre: true },
  { id: 'plan-3', restaurante_id: '11111111-1111-1111-1111-111111111111', nombre: 'Reserva Estándar', incluye_postre: false },

  { id: 'plan-4', restaurante_id: '22222222-2222-2222-2222-222222222222', nombre: 'Plan Vista Panorámica', incluye_postre: true },
  { id: 'plan-5', restaurante_id: '22222222-2222-2222-2222-222222222222', nombre: 'Reserva Estándar Cielo Rosa', incluye_postre: false },

  { id: 'plan-6', restaurante_id: '33333333-3333-3333-3333-333333333333', nombre: 'Plan Familiar Casa Juarez', incluye_postre: true },
  { id: 'plan-7', restaurante_id: '33333333-3333-3333-3333-333333333333', nombre: 'Reserva Estándar Casa Juarez', incluye_postre: false },

  { id: 'plan-8', restaurante_id: '44444444-4444-4444-4444-444444444444', nombre: 'Plan La Birria Premium', incluye_postre: true },
  { id: 'plan-9', restaurante_id: '44444444-4444-4444-4444-444444444444', nombre: 'Reserva Estándar La Birria', incluye_postre: false }
];

// Función para obtener fecha YYYY-MM-DD relativa a hoy
function getDateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day   = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

const INITIAL_RESERVATIONS = [
  {
    id: 'res-101',
    restaurante_id: '11111111-1111-1111-1111-111111111111',
    fecha: getDateOffset(0),
    hora: '13:30',
    nombre_cliente: 'Alejandro Morales',
    telefono_contacto: '+51 981 112 233',
    email_contacto: 'amorales@gmail.com',
    numero_personas: 2,
    plan_id: 'plan-1',
    ocasion: 'CITA_ROMANTICA',
    descripcion_notas: 'Mesa con flores y vista al ventanal. Alergia a nueces.',
    postre_incluido: true,
    estado: 'CONFIRMADA',
    creado_por: 'Administrador Innamorato',
    ultimo_editor: 'Administrador Innamorato',
    updated_at: new Date().toISOString()
  },
  {
    id: 'res-102',
    restaurante_id: '11111111-1111-1111-1111-111111111111',
    fecha: getDateOffset(0),
    hora: '20:00',
    nombre_cliente: 'Beatriz Salazar',
    telefono_contacto: '+51 982 223 344',
    email_contacto: 'bsalazar@empresa.pe',
    numero_personas: 6,
    plan_id: 'plan-3',
    ocasion: 'REUNION_NEGOCIOS',
    descripcion_notas: 'Zona tranquila alejada del paso para presentación de negocios.',
    postre_incluido: false,
    estado: 'CONFIRMADA',
    creado_por: 'Administrador Innamorato',
    ultimo_editor: 'Administrador Innamorato',
    updated_at: new Date().toISOString()
  },
  {
    id: 'res-103',
    restaurante_id: '11111111-1111-1111-1111-111111111111',
    fecha: getDateOffset(1),
    hora: '21:00',
    nombre_cliente: 'Claudia Domínguez',
    telefono_contacto: '+51 983 334 455',
    email_contacto: 'cdominguez@outlook.com',
    numero_personas: 4,
    plan_id: 'plan-2',
    ocasion: 'CUMPLEAÑOS',
    descripcion_notas: 'Traerán regalo sorpresa y requieren velas.',
    postre_incluido: true,
    estado: 'PENDIENTE',
    creado_por: 'Administrador Innamorato',
    ultimo_editor: 'Administrador Innamorato',
    updated_at: new Date().toISOString()
  },
  {
    id: 'res-201',
    restaurante_id: '22222222-2222-2222-2222-222222222222',
    fecha: getDateOffset(0),
    hora: '14:00',
    nombre_cliente: 'David Enríquez',
    telefono_contacto: '+51 984 445 566',
    email_contacto: 'denriquez@yahoo.com',
    numero_personas: 5,
    plan_id: 'plan-4',
    ocasion: 'REUNION_FAMILIAR',
    descripcion_notas: 'Familia con niño pequeño. Silla para bebé requerida.',
    postre_incluido: true,
    estado: 'CONFIRMADA',
    creado_por: 'Administrador Cielo Rosa',
    ultimo_editor: 'Administrador Cielo Rosa',
    updated_at: new Date().toISOString()
  },
  {
    id: 'res-301',
    restaurante_id: '33333333-3333-3333-3333-333333333333',
    fecha: getDateOffset(0),
    hora: '20:30',
    nombre_cliente: 'Gabriel Fontana',
    telefono_contacto: '+51 986 667 788',
    email_contacto: 'gfontana@gmail.com',
    numero_personas: 2,
    plan_id: 'plan-6',
    ocasion: 'CITA_ROMANTICA',
    descripcion_notas: 'Celebración de 5 años juntos. Mesa íntima.',
    postre_incluido: true,
    estado: 'CONFIRMADA',
    creado_por: 'Administrador Casa Juarez',
    ultimo_editor: 'Administrador Casa Juarez',
    updated_at: new Date().toISOString()
  },
  {
    id: 'res-401',
    restaurante_id: '44444444-4444-4444-4444-444444444444',
    fecha: getDateOffset(0),
    hora: '15:00',
    nombre_cliente: 'Héctor Villanueva',
    telefono_contacto: '+51 987 778 899',
    email_contacto: 'hvillanueva@outlook.com',
    numero_personas: 8,
    plan_id: 'plan-8',
    ocasion: 'CUMPLEAÑOS',
    descripcion_notas: 'Cumpleaños familiar, mesa amplia preferiblemente exterior.',
    postre_incluido: true,
    estado: 'CONFIRMADA',
    creado_por: 'Administrador La Birria',
    ultimo_editor: 'Administrador La Birria',
    updated_at: new Date().toISOString()
  }
];

// =============================================================================
// SERVICIO DE ALMACENAMIENTO Y API
// =============================================================================
window.DataService = {

  // --- RESTAURANTES ---
  getRestaurantes() {
    const raw = localStorage.getItem(STORAGE_KEY_RESTAURANTES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_RESTAURANTES, JSON.stringify(INITIAL_RESTAURANTS));
      return INITIAL_RESTAURANTS;
    }
    return JSON.parse(raw);
  },
  saveRestaurantes(restaurantes) {
    localStorage.setItem(STORAGE_KEY_RESTAURANTES, JSON.stringify(restaurantes));
  },

  // --- PLANES ---
  getPlanes() {
    const raw = localStorage.getItem(STORAGE_KEY_PLANES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PLANES, JSON.stringify(INITIAL_PLANS));
      return INITIAL_PLANS;
    }
    return JSON.parse(raw);
  },

  // --- RESERVAS ---
  getReservas() {
    const raw = localStorage.getItem(STORAGE_KEY_RESERVAS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_RESERVAS, JSON.stringify(INITIAL_RESERVATIONS));
      return INITIAL_RESERVATIONS;
    }
    return JSON.parse(raw);
  },
  saveReservas(reservas) {
    localStorage.setItem(STORAGE_KEY_RESERVAS, JSON.stringify(reservas));
  },

  // --- USUARIOS (con persistencia real en localStorage) ---
  getUsuarios() {
    const raw = localStorage.getItem(STORAGE_KEY_USUARIOS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(raw);
  },
  saveUsuarios(usuarios) {
    localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(usuarios));
  },
  addUsuario(nuevoUsuario) {
    const usuarios = this.getUsuarios();
    usuarios.push(nuevoUsuario);
    this.saveUsuarios(usuarios);
    return usuarios;
  },
  deleteUsuario(userId) {
    const usuarios = this.getUsuarios().filter(u => u.id !== userId);
    this.saveUsuarios(usuarios);
    return usuarios;
  },

  // --- AUTENTICACIÓN ---
  login(email, password) {
    const usuarios = this.getUsuarios();
    const user = usuarios.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    return user || null;
  },

  // --- PASSWORD RECOVERY ---
  recoverPassword(email) {
    const usuarios = this.getUsuarios();
    const user = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());
    return !!user;
  },

  // --- NOVEDADES ---
  getNovedades() {
    const raw = localStorage.getItem(STORAGE_KEY_NOVEDADES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_NOVEDADES, JSON.stringify([]));
      return [];
    }
    return JSON.parse(raw);
  },
  saveNovedades(novedades) {
    localStorage.setItem(STORAGE_KEY_NOVEDADES, JSON.stringify(novedades));
  },
  addNovedad(novedad) {
    const novedades = this.getNovedades();
    novedades.push(novedad);
    this.saveNovedades(novedades);
    return novedades;
  },

  // --- BRIEFINGS ---
  getBriefings() {
    const raw = localStorage.getItem(STORAGE_KEY_BRIEFINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_BRIEFINGS, JSON.stringify([]));
      return [];
    }
    return JSON.parse(raw);
  },
  saveBriefings(briefings) {
    localStorage.setItem(STORAGE_KEY_BRIEFINGS, JSON.stringify(briefings));
  },
  addBriefing(briefing) {
    const briefings = this.getBriefings();
    briefings.push(briefing);
    this.saveBriefings(briefings);
    return briefings;
  }
};
