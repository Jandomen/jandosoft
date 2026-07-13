import {
  Sparkles, Store, Bot, MessageCircle, Compass, FileText, ListOrdered, CheckSquare, type LucideIcon,
} from "lucide-react";

export interface TourStep {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  agentMessage: string;
  targetSelector?: string;
  position?: "top" | "bottom" | "left" | "right";
  autoAdvanceOn?: string;
}

export interface TourConfig {
  storageKey: string;
  steps: TourStep[];
}

export function getTourConfig(emailVerified: boolean): TourConfig {
  const baseSteps: TourStep[] = [
    {
      id: "welcome",
      icon: Sparkles,
      title: "Bienvenido a JANDOSOFT",
      description:
        "Te guiaré por los pasos más importantes para que empieces a gestionar tu negocio con inteligencia artificial.",
      agentMessage:
        "¡Hola! Soy tu asistente IA. Voy a mostrarte cómo crear tu empresa, configurar tu agente de IA, enviar tu primer mensaje y explorar los planes. ¿Empezamos?",
    },
    {
      id: "create_store",
      icon: Store,
      title: "Ve a Mis Websites",
      description:
        "Haz clic en 'Mis Websites' en el menú lateral para ir a tu panel de control.",
      agentMessage:
        "Primero ve a 'Mis Websites' en el menú de la izquierda. Allí podrás crear tu nueva empresa.",
      targetSelector: "[data-tour='create_store']",
      position: "right",
    },
    {
      id: "create_btn",
      icon: Store,
      title: "Crea tu Empresa",
      description:
        "Presiona el botón para abrir el formulario de creación.",
      agentMessage:
        "Dale clic a 'Nueva Empresa' para abrir el formulario. Te guiaré campo por campo.",
      targetSelector: "[data-tour='create_btn']",
      position: "bottom",
    },
    {
      id: "form_name",
      icon: FileText,
      title: "Nombre de la Empresa",
      description:
        "Escribe el nombre de tu empresa. Por ejemplo: 'Mi Tienda Online'.",
      agentMessage:
        "Empieza escribiendo el nombre de tu empresa aquí. Pon un nombre que identifique tu negocio.",
      targetSelector: "[data-tour='form_name']",
      position: "bottom",
    },
    {
      id: "form_desc",
      icon: FileText,
      title: "Descripción",
      description:
        "Agrega una breve descripción de tu empresa: qué haces, a qué te dedicas.",
      agentMessage:
        "Ahora escribe una descripción corta. Cuéntame de qué trata tu negocio.",
      targetSelector: "[data-tour='form_desc']",
      position: "top",
    },
    {
      id: "form_industry",
      icon: ListOrdered,
      title: "Industria",
      description:
        "Selecciona la industria de tu negocio: tecnología, comercio, salud, etc.",
      agentMessage:
        "Elige la industria que mejor describa tu negocio. Esto ayuda a personalizar tu agente IA.",
      targetSelector: "[data-tour='form_industry']",
      position: "top",
    },
    {
      id: "form_type",
      icon: ListOrdered,
      title: "Tipo de Empresa",
      description:
        "Elige el tipo: tienda online, SaaS, CRM, etc.",
      agentMessage:
        "Selecciona el tipo de empresa. Escoge el que mejor se ajuste a tu modelo de negocio.",
      targetSelector: "[data-tour='form_type']",
      position: "top",
    },
    {
      id: "form_submit",
      icon: CheckSquare,
      title: "Crear Empresa",
      description:
        "¡Ya casi! Presiona 'Crear' para finalizar. Asegúrate de haber llenado todos los campos.",
      agentMessage:
        "Perfecto, ahora presiona 'Crear' y tu empresa quedará lista. Te espero en el siguiente paso.",
      targetSelector: "[data-tour='form_submit']",
      position: "top",
      autoAdvanceOn: "tour:action:store_created",
    },
    {
      id: "ai_agent",
      icon: Bot,
      title: "Configura tu Agente IA",
      description:
        "Personaliza el agente de inteligencia artificial de tu negocio — 'IA Agente' en el menú — así podrá atender clientes, vender productos y responder preguntas automáticamente.",
      agentMessage:
        "Ahora entra a 'IA Agente' para configurar tu asistente. Dale nombre, personalidad y decide cómo interactuar con tus clientes.",
      targetSelector: "[data-tour='ai_agent']",
      position: "right",
      autoAdvanceOn: "tour:action:ai_configured",
    },
    {
      id: "chat",
      icon: MessageCircle,
      title: "Envía tu Primer Mensaje",
      description:
        "Prueba el chat 'IA Chat'. Puedes preguntarle al agente IA cualquier cosa sobre tu negocio, productos o clientes.",
      agentMessage:
        "Ahora ve a 'IA Chat' y escríbeme algo. Pregúntame lo que quieras, ¡así conoces todo lo que puedo hacer por ti!",
      targetSelector: "[data-tour='chat']",
      position: "right",
      autoAdvanceOn: "tour:action:first_message",
    },
    {
      id: "explore",
      icon: Compass,
      title: "Explora los Planes",
      description:
        "Descubre los planes disponibles en 'Planes' y elige el que mejor se adapte a las necesidades de tu negocio. ¡Hay opciones para todos!",
      agentMessage:
        "Por último, revisa los 'Planes'. Todos incluyen prueba gratuita para que encuentres el perfecto para ti.",
      targetSelector: "[data-tour='explore']",
      position: "right",
    },
  ];

  if (!emailVerified) {
    baseSteps.push({
      id: "verify_email",
      icon: Compass,
      title: "Verifica tu Correo Electrónico",
      description:
        "Revisa tu bandeja de entrada y haz clic en el enlace de verificación para activar tu cuenta.",
      agentMessage:
        "No olvides verificar tu correo para activar todas las funciones. ¿No lo recibiste? Puedes reenviarlo desde aquí.",
    });
  }

  return { storageKey: "jandosoft_product_tour", steps: baseSteps };
}
