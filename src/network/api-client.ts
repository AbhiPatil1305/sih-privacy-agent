import { SafeBrowserContext, AgentAction } from '../shared/types';

export interface PlanResponse {
  actions: AgentAction[];
  reasoning: string;
  serverConnected: boolean;
  mode: string;
}

export async function fetchAgentPlan(
  task: string,
  context: SafeBrowserContext
): Promise<PlanResponse> {
  const SERVER_URL = 'http://localhost:3000/api/plan';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ task, context }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return {
        actions: data.actions || [],
        reasoning: data.reasoning || 'Remote AI processed sanitized context.',
        serverConnected: true,
        mode: data.mode || 'demo'
      };
    }
  } catch (err) {
    console.warn('Backend server not reachable at http://localhost:3000/api/plan. Falling back to local Demo Agent reasoning.', err);
  }

  // Fallback: Local Demo Agent Mode (deterministic reasoning layer)
  const lowerTask = (task || '').toLowerCase();
  const isFlightSearch =
    (lowerTask.includes('search') && lowerTask.includes('flight')) ||
    (lowerTask.includes('mumbai') && lowerTask.includes('delhi')) ||
    lowerTask.includes('flight');

  if (isFlightSearch) {
    const btn = context.visibleElements.find(el => {
      const l = (el.label || '').toLowerCase();
      const isClickable = ['button', 'a', 'div', 'span'].includes(el.tag) || (!!el.role && ['button', 'link'].includes(el.role));
      return isClickable && (l.includes('search flight') || l.includes('search'));
    });

    if (btn) {
      return {
        actions: [{ action: 'click', element_id: btn.id }],
        reasoning: `Agent Reasoning — Demo Mode (Local Fallback): Identified flight search (Mumbai → Delhi). Selected '${btn.label}' from sanitized DOM. Zero private profile credentials required.`,
        serverConnected: false,
        mode: 'demo'
      };
    }
  }

  if (lowerTask.includes('scroll down')) {
    return {
      actions: [{ action: 'scroll', direction: 'down' }],
      reasoning: 'Agent Reasoning — Demo Mode: Executing requested scroll down.',
      serverConnected: false,
      mode: 'demo'
    };
  }

  return {
    actions: [{ action: 'wait', duration: 1000 }],
    reasoning: 'Agent Reasoning — Demo Mode: Could not map request to a visible action in sanitized context.',
    serverConnected: false,
    mode: 'demo'
  };
}
