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

type TranslateFn = (key: string) => string;

export function getTourConfig(emailVerified: boolean, t: TranslateFn): TourConfig {
  const baseSteps: TourStep[] = [
    {
      id: "welcome",
      icon: Sparkles,
      title: t("tour.welcome_title"),
      description: t("tour.welcome_desc"),
      agentMessage: t("tour.welcome_agent"),
    },
    {
      id: "create_store",
      icon: Store,
      title: t("tour.create_store_title"),
      description: t("tour.create_store_desc"),
      agentMessage: t("tour.create_store_agent"),
      targetSelector: "[data-tour='create_store']",
      position: "right",
    },
    {
      id: "create_btn",
      icon: Store,
      title: t("tour.create_btn_title"),
      description: t("tour.create_btn_desc"),
      agentMessage: t("tour.create_btn_agent"),
      targetSelector: "[data-tour='create_btn']",
      position: "bottom",
    },
    {
      id: "form_name",
      icon: FileText,
      title: t("tour.form_name_title"),
      description: t("tour.form_name_desc"),
      agentMessage: t("tour.form_name_agent"),
      targetSelector: "[data-tour='form_name']",
      position: "bottom",
    },
    {
      id: "form_desc",
      icon: FileText,
      title: t("tour.form_desc_title"),
      description: t("tour.form_desc_desc"),
      agentMessage: t("tour.form_desc_agent"),
      targetSelector: "[data-tour='form_desc']",
      position: "top",
    },
    {
      id: "form_industry",
      icon: ListOrdered,
      title: t("tour.form_industry_title"),
      description: t("tour.form_industry_desc"),
      agentMessage: t("tour.form_industry_agent"),
      targetSelector: "[data-tour='form_industry']",
      position: "top",
    },
    {
      id: "form_type",
      icon: ListOrdered,
      title: t("tour.form_type_title"),
      description: t("tour.form_type_desc"),
      agentMessage: t("tour.form_type_agent"),
      targetSelector: "[data-tour='form_type']",
      position: "top",
    },
    {
      id: "form_submit",
      icon: CheckSquare,
      title: t("tour.form_submit_title"),
      description: t("tour.form_submit_desc"),
      agentMessage: t("tour.form_submit_agent"),
      targetSelector: "[data-tour='form_submit']",
      position: "top",
      autoAdvanceOn: "tour:action:store_created",
    },
    {
      id: "ai_agent",
      icon: Bot,
      title: t("tour.ai_agent_title"),
      description: t("tour.ai_agent_desc"),
      agentMessage: t("tour.ai_agent_agent"),
      targetSelector: "[data-tour='ai_agent']",
      position: "right",
      autoAdvanceOn: "tour:action:ai_configured",
    },
    {
      id: "chat",
      icon: MessageCircle,
      title: t("tour.chat_title"),
      description: t("tour.chat_desc"),
      agentMessage: t("tour.chat_agent"),
      targetSelector: "[data-tour='chat']",
      position: "right",
      autoAdvanceOn: "tour:action:first_message",
    },
    {
      id: "explore",
      icon: Compass,
      title: t("tour.explore_title"),
      description: t("tour.explore_desc"),
      agentMessage: t("tour.explore_agent"),
      targetSelector: "[data-tour='explore']",
      position: "right",
    },
  ];

  if (!emailVerified) {
    baseSteps.push({
      id: "verify_email",
      icon: Compass,
      title: t("tour.verify_title"),
      description: t("tour.verify_desc"),
      agentMessage: t("tour.verify_agent"),
    });
  }

  return { storageKey: "jandosoft_product_tour", steps: baseSteps };
}
