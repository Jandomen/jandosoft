import mongoose, { Schema, Document } from "mongoose";
import { CATEGORIES } from "@/lib/categories/registry";

export interface IProduct {
  id: number;
  name: string;
  price: number;
  stock: number;
}

export interface ICustomer {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export interface IOrder {
  id: number;
  product: string;
  amount: number;
  status: string;
}

export interface IService {
  id: number;
  name: string;
  desc: string;
  price: number;
  duration?: number;
}

export interface IMenuItem {
  id: number;
  name: string;
  desc: string;
  price: number;
  category: string;
  imageUrl: string;
  ingredients: string;
  calories: number;
  dietaryInfo: string;
  featured: boolean;
  preparationTime: number;
}

export interface IRecipe {
  id: number;
  name: string;
  ingredients: string;
  instructions: string;
  prepTime: number;
  cookTime: number;
  difficulty: string;
  servings: number;
  calories: number;
  imageUrl: string;
  tags: string;
}

export interface ICourse {
  id: number;
  name: string;
  desc: string;
  price: number;
  durationWeeks: number;
  schedule: string;
  instructor: string;
  maxStudents: number;
  level: string;
  startDate: string;
  imageUrl: string;
}

export interface IClass {
  id: number;
  name: string;
  course: string;
  teacher: string;
  schedule: string;
  capacity: number;
  price: number;
  enrolled: number;
  room: string;
  startDate: string;
  endDate: string;
  recurring: string;
}

export interface IStudent {
  id: number;
  name: string;
  email: string;
  phone: string;
  grade: string;
  parentName: string;
  address: string;
  birthDate: string;
  enrollmentDate: string;
  emergencyContact: string;
  notes: string;
  photo: string;
}

export interface IGrade {
  id: number;
  studentName: string;
  course: string;
  score: number;
  period: string;
  comments: string;
  subject: string;
  gradeWeight: number;
  letterGrade: string;
  semester: string;
  attendance: number;
}

export interface IClient {
  id: number;
  name: string;
  email: string;
  phone: string;
  caseType: string;
  notes: string;
  address: string;
  birthDate: string;
  idNumber: string;
  preferredContact: string;
  status: string;
  assignedAttorney: string;
}

export interface ICaseFile {
  id: number;
  caseNumber: string;
  clientName: string;
  type: string;
  status: string;
  description: string;
  court: string;
  judge: string;
  filingDate: string;
  opposingCounsel: string;
  outcome: string;
}

export interface IHearing {
  id: number;
  caseNumber: string;
  date: string;
  court: string;
  judge: string;
  notes: string;
  time: string;
  room: string;
  hearingType: string;
  duration: number;
  outcome: string;
}

export interface IMedicalRecord {
  id: number;
  patientName: string;
  date: string;
  diagnosis: string;
  doctor: string;
  notes: string;
  visitType: string;
  symptoms: string;
  treatment: string;
  followUpDate: string;
  attachments: string;
}

export interface IPrescription {
  id: number;
  patientName: string;
  medication: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate: string;
  prescribedBy: string;
  pharmacy: string;
  refills: number;
  instructions: string;
  strength: string;
}

export interface IDoctor {
  id: number;
  name: string;
  specialty: string;
  phone: string;
  email: string;
  schedule: string;
  licenseNumber: string;
  department: string;
  bio: string;
  imageUrl: string;
  consultationFee: number;
  available: boolean;
}

export interface IInventoryItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  supplier: string;
  category: string;
  sku: string;
  minStock: number;
  location: string;
  expirationDate: string;
  unit: string;
  description: string;
}

export interface IGalleryItem {
  id: number;
  title: string;
  imageUrl: string;
  desc: string;
  altText: string;
  category: string;
  featured: boolean;
  date: string;
}

export interface ITestimonial {
  id: number;
  clientName: string;
  text: string;
  rating: number;
  date: string;
  company: string;
  position: string;
  avatar: string;
  approved: boolean;
  featured: boolean;
}

