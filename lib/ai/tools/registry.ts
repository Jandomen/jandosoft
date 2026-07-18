import type { ToolDefinition, ToolResult } from "./base";
import { TOOLS as PRODUCT_TOOLS, executeProductTool } from "./products";
import { TOOLS as BOOKING_TOOLS, executeBookingTool } from "./booking";
import { TOOLS as CRM_TOOLS, executeCRMTool } from "./crm";
import { TOOLS as PAYMENT_TOOLS, executePaymentTool } from "./payments";
import { TOOLS as EMAIL_TOOLS, executeEmailTool } from "./email";
import { TOOLS as ANALYTICS_TOOLS, executeAnalyticsTool } from "./analytics";
import { TOOLS as MARKETING_TOOLS, executeMarketingTool } from "./marketing";
import { TOOLS as ADMIN_TOOLS, executeAdminTool } from "./admin";
import { TOOLS as TIME_TOOLS, executeTimeTool } from "./time";
import { TOOLS as LEGAL_TOOLS, executeLegalTool } from "./legal";
import { TOOLS as INVENTORY_TOOLS, executeInventoryTool } from "./inventory";
import { TOOLS as EDUCATION_TOOLS, executeEducationTool } from "./education";
import { TOOLS as INDUSTRY_TOOLS, executeIndustryTool } from "./industry";
import { registerToolExecutor } from "./index";

export const ALL_TOOLS: ToolDefinition[] = [
  ...PRODUCT_TOOLS,
  ...BOOKING_TOOLS,
  ...CRM_TOOLS,
  ...PAYMENT_TOOLS,
  ...EMAIL_TOOLS,
  ...ANALYTICS_TOOLS,
  ...MARKETING_TOOLS,
  ...ADMIN_TOOLS,
  ...TIME_TOOLS,
  ...LEGAL_TOOLS,
  ...INVENTORY_TOOLS,
  ...EDUCATION_TOOLS,
  ...INDUSTRY_TOOLS,
];

type ToolExecutor = (name: string, args: any, store: any, userId: string) => Promise<ToolResult>;

const DOMAIN_EXECUTORS: { tools: string[]; executor: ToolExecutor }[] = [
  { tools: ["create_product", "delete_product", "create_service", "update_service", "delete_service", "list_services", "create_order", "update_order_status", "list_orders"], executor: executeProductTool },
  { tools: ["create_appointment", "update_appointment", "cancel_appointment", "list_appointments"], executor: executeBookingTool },
  { tools: ["create_customer", "update_customer", "list_customers", "invite_team_member", "remove_team_member", "change_team_member_role", "list_team_members", "find_leads"], executor: executeCRMTool },
  { tools: ["create_checkout", "list_payments", "check_my_subscription", "create_subscription_checkout", "cancel_subscription", "create_invoice", "list_invoices", "update_invoice_status", "delete_invoice", "send_invoice_email"], executor: executePaymentTool },
  { tools: ["send_email", "send_gmail", "send_messenger"], executor: executeEmailTool },
  { tools: ["get_analytics"], executor: executeAnalyticsTool },
  { tools: ["create_kb_entry", "update_kb_entry", "delete_kb_entry", "list_kb_entries", "create_automation", "update_automation", "delete_automation", "list_automations", "toggle_automation", "create_campaign", "update_campaign", "delete_campaign", "list_campaigns", "send_campaign", "create_smart_form", "update_smart_form", "delete_smart_form", "list_smart_forms", "list_form_submissions", "schedule_task", "create_workflow", "update_workflow", "delete_workflow", "list_workflows", "toggle_workflow"], executor: executeMarketingTool },
  { tools: ["create_store", "delete_store", "update_store", "send_telegram_message", "send_discord_message", "send_slack_message", "send_sms", "send_whatsapp", "send_whatsapp_business", "post_to_facebook", "post_to_instagram", "post_to_twitter", "post_to_threads", "post_to_tiktok", "get_youtube_stats", "configure_integration", "toggle_integration", "delete_integration", "test_integration", "list_integrations", "list_scheduled_tasks", "delete_scheduled_task", "get_widget_embed", "get_agent_config", "update_agent_config"], executor: executeAdminTool },
  { tools: ["getCurrentDateTime"], executor: executeTimeTool },
  { tools: ["create_document", "delete_document", "list_documents", "create_casefile", "update_casefile", "delete_casefile", "list_casefiles", "create_hearing", "update_hearing", "delete_hearing", "list_hearings"], executor: executeLegalTool },
  { tools: ["add_inventory_item", "update_inventory_item", "delete_inventory_item", "list_inventory"], executor: executeInventoryTool },
  { tools: ["create_class", "update_class", "delete_class", "list_classes", "enroll_student"], executor: executeEducationTool },
  { tools: ["create_gallery_item", "update_gallery_item", "delete_gallery_item", "list_gallery_items", "create_testimonial", "update_testimonial", "delete_testimonial", "list_testimonials", "create_menu_item", "update_menu_item", "delete_menu_item", "list_menu_items", "create_recipe", "update_recipe", "delete_recipe", "list_recipes", "create_barber", "update_barber", "delete_barber", "list_barbers", "add_queue_entry", "update_queue_entry", "delete_queue_entry", "list_queue", "create_promotion", "update_promotion", "delete_promotion", "list_promotions", "create_reservation", "update_reservation", "delete_reservation", "list_reservations", "list_loyalty_members", "add_loyalty_points", "redeem_loyalty_points", "list_reviews", "reply_to_review", "delete_review"], executor: executeIndustryTool },
];

export function registerAllTools(): void {
  for (const { tools, executor } of DOMAIN_EXECUTORS) {
    for (const toolName of tools) {
      registerToolExecutor(toolName, async (args, store, userId) => {
        return executor(toolName, args, store, userId);
      });
    }
  }
}
