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
  | "dentist"
  | "beauty_salon"
  | "spa"
  | "coffee_shop"
  | "bakery"
  | "florist"
  | "pharmacy"
  | "optics"
  | "pet_grooming"
  | "tattoo"
  | "laundry"
  | "car_wash"
  | "catering"
  | "dj_musician"
  | "academy"
  | "landscaping"
  | "cleaning";

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
      "promotions", "loyalty",
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
      "promotions", "loyalty", "reservations",
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
      "promotions", "loyalty",
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
      "reservations",
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
      "queue", "reservations",
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
      "promotions", "loyalty",
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
      "promotions", "loyalty", "reservations",
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
      "promotions", "loyalty", "reservations",
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
      "promotions", "loyalty",
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
      "promotions", "loyalty", "reservations",
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
      "promotions", "loyalty", "reservations",
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
      "promotions", "loyalty", "reservations",
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
      "promotions", "loyalty", "reservations",
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
      "promotions", "loyalty", "reservations",
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
      "promotions", "loyalty", "reservations",
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
      "promotions", "loyalty",
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
      "promotions", "loyalty",
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
      "promotions", "loyalty",
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
      "promotions", "loyalty",
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
      "promotions", "loyalty", "queue", "reservations",
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
  beauty_salon: {
    id: "beauty_salon",
    name: "Salón de Belleza",
    description: "Peluquerías, salones de uñas, maquillaje y estética",
    icon: "Sparkles",
    modules: [
      "dashboard", "services", "appointments", "customers",
      "products", "analytics", "invoices", "campaigns",
      "integrations", "automations",
      "ai", "knowledgebase", "agentconfig", "agentinstall",
      "smartforms", "team", "orgsettings",
      "gallery", "testimonials",
      "promotions", "loyalty", "queue", "reservations",
    ],
    systemPrompt: `Eres un asistente IA especializado en salones de belleza y estética.
Gestionas servicios de corte, peinado, coloración, manicure, pedicure, maquillaje y tratamientos capilares.
Ayudas a agendar citas, recordar a clientes sus próximas visitas, gestionar el inventario de productos de belleza.
Puedes recomendar estilos según el tipo de cabello y rostro, y mantener un historial de servicios por cliente.`,
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
  spa: {
    id: "spa",
    name: "Spa / Bienestar",
    description: "Spas, centros de masaje, relajación y bienestar",
    icon: "Heart",
    modules: [
      "dashboard", "services", "appointments", "customers",
      "products", "analytics", "invoices", "campaigns",
      "integrations", "automations",
      "ai", "knowledgebase", "agentconfig", "agentinstall",
      "smartforms", "team", "orgsettings",
      "gallery", "testimonials",
      "promotions", "loyalty", "queue", "reservations",
    ],
    systemPrompt: `Eres un asistente IA especializado en spas y centros de bienestar.
Gestionas servicios de masaje, tratamientos faciales, aromaterapia, yoga y relajación.
Ayudas a agendar sesiones, recomendar tratamientos según necesidades, gestionar paquetes y membresías.
Puedes sugerir rutinas de bienestar, recordar citas, y gestionar el inventario de productos.`,
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
  coffee_shop: {
    id: "coffee_shop",
    name: "Cafetería",
    description: "Cafeterías, coffee shops, bares de café y té",
    icon: "Coffee",
    modules: [
      "dashboard", "menu", "products", "orders", "customers",
      "analytics", "invoices", "campaigns", "promotions",
      "integrations", "automations",
      "ai", "knowledgebase", "agentconfig", "agentinstall",
      "smartforms", "team", "orgsettings",
      "gallery", "testimonials",
      "loyalty",
    ],
    systemPrompt: `Eres un asistente IA especializado en cafeterías y coffee shops.
Gestionas menús de café, bebidas, postres, pedidos, inventario y atención al cliente.
Ayudas a crear combos especiales, gestionar pedidos para llevar, y controlar el inventario de granos y suministros.
Puedes recomendar bebidas según preferencias, gestionar programas de fidelidad, y enviar notificaciones de pedidos listos.`,
    widgetConfig: {
      showHero: true, showProducts: true, showServices: false,
      showGallery: true, showTestimonials: true,
      tabs: [
        { href: "", labelKey: "nav.home" },
        { href: "/products", labelKey: "nav.menu" },
        { href: "/contact", labelKey: "nav.contact" },
      ],
      heroTitleKey: "widget.hero_title",
      heroDescKey: "widget.hero_desc",
    },
  },
  bakery: {
    id: "bakery",
    name: "Panadería",
    description: "Panaderías, pastelerías, reposterías y hornos",
    icon: "Cake",
    modules: [
      "dashboard", "menu", "products", "orders", "customers",
      "inventory", "analytics", "invoices", "campaigns", "promotions",
      "integrations", "automations",
      "ai", "knowledgebase", "agentconfig", "agentinstall",
      "smartforms", "team", "orgsettings",
      "gallery", "testimonials",
      "loyalty",
    ],
    systemPrompt: `Eres un asistente IA especializado en panaderías y pastelerías.
Gestionas productos de panadería, pasteles, pedidos, inventario de ingredientes y clientes.
Ayudas a tomar pedidos especiales (pasteles personalizados), controlar stock de ingredientes por receta, y gestionar pedidos por encargo.
Puedes recomendar productos del día, gestionar pedidos para eventos, y enviar recordatorios de pedidos listos.`,
    widgetConfig: {
      showHero: true, showProducts: true, showServices: false,
      showGallery: true, showTestimonials: true,
      tabs: [
        { href: "", labelKey: "nav.home" },
        { href: "/products", labelKey: "nav.products" },
        { href: "/contact", labelKey: "nav.contact" },
      ],
      heroTitleKey: "widget.hero_title",
      heroDescKey: "widget.hero_desc",
    },
  },
  florist: {
    id: "florist",
    name: "Floristería",
    description: "Floristerías, arreglos florales, ramos y decoración",
    icon: "Flower2",
    modules: [
      "dashboard", "products", "orders", "customers",
      "analytics", "invoices", "campaigns", "promotions",
      "integrations", "automations",
      "ai", "knowledgebase", "agentconfig", "agentinstall",
      "smartforms", "team", "orgsettings",
      "gallery", "testimonials",
      "loyalty",
    ],
    systemPrompt: `Eres un asistente IA especializado en floristerías y arreglos florales.
Gestionas arreglos, ramos, productos florales, pedidos, eventos y clientes.
Ayudas a crear arreglos personalizados, gestionar pedidos para eventos especiales, y controlar el inventario de flores según temporada.
Puedes recomendar arreglos según la ocasión, gestionar suscripciones de flores, y enviar notificaciones de pedidos.`,
    widgetConfig: {
      showHero: true, showProducts: true, showServices: false,
      showGallery: true, showTestimonials: true,
      tabs: [
        { href: "", labelKey: "nav.home" },
        { href: "/products", labelKey: "nav.products" },
        { href: "/contact", labelKey: "nav.contact" },
      ],
      heroTitleKey: "widget.hero_title",
      heroDescKey: "widget.hero_desc",
    },
  },
  pharmacy: {
    id: "pharmacy",
    name: "Farmacia",
    description: "Farmacias, droguerías y puntos de venta de medicamentos",
    icon: "Pill",
    modules: [
      "dashboard", "products", "customers", "inventory",
      "orders", "analytics", "invoices", "campaigns",
      "integrations", "automations",
      "ai", "knowledgebase", "agentconfig", "agentinstall",
      "smartforms", "team", "orgsettings",
      "medical_records", "prescriptions",
      "promotions", "loyalty",
    ],
    systemPrompt: `Eres un asistente IA especializado en farmacias y venta de medicamentos.
Gestionas productos farmacéuticos, inventario, pedidos, recetas médicas y clientes.
Ayudas a controlar stock, gestionar vencimientos de medicamentos, y procesar pedidos con o sin receta.
Puedes recordar a clientes sobre renovaciones de recetas, gestionar productos de venta libre, y controlar inventario por categorías.`,
    widgetConfig: {
      showHero: true, showProducts: true, showServices: false,
      showGallery: false, showTestimonials: true,
      tabs: [
        { href: "", labelKey: "nav.home" },
        { href: "/products", labelKey: "nav.products" },
        { href: "/contact", labelKey: "nav.contact" },
      ],
      heroTitleKey: "widget.hero_title",
      heroDescKey: "widget.hero_desc",
    },
  },
  optics: {
    id: "optics",
    name: "Óptica",
    description: "Ópticas, lentes, exámenes visuales y cuidado ocular",
    icon: "Eye",
    modules: [
      "dashboard", "services", "products", "appointments", "customers",
      "analytics", "invoices", "campaigns",
      "integrations", "automations",
      "ai", "knowledgebase", "agentconfig", "agentinstall",
      "smartforms", "team", "orgsettings",
      "medical_records", "gallery", "testimonials",
      "promotions", "loyalty",
    ],
    systemPrompt: `Eres un asistente IA especializado en ópticas y cuidado visual.
Gestionas productos ópticos (lentes, monturas, lentes de contacto), citas para exámenes visuales, historiales y clientes.
Ayudas a agendar exámenes, recomendar productos según la prescripción, gestionar inventario de monturas y lentes.
Puedes recordar a clientes sobre renovaciones de graduación y enviar recordatorios de citas.`,
    widgetConfig: {
      showHero: true, showProducts: true, showServices: true,
      showGallery: true, showTestimonials: true,
      tabs: [
        { href: "", labelKey: "nav.home" },
        { href: "/products", labelKey: "nav.products" },
        { href: "/reservar", labelKey: "nav.book_appointment" },
      ],
      heroTitleKey: "widget.hero_title",
      heroDescKey: "widget.hero_desc",
    },
  },
  pet_grooming: {
    id: "pet_grooming",
    name: "Estética Canina",
    description: "Peluquería de mascotas, estética canina y grooming",
    icon: "Dog",
    modules: [
      "dashboard", "services", "appointments", "customers",
      "products", "analytics", "invoices", "campaigns",
      "integrations", "automations",
      "ai", "knowledgebase", "agentconfig", "agentinstall",
      "smartforms", "team", "orgsettings",
      "gallery", "testimonials",
      "promotions", "loyalty", "queue", "reservations",
    ],
    systemPrompt: `Eres un asistente IA especializado en estética canina y grooming de mascotas.
Gestionas servicios de baño, corte, cepillado, corte de uñas y tratamientos para mascotas.
Ayudas a agendar citas, recordar visitas periódicas de cada mascota, gestionar inventario de productos de grooming.
Puedes recomendar servicios según la raza y tamaño de la mascota, y mantener un historial de servicios por cliente.`,
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
  tattoo: {
    id: "tattoo",
    name: "Tattoo",
    description: "Estudios de tatuaje, piercing y arte corporal",
    icon: "PenTool",
    modules: [
      "dashboard", "services", "appointments", "customers",
      "analytics", "invoices", "campaigns",
      "integrations", "automations",
      "ai", "knowledgebase", "agentconfig", "agentinstall",
      "smartforms", "team", "orgsettings",
      "gallery", "testimonials",
      "promotions", "loyalty", "queue", "reservations",
    ],
    systemPrompt: `Eres un asistente IA especializado en estudios de tatuaje y piercing.
Gestionas servicios de tatuaje, piercing, diseño personalizado, citas y clientes.
Ayudas a agendar sesiones, gestionar portafolio de trabajos, dar indicaciones pre-cita (cuidados, preparación).
Puedes recomendar estilos, gestionar depósitos, y enviar recordatorios de cuidados post-tatuaje.`,
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
  laundry: {
    id: "laundry",
    name: "Lavandería",
    description: "Lavanderías, tintorerías y servicio de planchado",
    icon: "Shirt",
    modules: [
      "dashboard", "services", "orders", "customers",
      "analytics", "invoices", "campaigns",
      "integrations", "automations",
      "ai", "knowledgebase", "agentconfig", "agentinstall",
      "smartforms", "team", "orgsettings",
      "testimonials",
      "promotions", "loyalty", "queue",
    ],
    systemPrompt: `Eres un asistente IA especializado en lavanderías y servicio de limpieza textil.
Gestionas servicios de lavado, planchado, tintorería, órdenes de servicio y clientes.
Ayudas a recibir pedidos, calcular precios por prenda/kg, gestionar turnos de entrega, y dar seguimiento a órdenes.
Puedes recomendar tratamientos según tipo de tejido, gestionar pedidos recurrentes, y notificar pedidos listos.`,
    widgetConfig: {
      showHero: true, showProducts: false, showServices: true,
      showGallery: false, showTestimonials: true,
      tabs: [
        { href: "", labelKey: "nav.home" },
        { href: "/services", labelKey: "nav.services" },
        { href: "/contact", labelKey: "nav.contact" },
      ],
      heroTitleKey: "widget.hero_title",
      heroDescKey: "widget.hero_desc",
    },
  },
  car_wash: {
    id: "car_wash",
    name: "Autolavado",
    description: "Autolavados, detail de autos y servicio automotriz de limpieza",
    icon: "Car",
    modules: [
      "dashboard", "services", "appointments", "orders", "customers",
      "products", "analytics", "invoices", "campaigns",
      "integrations", "automations",
      "ai", "knowledgebase", "agentconfig", "agentinstall",
      "smartforms", "team", "orgsettings",
      "gallery", "testimonials",
      "promotions", "loyalty", "queue", "reservations",
    ],
    systemPrompt: `Eres un asistente IA especializado en autolavados y detail de autos.
Gestionas servicios de lavado exterior, interior, detail completo, protectores de pintura y más.
Ayudas a agendar citas, gestionar cola de espera, calcular precios según tipo de vehículo y servicio.
Puedes recomendar paquetes de servicio, gestionar membresías de lavado ilimitado, y notificar cuando el auto está listo.`,
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
  catering: {
    id: "catering",
    name: "Catering",
    description: "Servicios de catering, banquetes y comida para eventos",
    icon: "Utensils",
    modules: [
      "dashboard", "menu", "services", "orders", "appointments", "customers",
      "analytics", "invoices", "campaigns",
      "integrations", "automations",
      "ai", "knowledgebase", "agentconfig", "agentinstall",
      "smartforms", "team", "orgsettings",
      "gallery", "testimonials",
      "promotions", "loyalty", "reservations",
    ],
    systemPrompt: `Eres un asistente IA especializado en catering y servicios de banquetería.
Gestionas menús, cotizaciones de eventos, pedidos, proveedores, clientes y logística de entrega.
Ayudas a crear paquetes de menú, cotizar eventos según número de comensales, gestionar restricciones alimentarias.
Puedes recomendar menús según la ocasión, gestionar calendario de eventos, y coordinar tiempos de entrega.`,
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
  dj_musician: {
    id: "dj_musician",
    name: "DJ / Músico",
    description: "DJs, músicos, sonideros y servicios musicales para eventos",
    icon: "Music",
    modules: [
      "dashboard", "services", "appointments", "customers",
      "analytics", "invoices", "campaigns",
      "integrations", "automations",
      "ai", "knowledgebase", "agentconfig", "agentinstall",
      "smartforms", "team", "orgsettings",
      "gallery", "testimonials",
      "promotions", "loyalty", "reservations",
    ],
    systemPrompt: `Eres un asistente IA especializado en DJs, músicos y servicios musicales.
Gestionas servicios de DJ, presentaciones en vivo, alquiler de equipo de sonido, eventos y clientes.
Ayudas a cotizar eventos, gestionar disponibilidad, coordinar horarios de presentación y equipos necesarios.
Puedes recomendar paquetes según tipo de evento, gestionar playlists, y enviar confirmaciones de reservas.`,
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
  academy: {
    id: "academy",
    name: "Academia / Tutoría",
    description: "Academias particulares, tutores, profesores y centros de formación",
    icon: "BookOpen",
    modules: [
      "dashboard", "courses", "classes", "students", "grades",
      "appointments", "customers", "analytics", "invoices",
      "campaigns", "integrations", "automations",
      "ai", "knowledgebase", "agentconfig", "agentinstall",
      "smartforms", "team", "orgsettings",
      "promotions", "loyalty", "reservations",
    ],
    systemPrompt: `Eres un asistente IA especializado en academias particulares y tutorías.
Gestionas cursos, clases particulares, horarios, estudiantes, calificaciones y comunicaciones con padres.
Ayudas a agendar tutorías, hacer seguimiento del progreso académico, generar reportes de notas.
Puedes recomendar planes de estudio personalizados, gestionar disponibilidad de profesores, y enviar recordatorios de clases.`,
    widgetConfig: {
      showHero: true, showProducts: false, showServices: true,
      showGallery: false, showTestimonials: true,
      tabs: [
        { href: "", labelKey: "nav.home" },
        { href: "/services", labelKey: "nav.courses" },
        { href: "/reservar", labelKey: "nav.contact" },
      ],
      heroTitleKey: "widget.hero_title",
      heroDescKey: "widget.hero_desc",
    },
  },
  landscaping: {
    id: "landscaping",
    name: "Jardinería",
    description: "Jardinería, paisajismo, mantenimiento de jardines y áreas verdes",
    icon: "TreePine",
    modules: [
      "dashboard", "services", "appointments", "orders", "customers",
      "products", "analytics", "invoices", "campaigns",
      "integrations", "automations",
      "ai", "knowledgebase", "agentconfig", "agentinstall",
      "smartforms", "team", "orgsettings",
      "gallery", "testimonials",
      "promotions", "loyalty",
    ],
    systemPrompt: `Eres un asistente IA especializado en jardinería y paisajismo.
Gestionas servicios de mantenimiento de jardines, diseño de paisajismo, poda, riego y clientes.
Ayudas a cotizar proyectos, programar visitas de mantenimiento, gestionar inventario de plantas y herramientas.
Puedes recomendar plantas según clima y espacio, crear planes de mantenimiento, y enviar recordatorios de servicios.`,
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
  cleaning: {
    id: "cleaning",
    name: "Limpieza",
    description: "Servicios de limpieza doméstica, empresarial e industrial",
    icon: "SprayCan",
    modules: [
      "dashboard", "services", "appointments", "orders", "customers",
      "analytics", "invoices", "campaigns",
      "integrations", "automations",
      "ai", "knowledgebase", "agentconfig", "agentinstall",
      "smartforms", "team", "orgsettings",
      "testimonials",
      "promotions", "loyalty",
    ],
    systemPrompt: `Eres un asistente IA especializado en servicios de limpieza.
Gestionas servicios de limpieza doméstica, empresarial e industrial, citas, pedidos, clientes y personal.
Ayudas a cotizar servicios según tamaño del espacio, programar visitas recurrentes, gestionar checklist de limpieza.
Puedes recomendar paquetes de limpieza, gestionar pedidos recurrentes, y enviar confirmaciones de servicio.`,
    widgetConfig: {
      showHero: true, showProducts: false, showServices: true,
      showGallery: false, showTestimonials: true,
      tabs: [
        { href: "", labelKey: "nav.home" },
        { href: "/services", labelKey: "nav.services" },
        { href: "/reservar", labelKey: "nav.book_now" },
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
