/* eslint-disable @typescript-eslint/no-explicit-any */
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

  // ── Case 1: Affirmative while awaiting confirmation → execute the pending tool ──
  if (affirmative && currentTask?.pendingConfirmation && currentTask?.plan?.toolToCall) {
    const updatedState = {
      ...currentTask,
      status: "executing" as const,
      pendingConfirmation: false,
      lastAgentQuestion: null,
      updatedAt: new Date(),
    };

    logs[logs.length - 1].reasoning = `Confirmed destructive action: "${currentTask.plan.confirmationMessage}". Executing tool.`;
    logs[logs.length - 1].outcome = "executed";

    return {
      action: "execute_tool",
      plan: currentTask.plan,
      taskState: updatedState,
      responsePrefix: null,
      toolToExecute: {
        name: currentTask.plan.toolToCall,
        args: currentTask.plan.toolArgs,
      },
      logs,
    };
  }

  // ── Case 2: Affirmative to last agent question (collecting info) ──
  if (affirmative && currentTask?.lastAgentQuestion && currentTask?.plan) {
    const updatedState = {
      ...currentTask,
      status: "executing" as const,
      pendingConfirmation: false,
      updatedAt: new Date(),
    };

    logs[logs.length - 1].reasoning = `Affirmative to: "${currentTask.lastAgentQuestion.substring(0, 100)}..."`;
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

  // ── Case 3: Affirmative without context → clarify ──
  if (affirmative && !currentTask?.lastAgentQuestion && !currentTask?.pendingConfirmation) {
    logs[logs.length - 1].reasoning = "Affirmative without pending question nor confirmation. Asking for clarification.";
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

  // ── Case 4: Topic change ──
  if (currentTask && currentTask.status !== "completed" && currentTask.status !== "idle" && currentTask.status !== "failed") {
    const topicChanged = isTopicChange(
      currentTask.conversationTopic as IntentType,
      intent,
      currentTask.conversationTopic,
      userMessage,
      currentTask.status,
    );

    if (topicChanged) {
      logs[logs.length - 1].reasoning = `Topic change detected: ${currentTask.conversationTopic} → ${intent}. Previous task abandoned.`;
      logs[logs.length - 1].outcome = "clarified";

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

  // ── Case 5: Existing task in progress, continue collecting info ──
  if (currentTask && currentTask.status !== "completed" && currentTask.status !== "idle") {
    logs[logs.length - 1].reasoning = `Continuing task: ${currentTask.conversationTopic} (status: ${currentTask.status}). New info provided.`;
    logs[logs.length - 1].outcome = "clarified";

    // Rebuild plan with new user message to extract additional params
    const updatedPlan = generateTaskPlan(userMessage, history, storeContext, currentTask);

    return {
      action: updatedPlan.toolToCall && updatedPlan.missingParams.length === 0 && !updatedPlan.needsConfirmation
        ? "execute_tool"
        : updatedPlan.missingParams.length > 0
        ? "ask_for_info"
        : updatedPlan.needsConfirmation
        ? "ask_confirmation"
        : "respond_directly",
      plan: updatedPlan,
      taskState: {
        ...currentTask,
        plan: updatedPlan,
        updatedAt: new Date(),
      },
      responsePrefix: null,
      toolToExecute: updatedPlan.toolToCall && updatedPlan.missingParams.length === 0 && !updatedPlan.needsConfirmation
        ? { name: updatedPlan.toolToCall, args: updatedPlan.toolArgs }
        : null,
      logs,
    };
  }

  // ── Case 6: New task (idle or completed) ──
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