export interface IDocument {
  id: number;
  name: string;
  fileUrl: string;
  type: string;
  desc: string;
  uploadDate: string;
  tags: string;
  size: number;
  version: string;
  expiryDate: string;
  signed: boolean;
}

export interface IBarber {
  id: number;
  name: string;
  phone: string;
  email: string;
  photo: string;
  specialties: string[];
  bio: string;
  schedule: Record<string, { start: string; end: string }>;
  active: boolean;
  joinedAt: string;
}

export interface IBarberQueueEntry {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceRequested: string;
  barberId?: number;
  position: number;
  status: "waiting" | "in_progress" | "completed" | "cancelled";
  checkInTime: string;
  startedAt?: string;
  completedAt?: string;
  notes: string;
}

export interface IBarberServiceHistory {
  id: string;
  barberId: number;
  barberName: string;
  customerName: string;
  customerPhone: string;
  service: string;
  price: number;
  duration: number;
  notes: string;
  rating?: number;
  date: string;
}

export interface IStore extends Document {
  ownerEmail: string;
  name: string;
  slug: string;
  slugHistory?: string[];
  desc: string;
  industry: string;
  type: string;
  typeLabel: string;
  category: string;
  createdAt: string;
  location: string;
  phone: string;
  coordinates: { lat: number; lng: number };
  products: IProduct[];
  customers: ICustomer[];
  orders: IOrder[];
  services: IService[];
  menuItems: IMenuItem[];
  recipes: IRecipe[];
  courses: ICourse[];
  classes: IClass[];
  students: IStudent[];
  grades: IGrade[];
  clients: IClient[];
  caseFiles: ICaseFile[];
  hearings: IHearing[];
  medicalRecords: IMedicalRecord[];
  prescriptions: IPrescription[];
  doctors: IDoctor[];
  inventoryItems: IInventoryItem[];
  galleryItems: IGalleryItem[];
  testimonials: ITestimonial[];
  documents: IDocument[];
  barbers: IBarber[];
  barberQueue: IBarberQueueEntry[];
  barberServiceHistory: IBarberServiceHistory[];
  stripeAccountId?: string;
  stripeConnectAccessToken?: string;
  stripeConnectRefreshToken?: string;
  stripeConnectEmail?: string;
  paymentsEnabled?: boolean;
  paymentPolicy?: "always" | "optional" | "none";
  platformFeePercent?: number;
  paymentIntegrations?: { provider: string; credentials: Record<string, string>; enabled: boolean; isDefault: boolean; connectedAt?: Date }[];
  aiProvider?: { provider: string; apiKey: string; baseUrl: string; model: string; enabled: boolean; configuredAt?: Date } | null;
  organizationId?: mongoose.Types.ObjectId;
  image?: string;
  isPublic?: boolean;
  publicAI?: boolean;
  isSuspended?: boolean;
  suspensionReason?: string;
  suspendedUntil?: Date | null;
  automations?: IAutomation[];
  knowledgebase?: IKnowledgeEntry[];
  campaigns?: ICampaign[];
  smartForms?: any[];
  agentConfig?: IAgentConfig;
  currency?: string;
  timezone?: string;
}

interface IAutomation {
  id: number;
  name: string;
  trigger: string;
  actionType: string;
  actionConfig: Record<string, any>;
  triggerConfig: Record<string, any>;
  enabled: boolean;
  createdAt: string;
}

interface IKnowledgeEntry {
  id: number;
  title: string;
  content: string;
  category: string;
  question?: string;
  createdAt: string;
}

interface ICampaign {
  id: number;
  name: string;
  type: string;
  status: string;
  audience: string;
  subject: string;
  body: string;
  scheduledAt: string | null;
  sentAt: string | null;
  stats: { sent: number; opened: number; clicked: number; bounced: number; unsubscribed: number };
  createdAt: string;
}

