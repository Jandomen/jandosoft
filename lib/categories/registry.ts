import { ModuleId } from "@/lib/modules/registry";

export type CategoryId =
  | "general"
  | "restaurant"
  | "school"
  | "barbershop"
  | "lawyer"
  | "clinic"
  | "store"
  | "gym"
  | "realestate"
  | "mechanic"
  | "veterinary"
  | "hotel"
  | "events"
  | "photographer"
  | "consultant"
  | "accountant"
  | "itservices"
  | "marketing"
  | "construction"
  | "transport"
  | "dentist";

export interface WidgetTab {
  href: string;
  labelKey: string;
}

export interface WidgetConfig {
  showHero: boolean;
  showProducts: boolean;
  showServices: boolean;
  showGallery: boolean;
  showTestimonials: boolean;
  tabs: WidgetTab[];
  heroTitleKey: string;
  heroDescKey: string;
}

export interface CategoryDefinition {
  id: CategoryId;
  name: string;
  description: string;
  icon: string;
  modules: ModuleId[];
  systemPrompt: string;
  widgetConfig: WidgetConfig;
}

export const CATEGORIES: Record<CategoryId, CategoryDefinition> = {
  general: {
    id: "general",
    name: "General",
    description: "Negocio general sin categoría específica",
    icon: "Building2",
    modules: [
      "dashboard", "products", "services", "appointments", "customers", "orders",
      "analytics", "invoices", "campaigns", "integrations",
      "automations", "ai", "knowledgebase", "agentconfig",
      "agentinstall", "smartforms", "team", "orgsettings",
    ],
    systemPrompt: `Eres un asistente IA para un negocio general. Puedes ayudar a gestionar productos, servicios, clientes, pedidos, citas y más.`,
    widgetConfig: {
      showHero: true, showProducts: true, showServices: true,
      showGallery: false, showTestimonials: false,
      tabs: [
        { href: "", labelKey: "nav.home" },
        { href: "/products", labelKey: "nav.products" },
        { href: "/services", labelKey: "nav.services" },
      ],
      heroTitleKey: "widget.hero_title",
      heroDescKey: "widget.hero_desc",
    },
  },
  restaurant: {
    id: "restaurant",
    name: "Restaurante",
    description: "Restaurantes, cafeterías, bares y comedores",
    icon: "UtensilsCrossed",
    modules: [
      "dashboard", "menu", "restaurant", "floor_plan", "restaurant_orders", "reservations",
      "customers", "appointments", "recipes", "inventory", "promotions", "loyalty",
      "restaurant_reviews", "waiter_calls", "analytics", "invoices", "gallery",
      "testimonials", "integrations", "automations",
      "ai", "knowledgebase", "agentconfig", "agentinstall",
      "smartforms", "team", "orgsettings",
    ],
    systemPrompt: `Eres un asistente IA especializado en restaurantes y gastronomía.
Gestionas menús, platillos, ingredientes, recetas, inventario de cocina, pedidos a domicilio, reservas de mesas y reseñas de clientes.
Ayudas a crear platos especiales, ajustar precios según temporada, y optimizar el menú basado en popularidad.
Puedes recomendar maridajes y sugerir sustituciones de ingredientes por alergias.`,
    widgetConfig: {
      showHero: true, showProducts: true, showServices: false,
      showGallery: true, showTestimonials: true,
      tabs: [
        { href: "", labelKey: "nav.home" },
        { href: "/products", labelKey: "nav.menu" },
        { href: "/reservar", labelKey: "nav.reserve" },
      ],
      heroTitleKey: "widget.restaurant_hero",
      heroDescKey: "widget.restaurant_desc",
    },
  },
  school: {
    id: "school",
    name: "Escuela",
    description: "Colegios, academias, institutos y centros educativos",
    icon: "GraduationCap",
    modules: [
      "dashboard", "courses", "classes", "students", "grades",
      "appointments", "customers", "analytics", "invoices",
      "campaigns", "integrations", "automations",
      "ai", "knowledgebase", "agentconfig", "agentinstall",
      "smartforms", "team", "orgsettings",
    ],
    systemPrompt: `Eres un asistente IA especializado en instituciones educativas.
Gestionas cursos, clases, horarios, estudiantes, calificaciones, asistencia y comunicaciones con padres.
Ayudas a inscribir estudiantes, generar reportes de notas, programar examenes, y enviar notificaciones a padres.
Puedes crear planes de estudio, asignar profesores a cursos, y gestionar el calendario academico.`,
    widgetConfig: {
      showHero: true, showProducts: true, showServices: true,
      showGallery: true, showTestimonials: true,
      tabs: [
        { href: "", labelKey: "nav.home" },
        { href: "/services", labelKey: "nav.courses" },
        { href: "/reservar", labelKey: "nav.contact" },
      ],
      heroTitleKey: "widget.school_hero",
      heroDescKey: "widget.school_desc",
    },
  },
  barbershop: {
    id: "barbershop",
    name: "Barbería",
    description: "Barberías, salones de belleza, spas y centros de estética",
    icon: "Scissors",
    modules: [
      "dashboard", "services", "appointments", "customers",
      "products", "gallery", "analytics", "invoices", "campaigns",
      "integrations", "automations",
      "ai", "knowledgebase", "agentconfig", "agentinstall",
      "smartforms", "team", "orgsettings",
      "barbers", "queue", "barber_history",
    ],
    systemPrompt: `Eres un asistente IA especializado en barberías y salones de belleza.
Gestionas servicios de corte, peinado, coloración, manicure y tratamientos.
Gestionas la cola de clientes walk-in, los barberos, sus horarios y especialidades.
Ayudas a agendar citas, recordar a clientes sus próximas visitas, gestionar el inventario de productos.
Puedes recomendar estilos según el tipo de cabello y mantener un historial de servicios por cliente y barbero.`,
    widgetConfig: {
      showHero: true, showProducts: false, showServices: true,
      showGallery: true, showTestimonials: true,
      tabs: [
        { href: "", labelKey: "nav.home" },
        { href: "/services", labelKey: "nav.services" },
        { href: "/reservar", labelKey: "nav.book_now" },
      ],
      heroTitleKey: "widget.barbershop_hero",
      heroDescKey: "widget.barbershop_desc",
    },
  },
  lawyer: {
    id: "lawyer",
    name: "Abogado",
    description: "Bufetes, abogados independientes y consultoría legal",
    icon: "Scale",
    modules: [
      "dashboard", "clients", "case_files", "hearings",
      "appointments", "documents", "invoices", "analytics",
      "campaigns", "integrations", "automations",
      "ai", "knowledgebase", "agentconfig", "agentinstall",
      "smartforms", "team", "orgsettings",
    ],
    systemPrompt: `Eres un asistente IA especializado en servicios legales.
Gestionas clientes, casos, expedientes, audiencias, plazos procesales y documentos legales.
Ayudas a redactar documentos legales basicos, calcular plazos, organizar reuniones con clientes.
Puedes hacer seguimiento de casos activos, recordar fechas de audiencias, y categorizar documentos por tipo de caso.
Mantienes la confidencialidad de toda la informacion de los clientes.`,
    widgetConfig: {
      showHero: true, showProducts: false, showServices: true,
      showGallery: false, showTestimonials: true,
      tabs: [
        { href: "", labelKey: "nav.home" },
        { href: "/services", labelKey: "nav.services" },
        { href: "/reservar", labelKey: "nav.contact" },
      ],
      heroTitleKey: "widget.lawyer_hero",
      heroDescKey: "widget.lawyer_desc",
    },
  },
  clinic: {
    id: "clinic",
    name: "Clínica",
    description: "Clínicas, consultorios, hospitales y centros de salud",
    icon: "Stethoscope",
    modules: [
      "dashboard", "appointments", "medical_records", "prescriptions",
      "doctors", "customers", "invoices", "analytics", "campaigns",
      "integrations", "automations",
      "ai", "knowledgebase", "agentconfig", "agentinstall",
      "smartforms", "team", "orgsettings",
    ],
    systemPrompt: `Eres un asistente IA especializado en servicios medicos y de salud.
Gestionas citas medicas, historiales clinicos, recetas, doctores, pacientes y facturacion.
Ayudas a agendar consultas, recordar citas a pacientes, gestionar expedientes medicos electronicos.
Puedes generar recetas, dar indicaciones pre-consulta, y gestionar el inventario de medicamentos.
Toda la informacion medica se maneja con estricta confidencialidad.`,
    widgetConfig: {
      showHero: true, showProducts: false, showServices: true,
      showGallery: false, showTestimonials: true,
      tabs: [
        { href: "", labelKey: "nav.home" },
        { href: "/services", labelKey: "nav.services" },
        { href: "/reservar", labelKey: "nav.book_appointment" },
      ],
      heroTitleKey: "widget.clinic_hero",
      heroDescKey: "widget.clinic_desc",
    },
  },
  store: {
    id: "store",
    name: "Empresa Online",
    description: "Empresas de e-commerce, ventas por catálogo y retail",
    icon: "ShoppingBag",
    modules: [
      "dashboard", "products", "appointments", "orders", "customers", "inventory",
      "analytics", "invoices", "campaigns", "gallery", "testimonials",
      "integrations", "automations",
      "ai", "knowledgebase", "agentconfig", "agentinstall",
      "smartforms", "team", "orgsettings",
    ],
    systemPrompt: `Eres un asistente IA especializado en empresas online y e-commerce.
Gestionas productos, inventario, pedidos, clientes, pagos y envios.
Ayudas a crear y categorizar productos, procesar devoluciones, y analizar tendencias de venta.
Puedes generar reportes de productos mas vendidos, recomendar precios competitivos, y automatizar respuestas a clientes.`,
    widgetConfig: {
      showHero: true, showProducts: true, showServices: false,
      showGallery: true, showTestimonials: true,
      tabs: [
        { href: "", labelKey: "nav.home" },
        { href: "/products", labelKey: "nav.products" },
        { href: "/contact", labelKey: "nav.contact" },
      ],
      heroTitleKey: "widget.store_hero",
      heroDescKey: "widget.store_desc",
    },
  },
  gym: {
    id: "gym",
    name: "Gimnasio",
    description: "Gimnasios, centros de fitness, entrenadores personales y crossfit",
    icon: "Dumbbell",
    modules: [
      "dashboard", "services", "appointments", "customers",
      "products", "analytics", "invoices", "campaigns",
      "integrations", "automations",
      "ai", "knowledgebase", "agentconfig", "agentinstall",
      "smartforms", "team", "orgsettings",
      "classes", "inventory", "gallery", "testimonials",
    ],
    systemPrompt: `Eres un asistente IA especializado en gimnasios y centros de fitness.
Gestionas membresias, planes de entrenamiento, clases grupales, entrenadores y clientes.
Ayudas a agendar sesiones con entrenadores, crear rutinas personalizadas, y hacer seguimiento del progreso de los clientes.
Puedes recomendar suplementos, gestionar el inventario de productos, y enviar recordatorios de pago de membresias.`,
    widgetConfig: {
      showHero: true, showProducts: true, showServices: true,
      showGallery: true, showTestimonials: true,
      tabs: [
        { href: "", labelKey: "nav.home" },
        { href: "/services", labelKey: "nav.services" },
        { href: "/reservar", labelKey: "nav.book_now" },
      ],
      heroTitleKey: "widget.hero_title",
      heroDescKey: "widget.hero_desc",
    },
  },
  realestate: {
    id: "realestate",
    name: "Inmobiliaria",
    description: "Agencias inmobiliarias, corredores de propiedades y bienes raíces",
    icon: "Building",
    modules: [
      "dashboard", "services", "appointments", "customers",
      "analytics", "invoices", "campaigns",
      "integrations", "automations",
      "ai", "knowledgebase", "agentconfig", "agentinstall",
      "smartforms", "team", "orgsettings",
      "gallery", "testimonials", "documents",
    ],
    systemPrompt: `Eres un asistente IA especializado en bienes raices e inmobiliarias.
Gestionas propiedades en venta y renta, clientes compradores y vendedores, citas para visitas y cierres de negocios.
Ayudas a publicar propiedades, calificar leads, programar visitas guiadas, y dar seguimiento a prospectos.
Puedes generar reportes de mercado, calcular hipotecas estimadas, y automatizar recordatorios de seguimiento.`,
    widgetConfig: {
      showHero: true, showProducts: true, showServices: true,
      showGallery: true, showTestimonials: true,
      tabs: [
        { href: "", labelKey: "nav.home" },
        { href: "/products", labelKey: "nav.properties" },
        { href: "/reservar", labelKey: "nav.contact" },
      ],
      heroTitleKey: "widget.hero_title",
      heroDescKey: "widget.hero_desc",
    },
  },
  mechanic: {
    id: "mechanic",
    name: "Taller Mecánico",
    description: "Talleres mecánicos, autolavados, vulcanizadoras y servicios automotrices",
    icon: "Wrench",
    modules: [
      "dashboard", "services", "appointments", "customers",
      "products", "analytics", "invoices", "campaigns",
      "integrations", "automations",
      "ai", "knowledgebase", "agentconfig", "agentinstall",
      "smartforms", "team", "orgsettings",
      "inventory", "gallery", "testimonials",
    ],
    systemPrompt: `Eres un asistente IA especializado en talleres mecanicos y servicios automotrices.
Gestionas servicios de reparacion y mantenimiento, citas, clientes, inventario de refacciones y ordenes de trabajo.
Ayudas a diagnosticar problemas comunes, presupuestar reparaciones, programar servicios preventivos, y dar seguimiento a ordenes.
Puedes recomendar programas de mantenimiento segun kilometraje y enviar recordatorios a clientes.`,
    widgetConfig: {
      showHero: true, showProducts: false, showServices: true,
      showGallery: true, showTestimonials: true,
      tabs: [
        { href: "", labelKey: "nav.home" },
        { href: "/services", labelKey: "nav.services" },
        { href: "/reservar", labelKey: "nav.book_now" },
      ],
      heroTitleKey: "widget.hero_title",
      heroDescKey: "widget.hero_desc",
    },
  },
  veterinary: {
    id: "veterinary",
    name: "Veterinaria",
    description: "Clínicas veterinarias, pet shops, estéticas caninas y cuidado animal",
    icon: "PawPrint",
    modules: [
      "dashboard", "services", "products", "appointments", "customers",
      "analytics", "invoices", "campaigns",
      "integrations", "automations",
      "ai", "knowledgebase", "agentconfig", "agentinstall",
      "smartforms", "team", "orgsettings",
      "medical_records", "prescriptions", "inventory", "gallery", "testimonials",
    ],
    systemPrompt: `Eres un asistente IA especializado en veterinaria y cuidado de mascotas.
Gestionas citas veterinarias, historiales clinicos de mascotas, vacunas, productos y servicios de estetica canina.
Ayudas a agendar consultas, recordar vacunas pendientes, gestionar el inventario de alimentos y medicamentos.
Puedes dar recomendaciones basicas de cuidado segun la especie y raza, y enviar recordatorios de desparasitacion.`,
    widgetConfig: {
      showHero: true, showProducts: true, showServices: true,
      showGallery: true, showTestimonials: true,
      tabs: [
        { href: "", labelKey: "nav.home" },
        { href: "/services", labelKey: "nav.services" },
        { href: "/reservar", labelKey: "nav.book_appointment" },
      ],
      heroTitleKey: "widget.hero_title",
      heroDescKey: "widget.hero_desc",
    },
  },
  hotel: {
    id: "hotel",
    name: "Hotel",
    description: "Hoteles, hostales, moteles, cabañas y alojamientos turísticos",
    icon: "Hotel",
    modules: [
      "dashboard", "services", "appointments", "customers",
      "products", "analytics", "invoices", "campaigns",
      "integrations", "automations",
      "ai", "knowledgebase", "agentconfig", "agentinstall",
      "smartforms", "team", "orgsettings",
      "inventory", "gallery", "testimonials",
    ],
    systemPrompt: `Eres un asistente IA especializado en hoteles y alojamientos.
Gestionas reservas de habitaciones, check-in y check-out, servicios adicionales, clientes y disponibilidad.
Ayudas a gestionar tarifas por temporada, bloquear fechas, procesar reservas directas, y coordinar servicios de limpieza.
Puedes recomendar habitaciones segun preferencias, gestionar programas de fidelidad, y enviar confirmaciones.`,
    widgetConfig: {
      showHero: true, showProducts: true, showServices: true,
      showGallery: true, showTestimonials: true,
      tabs: [
        { href: "", labelKey: "nav.home" },
        { href: "/products", labelKey: "nav.rooms" },
        { href: "/reservar", labelKey: "nav.book_now" },
      ],
      heroTitleKey: "widget.hero_title",
      heroDescKey: "widget.hero_desc",
    },
  },
  events: {
    id: "events",
    name: "Salón de Eventos",
    description: "Salones de fiestas, centros de convenciones, banquetes y organización de eventos",
    icon: "PartyPopper",
    modules: [
      "dashboard", "services", "appointments", "customers",
      "products", "analytics", "invoices", "campaigns",
      "integrations", "automations",
      "ai", "knowledgebase", "agentconfig", "agentinstall",
      "smartforms", "team", "orgsettings",
      "inventory", "gallery", "testimonials",
    ],
    systemPrompt: `Eres un asistente IA especializado en salones de eventos y organizacion de fiestas.
Gestionas reservas de espacios, paquetes de servicios, clientes, contratos y calendario de eventos.
Ayudas a cotizar eventos, coordinar proveedores, gestionar menus y bebidas, y dar seguimiento a pagos.
Puedes recomendar decoracion segun la ocasion, enviar recordatorios de fecha, y gestionar listas de invitados.`,
    widgetConfig: {
      showHero: true, showProducts: false, showServices: true,
      showGallery: true, showTestimonials: true,
      tabs: [
        { href: "", labelKey: "nav.home" },
        { href: "/services", labelKey: "nav.services" },
        { href: "/reservar", labelKey: "nav.book_now" },
      ],
      heroTitleKey: "widget.hero_title",
      heroDescKey: "widget.hero_desc",
    },
  },
  photographer: {
    id: "photographer",
    name: "Fotógrafo",
    description: "Fotógrafos profesionales, estudios de fotografía y videografía",
    icon: "Camera",
    modules: [
      "dashboard", "services", "appointments", "customers",
      "products", "analytics", "invoices", "campaigns",
      "integrations", "automations",
      "ai", "knowledgebase", "agentconfig", "agentinstall",
      "smartforms", "team", "orgsettings",
      "gallery", "testimonials",
    ],
    systemPrompt: `Eres un asistente IA especializado en fotografia y videografia.
Gestionas sesiones fotograficas, paquetes de servicios, clientes, portafolio y entregas de trabajos.
Ayudas a programar sesiones, cotizar eventos (bodas, quinceaneras, retratos), y gestionar la edicion y entrega de fotos.
Puedes recomendar locaciones, sugerir paquetes segun necesidades, y automatizar recordatorios de sesiones.`,
    widgetConfig: {
      showHero: true, showProducts: true, showServices: true,
      showGallery: true, showTestimonials: true,
      tabs: [
        { href: "", labelKey: "nav.home" },
        { href: "/services", labelKey: "nav.services" },
        { href: "/gallery", labelKey: "nav.gallery" },
      ],
      heroTitleKey: "widget.hero_title",
      heroDescKey: "widget.hero_desc",
    },
  },
  consultant: {
    id: "consultant",
    name: "Consultor",
    description: "Consultores, coaches, tutores, asesores y mentores profesionales",
    icon: "Briefcase",
    modules: [
      "dashboard", "services", "appointments", "customers",
      "analytics", "invoices", "campaigns",
      "integrations", "automations",
      "ai", "knowledgebase", "agentconfig", "agentinstall",
      "smartforms", "team", "orgsettings",
      "testimonials", "documents",
    ],
    systemPrompt: `Eres un asistente IA especializado en consultoria, coaching y tutoria.
Gestionas sesiones de consultoria, programas de coaching, clientes, planes de accion y facturacion.
Ayudas a agendar sesiones, dar seguimiento a objetivos de clientes, crear planes de desarrollo, y compartir recursos.
Puedes recomendar lecturas, enviar tareas entre sesiones, y automatizar recordatorios de compromisos.`,
    widgetConfig: {
      showHero: true, showProducts: false, showServices: true,
      showGallery: false, showTestimonials: true,
      tabs: [
        { href: "", labelKey: "nav.home" },
        { href: "/services", labelKey: "nav.services" },
        { href: "/reservar", labelKey: "nav.contact" },
      ],
      heroTitleKey: "widget.hero_title",
      heroDescKey: "widget.hero_desc",
    },
  },
  accountant: {
    id: "accountant",
    name: "Contador",
    description: "Contadores, asesores fiscales, consultores financieros y gestoría",
    icon: "Calculator",
    modules: [
      "dashboard", "services", "appointments", "customers",
      "analytics", "invoices", "campaigns",
      "integrations", "automations",
      "ai", "knowledgebase", "agentconfig", "agentinstall",
      "smartforms", "team", "orgsettings",
      "testimonials", "documents",
    ],
    systemPrompt: `Eres un asistente IA especializado en contabilidad y finanzas.
Gestionas clientes, declaraciones fiscales, facturacion, documentos contables y plazos impositivos.
Ayudas a organizar documentos fiscales, calcular impuestos estimados, recordar fechas de declaracion, y generar reportes financieros.
Puedes recomendar estrategias de ahorro fiscal, clasificar gastos, y automatizar recordatorios de vencimientos.`,
    widgetConfig: {
      showHero: true, showProducts: false, showServices: true,
      showGallery: false, showTestimonials: true,
      tabs: [
        { href: "", labelKey: "nav.home" },
        { href: "/services", labelKey: "nav.services" },
        { href: "/reservar", labelKey: "nav.contact" },
      ],
      heroTitleKey: "widget.hero_title",
      heroDescKey: "widget.hero_desc",
    },
  },
  itservices: {
    id: "itservices",
    name: "Soporte Técnico",
    description: "Servicios de TI, soporte técnico, reparación de equipos y consultoría tecnológica",
    icon: "Monitor",
    modules: [
      "dashboard", "services", "appointments", "customers",
      "products", "analytics", "invoices", "campaigns",
      "integrations", "automations",
      "ai", "knowledgebase", "agentconfig", "agentinstall",
      "smartforms", "team", "orgsettings",
      "inventory", "testimonials", "documents",
    ],
    systemPrompt: `Eres un asistente IA especializado en servicios de tecnologia y soporte tecnico.
Gestionas ordenes de servicio, reparaciones, clientes, inventario de equipos y componentes, y visitas tecnicas.
Ayudas a diagnosticar problemas, presupuestar reparaciones, programar visitas, y dar seguimiento a tickets de soporte.
Puedes recomendar equipos segun necesidades, gestionar garantias, y automatizar recordatorios de mantenimiento.`,
    widgetConfig: {
      showHero: true, showProducts: true, showServices: true,
      showGallery: false, showTestimonials: true,
      tabs: [
        { href: "", labelKey: "nav.home" },
        { href: "/services", labelKey: "nav.services" },
        { href: "/reservar", labelKey: "nav.contact" },
      ],
      heroTitleKey: "widget.hero_title",
      heroDescKey: "widget.hero_desc",
    },
  },
  marketing: {
    id: "marketing",
    name: "Agencia de Marketing",
    description: "Agencias de marketing, publicidad, redes sociales y branding",
    icon: "Megaphone",
    modules: [
      "dashboard", "services", "campaigns", "customers",
      "analytics", "invoices",
      "integrations", "automations",
      "ai", "knowledgebase", "agentconfig", "agentinstall",
      "smartforms", "team", "orgsettings",
      "gallery", "testimonials",
    ],
    systemPrompt: `Eres un asistente IA especializado en marketing y publicidad.
Gestionas campanas publicitarias, clientes, contenido para redes sociales, analytics y reportes de rendimiento.
Ayudas a planificar estrategias de marketing, crear calendarios de contenido, analizar metricas de campanas, y gestionar presupuestos.
Puedes recomendar canales segun el publico objetivo, automatizar publicaciones, y generar reportes de ROI.`,
    widgetConfig: {
      showHero: true, showProducts: false, showServices: true,
      showGallery: true, showTestimonials: true,
      tabs: [
        { href: "", labelKey: "nav.home" },
        { href: "/services", labelKey: "nav.services" },
        { href: "/reservar", labelKey: "nav.contact" },
      ],
      heroTitleKey: "widget.hero_title",
      heroDescKey: "widget.hero_desc",
    },
  },
  construction: {
    id: "construction",
    name: "Construcción",
    description: "Empresas de construcción, remodelaciones, contratistas y arquitectos",
    icon: "HardHat",
    modules: [
      "dashboard", "services", "appointments", "customers",
      "products", "analytics", "invoices", "campaigns",
      "integrations", "automations",
      "ai", "knowledgebase", "agentconfig", "agentinstall",
      "smartforms", "team", "orgsettings",
      "inventory", "gallery", "testimonials", "documents",
    ],
    systemPrompt: `Eres un asistente IA especializado en construccion y remodelaciones.
Gestionas proyectos, presupuestos, clientes, materiales, cronogramas de obra y contratistas.
Ayudas a crear cotizaciones, planificar fases de construccion, dar seguimiento a avances de obra, y gestionar ordenes de compra.
Puedes recomendar materiales segun el proyecto, calcular costos estimados, y enviar actualizaciones a clientes.`,
    widgetConfig: {
      showHero: true, showProducts: false, showServices: true,
      showGallery: true, showTestimonials: true,
      tabs: [
        { href: "", labelKey: "nav.home" },
        { href: "/services", labelKey: "nav.services" },
        { href: "/gallery", labelKey: "nav.gallery" },
      ],
      heroTitleKey: "widget.hero_title",
      heroDescKey: "widget.hero_desc",
    },
  },
  transport: {
    id: "transport",
    name: "Transporte",
    description: "Servicios de transporte, delivery, mudanzas y logística",
    icon: "Truck",
    modules: [
      "dashboard", "services", "orders", "customers",
      "analytics", "invoices", "campaigns",
      "integrations", "automations",
      "ai", "knowledgebase", "agentconfig", "agentinstall",
      "smartforms", "team", "orgsettings",
      "testimonials",
    ],
    systemPrompt: `Eres un asistente IA especializado en transporte y logistica.
Gestionas ordenes de servicio, rutas, conductores, clientes, seguimiento de envios y facturacion.
Ayudas a programar recogidas y entregas, optimizar rutas, dar seguimiento en tiempo real, y gestionar flotillas.
Puedes recomendar horarios de entrega, calcular distancias y costos de envio, y automatizar notificaciones a clientes.`,
    widgetConfig: {
      showHero: true, showProducts: false, showServices: true,
      showGallery: false, showTestimonials: true,
      tabs: [
        { href: "", labelKey: "nav.home" },
        { href: "/services", labelKey: "nav.services" },
        { href: "/reservar", labelKey: "nav.contact" },
      ],
      heroTitleKey: "widget.hero_title",
      heroDescKey: "widget.hero_desc",
    },
  },
  dentist: {
    id: "dentist",
    name: "Dentista",
    description: "Consultorios dentales, clínicas de odontología y ortodoncistas",
    icon: "Tooth",
    modules: [
      "dashboard", "services", "appointments", "customers",
      "analytics", "invoices", "campaigns",
      "integrations", "automations",
      "ai", "knowledgebase", "agentconfig", "agentinstall",
      "smartforms", "team", "orgsettings",
      "medical_records", "prescriptions", "doctors", "inventory", "gallery", "testimonials",
    ],
    systemPrompt: `Eres un asistente IA especializado en odontologia y cuidado dental.
Gestionas citas dentales, historiales clinicos, tratamientos, pacientes y facturacion.
Ayudas a agendar consultas, recordar citas a pacientes, gestionar planes de tratamiento y ortodoncia.
Puedes recomendar cuidados post-operatorios, enviar recordatorios de limpieza dental, y gestionar el inventario de insumos.`,
    widgetConfig: {
      showHero: true, showProducts: false, showServices: true,
      showGallery: false, showTestimonials: true,
      tabs: [
        { href: "", labelKey: "nav.home" },
        { href: "/services", labelKey: "nav.services" },
        { href: "/reservar", labelKey: "nav.book_appointment" },
      ],
      heroTitleKey: "widget.hero_title",
      heroDescKey: "widget.hero_desc",
    },
  },
};

export function getCategory(id: CategoryId): CategoryDefinition {
  return CATEGORIES[id] || CATEGORIES.general;
}

export function getCategoryModules(categoryId: CategoryId): ModuleId[] {
  return getCategory(categoryId).modules;
}

export function getCategorySystemPrompt(categoryId: CategoryId): string {
  return getCategory(categoryId).systemPrompt;
}
