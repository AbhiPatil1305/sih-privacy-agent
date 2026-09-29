import { SafeBrowserContext, AgentAction, AgentPlanRequest, AgentPlanResponse } from '../shared/types';

const SERVER_URL = 'http://localhost:3000/api/plan';

export async function fetchAgentPlan(
  task: string, 
  context: SafeBrowserContext,
  stepNumber: number = 1
): Promise<{ status: "continue" | "complete", actions: AgentAction[], reasoning: string, metrics?: any }> {
  console.log(`[API Client] Sending sanitized payload (Step ${stepNumber}) to server at ${SERVER_URL}...`);

  const payload: AgentPlanRequest = {
    task,
    pageTitle: context.pageTitle,
    url: context.url,
    sanitizedScreenshot: context.sanitizedScreenshot,
    sanitizedDOM: context.sanitizedDOM,
    visibleElements: context.visibleElements,
    detectedObjects: context.detectedObjects,
    stepNumber
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 180000);

  try {
    const response = await fetch(SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = `Server Error (${response.status}): ${errorData.error}`;
        }
      } catch (_) {
        // Fallback to status text
      }
      throw new Error(errorMessage);
    }

    const data: AgentPlanResponse = await response.json();

    if (!data.success && data.error) {
      throw new Error(`Server returned error: ${data.error}`);
    }

    const planStatus = data.status || 'continue';

    // If task is complete, no action is required
    if (planStatus === 'complete') {
      return {
        status: 'complete',
        actions: [],
        reasoning: data.reasoning || 'Task completed successfully according to VLM.',
        metrics: data.metrics
      };
    }

    if (!data.actions || !Array.isArray(data.actions) || data.actions.length === 0) {
      throw new Error("Server returned an invalid or empty actions list for status='continue'.");
    }

    // Validate that actions adhere to expected AgentAction format
    for (const act of data.actions) {
      if (!act.action) {
        throw new Error("Server returned malformed action missing 'action' field.");
      }
    }

    return {
      status: 'continue',
      actions: data.actions,
      reasoning: data.reasoning || "Server planned task action successfully.",
      metrics: data.metrics
    };

  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error("Request to server timed out (180s limit exceeded).");
    }
    if (error.message && error.message.includes('Failed to fetch')) {
      throw new Error(`Server unavailable at ${SERVER_URL}. Please ensure the local server is running.`);
    }
    throw error;
  }
}