interface IAgentConfig {
  systemPrompt: string;
  temperature: number;
  model: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  widgetWelcome: string;
  widgetPlaceholder: string;
  widgetHeader: string;
  borderColor: string;
  borderRadius: number;
  shadow: string;
  headerBgColor: string;
  headerTextColor: string;
  botBubbleColor: string;
  userBubbleColor: string;
}

const AutomationSchema = new Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  trigger: { type: String, required: true },
  actionType: { type: String, required: true },
  actionConfig: { type: Schema.Types.Mixed, default: {} },
  triggerConfig: { type: Schema.Types.Mixed, default: {} },
  enabled: { type: Boolean, default: true },
  createdAt: { type: String, default: "" },
}, { _id: false });

const KnowledgeEntrySchema = new Schema({
  id: { type: Number, required: true },
  title: { type: String, default: "" },
  content: { type: String, default: "" },
  category: { type: String, default: "general" },
  question: { type: String, default: undefined },
  createdAt: { type: String, default: "" },
}, { _id: false });

const CampaignSchema = new Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  type: { type: String, default: "email" },
  status: { type: String, default: "draft" },
  audience: { type: String, default: "" },
  subject: { type: String, default: "" },
  body: { type: String, default: "" },
  scheduledAt: { type: String, default: null },
  sentAt: { type: String, default: null },
  stats: { type: Schema.Types.Mixed, default: { sent: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0 } },
  createdAt: { type: String, default: "" },
}, { _id: false });

const AgentConfigSchema = new Schema({
  systemPrompt: { type: String, default: "" },
  temperature: { type: Number, default: 0.7 },
  model: { type: String, default: "gpt-4o-mini" },
  logo: { type: String, default: "" },
  primaryColor: { type: String, default: "#dc2626" },
  secondaryColor: { type: String, default: "#f5f5f5" },
  textColor: { type: String, default: "#09090b" },
  widgetWelcome: { type: String, default: "" },
  widgetPlaceholder: { type: String, default: "" },
  widgetHeader: { type: String, default: "" },
  borderColor: { type: String, default: "#e4e4e7" },
  borderRadius: { type: Number, default: 16 },
  shadow: { type: String, default: "0 8px 40px rgba(0,0,0,0.12)" },
  headerBgColor: { type: String, default: "#dc2626" },
  headerTextColor: { type: String, default: "#ffffff" },
  botBubbleColor: { type: String, default: "#f4f4f5" },
  userBubbleColor: { type: String, default: "#dc2626" },
  chatBgColor: { type: String, default: "#f9fafb" },
  inputBgColor: { type: String, default: "#ffffff" },
  inputBorderColor: { type: String, default: "#e4e4e7" },
  inputFocusColor: { type: String, default: "#dc2626" },
  inputTextColor: { type: String, default: "#18181b" },
  botTextColor: { type: String, default: "#18181b" },
  userTextColor: { type: String, default: "#ffffff" },
  fontFamily: { type: String, default: "" },
  buttonSize: { type: Number, default: 56 },
  buttonPosition: { type: String, default: "bottom-right" },
  buttonStyle: { type: String, default: "circle" },
  chatWidth: { type: Number, default: 380 },
  chatHeight: { type: Number, default: 540 },
  animationType: { type: String, default: "slide" },
  inputRadius: { type: Number, default: 12 },
  bubbleRadius: { type: Number, default: 16 },
  theme: { type: String, default: "custom" },
  lang: { type: String, default: "es" },
}, { _id: false });

const ProductSchema = new Schema<IProduct>({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
}, { _id: false });

const CustomerSchema = new Schema<ICustomer>({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  email: { type: String, default: "" },
  phone: { type: String, default: "" },
}, { _id: false });

const OrderSchema = new Schema<IOrder>({
  id: { type: Number, required: true },
  product: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, default: "Pendiente" },
}, { _id: false });

