import { connectDB } from "@/lib/mongodb";
import ConversationMemoryModel, { IConversationMemory, IMemoryItem } from "@/lib/models/ConversationMemory";
import ConversationSummaryModel, { IConversationSummary } from "@/lib/models/ConversationSummary";
import { summarizeConversation, extractMemoryItems } from "./SummaryService";
import { buildContext } from "./ContextBuilder";
import { RECENT_MESSAGE_COUNT, SUMMARIZE_THRESHOLD } from "./TokenCounter";

export class MemoryService {
  private storeId: string;

  constructor(storeId: string) {
    this.storeId = storeId;
  }

  async getGlobalMemory(): Promise<IConversationMemory | null> {
    await connectDB();
    return ConversationMemoryModel.findOne({ storeId: this.storeId }).lean();
  }

  async createOrUpdateMemory(data: {
    businessInfo?: string;
    goals?: string[];
    preferences?: string[];
    importantData?: IMemoryItem[];
  }): Promise<IConversationMemory> {
    await connectDB();
    const update: Record<string, any> = {};
    if (data.businessInfo !== undefined) update.businessInfo = data.businessInfo;
    if (data.goals !== undefined) update.$push = { goals: { $each: data.goals } };
    else if (data.preferences !== undefined) update.$push = { preferences: { $each: data.preferences } };

    const setData: Record<string, any> = {};
    if (data.businessInfo !== undefined) setData.businessInfo = data.businessInfo;

    const pushData: Record<string, any> = {};
    if (data.goals?.length) pushData.goals = { $each: data.goals };
    if (data.preferences?.length) pushData.preferences = { $each: data.preferences };
    if (data.importantData?.length) pushData.importantData = { $each: data.importantData };

    const updateOps: Record<string, any> = {};
    if (Object.keys(setData).length) updateOps.$set = setData;
    if (Object.keys(pushData).length) updateOps.$push = pushData;

    return ConversationMemoryModel.findOneAndUpdate(
      { storeId: this.storeId },
      { ...updateOps, $setOnInsert: { storeId: this.storeId } },
      { upsert: true, new: true }
    );
  }

  async getLatestSummary(): Promise<IConversationSummary | null> {
    await connectDB();
    return ConversationSummaryModel.findOne({ storeId: this.storeId })
      .sort({ createdAt: -1 })
      .lean();
  }

  async saveSummary(summary: string, messageCount: number): Promise<IConversationSummary> {
    await connectDB();
    return ConversationSummaryModel.create({
      storeId: this.storeId,
      summary,
      messageCount,
    });
  }

  async buildOptimizedContext(params: {
    systemPrompt: string;
    allMessages: { role: string; content: string | any[] }[];
    ragResults?: string;
  }): Promise<{
    messages: { role: string; content: string | any[] }[];
    summary?: string;
    memoryUpdated: boolean;
  }> {
    const { systemPrompt, allMessages, ragResults } = params;

    const nonSystem = allMessages.filter((m) => m.role !== "system");

    const [globalMemory, latestSummary] = await Promise.all([
      this.getGlobalMemory(),
      this.getLatestSummary(),
    ]);

    let summary = latestSummary?.summary || undefined;
    let summarized = false;

    if (nonSystem.length > SUMMARIZE_THRESHOLD) {
      const keepCount = RECENT_MESSAGE_COUNT;
      const toSummarize = nonSystem.slice(0, nonSystem.length - keepCount);
      const recent = nonSystem.slice(nonSystem.length - keepCount);

      try {
        summary = await summarizeConversation(toSummarize, summary);
        await this.saveSummary(summary, nonSystem.length);
        summarized = true;

        nonSystem.length = 0;
        nonSystem.push(...recent);
      } catch (e: any) {
        console.warn("[MemoryService] Summarization failed, proceeding without:", e?.message || e);
      }
    }

    const recentMessages = nonSystem.slice(-RECENT_MESSAGE_COUNT);

    const messages = buildContext({
      systemPrompt,
      globalMemory,
      summary,
      recentMessages,
      ragResults,
    });

    let memoryUpdated = false;
    if (summarized) {
      try {
        const memory = globalMemory || { businessInfo: "", goals: [], preferences: [] };
        const extracted = await extractMemoryItems(
          recentMessages.slice(-5),
          {
            businessInfo: (memory as any)?.businessInfo || "",
            goals: (memory as any)?.goals || [],
            preferences: (memory as any)?.preferences || [],
          }
        );

        if (extracted.newBusinessInfo || extracted.newGoals.length || extracted.newPreferences.length || extracted.newImportantData.length) {
          await this.createOrUpdateMemory({
            businessInfo: extracted.newBusinessInfo || undefined,
            goals: extracted.newGoals,
            preferences: extracted.newPreferences,
            importantData: extracted.newImportantData,
          });
          memoryUpdated = true;
        }
      } catch (e: any) {
        console.warn("[MemoryService] Memory extraction failed:", e?.message || e);
      }
    }

    return { messages, summary, memoryUpdated };
  }
}
