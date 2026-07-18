export type Domain =
  | "crm"
  | "booking"
  | "products"
  | "payments"
  | "email"
  | "analytics"
  | "marketing"
  | "admin"
  | "legal"
  | "inventory"
  | "education"
  | "industry"
  | "general";

export const DOMAIN_TOOLS: Record<Domain, string[]> = {
  general: ["getCurrentDateTime"],
  crm: [
    "create_customer", "update_customer", "list_customers",
    "invite_team_member", "remove_team_member", "change_team_member_role", "list_team_members",
    "find_leads",
  ],
  booking: [
    "create_appointment", "update_appointment", "cancel_appointment", "list_appointments",
  ],
  products: [
    "create_product", "delete_product",
    "create_service", "update_service", "delete_service", "list_services",
    "create_order", "update_order_status", "list_orders",
  ],
  payments: [
    "create_checkout", "list_payments",
    "create_invoice", "list_invoices", "update_invoice_status", "delete_invoice", "send_invoice_email",
    "check_my_subscription", "create_subscription_checkout", "cancel_subscription",
  ],
  email: [
    "send_email", "send_gmail", "send_messenger",
  ],
  analytics: [
    "get_analytics",
  ],
  marketing: [
    "schedule_task",
    "create_kb_entry", "update_kb_entry", "delete_kb_entry", "list_kb_entries",
    "create_automation", "update_automation", "delete_automation", "list_automations", "toggle_automation",
    "create_campaign", "update_campaign", "delete_campaign", "list_campaigns", "send_campaign",
    "create_smart_form", "update_smart_form", "delete_smart_form", "list_smart_forms", "list_form_submissions",
    "create_workflow", "update_workflow", "delete_workflow", "list_workflows", "toggle_workflow",
  ],
  legal: [
    "create_document", "delete_document", "list_documents",
    "create_casefile", "update_casefile", "delete_casefile", "list_casefiles",
    "create_hearing", "update_hearing", "delete_hearing", "list_hearings",
  ],
  inventory: [
    "add_inventory_item", "update_inventory_item", "delete_inventory_item", "list_inventory",
  ],
  education: [
    "create_class", "update_class", "delete_class", "list_classes", "enroll_student",
  ],
  industry: [
    "create_gallery_item", "update_gallery_item", "delete_gallery_item", "list_gallery_items",
    "create_testimonial", "update_testimonial", "delete_testimonial", "list_testimonials",
    "create_menu_item", "update_menu_item", "delete_menu_item", "list_menu_items",
    "create_recipe", "update_recipe", "delete_recipe", "list_recipes",
    "create_barber", "update_barber", "delete_barber", "list_barbers",
    "add_queue_entry", "update_queue_entry", "delete_queue_entry", "list_queue",
    "create_promotion", "update_promotion", "delete_promotion", "list_promotions",
    "create_reservation", "update_reservation", "delete_reservation", "list_reservations",
    "list_loyalty_members", "add_loyalty_points", "redeem_loyalty_points",
    "list_reviews", "reply_to_review", "delete_review",
  ],
  admin: [
    "create_store", "delete_store", "update_store",
    "send_telegram_message", "send_discord_message", "send_slack_message",
    "send_sms", "send_whatsapp", "send_whatsapp_business",
    "post_to_facebook", "post_to_instagram", "post_to_twitter", "post_to_threads",
    "post_to_tiktok", "get_youtube_stats",
    "configure_integration", "toggle_integration", "delete_integration", "test_integration", "list_integrations",
    "list_scheduled_tasks", "delete_scheduled_task",
    "get_widget_embed",
    "get_agent_config", "update_agent_config",
  ],
};

export const ALL_TOOL_NAMES = new Set(Object.values(DOMAIN_TOOLS).flat());

export function getToolsForDomains(domains: Domain[]): string[] {
  const names = new Set<string>();
  for (const d of domains) {
    for (const t of DOMAIN_TOOLS[d]) {
      names.add(t);
    }
  }
  return [...names];
}

export function getDomainForTool(toolName: string): Domain | null {
  for (const [domain, tools] of Object.entries(DOMAIN_TOOLS)) {
    if (tools.includes(toolName)) return domain as Domain;
  }
  return null;
}
