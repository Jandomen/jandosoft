/**
 * Intent Tracker - Manages conversation state, confirmation flows,
 * and provides context-aware instructions to the LLM.
 *
 * This module ensures:
 * - The agent always knows the current task context
 * - Destructive actions require confirmation
 * - Affirmatives apply only to the last agent question
 * - Topic changes are handled cleanly
 * - Logs are generated for every decision
 */

import {
  TaskState,
  TaskPlan,
  AgentLog,
  IntentType,
  detectIntent,
  isAffirmative,
  isTopicChange,
  generateTaskPlan,
  createTaskState,
  updateTaskState,
  serializeTaskState,
  deserializeTaskState,
} from "./task-planner";

export interface TrackerContext {
  currentTask: TaskState | null;
  messageHistory: any[];
  storeContext: any;
}

export interface TrackerDecision {
  action: "execute_tool" | "ask_for_info" | "ask_confirmation" | "respond_directly" | "clarify" | "reset_task";
  plan: TaskPlan | null;
  taskState: TaskState | null;
  responsePrefix: string | null;
  toolToExecute: { name: string; args: Record<string, any> } | null;
  logs: AgentLog[];
}

/**
 * Process a user message and decide what the agent should do
 */
export function processUserMessage(
  userMessage: string,
  history: any[],
  storeContext: any,
  serializedTaskState: string | null
): TrackerDecision {
  const logs: AgentLog[] = [];
  const currentTask = deserializeTaskState(serializedTaskState);
  const { intent, confidence } = detectIntent(userMessage);
  const affirmative = isAffirmative(userMessage);

  // ── Log intent detection ──
  logs.push({
    timestamp: new Date(),
    turn: (currentTask?.turnCount || 0) + 1,
    userInput: userMessage,
    detectedIntent: intent,
    confidence,
    selectedTool: null,
    reasoning: `Intent detected: ${intent} (confidence: ${confidence.toFixed(2)})`,
    outcome: "clarified",
  });

  // ── Case 1: Affirmative to agent's last question ──
  if (affirmative && currentTask?.lastAgentQuestion && currentTask.plan) {
    const updatedState = { ...currentTask, status: "executing" as const, updatedAt: new Date() };

    logs[logs.length - 1].reasoning = `Affirmative response to: "${currentTask.lastAgentQuestion.substring(0, 100)}..."`;
    logs[logs.length - 1].outcome = "executed";

    return {
      action: currentTask.plan.needsConfirmation ? "execute_tool" : "execute_tool",
      plan: currentTask.plan,
      taskState: updatedState,
      responsePrefix: null,
      toolToExecute: currentTask.plan.toolToCall
        ? { name: currentTask.plan.toolToCall, args: currentTask.plan.toolArgs }
        : null,
      logs,
    };
  }

  // ── Case 2: Affirmative without context → ask what they mean ──
  if (affirmative && !currentTask?.lastAgentQuestion) {
    logs[logs.length - 1].reasoning = "Affirmative without pending question. Asking for clarification.";
    logs[logs.length - 1].outcome = "clarified";

    return {
      action: "clarify",
      plan: null,
      taskState: currentTask,
      responsePrefix: null,
      toolToExecute: null,
      logs,
    };
  }

  // ── Case 3: Topic change ──
  if (currentTask && currentTask.status !== "completed" && currentTask.status !== "idle") {
    if (isTopicChange(currentTask.conversationTopic as IntentType, intent, currentTask.conversationTopic, userMessage)) {
      logs[logs.length - 1].reasoning = `Topic change detected: ${currentTask.conversationTopic} → ${intent}. Previous task abandoned.`;
      logs[logs.length - 1].outcome = "clarified";

      // Generate new plan for the new intent
      const newPlan = generateTaskPlan(userMessage, history, storeContext, null);
      const newTask = createTaskState(newPlan);

      return {
        action: newPlan.toolToCall && newPlan.missingParams.length === 0 && !newPlan.needsConfirmation
          ? "execute_tool"
          : newPlan.missingParams.length > 0
          ? "ask_for_info"
          : newPlan.needsConfirmation
          ? "ask_confirmation"
          : "respond_directly",
        plan: newPlan,
        taskState: newTask,
        responsePrefix: null,
        toolToExecute: newPlan.toolToCall && newPlan.missingParams.length === 0 && !newPlan.needsConfirmation
          ? { name: newPlan.toolToCall, args: newPlan.toolArgs }
          : null,
        logs,
      };
    }
  }

  // ── Case 4: New task from idle state or first message ──
  if (!currentTask || currentTask.status === "idle" || currentTask.status === "completed") {
    const plan = generateTaskPlan(userMessage, history, storeContext, null);
    const task = createTaskState(plan);

    if (plan.needsConfirmation) {
      logs[logs.length - 1].outcome = "asked_confirmation";
      logs[logs.length - 1].reasoning = `Destructive action detected. Confirmation needed: ${plan.confirmationMessage}`;
      return {
        action: "ask_confirmation",
        plan,
        taskState: task,
        responsePrefix: plan.confirmationMessage,
        toolToExecute: null,
        logs,
      };
    }

    if (plan.missingParams.length > 0 && plan.toolToCall) {
      logs[logs.length - 1].outcome = "asked_for_info";
      logs[logs.length - 1].reasoning = `Missing params: ${plan.missingParams.join(", ")}`;
      return {
        action: "ask_for_info",
        plan,
        taskState: { ...task, status: "collecting_info" },
        responsePrefix: null,
        toolToExecute: null,
        logs,
      };
    }

    if (plan.toolToCall && plan.missingParams.length === 0) {
      logs[logs.length - 1].selectedTool = plan.toolToCall;
      logs[logs.length - 1].outcome = "executed";
      logs[logs.length - 1].reasoning = plan.reasoning;
      return {
        action: "execute_tool",
        plan,
        taskState: task,
        responsePrefix: null,
        toolToExecute: { name: plan.toolToCall, args: plan.toolArgs },
        logs,
      };
    }

    // No tool needed, just respond
    logs[logs.length - 1].outcome = "executed";
    logs[logs.length - 1].reasoning = plan.reasoning;
    return {
      action: "respond_directly",
      plan,
      taskState: task,
      responsePrefix: null,
      toolToExecute: null,
      logs,
    };
  }

  // ── Case 5: Existing task in progress, new message ──
  // Continue with existing context
  logs[logs.length - 1].reasoning = `Continuing task: ${currentTask.conversationTopic} (status: ${currentTask.status})`;
  logs[logs.length - 1].outcome = "clarified";

  return {
    action: "respond_directly",
    plan: currentTask.plan,
    taskState: currentTask,
    responsePrefix: null,
    toolToExecute: null,
    logs,
  };
}