const ServiceSchema = new Schema<IService>({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  desc: { type: String, default: "" },
  price: { type: Number, required: true },
  duration: { type: Number, default: 60 },
}, { _id: false });

const MenuItemSchema = new Schema<IMenuItem>({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  desc: { type: String, default: "" },
  price: { type: Number, required: true },
  category: { type: String, default: "General" },
  imageUrl: { type: String, default: "" },
  ingredients: { type: String, default: "" },
  calories: { type: Number, default: 0 },
  dietaryInfo: { type: String, default: "" },
  featured: { type: Boolean, default: false },
  preparationTime: { type: Number, default: 0 },
}, { _id: false });

const RecipeSchema = new Schema<IRecipe>({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  ingredients: { type: String, default: "" },
  instructions: { type: String, default: "" },
  prepTime: { type: Number, default: 0 },
  cookTime: { type: Number, default: 0 },
  difficulty: { type: String, default: "easy" },
  servings: { type: Number, default: 0 },
  calories: { type: Number, default: 0 },
  imageUrl: { type: String, default: "" },
  tags: { type: String, default: "" },
}, { _id: false });

const CourseSchema = new Schema<ICourse>({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  desc: { type: String, default: "" },
  price: { type: Number, required: true },
  durationWeeks: { type: Number, default: 0 },
  schedule: { type: String, default: "" },
  instructor: { type: String, default: "" },
  maxStudents: { type: Number, default: 0 },
  level: { type: String, default: "beginner" },
  startDate: { type: String, default: "" },
  imageUrl: { type: String, default: "" },
}, { _id: false });

const ClassSchema = new Schema<IClass>({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  course: { type: String, default: "" },
  teacher: { type: String, default: "" },
  schedule: { type: String, default: "" },
  capacity: { type: Number, default: 0 },
  price: { type: Number, default: 0 },
  enrolled: { type: Number, default: 0 },
  room: { type: String, default: "" },
  startDate: { type: String, default: "" },
  endDate: { type: String, default: "" },
  recurring: { type: String, default: "" },
}, { _id: false });

const StudentSchema = new Schema<IStudent>({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  email: { type: String, default: "" },
  phone: { type: String, default: "" },
  grade: { type: String, default: "" },
  parentName: { type: String, default: "" },
  address: { type: String, default: "" },
  birthDate: { type: String, default: "" },
  enrollmentDate: { type: String, default: "" },
  emergencyContact: { type: String, default: "" },
  notes: { type: String, default: "" },
  photo: { type: String, default: "" },
}, { _id: false });

const GradeSchema = new Schema<IGrade>({
  id: { type: Number, required: true },
  studentName: { type: String, required: true },
  course: { type: String, default: "" },
  score: { type: Number, default: 0 },
  period: { type: String, default: "" },
  comments: { type: String, default: "" },
  subject: { type: String, default: "" },
  gradeWeight: { type: Number, default: 100 },
  letterGrade: { type: String, default: "" },
  semester: { type: String, default: "" },
  attendance: { type: Number, default: 0 },
}, { _id: false });

const ClientSchema = new Schema<IClient>({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  email: { type: String, default: "" },
  phone: { type: String, default: "" },
  caseType: { type: String, default: "" },
  notes: { type: String, default: "" },
  address: { type: String, default: "" },
  birthDate: { type: String, default: "" },
  idNumber: { type: String, default: "" },
  preferredContact: { type: String, default: "email" },
  status: { type: String, default: "active" },
  assignedAttorney: { type: String, default: "" },
}, { _id: false });

const CaseFileSchema = new Schema<ICaseFile>({
  id: { type: Number, required: true },
  caseNumber: { type: String, required: true },
  clientName: { type: String, default: "" },
  type: { type: String, default: "" },
  status: { type: String, default: "Activo" },
  description: { type: String, default: "" },
  court: { type: String, default: "" },
  judge: { type: String, default: "" },
  filingDate: { type: String, default: "" },
  opposingCounsel: { type: String, default: "" },
  outcome: { type: String, default: "" },
}, { _id: false });

