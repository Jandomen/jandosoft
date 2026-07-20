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
import { GoalManager, isConfirmationResponse, isExplicitTopicChange } from "./goal-manager";
import { WorkflowManager } from "./workflow-manager";

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
  goalManager: GoalManager | null;
  workflowManager: WorkflowManager | null;
}

export function processUserMessage(
  userMessage: string,
  history: any[],
  storeContext: any,
  serializedTaskState: string | null,
  serializedGoalState: string | null = null,
  serializedWorkflowState: string | null = null
): TrackerDecision {
  const logs: AgentLog[] = [];
  const currentTask = deserializeTaskState(serializedTaskState);
  const goalManager = GoalManager.deserialize(serializedGoalState);
  const workflowManager = WorkflowManager.deserialize(serializedWorkflowState);
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

  // ═══════════════════════════════════════════════════
  // WORKFLOW MANAGER: HIGHEST PRIORITY
  // If a workflow is active, it OVERRIDES everything.
  // ═══════════════════════════════════════════════════
  if (workflowManager.isActive()) {
    const wfResult = workflowManager.processMessage(userMessage);

    logs[logs.length - 1].reasoning = `Workflow active (${workflowManager.getState()?.type}). Processing step: ${wfResult.action}`;
    logs[logs.length - 1].outcome = wfResult.action === "cancel" ? "clarified" : "executed";

    // Cancel
    if (wfResult.action === "cancel") {
      return {
        action: "respond_directly",
        plan: null,
        taskState: currentTask,
        responsePrefix: wfResult.summary || "Flujo cancelado.",
        toolToExecute: null,
        logs,
        goalManager,
        workflowManager,
      };
    }

    // Continue collecting info
    if (wfResult.action === "continue_collecting") {
      return {
        action: "ask_for_info",
        plan: null,
        taskState: currentTask,
        responsePrefix: wfResult.question,
        toolToExecute: null,
        logs,
        goalManager,
        workflowManager,
      };
    }

    // Advance to next step with question
    if (wfResult.action === "advance_step" && wfResult.question) {
      return {
        action: "ask_for_info",
        plan: null,
        taskState: currentTask,
        responsePrefix: wfResult.question,
        toolToExecute: null,
        logs,
        goalManager,
        workflowManager,
      };
    }

    // Execute tool step
    if (wfResult.action === "execute_step" && wfResult.toolToExecute) {
      return {
        action: "execute_tool",
        plan: null,
        taskState: currentTask,
        responsePrefix: null,
        toolToExecute: wfResult.toolToExecute,
        logs,
        goalManager,
        workflowManager,
      };
    }

    // Workflow completed after inform step
    if (wfResult.action === "no_workflow") {
      return {
        action: "respond_directly",
        plan: null,
        taskState: currentTask,
        responsePrefix: null,
        toolToExecute: null,
        logs,
        goalManager,
        workflowManager,
      };
    }
  }

  // ═══════════════════════════════════════════════════
  // NO ACTIVE WORKFLOW — Check if user wants to START one
  // ═══════════════════════════════════════════════════
  if (!workflowManager.isActive()) {
    const detectedType = workflowManager.detectWorkflowIntent(userMessage);
    if (detectedType) {
      workflowManager.startWorkflow(detectedType, storeContext);
      logs[logs.length - 1].reasoning = `New workflow started: ${detectedType}`;

      // Get the first question from the workflow
      const firstStep = workflowManager.getState()?.steps[0];
      if (firstStep) {
        const question = firstStep.questionTemplate || "Empezemos...";
        return {
          action: "ask_for_info",
          plan: null,
          taskState: currentTask,
          responsePrefix: question,
          toolToExecute: null,
          logs,
          goalManager,
        workflowManager,
        };
      }
    }
  }

  // ── GOAL MANAGEMENT: Detect goal ──
  const goalState = goalManager.detectGoal(userMessage, intent, confidence, storeContext);

  // If explicit topic change, abandon old goal and start fresh
  if (goalManager.getState() === null && currentTask && currentTask.status !== "completed") {
    logs[logs.length - 1].reasoning = `Explicit topic change detected. Abandoning previous goal.`;
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
      goalManager,
        workflowManager,    };
  }

  // ── GOAL LOCK: If goal is locked, force continuation ──
  if (goalManager.isLocked()) {
    // Affirmative → continue current goal
    if (affirmative && goalManager.getState()?.pendingConfirmation) {
      goalManager.clearConfirmation();
      goalManager.setExecuting();
      const plan = generateTaskPlan(userMessage, history, storeContext, currentTask);
      if (plan.toolToCall) {
        logs[logs.length - 1].reasoning = `Goal locked. User confirmed. Executing tool: ${plan.toolToCall}`;
        logs[logs.length - 1].outcome = "executed";
        return {
          action: "execute_tool",
          plan,
          taskState: currentTask,
          responsePrefix: null,
          toolToExecute: { name: plan.toolToCall, args: plan.toolArgs },
          logs,
          goalManager,
        workflowManager,        };
      }
    }

    if (affirmative && goalManager.getState()?.lastAgentQuestion) {
      goalManager.setExecuting();
      const plan = generateTaskPlan(userMessage, history, storeContext, currentTask);
      if (plan.toolToCall && plan.missingParams.length === 0) {
        logs[logs.length - 1].reasoning = `Goal locked. Affirmative to question. Executing: ${plan.toolToCall}`;
        logs[logs.length - 1].outcome = "executed";
        return {
          action: "execute_tool",
          plan,
          taskState: currentTask,
          responsePrefix: null,
          toolToExecute: { name: plan.toolToCall, args: plan.toolArgs },
          logs,
          goalManager,
        workflowManager,        };
      }
    }

    // Continue collecting info for current goal
    goalManager.setCollecting();
    const updatedPlan = generateTaskPlan(userMessage, history, storeContext, currentTask);

    if (updatedPlan.toolToCall && updatedPlan.missingParams.length === 0 && !updatedPlan.needsConfirmation) {
      goalManager.setExecuting();
      logs[logs.length - 1].reasoning = `Goal locked. All params collected. Executing: ${updatedPlan.toolToCall}`;
      logs[logs.length - 1].outcome = "executed";
      return {
        action: "execute_tool",
        plan: updatedPlan,
        taskState: { ...currentTask!, plan: updatedPlan, updatedAt: new Date() },
        responsePrefix: null,
        toolToExecute: { name: updatedPlan.toolToCall, args: updatedPlan.toolArgs },
        logs,
        goalManager,
        workflowManager,      };
    }

    if (updatedPlan.needsConfirmation) {
      goalManager.setConfirmation(updatedPlan.confirmationMessage || "¿Confirmas?");
      logs[logs.length - 1].outcome = "asked_confirmation";
      return {
        action: "ask_confirmation",
        plan: updatedPlan,
        taskState: { ...currentTask!, plan: updatedPlan, status: "awaiting_confirmation", pendingConfirmation: true, updatedAt: new Date() },
        responsePrefix: updatedPlan.confirmationMessage,
        toolToExecute: null,
        logs,
        goalManager,
        workflowManager,      };
    }

    logs[logs.length - 1].reasoning = `Goal locked. Continuing to collect: ${updatedPlan.missingParams.join(", ")}`;
    logs[logs.length - 1].outcome = "asked_for_info";
    goalManager.setLastAgentQuestion(`Falta: ${updatedPlan.missingParams.join(", ")}`);
    return {
      action: "ask_for_info",
      plan: updatedPlan,
      taskState: { ...currentTask!, plan: updatedPlan, updatedAt: new Date() },
      responsePrefix: null,
      toolToExecute: null,
      logs,
      goalManager,
        workflowManager,    };
  }

  // ── No active goal — fall through to original logic ──

  // Case 1: Affirmative while awaiting confirmation → execute
  if (affirmative && currentTask?.pendingConfirmation && currentTask?.plan?.toolToCall) {
    const updatedState = {
      ...currentTask,
      status: "executing" as const,
      pendingConfirmation: false,
      lastAgentQuestion: null,
      updatedAt: new Date(),
    };
    if (goalManager.getState()) {
      goalManager.clearConfirmation();
      goalManager.setExecuting();
    }
    logs[logs.length - 1].reasoning = `Confirmed destructive action: "${currentTask.plan.confirmationMessage}". Executing tool.`;
    logs[logs.length - 1].outcome = "executed";
    return {
      action: "execute_tool",
      plan: currentTask.plan,
      taskState: updatedState,
      responsePrefix: null,
      toolToExecute: { name: currentTask.plan.toolToCall, args: currentTask.plan.toolArgs },
      logs,
      goalManager,
        workflowManager,    };
  }

  // Case 2: Affirmative to last agent question
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
      action: "execute_tool",
      plan: currentTask.plan,
      taskState: updatedState,
      responsePrefix: null,
      toolToExecute: currentTask.plan.toolToCall
        ? { name: currentTask.plan.toolToCall, args: currentTask.plan.toolArgs }
        : null,
      logs,
      goalManager,
        workflowManager,    };
  }

  // Case 3: Affirmative without context
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
      goalManager,
        workflowManager,    };
  }

  // Case 4: Topic change
  if (currentTask && currentTask.status !== "completed" && currentTask.status !== "idle" && currentTask.status !== "failed") {
    const topicChanged = isTopicChange(
      currentTask.conversationTopic as IntentType,
      intent,
      currentTask.conversationTopic,
      userMessage,
      currentTask.status,
    );
    if (topicChanged) {
      goalManager.changeGoal();
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
        goalManager,
        workflowManager,      };
    }
  }

  // Case 5: Existing task in progress, continue
  if (currentTask && currentTask.status !== "completed" && currentTask.status !== "idle") {
    logs[logs.length - 1].reasoning = `Continuing task: ${currentTask.conversationTopic} (status: ${currentTask.status}). New info provided.`;
    logs[logs.length - 1].outcome = "clarified";
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
      taskState: { ...currentTask, plan: updatedPlan, updatedAt: new Date() },
      responsePrefix: null,
      toolToExecute: updatedPlan.toolToCall && updatedPlan.missingParams.length === 0 && !updatedPlan.needsConfirmation
        ? { name: updatedPlan.toolToCall, args: updatedPlan.toolArgs }
        : null,
      logs,
      goalManager,
        workflowManager,    };
  }

  // Case 6: New task (idle or completed)
  const plan = generateTaskPlan(userMessage, history, storeContext, null);
  const task = createTaskState(plan);

  if (plan.needsConfirmation) {
    if (goalManager.getState()) goalManager.setConfirmation(plan.confirmationMessage || "¿Confirmas?");
    logs[logs.length - 1].outcome = "asked_confirmation";
    logs[logs.length - 1].reasoning = `Destructive action detected. Confirmation needed: ${plan.confirmationMessage}`;
    return {
      action: "ask_confirmation",
      plan,
      taskState: task,
      responsePrefix: plan.confirmationMessage,
      toolToExecute: null,
      logs,
      goalManager,
        workflowManager,    };
  }

  if (plan.missingParams.length > 0 && plan.toolToCall) {
    if (goalManager.getState()) goalManager.setCollecting();
    logs[logs.length - 1].outcome = "asked_for_info";
    logs[logs.length - 1].reasoning = `Missing params: ${plan.missingParams.join(", ")}`;
    return {
      action: "ask_for_info",
      plan,
      taskState: { ...task, status: "collecting_info" },
      responsePrefix: null,
      toolToExecute: null,
      logs,
      goalManager,
        workflowManager,    };
  }

  if (plan.toolToCall && plan.missingParams.length === 0) {
    if (goalManager.getState()) goalManager.setExecuting();
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
      goalManager,
        workflowManager,    };
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
    goalManager,
        workflowManager,  };
}

export function generateTaskContext(state: TaskState | null, goalManager?: GoalManager | null, workflowManager?: WorkflowManager | null): string {
  const parts: string[] = [];

  // Workflow context first (highest priority)
  if (workflowManager) {
    const wfCtx = workflowManager.generateWorkflowContext();
    if (wfCtx) parts.push(wfCtx);
  }

  // Goal context (second priority)
  if (goalManager) {
    const goalCtx = goalManager.generateGoalContext();
    if (goalCtx) parts.push(goalCtx);
  }

  // Legacy task context
  if (state && state.plan) {
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
    parts.push(lines.join("\n"));
  }

  return parts.join("\n\n");
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
export { GoalManager, isConfirmationResponse, isExplicitTopicChange } from "./goal-manager";
export type { GoalState, GoalSnapshot, GoalValidation } from "./goal-manager";
export { WorkflowManager } from "./workflow-manager";
export type { WorkflowState, WorkflowSnapshot, WorkflowValidation } from "./workflow-manager";