/**
 * Generate context injection for the system prompt based on current task state
 */
export function generateTaskContext(state: TaskState | null): string {
  if (!state || !state.plan) return "";

  const lines: string[] = [];
  lines.push("--- CURRENT TASK CONTEXT ---");
  lines.push(`Active intent: ${state.plan.intent}`);
  lines.push(`Task status: ${state.status}`);
  lines.push(`Turn count in this task: ${state.turnCount}`);

  if (state.plan.missingParams.length > 0) {
    lines.push(`Still need to collect: ${state.plan.missingParams.join(", ")}`);
  }

  if (state.plan.providedParams && Object.keys(state.plan.providedParams).length > 0) {
    lines.push(`Already collected: ${JSON.stringify(state.plan.providedParams)}`);
  }

  if (state.pendingConfirmation) {
    lines.push(`AWAITING USER CONFIRMATION for destructive action.`);
    lines.push(`Confirmation message sent: "${state.lastAgentQuestion?.substring(0, 200)}"`);
  }

  if (state.lastAgentQuestion) {
    lines.push(`Last question I asked: "${state.lastAgentQuestion.substring(0, 200)}"`);
    lines.push(`If the user responds with "sí", "ok", "hazlo", "continúa", "adelante", "yes", "sure", "go ahead" — this is a response to THAT specific question.`);
  }

  if (state.lastToolExecuted) {
    lines.push(`Last tool executed: ${state.lastToolExecuted}`);
    lines.push(`Task is COMPLETED. Wait for new instructions from the user.`);
  }

  lines.push("--- END TASK CONTEXT ---");
  return lines.join("\n");
}

/**
 * Update task state after the agent has responded
 */
export function trackAgentResponse(
  state: TaskState | null,
  agentResponse: string,
  toolExecuted?: string,
  toolResult?: string
): TaskState | null {
  if (!state) return null;
  return updateTaskState(state, agentResponse, toolExecuted, toolResult);
}

export { serializeTaskState, deserializeTaskState };