const HearingSchema = new Schema<IHearing>({
  id: { type: Number, required: true },
  caseNumber: { type: String, required: true },
  date: { type: String, default: "" },
  court: { type: String, default: "" },
  judge: { type: String, default: "" },
  notes: { type: String, default: "" },
  time: { type: String, default: "" },
  room: { type: String, default: "" },
  hearingType: { type: String, default: "" },
  duration: { type: Number, default: 60 },
  outcome: { type: String, default: "" },
}, { _id: false });

const MedicalRecordSchema = new Schema<IMedicalRecord>({
  id: { type: Number, required: true },
  patientName: { type: String, required: true },
  date: { type: String, default: "" },
  diagnosis: { type: String, default: "" },
  doctor: { type: String, default: "" },
  notes: { type: String, default: "" },
  visitType: { type: String, default: "general" },
  symptoms: { type: String, default: "" },
  treatment: { type: String, default: "" },
  followUpDate: { type: String, default: "" },
  attachments: { type: String, default: "" },
}, { _id: false });

const PrescriptionSchema = new Schema<IPrescription>({
  id: { type: Number, required: true },
  patientName: { type: String, required: true },
  medication: { type: String, required: true },
  dosage: { type: String, default: "" },
  frequency: { type: String, default: "" },
  startDate: { type: String, default: "" },
  endDate: { type: String, default: "" },
  prescribedBy: { type: String, default: "" },
  pharmacy: { type: String, default: "" },
  refills: { type: Number, default: 0 },
  instructions: { type: String, default: "" },
  strength: { type: String, default: "" },
}, { _id: false });

const DoctorSchema = new Schema<IDoctor>({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  specialty: { type: String, default: "" },
  phone: { type: String, default: "" },
  email: { type: String, default: "" },
  schedule: { type: String, default: "" },
  licenseNumber: { type: String, default: "" },
  department: { type: String, default: "" },
  bio: { type: String, default: "" },
  imageUrl: { type: String, default: "" },
  consultationFee: { type: Number, default: 0 },
  available: { type: Boolean, default: true },
}, { _id: false });

const InventoryItemSchema = new Schema<IInventoryItem>({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, default: 0 },
  price: { type: Number, default: 0 },
  supplier: { type: String, default: "" },
  category: { type: String, default: "" },
  sku: { type: String, default: "" },
  minStock: { type: Number, default: 0 },
  location: { type: String, default: "" },
  expirationDate: { type: String, default: "" },
  unit: { type: String, default: "pcs" },
  description: { type: String, default: "" },
}, { _id: false });

const GalleryItemSchema = new Schema<IGalleryItem>({
  id: { type: Number, required: true },
  title: { type: String, required: true },
  imageUrl: { type: String, default: "" },
  desc: { type: String, default: "" },
  altText: { type: String, default: "" },
  category: { type: String, default: "" },
  featured: { type: Boolean, default: false },
  date: { type: String, default: "" },
}, { _id: false });

const TestimonialSchema = new Schema<ITestimonial>({
  id: { type: Number, required: true },
  clientName: { type: String, required: true },
  text: { type: String, default: "" },
  rating: { type: Number, default: 5 },
  date: { type: String, default: "" },
  company: { type: String, default: "" },
  position: { type: String, default: "" },
  avatar: { type: String, default: "" },
  approved: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
}, { _id: false });

const DocumentSchema = new Schema<IDocument>({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  fileUrl: { type: String, default: "" },
  type: { type: String, default: "General" },
  desc: { type: String, default: "" },
  uploadDate: { type: String, default: "" },
  tags: { type: String, default: "" },
  size: { type: Number, default: 0 },
  version: { type: String, default: "1.0" },
  expiryDate: { type: String, default: "" },
  signed: { type: Boolean, default: false },
}, { _id: false });

