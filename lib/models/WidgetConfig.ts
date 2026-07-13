import mongoose, { Schema, Document } from "mongoose";

export interface IWidgetConfig extends Document {
  storeId: mongoose.Types.ObjectId;
  slug: string;
  enabled: boolean;
  title: string;
  welcomeMessage: string;
  placeholder: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  logo: string;
  headerText: string;
  updatedAt: Date;
}

const WidgetConfigSchema = new Schema<IWidgetConfig>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      unique: true,
      index: true,
    },
    slug: { type: String, required: true, index: true },
    enabled: { type: Boolean, default: true },
    title: { type: String, default: "Asistente IA" },
    welcomeMessage: {
      type: String,
      default: "¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte?",
    },
    placeholder: { type: String, default: "Escribe tu mensaje..." },
    primaryColor: { type: String, default: "#dc2626" },
    secondaryColor: { type: String, default: "#f5f5f5" },
    textColor: { type: String, default: "#1a1a1a" },
    position: {
      type: String,
      enum: ["bottom-right", "bottom-left", "top-right", "top-left"],
      default: "bottom-right",
    },
    logo: { type: String, default: "" },
    headerText: { type: String, default: "" },
  },
  { timestamps: true }
);

export const WidgetConfig =
  mongoose.models.WidgetConfig ||
  mongoose.model<IWidgetConfig>("WidgetConfig", WidgetConfigSchema);
