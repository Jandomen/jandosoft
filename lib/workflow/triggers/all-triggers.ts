/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TriggerPlugin } from "../core/plugin-interfaces";

export const ALL_TRIGGERS: TriggerPlugin[] = [
  {
    id: "new_customer",
    name: "Nuevo Cliente",
    description: "Se dispara cuando se registra un nuevo cliente en la tienda",
    icon: "UserPlus",
    configSchema: {},
    evaluate(event) {
      return !!event.payload.customerName || !!event.payload.customerEmail;
    },
  },
  {
    id: "new_order",
    name: "Nuevo Pedido",
    description: "Se dispara cuando se crea un nuevo pedido",
    icon: "ShoppingCart",
    configSchema: {},
    evaluate(event) {
      return !!event.payload.orderId || !!event.payload.product;
    },
  },
  {
    id: "new_appointment",
    name: "Nueva Cita",
    description: "Se dispara cuando se agenda una nueva cita",
    icon: "Calendar",
    configSchema: {},
    evaluate(event) {
      return !!event.payload.appointmentId || !!event.payload.customerName;
    },
  },
  {
    id: "payment_received",
    name: "Pago Recibido",
    description: "Se dispara cuando se recibe un pago exitoso",
    icon: "CreditCard",
    configSchema: {
      minAmount: { type: "number", description: "Monto mínimo para disparar (opcional)" },
    },
    evaluate(event, config) {
      if (!event.payload.amount && !event.payload.paymentIntentId) return false;
      if (config.minAmount && event.payload.amount < config.minAmount) return false;
      return true;
    },
  },
  {
    id: "payment_failed",
    name: "Pago Fallido",
    description: "Se dispara cuando un pago falla",
    icon: "AlertTriangle",
    configSchema: {},
    evaluate(event) {
      return event.payload.status === "failed" || event.payload.failureReason;
    },
  },
  {
    id: "new_form_submission",
    name: "Nuevo Formulario",
    description: "Se dispara cuando alguien llena un formulario inteligente",
    icon: "FileText",
    configSchema: {
      formId: { type: "string", description: "ID del formulario específico (opcional)" },
    },
    evaluate(event, config) {
      if (config.formId && event.payload.formId !== config.formId) return false;
      return !!event.payload.formId;
    },
  },
  {
    id: "customer_inactive",
    name: "Cliente Inactivo",
    description: "Se dispara para clientes que no han comprado en X días",
    icon: "UserX",
    configSchema: {
      daysInactive: { type: "number", description: "Días de inactividad", default: 30 },
    },
    getCronExpression() {
      return "0 6 * * *";
    },
  },
  {
    id: "customer_birthday",
    name: "Cumpleaños",
    description: "Se dispara en el cumpleaños del cliente",
    icon: "Gift",
    configSchema: {},
    getCronExpression() {
      return "0 8 * * *";
    },
  },
  {
    id: "low_stock",
    name: "Stock Bajo",
    description: "Se dispara cuando un producto tiene stock por debajo del umbral",
    icon: "Package",
    configSchema: {
      threshold: { type: "number", description: "Umbral de stock mínimo", default: 5 },
    },
    evaluate(event, config) {
      const threshold = config.threshold ?? 5;
      return event.payload.productStock <= threshold;
    },
  },
  {
    id: "subscription_created",
    name: "Suscripción Creada",
    description: "Se dispara cuando un usuario crea una suscripción",
    icon: "Zap",
    configSchema: {},
    evaluate(event) {
      return event.payload.subscriptionId && event.payload.status === "active";
    },
  },
  {
    id: "subscription_canceled",
    name: "Suscripción Cancelada",
    description: "Se dispara cuando un usuario cancela su suscripción",
    icon: "XCircle",
    configSchema: {},
    evaluate(event) {
      return event.payload.subscriptionId && (event.payload.status === "canceled" || event.payload.status === "cancelled");
    },
  },
  {
    id: "webhook_received",
    name: "Webhook Recibido",
    description: "Se dispara cuando se recibe un webhook externo en la URL de la tienda",
    icon: "Webhook",
    configSchema: {
      secret: { type: "string", description: "Token de verificación (opcional)" },
    },
    evaluate() {
      return true;
    },
  },
];