const StoreSchema = new Schema<IStore>({
  ownerEmail: { type: String, required: true, index: true },
  name: { type: String, required: true },
  slug: { type: String, unique: true, sparse: true, index: true },
  slugHistory: { type: [String], default: [] },
  desc: { type: String, default: "" },
  industry: { type: String, default: "tecnologia" },
  type: { type: String, default: "general" },
  typeLabel: { type: String, default: "" },
  category: { type: String, default: "general", enum: Object.keys(CATEGORIES) },
  createdAt: { type: String, default: () => new Date().toISOString() },
  products: [ProductSchema],
  customers: [CustomerSchema],
  orders: [OrderSchema],
  services: [ServiceSchema],
  menuItems: [MenuItemSchema],
  recipes: [RecipeSchema],
  courses: [CourseSchema],
  classes: [ClassSchema],
  students: [StudentSchema],
  grades: [GradeSchema],
  clients: [ClientSchema],
  caseFiles: [CaseFileSchema],
  hearings: [HearingSchema],
  medicalRecords: [MedicalRecordSchema],
  prescriptions: [PrescriptionSchema],
  doctors: [DoctorSchema],
  inventoryItems: [InventoryItemSchema],
  galleryItems: [GalleryItemSchema],
  testimonials: [TestimonialSchema],
  documents: [DocumentSchema],
  barbers: [{
    id: Number,
    name: String,
    phone: String,
    email: String,
    photo: String,
    specialties: [String],
    bio: String,
    schedule: Schema.Types.Mixed,
    active: { type: Boolean, default: true },
    joinedAt: String,
  }],
  barberQueue: [{
    id: String,
    customerName: String,
    customerPhone: String,
    serviceRequested: String,
    barberId: Number,
    position: Number,
    status: { type: String, default: "waiting" },
    checkInTime: String,
    startedAt: String,
    completedAt: String,
    notes: String,
  }],
  barberServiceHistory: [{
    id: String,
    barberId: Number,
    barberName: String,
    customerName: String,
    customerPhone: String,
    service: String,
    price: Number,
    duration: Number,
    notes: String,
    rating: Number,
    date: String,
  }],
  stripeAccountId: { type: String, default: "" },
  stripeConnectAccessToken: { type: String, default: "" },
  stripeConnectRefreshToken: { type: String, default: "" },
  stripeConnectEmail: { type: String, default: "" },
  paymentsEnabled: { type: Boolean, default: false },
  paymentPolicy: { type: String, enum: ["always", "optional", "none"], default: "optional" },
  platformFeePercent: { type: Number, default: 5 },
  paymentIntegrations: { type: [Schema.Types.Mixed], default: [] },
  aiProvider: {
    type: {
      provider: { type: String, default: "" },
      apiKey: { type: String, default: "" },
      baseUrl: { type: String, default: "" },
      model: { type: String, default: "" },
      enabled: { type: Boolean, default: false },
    },
    default: null,
  },
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization", index: true },
  image: { type: String, default: "" },
  location: { type: String, default: "" },
  phone: { type: String, default: "" },
  coordinates: { type: { lat: { type: Number }, lng: { type: Number } }, default: null },
  isPublic: { type: Boolean, default: false },
  publicAI: { type: Boolean, default: false },
  isSuspended: { type: Boolean, default: false },
  suspensionReason: { type: String, default: "" },
  suspendedUntil: { type: Date, default: null },
  automations: { type: [AutomationSchema], default: [] },
  knowledgebase: { type: [KnowledgeEntrySchema], default: [] },
  campaigns: { type: [CampaignSchema], default: [] },
  smartForms: { type: [Schema.Types.Mixed], default: [] },
  agentConfig: { type: AgentConfigSchema, default: null },
  currency: { type: String, default: "USD" },
  timezone: { type: String, default: "" },
}, { timestamps: true });

export const Store = mongoose.models.Store || mongoose.model<IStore>("Store", StoreSchema);
