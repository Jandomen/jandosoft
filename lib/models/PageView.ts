import mongoose, { Schema, Document } from "mongoose";

export interface IPageView extends Document {
  storeId: mongoose.Types.ObjectId;
  path: string;
  visitorId: string;
  timestamp: Date;
  referrer: string;
}

const PageViewSchema = new Schema<IPageView>({
  storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true, index: true },
  path: { type: String, required: true },
  visitorId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, index: true },
  referrer: { type: String, default: "" },
});

PageViewSchema.index({ storeId: 1, timestamp: -1 });

export const PageView = mongoose.models.PageView || mongoose.model<IPageView>("PageView", PageViewSchema);
