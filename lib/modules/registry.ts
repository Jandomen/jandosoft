export type ModuleId =
  | "dashboard"
  | "products"
  | "services"
  | "appointments"
  | "customers"
  | "orders"
  | "analytics"
  | "invoices"
  | "campaigns"
  | "integrations"
  | "automations"
  | "ai"
  | "knowledgebase"
  | "agentconfig"
  | "agentinstall"
  | "smartforms"
  | "team"
  | "orgsettings"
  | "menu"
  | "recipes"
  | "courses"
  | "classes"
  | "students"
  | "grades"
  | "clients"
  | "case_files"
  | "hearings"
  | "medical_records"
  | "prescriptions"
  | "doctors"
  | "inventory"
  | "gallery"
  | "testimonials"
  | "documents"
  | "restaurant"
  | "floor_plan"
  | "restaurant_orders"
  | "reservations"
  | "promotions"
  | "loyalty"
  | "restaurant_reviews"
  | "waiter_calls"
  | "barbers"
  | "queue"
  | "barber_history";

export interface ModuleDefinition {
  id: ModuleId;
  nameKey: string;
  descKey: string;
  icon: string;
  sectionKey: string;
  group: "management" | "automation" | "assistance" | "tools" | "industry";
}

export const MODULES: Record<ModuleId, ModuleDefinition> = {
  dashboard: {
    id: "dashboard", nameKey: "nav.dashboard", descKey: "", icon: "BarChart3",
    sectionKey: "dashboard", group: "management",
  },
  products: {
    id: "products", nameKey: "nav.products", descKey: "", icon: "Package",
    sectionKey: "products", group: "management",
  },
  services: {
    id: "services", nameKey: "nav.services", descKey: "", icon: "ConciergeBell",
    sectionKey: "services", group: "management",
  },
  appointments: {
    id: "appointments", nameKey: "nav.appointments", descKey: "", icon: "CalendarCheck",
    sectionKey: "appointments", group: "management",
  },
  customers: {
    id: "customers", nameKey: "nav.customers", descKey: "", icon: "Users",
    sectionKey: "customers", group: "management",
  },
  orders: {
    id: "orders", nameKey: "nav.orders", descKey: "", icon: "ShoppingCart",
    sectionKey: "orders", group: "management",
  },
  analytics: {
    id: "analytics", nameKey: "nav.analytics", descKey: "", icon: "TrendingUp",
    sectionKey: "analytics", group: "management",
  },
  invoices: {
    id: "invoices", nameKey: "nav.invoices", descKey: "", icon: "FileText",
    sectionKey: "invoices", group: "management",
  },
  campaigns: {
    id: "campaigns", nameKey: "nav.campaigns", descKey: "", icon: "Megaphone",
    sectionKey: "campaigns", group: "management",
  },
  integrations: {
    id: "integrations", nameKey: "nav.integrations", descKey: "", icon: "Plug",
    sectionKey: "integrations", group: "management",
  },
  automations: {
    id: "automations", nameKey: "nav.automations", descKey: "", icon: "Zap",
    sectionKey: "automations", group: "automation",
  },
  ai: {
    id: "ai", nameKey: "biz.ai_agent", descKey: "", icon: "Bot",
    sectionKey: "ai", group: "assistance",
  },
  knowledgebase: {
    id: "knowledgebase", nameKey: "biz.knowledge_base", descKey: "", icon: "BookOpen",
    sectionKey: "knowledgebase", group: "assistance",
  },
  agentconfig: {
    id: "agentconfig", nameKey: "nav.agentconfig", descKey: "", icon: "Settings",
    sectionKey: "agentconfig", group: "assistance",
  },
  agentinstall: {
    id: "agentinstall", nameKey: "nav.agentinstall", descKey: "", icon: "Code",
    sectionKey: "agentinstall", group: "assistance",
  },
  smartforms: {
    id: "smartforms", nameKey: "nav.smartforms", descKey: "", icon: "FileSpreadsheet",
    sectionKey: "smartforms", group: "tools",
  },
  team: {
    id: "team", nameKey: "nav.team", descKey: "", icon: "Users2",
    sectionKey: "team", group: "management",
  },
  orgsettings: {
    id: "orgsettings", nameKey: "nav.orgsettings", descKey: "", icon: "Building2",
    sectionKey: "orgsettings", group: "tools",
  },
  menu: {
    id: "menu", nameKey: "category.menu", descKey: "", icon: "UtensilsCrossed",
    sectionKey: "menu", group: "industry",
  },
  recipes: {
    id: "recipes", nameKey: "category.recipes", descKey: "", icon: "BookHeart",
    sectionKey: "recipes", group: "industry",
  },
  courses: {
    id: "courses", nameKey: "category.courses", descKey: "", icon: "GraduationCap",
    sectionKey: "courses", group: "industry",
  },
  classes: {
    id: "classes", nameKey: "category.classes", descKey: "", icon: "Presentation",
    sectionKey: "classes", group: "industry",
  },
  students: {
    id: "students", nameKey: "category.students", descKey: "", icon: "UserRound",
    sectionKey: "students", group: "industry",
  },
  grades: {
    id: "grades", nameKey: "category.grades", descKey: "", icon: "Award",
    sectionKey: "grades", group: "industry",
  },
  clients: {
    id: "clients", nameKey: "category.clients", descKey: "", icon: "Briefcase",
    sectionKey: "clients", group: "industry",
  },
  case_files: {
    id: "case_files", nameKey: "category.case_files", descKey: "", icon: "FolderKanban",
    sectionKey: "case_files", group: "industry",
  },
  hearings: {
    id: "hearings", nameKey: "category.hearings", descKey: "", icon: "Gavel",
    sectionKey: "hearings", group: "industry",
  },
  medical_records: {
    id: "medical_records", nameKey: "category.medical_records", descKey: "", icon: "ClipboardPlus",
    sectionKey: "medical_records", group: "industry",
  },
  prescriptions: {
    id: "prescriptions", nameKey: "category.prescriptions", descKey: "", icon: "Pill",
    sectionKey: "prescriptions", group: "industry",
  },
  doctors: {
    id: "doctors", nameKey: "category.doctors", descKey: "", icon: "Stethoscope",
    sectionKey: "doctors", group: "industry",
  },
  inventory: {
    id: "inventory", nameKey: "nav.inventory", descKey: "", icon: "Warehouse",
    sectionKey: "inventory", group: "industry",
  },
  gallery: {
    id: "gallery", nameKey: "nav.gallery", descKey: "", icon: "Image",
    sectionKey: "gallery", group: "industry",
  },
  testimonials: {
    id: "testimonials", nameKey: "nav.testimonials", descKey: "", icon: "Star",
    sectionKey: "testimonials", group: "industry",
  },
  documents: {
    id: "documents", nameKey: "nav.documents", descKey: "", icon: "FileText",
    sectionKey: "documents", group: "industry",
  },
  restaurant: {
    id: "restaurant", nameKey: "nav.restaurant", descKey: "", icon: "UtensilsCrossed",
    sectionKey: "restaurant", group: "industry",
  },
  floor_plan: {
    id: "floor_plan", nameKey: "nav.floor_plan", descKey: "", icon: "LayoutGrid",
    sectionKey: "floor_plan", group: "industry",
  },
  restaurant_orders: {
    id: "restaurant_orders", nameKey: "nav.restaurant_orders", descKey: "", icon: "ClipboardList",
    sectionKey: "restaurant_orders", group: "industry",
  },
  reservations: {
    id: "reservations", nameKey: "nav.reservations", descKey: "", icon: "CalendarCheck",
    sectionKey: "reservations", group: "industry",
  },
  promotions: {
    id: "promotions", nameKey: "nav.promotions", descKey: "", icon: "Tag",
    sectionKey: "promotions", group: "industry",
  },
  loyalty: {
    id: "loyalty", nameKey: "nav.loyalty", descKey: "", icon: "Award",
    sectionKey: "loyalty", group: "industry",
  },
  restaurant_reviews: {
    id: "restaurant_reviews", nameKey: "nav.restaurant_reviews", descKey: "", icon: "MessageSquare",
    sectionKey: "restaurant_reviews", group: "industry",
  },
  waiter_calls: {
    id: "waiter_calls", nameKey: "nav.waiter_calls", descKey: "", icon: "Bell",
    sectionKey: "waiter_calls", group: "industry",
  },
  barbers: { id: "barbers", nameKey: "nav.barbers", descKey: "", icon: "Scissors", sectionKey: "barbers", group: "industry" },
  queue: { id: "queue", nameKey: "nav.queue", descKey: "", icon: "Users", sectionKey: "queue", group: "industry" },
  barber_history: { id: "barber_history", nameKey: "nav.barber_history", descKey: "", icon: "Clock", sectionKey: "barber_history", group: "industry" },
};

export const MODULE_GROUPS = [
  { id: "management", nameKey: "biz.management" },
  { id: "automation", nameKey: "biz.automation" },
  { id: "assistance", nameKey: "biz.assistance" },
  { id: "tools", nameKey: "section.tools" },
  { id: "industry", nameKey: "category.industry" },
] as const;

export function getModule(id: ModuleId): ModuleDefinition {
  return MODULES[id];
}

export function getModules(ids: ModuleId[]): ModuleDefinition[] {
  return ids.map((id) => MODULES[id]).filter(Boolean);
}
