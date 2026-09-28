// =============================================================================
// APLICACIÓN VUE.JS 3 - SISTEMA DE RESERVAS MULTIRESTAURANTE
// =============================================================================

const { createApp, ref, computed, onMounted, watch } = Vue;

createApp({
  setup() {
    // -------------------------------------------------------------------------
    // ESTADO: AUTENTICACIÓN
    // -------------------------------------------------------------------------
    const isLoggedIn  = ref(false);
    const loginForm   = ref({ email: '', password: '', error: '' });
    const loginLoading = ref(false);

    const showRecoverPassword = ref(false);
    const recoverForm = ref({ email: '', message: '', error: '' });

    // -------------------------------------------------------------------------
    // ESTADO GENERAL
    // -------------------------------------------------------------------------
    const activeTab    = ref('calendario'); // 'calendario', 'reservas_lista', 'ajustes_jefe'
    const toastMessage = ref('');
    const toastVisible = ref(false);

    // Listas principales
    const restaurantes = ref([]);
    const planes       = ref([]);
    const reservas     = ref([]);
    const usuarios     = ref([]);
    const novedades    = ref([]);
    const briefings    = ref([]);

    // Sesión actual
    const currentUser          = ref(null);
    const selectedRestaurantId = ref('');

    // Calendario
    const currentMonthDate = ref(new Date());
    const selectedDateStr  = ref(formatDateToIso(new Date()));

    // Modales de reservas
    const showCreateModal = ref(false);
    const showEditModal   = ref(false);

    const formReserva = ref({
      id: '',
      restaurante_id: '',
      fecha: '',
      hora: '14:00',
      numero_personas: 2,
      nombre_cliente: '',
      telefono_contacto: '',
      email_contacto: '',
      plan_id: '',
      plan: 'No aplica',
      ocasion: 'OTRO',
      descripcion_notas: '',
      postre_incluido: false,
      estado: 'CONFIRMADA'
    });

    const planesSelector = [
      {id:'30',label:'Plan 30'},
      {id:'50',label:'Plan 50'},
      {id:'60',label:'Plan 60'},
      {id:'70',label:'Plan 70'},
      {id:'80',label:'Plan 80'},
      {id:'no_aplica',label:'No aplica'}
    ];

    // Formulario de edición de restaurante (Jefe)
    const editRestaurantForm = ref({
      id: '',
      nombre: '',
      direccion: '',
      telefono: '',
      email: '',
      hora_apertura: '',
      hora_cierre: '',
      capacidad_maxima: 60,
      activo: true
    });

    // -------------------------------------------------------------------------
    // ESTADO: GESTIÓN DE CUENTAS (JEFE)
    // -------------------------------------------------------------------------
    const showAddUserForm = ref(false);
    const newUserForm     = ref({
      nombre_completo: '',
      email: '',
      password: '',
      restaurante_id: '',
      error: ''
    });

    // -------------------------------------------------------------------------
    // ESTADO: NOVEDADES Y BRIEFINGS
    // -------------------------------------------------------------------------
    const filtroNovedad = ref('todas');
    const busquedaNovedad = ref('');
    const showNovedadForm = ref(false);
    const showNovedadDetalle = ref(false);
    const novedadDetalle = ref(null);
    const formNovedad = ref({ nombre_realiza:'', nombre_dirigida:'', fecha:'', asunto:'', descripcion:'', imagen:null, imagen_preview:'', prioridad:'Media', tipo:'Novedad del Personal' });

    const showBriefingForm = ref(false);
    const showBriefingDetalle = ref(false);
    const briefingDetalle = ref(null);
    const formBriefing = ref({ no_hay:'', por_acabarse:'', impulsar:'', organizacion_servicio:'' });

    // Logos y Cartas (PDF) por restaurante — almacenados en localStorage como data URIs
    const restaurantLogos  = ref(JSON.parse(localStorage.getItem('app_restaurant_logos') || '{}'));
    const restaurantCartas = ref(JSON.parse(localStorage.getItem('app_restaurant_cartas') || '{}'));

    // Opciones de Ocasión
    const ocasionesDisponibles = [
      { id: 'CUMPLEAÑOS',          label: 'Cumpleaños' },
      { id: 'ANIVERSARIO',         label: 'Aniversario' },
      { id: 'CITA_ROMANTICA',      label: 'Cita Romántica' },
      { id: 'REUNION_NEGOCIOS',    label: 'Grado' },
      { id: 'REUNION_FAMILIAR',    label: 'Solo Mesa' },
      { id: 'CELEBRACION_ESPECIAL',label: 'Pedida De Mano' }
    ];

    // -------------------------------------------------------------------------
    // COMPUTED PROPERTIES
    // -------------------------------------------------------------------------
    const isJefe = computed(() => currentUser.value && currentUser.value.rol === 'JEFE');

    const currentRestaurant = computed(() => {
      return restaurantes.value.find(r => r.id === selectedRestaurantId.value) || {
        nombre: 'Todos los Restaurantes',
        direccion: '',
        telefono: ''
      };
    });

    const availablePlans = computed(() => {
      return planes.value.filter(p => p.restaurante_id === selectedRestaurantId.value);
    });

    // Clase de tema CSS dinámica según restaurante seleccionado
    const restaurantThemeClass = computed(() => {
      const slug = currentRestaurant.value?.slug;
      if (!slug) return '';
      const map = {
        'innamorato-fusion': 'theme-innamorato',
        'cielo-rosa': 'theme-cielo-rosa',
        'casa-juarez': 'theme-casa-juarez',
        'la-birria': 'theme-primavera'
      };
      return map[slug] || '';
    });

    // Logo del restaurante actual para mostrar en el topbar
    const currentRestaurantLogo = computed(() => {
      return restaurantLogos.value[selectedRestaurantId.value] || '';
    });

    const currentRestaurantCarta = computed(() => {
      return restaurantCartas.value[selectedRestaurantId.value] || '';
    });

    const filteredNovedades = computed(() => {
      return novedades.value.filter(n => {
        if (selectedRestaurantId.value && n.restaurante_id !== selectedRestaurantId.value) return false;
        if (filtroNovedad.value !== 'todas' && n.tipo !== filtroNovedad.value) return false;
        if (busquedaNovedad.value && !n.asunto.toLowerCase().includes(busquedaNovedad.value.toLowerCase())) return false;
        return true;
      });
    });

    const filteredBriefings = computed(() => {
      let list = briefings.value;
      if (selectedRestaurantId.value) {
        list = list.filter(b => b.restaurante_id === selectedRestaurantId.value);
      }
      return list.sort((a,b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime()).reverse();
    });

    const filteredReservas = computed(() => {
      if (isJefe.value && !selectedRestaurantId.value) return reservas.value;
      return reservas.value.filter(r => r.restaurante_id === selectedRestaurantId.value);
    });

    const dayReservations = computed(() => {
      return filteredReservas.value
        .filter(r => r.fecha === selectedDateStr.value)
        .sort((a, b) => a.hora.localeCompare(b.hora));
    });

    // Solo administradores (excluye al Jefe de la lista para gestión)
    const adminUsuarios = computed(() =>
      usuarios.value.filter(u => u.rol === 'ADMINISTRADOR')
    );

    // Métricas del día
    const metricTotalHoy = computed(() => {
      const todayStr = formatDateToIso(new Date());
      return filteredReservas.value.filter(r => r.fecha === todayStr).length;
    });

    const metricConfirmadasHoy = computed(() => {
      const todayStr = formatDateToIso(new Date());
      return filteredReservas.value.filter(r => r.fecha === todayStr && r.estado === 'CONFIRMADA').length;
    });

    const metricComensalesHoy = computed(() => {
      const todayStr = formatDateToIso(new Date());
      return filteredReservas.value
        .filter(r => r.fecha === todayStr && r.estado !== 'CANCELADA')
        .reduce((sum, r) => sum + Number(r.numero_personas || 0), 0);
    });

    // -------------------------------------------------------------------------
    // LÓGICA DE AUTENTICACIÓN
    // -------------------------------------------------------------------------
    function doLogin() {
      loginForm.value.error = '';
      if (!loginForm.value.email.trim() || !loginForm.value.password.trim()) {
        loginForm.value.error = 'Por favor ingresa tu correo y contraseña.';
        return;
      }

      loginLoading.value = true;
      setTimeout(() => {
        const user = DataService.login(loginForm.value.email.trim(), loginForm.value.password);
        loginLoading.value = false;

        if (!user) {
          loginForm.value.error = 'Correo o contraseña incorrectos. Intenta de nuevo.';
          return;
        }

        // Sesión iniciada
        currentUser.value = user;
        isLoggedIn.value  = true;
        loginForm.value   = { email: '', password: '', error: '' };

        // Inicializar datos
        restaurantes.value = DataService.getRestaurantes();
        planes.value       = DataService.getPlanes();
        reservas.value     = DataService.getReservas();
        usuarios.value     = DataService.getUsuarios();
        novedades.value    = DataService.getNovedades();
        briefings.value    = DataService.getBriefings();

        if (user.rol === 'ADMINISTRADOR') {
          selectedRestaurantId.value = user.restaurante_id;
          showToast(`✅ Bienvenido, ${user.nombre_completo}`);
        } else {
          // Jefe: ver primer restaurante por defecto
          selectedRestaurantId.value = restaurantes.value[0]?.id || '';
          showToast('👑 Bienvenido, Jefe. Tienes acceso a los 4 restaurantes.');
        }
      }, 400);
    }

    function doLogout() {
      currentUser.value  = null;
      isLoggedIn.value   = false;
      activeTab.value    = 'calendario';
      selectedRestaurantId.value = '';
      reservas.value     = [];
      restaurantes.value = [];
      planes.value       = [];
      usuarios.value     = [];
      novedades.value    = [];
      briefings.value    = [];
    }

    function doRecoverPassword() {
      recoverForm.value.error = '';
      recoverForm.value.message = '';
      if (!recoverForm.value.email.trim()) {
        recoverForm.value.error = 'Por favor ingresa tu correo.';
        return;
      }
      const found = DataService.recoverPassword(recoverForm.value.email.trim());
      if (found) {
        recoverForm.value.message = 'Se ha enviado un enlace de recuperación a tu correo.';
      } else {
        recoverForm.value.error = 'Correo no encontrado en el sistema.';
      }
    }

    function cancelRecover() {
      showRecoverPassword.value = false;
      recoverForm.value = { email: '', message: '', error: '' };
    }

    // -------------------------------------------------------------------------
    // LÓGICA DE CALENDARIO
    // -------------------------------------------------------------------------
    const monthYearTitle = computed(() => {
      const options = { month: 'long', year: 'numeric' };
      const str = currentMonthDate.value.toLocaleDateString('es-ES', options);
      return str.charAt(0).toUpperCase() + str.slice(1);
    });

    const calendarGridCells = computed(() => {
      const year  = currentMonthDate.value.getFullYear();
      const month = currentMonthDate.value.getMonth();

      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth  = new Date(year, month + 1, 0);

      let startDayOfWeek = firstDayOfMonth.getDay() - 1;
      if (startDayOfWeek === -1) startDayOfWeek = 6;

      const totalDays = lastDayOfMonth.getDate();
      const cells     = [];

      const prevMonthLastDay = new Date(year, month, 0).getDate();
      for (let i = startDayOfWeek - 1; i >= 0; i--) {
        const d = prevMonthLastDay - i;
        const prevMonthDate = new Date(year, month - 1, d);
        const isoStr = formatDateToIso(prevMonthDate);
        cells.push({ dayNumber: d, dateStr: isoStr, isOtherMonth: true, isToday: isToday(isoStr), isSelected: isoStr === selectedDateStr.value, reservations: getReservationsForDate(isoStr) });
      }

      for (let d = 1; d <= totalDays; d++) {
        const dateObj = new Date(year, month, d);
        const isoStr  = formatDateToIso(dateObj);
        cells.push({ dayNumber: d, dateStr: isoStr, isOtherMonth: false, isToday: isToday(isoStr), isSelected: isoStr === selectedDateStr.value, reservations: getReservationsForDate(isoStr) });
      }

      const remaining = 7 - (cells.length % 7);
      if (remaining < 7) {
        for (let d = 1; d <= remaining; d++) {
          const nextDateObj = new Date(year, month + 1, d);
          const isoStr = formatDateToIso(nextDateObj);
          cells.push({ dayNumber: d, dateStr: isoStr, isOtherMonth: true, isToday: isToday(isoStr), isSelected: isoStr === selectedDateStr.value, reservations: getReservationsForDate(isoStr) });
        }
      }
      return cells;
    });

    function getReservationsForDate(dateStr) {
      return filteredReservas.value.filter(r => r.fecha === dateStr);
    }
    function isToday(dateStr) { return dateStr === formatDateToIso(new Date()); }
    function prevMonth() { currentMonthDate.value = new Date(currentMonthDate.value.getFullYear(), currentMonthDate.value.getMonth() - 1, 1); }
    function nextMonth() { currentMonthDate.value = new Date(currentMonthDate.value.getFullYear(), currentMonthDate.value.getMonth() + 1, 1); }
    function goToToday() { currentMonthDate.value = new Date(); selectedDateStr.value = formatDateToIso(new Date()); }
    function selectDate(cell) { selectedDateStr.value = cell.dateStr; }

    // -------------------------------------------------------------------------
    // GESTIÓN DE RESTAURANTE (Jefe)
    // -------------------------------------------------------------------------
    function onBossRestaurantChange(event) {
      selectedRestaurantId.value = event.target.value;
    }

    function startEditRestaurant(rest) {
      editRestaurantForm.value = JSON.parse(JSON.stringify(rest));
    }

    function saveRestaurantChanges() {
      const idx = restaurantes.value.findIndex(r => r.id === editRestaurantForm.value.id);
      if (idx !== -1) {
        restaurantes.value[idx] = { ...editRestaurantForm.value };
        DataService.saveRestaurantes(restaurantes.value);
        showToast(`Restaurante "${editRestaurantForm.value.nombre}" actualizado correctamente.`);
        editRestaurantForm.value.id = '';
      }
    }

    // -------------------------------------------------------------------------
    // GESTIÓN DE CUENTAS DE USUARIO (Solo Jefe)
    // -------------------------------------------------------------------------
    function openAddUserForm() {
      newUserForm.value = { nombre_completo: '', email: '', password: '', restaurante_id: restaurantes.value[0]?.id || '', error: '' };
      showAddUserForm.value = true;
    }

    function cancelAddUser() {
      showAddUserForm.value = false;
      newUserForm.value.error = '';
    }

    function saveNewUser() {
      newUserForm.value.error = '';
      const { nombre_completo, email, password, restaurante_id } = newUserForm.value;

      if (!nombre_completo.trim() || !email.trim() || !password.trim() || !restaurante_id) {
        newUserForm.value.error = 'Completa todos los campos para crear la cuenta.';
        return;
      }

      // Verificar email duplicado
      const existing = usuarios.value.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        newUserForm.value.error = 'Ya existe una cuenta con ese correo electrónico.';
        return;
      }

      const nuevoAdmin = {
        id: 'u-' + Date.now(),
        nombre_completo: nombre_completo.trim(),
        email: email.trim(),
        password: password,
        rol: 'ADMINISTRADOR',
        restaurante_id: restaurante_id
      };

      usuarios.value = DataService.addUsuario(nuevoAdmin);
      showAddUserForm.value = false;
      showToast(`✅ Cuenta creada para "${nuevoAdmin.nombre_completo}" correctamente.`);
    }

    function deleteUser(userId) {
      const user = usuarios.value.find(u => u.id === userId);
      if (!user) return;
      if (!confirm(`¿Eliminar la cuenta de "${user.nombre_completo}"?`)) return;
      usuarios.value = DataService.deleteUsuario(userId);
      showToast(`Cuenta de "${user.nombre_completo}" eliminada.`);
    }

    // -------------------------------------------------------------------------
    // CRUD DE RESERVAS
    // -------------------------------------------------------------------------
    function openCreateModal(dateStr = null) {
      const targetDate  = dateStr || selectedDateStr.value || formatDateToIso(new Date());
      const defaultPlan = availablePlans.value[0]?.id || '';
      formReserva.value = {
        id: '', restaurante_id: selectedRestaurantId.value,
        fecha: targetDate, hora: '14:00', numero_personas: 2,
        nombre_cliente: '', telefono_contacto: '', email_contacto: '',
        plan_id: defaultPlan, ocasion: 'OTRO', descripcion_notas: '',
        postre_incluido: false, estado: 'CONFIRMADA'
      };
      checkPlanDessert(defaultPlan);
      showCreateModal.value = true;
    }

    function openEditModal(reserva) {
      formReserva.value = JSON.parse(JSON.stringify(reserva));
      showEditModal.value = true;
    }

    function onPlanChanged() { checkPlanDessert(formReserva.value.plan_id); }

    function checkPlanDessert(planId) {
      const plan = planes.value.find(p => p.id === planId);
      if (plan && plan.incluye_postre) formReserva.value.postre_incluido = true;
    }

    function saveNewReservation() {
      if (!formReserva.value.nombre_cliente.trim() || !formReserva.value.telefono_contacto.trim()) {
        alert('Por favor completa el nombre del cliente y el teléfono de contacto.');
        return;
      }
      const newRes = {
        ...formReserva.value,
        id: 'res-' + Date.now(),
        restaurante_id: selectedRestaurantId.value,
        creado_por: currentUser.value?.nombre_completo || 'Administrador',
        ultimo_editor: currentUser.value?.nombre_completo || 'Administrador',
        updated_at: new Date().toISOString()
      };
      reservas.value.push(newRes);
      DataService.saveReservas(reservas.value);
      showCreateModal.value = false;
      showToast(`✅ Reserva para "${newRes.nombre_cliente}" agregada al calendario.`);
    }

    function updateReservation() {
      if (!formReserva.value.nombre_cliente.trim() || !formReserva.value.telefono_contacto.trim()) {
        alert('Por favor completa el nombre del cliente y el teléfono de contacto.');
        return;
      }
      const idx = reservas.value.findIndex(r => r.id === formReserva.value.id);
      if (idx !== -1) {
        reservas.value[idx] = {
          ...formReserva.value,
          ultimo_editor: currentUser.value?.nombre_completo || 'Administrador',
          updated_at: new Date().toISOString()
        };
        DataService.saveReservas(reservas.value);
        showEditModal.value = false;
        showToast(` Reserva de "${formReserva.value.nombre_cliente}" actualizada.`);
      }
    }

    function cancelReservation(reserva) {
      if (confirm(`¿Cancelar la reserva de ${reserva.nombre_cliente}?`)) {
        const idx = reservas.value.findIndex(r => r.id === reserva.id);
        if (idx !== -1) {
          reservas.value[idx].estado        = 'CANCELADA';
          reservas.value[idx].ultimo_editor = currentUser.value?.nombre_completo || 'Administrador';
          reservas.value[idx].updated_at    = new Date().toISOString();
          DataService.saveReservas(reservas.value);
          showToast(`Reserva de ${reserva.nombre_cliente} marcada como CANCELADA.`);
        }
      }
    }

    // -------------------------------------------------------------------------
    // HELPERS & FORMATTERS
    // -------------------------------------------------------------------------
    function getRestaurantName(restId) {
      const r = restaurantes.value.find(item => item.id === restId);
      return r ? r.nombre : 'Restaurante';
    }

    function getPlanName(planId) {
      const p = planes.value.find(item => item.id === planId);
      return p ? p.nombre : 'Plan Estándar';
    }

    function getOccasionLabel(ocasionId) {
      const oc = ocasionesDisponibles.find(o => o.id === ocasionId);
      return oc ? oc.label : ocasionId;
    }

    function formatDisplayDate(dateIsoStr) {
      if (!dateIsoStr) return '';
      const [year, month, day] = dateIsoStr.split('-');
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }

    function showToast(msg) {
      toastMessage.value = msg;
      toastVisible.value = true;
      setTimeout(() => { toastVisible.value = false; }, 3500);
    }

    function formatTimeTo12h(timeStr) {
      if (!timeStr) return '';
      let [h, m] = timeStr.split(':');
      let ampm = 'AM';
      h = parseInt(h, 10);
      if (h >= 12) {
        ampm = 'PM';
        if (h > 12) h -= 12;
      }
      if (h === 0) h = 12;
      return `${h}:${m} ${ampm}`;
    }

    // -------------------------------------------------------------------------
    // TELÉFONO: SOLO NÚMEROS, MÁXIMO 10
    // -------------------------------------------------------------------------
    function filterPhoneInput() {
      formReserva.value.telefono_contacto = formReserva.value.telefono_contacto.replace(/\D/g, '').slice(0, 10);
    }

    // -------------------------------------------------------------------------
    // LOGOS DE RESTAURANTE
    // -------------------------------------------------------------------------
    function getRestaurantLogo(restId) {
      return restaurantLogos.value[restId] || '';
    }

    function onLogoUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        restaurantLogos.value[selectedRestaurantId.value] = e.target.result;
        localStorage.setItem('app_restaurant_logos', JSON.stringify(restaurantLogos.value));
        showToast('📷 Logo del restaurante actualizado.');
      };
      reader.readAsDataURL(file);
    }

    function onRestaurantLogoUpload(event, restId) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        restaurantLogos.value[restId] = e.target.result;
        localStorage.setItem('app_restaurant_logos', JSON.stringify(restaurantLogos.value));
        showToast('📷 Logo actualizado correctamente.');
      };
      reader.readAsDataURL(file);
    }

    function removeRestaurantLogo(restId) {
      delete restaurantLogos.value[restId];
      restaurantLogos.value = { ...restaurantLogos.value };
      localStorage.setItem('app_restaurant_logos', JSON.stringify(restaurantLogos.value));
      showToast('Logo eliminado.');
    }

    // -------------------------------------------------------------------------
    // CARTA PDF DE RESTAURANTE
    // -------------------------------------------------------------------------
    function getRestaurantCarta(restId) {
      return restaurantCartas.value[restId] || '';
    }

    function onCartaUpload(event, restId) {
      const file = event.target.files[0];
      if (!file) return;
      if (file.type !== 'application/pdf') {
        alert('Por favor selecciona un archivo PDF.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        restaurantCartas.value[restId] = e.target.result;
        localStorage.setItem('app_restaurant_cartas', JSON.stringify(restaurantCartas.value));
        showToast('📄 Carta/Menú PDF cargada correctamente.');
      };
      reader.readAsDataURL(file);
    }

    function removeRestaurantCarta(restId) {
      delete restaurantCartas.value[restId];
      restaurantCartas.value = { ...restaurantCartas.value };
      localStorage.setItem('app_restaurant_cartas', JSON.stringify(restaurantCartas.value));
      showToast('Carta PDF eliminada.');
    }

    // -------------------------------------------------------------------------
    // MÉTODOS DE NOVEDADES
    // -------------------------------------------------------------------------
    function openNovedadForm() {
      formNovedad.value = { nombre_realiza:'', nombre_dirigida:'', fecha: formatDateToIso(new Date()), asunto:'', descripcion:'', imagen:null, imagen_preview:'', prioridad:'Media', tipo:'Novedad del Personal' };
      showNovedadForm.value = true;
    }

    function saveNovedad() {
      if (!formNovedad.value.asunto.trim() || !formNovedad.value.descripcion.trim()) {
        showToast('Por favor completa los campos obligatorios');
        return;
      }
      const newNov = {
        ...formNovedad.value,
        id: 'nov-' + Date.now(),
        restaurante_id: selectedRestaurantId.value,
        fecha_creacion: new Date().toISOString()
      };
      novedades.value = DataService.addNovedad(newNov);
      showNovedadForm.value = false;
      showToast('✅ Novedad registrada correctamente');
    }

    function verNovedad(novedad) {
      novedadDetalle.value = novedad;
      showNovedadDetalle.value = true;
    }

    function closeNovedadDetalle() {
      showNovedadDetalle.value = false;
      novedadDetalle.value = null;
    }

    function onNovedadImageUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        alert('Solo JPG/PNG permitidos');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        formNovedad.value.imagen_preview = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    // -------------------------------------------------------------------------
    // MÉTODOS DE BRIEFINGS
    // -------------------------------------------------------------------------
    function openBriefingForm() {
      formBriefing.value = { no_hay:'', por_acabarse:'', impulsar:'', organizacion_servicio:'' };
      showBriefingForm.value = true;
    }

    function saveBriefing() {
      const newBrf = {
        ...formBriefing.value,
        id: 'brf-' + Date.now(),
        restaurante_id: selectedRestaurantId.value,
        fecha_creacion: new Date().toISOString()
      };
      briefings.value = DataService.addBriefing(newBrf);
      showBriefingForm.value = false;
      showToast('✅ Briefing guardado');
    }

    function verBriefing(briefing) {
      briefingDetalle.value = briefing;
      showBriefingDetalle.value = true;
    }

    function closeBriefingDetalle() {
      showBriefingDetalle.value = false;
      briefingDetalle.value = null;
    }

    // -------------------------------------------------------------------------
    // CICLO DE VIDA
    // -------------------------------------------------------------------------
    onMounted(() => {
      // La app comienza en la pantalla de login — no cargamos datos aún
    });

    return {
      // Auth
      isLoggedIn, loginForm, loginLoading, doLogin, doLogout,
      showRecoverPassword, recoverForm, doRecoverPassword, cancelRecover,
      // Estado general
      activeTab, toastMessage, toastVisible,
      restaurantes, planes, reservas, usuarios, adminUsuarios,
      novedades, briefings,
      currentUser, selectedRestaurantId,
      currentRestaurant, availablePlans, filteredReservas,
      dayReservations, selectedDateStr, currentMonthDate,
      monthYearTitle, calendarGridCells, isJefe,
      ocasionesDisponibles, planesSelector,
      metricTotalHoy, metricConfirmadasHoy, metricComensalesHoy,
      // Tema y logo
      restaurantThemeClass, currentRestaurantLogo, currentRestaurantCarta,
      // Modales reservas
      showCreateModal, showEditModal, formReserva,
      // Edición restaurante
      editRestaurantForm,
      // Gestión de usuarios
      showAddUserForm, newUserForm,
      // Novedades
      filtroNovedad, busquedaNovedad, showNovedadForm, showNovedadDetalle, novedadDetalle, formNovedad, filteredNovedades,
      openNovedadForm, saveNovedad, verNovedad, closeNovedadDetalle, onNovedadImageUpload,
      // Briefings
      showBriefingForm, showBriefingDetalle, briefingDetalle, formBriefing, filteredBriefings,
      openBriefingForm, saveBriefing, verBriefing, closeBriefingDetalle,
      // Métodos
      prevMonth, nextMonth, goToToday, selectDate,
      onBossRestaurantChange,
      openCreateModal, openEditModal, onPlanChanged,
      saveNewReservation, updateReservation, cancelReservation,
      startEditRestaurant, saveRestaurantChanges,
      openAddUserForm, cancelAddUser, saveNewUser, deleteUser,
      getRestaurantName, getPlanName, getOccasionLabel, formatDisplayDate, showToast, formatTimeTo12h,
      // Teléfono
      filterPhoneInput,
      // Logos y Cartas
      getRestaurantLogo, onLogoUpload, onRestaurantLogoUpload, removeRestaurantLogo,
      getRestaurantCarta, onCartaUpload, removeRestaurantCarta
    };
  }
}).mount('#app');

// Función de formateo de fecha a 'YYYY-MM-DD'
function formatDateToIso(d) {
  const year  = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day   = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
