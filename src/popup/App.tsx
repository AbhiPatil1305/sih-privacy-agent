import React, { useState } from 'react';
import { Shield, ShieldAlert, Zap, Lock, Eye, EyeOff, Activity, Download, CheckCircle2, XCircle, AlertTriangle, Clock, Layers, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { capturePage } from '../capture/page-capture';
import { MockOCRProvider, RealOCRProvider } from '../vision/ocr';
import { runPrivacyIntelligence } from '../privacy/intelligence';
import { redactScreenshot } from '../privacy/redactor';
import { applyRedactionPolicy } from '../privacy/redaction-policy';
import { fetchAgentPlan } from '../network/api-client';
import { PageCapture, PrivacyBudgetState, StepTelemetry, BoundingBox } from '../shared/types';
import { sanitizeDOM } from '../privacy/dom-sanitizer';
import { detectVisualPII } from '../privacy/visual-detector';
import { PrivacyBudgetManager, calculatePrivacyCost, DEFAULT_PRIVACY_BUDGET } from '../privacy/privacy-budget';
import { browserAPI } from '../platform/browser-api';

function injectedActionExecutor(actionPayload: any) {
  const el = actionPayload.element_id ? document.querySelector(`[data-agent-id="${actionPayload.element_id}"]`) as HTMLElement : null;

  if (actionPayload.action === 'click') {
    if (!el) return false;
    el.click();
    return true;
  }
  
  if (actionPayload.action === 'type') {
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      el.value = actionPayload.text;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
  }
  
  if (actionPayload.action === 'scroll') {
    const scrollAmount = actionPayload.direction === 'down' ? window.innerHeight / 1.5 : -window.innerHeight / 1.5;
    window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
    if (document.scrollingElement) {
      document.scrollingElement.scrollBy({ top: scrollAmount, behavior: 'smooth' });
    }
    return true;
  }

  return false;
}

export default function App() {
  const [task, setTask] = useState('');
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'failed' | 'timeout' | 'max_steps' | 'privacy_budget_exhausted'>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [ocrEngine, setOcrEngine] = useState<'mock' | 'tesseract'>('mock');

  // Dashboard Telemetry States
  const [currentStep, setCurrentStep] = useState(0);
  const [maxSteps] = useState(10);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [budgetState, setBudgetState] = useState<PrivacyBudgetState | null>(null);

  const [runtimeEngine, setRuntimeEngine] = useState<'WebGPU' | 'WASM'>('WASM');
  const [memoryMb, setMemoryMb] = useState<number | string>('N/A');
  const [perceptionLatencyMs, setPerceptionLatencyMs] = useState<number>(0);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.50);
  const [inspectorOverlayActive, setInspectorOverlayActive] = useState<boolean>(false);

  const [detectionCounts, setDetectionCounts] = useState<Record<string, number>>({});
  const [sourceCounts, setSourceCounts] = useState<{ dom: number; ocr: number; vision: number }>({ dom: 0, ocr: 0, vision: 0 });
  const [redactionCounts, setRedactionCounts] = useState<{ black: number; blur: number; preserve: number }>({ black: 0, blur: 0, preserve: 0 });
  const [policyMode, setPolicyMode] = useState<'NORMAL' | 'AGGRESSIVE' | 'STRICT'>('NORMAL');
  const [upgradedVisualCount, setUpgradedVisualCount] = useState(0);

  const [stepHistory, setStepHistory] = useState<StepTelemetry[]>([]);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const [abstractRegions, setAbstractRegions] = useState<{ category: string; bbox: BoundingBox; strategy: 'BLACK' | 'BLUR' | 'PRESERVE' }[]>([]);

  const updateMemoryEstimate = () => {
    if (typeof performance !== 'undefined' && (performance as any).memory && (performance as any).memory.usedJSHeapSize) {
      const used = Math.round((performance as any).memory.usedJSHeapSize / (1024 * 1024));
      setMemoryMb(used);
    } else {
      setMemoryMb('N/A');
    }
  };

  const [networkBoundary, setNetworkBoundary] = useState<{
    rawScreenshotBlocked: boolean;
    rawPiiBlocked: boolean;
    sanitizedContextTransmitted: boolean;
    budgetEnforced: boolean;
    transmissionStatus: 'allowed' | 'blocked';
    blockReason?: string;
  }>({
    rawScreenshotBlocked: true,
    rawPiiBlocked: true,
    sanitizedContextTransmitted: false,
    budgetEnforced: true,
    transmissionStatus: 'allowed'
  });

  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  const downloadFile = (content: string, filename: string, isJson: boolean = false) => {
    const a = document.createElement('a');
    if (isJson) {
      const blob = new Blob([content], { type: 'application/json' });
      a.href = URL.createObjectURL(blob);
    } else {
      a.href = content;
    }
    a.download = filename;
    a.click();
  };

  const exportAuditTelemetry = () => {
    const auditSummary = {
      timestamp: new Date().toISOString(),
      task,
      status,
      totalSteps: currentStep,
      maxSteps,
      elapsedMs,
      budget: budgetState,
      detectionCounts,
      sourceCounts,
      redactionCounts,
      policyMode,
      upgradedVisualCount,
      networkBoundary,
      stepHistory
    };
    downloadFile(JSON.stringify(auditSummary, null, 2), 'session-audit.json', true);
  };

  const getActiveTab = async () => {
    const tabs = await browserAPI.tabs.query({ active: true, lastFocusedWindow: true });
    if (!tabs || tabs.length === 0 || !tabs[0].id) {
       const allTabs = await browserAPI.tabs.query({ active: true });
       if (allTabs && allTabs.length > 0 && allTabs[0].id) {
         return allTabs[0];
       }
       throw new Error("No active tab found.");
    }
    return tabs[0];
  };

  const runPipeline = async () => {
    if (!task) return;
    setStatus('running');
    setLogs([]);
    setStepHistory([]);
    setCurrentStep(1);

    const MAX_STEPS = 10;
    const AGENT_TIMEOUT_MS = 300000; // 5 minutes for local VLM multi-step tasks
    const startedAt = Date.now();

    const budgetManager = new PrivacyBudgetManager(DEFAULT_PRIVACY_BUDGET);
    setBudgetState(budgetManager.state);

    const loopState: {
      task: string;
      step: number;
      maxSteps: number;
      startedAt: number;
      status: 'running' | 'completed' | 'failed' | 'timeout' | 'max_steps' | 'privacy_budget_exhausted';
      lastActionSignature?: string;
      repeatedActionCount: number;
    } = {
      task,
      step: 1,
      maxSteps: MAX_STEPS,
      startedAt,
      status: "running",
      lastActionSignature: undefined,
      repeatedActionCount: 0
    };

    try {
      const tab = await getActiveTab();

      while (loopState.status === "running") {
        const stepStart = performance.now();
        setElapsedMs(Date.now() - startedAt);
        setCurrentStep(loopState.step);

        if (Date.now() - loopState.startedAt > AGENT_TIMEOUT_MS) {
          loopState.status = "timeout";
          setStatus("timeout");
          addLog('[AGENT_TIMEOUT] Global execution timeout reached (300s). Terminating loop.');
          break;
        }

        if (loopState.step > loopState.maxSteps) {
          loopState.status = "max_steps";
          setStatus("max_steps");
          addLog(`[AGENT_MAX_STEPS] Hard maximum step limit reached (${MAX_STEPS}). Terminating loop.`);
          break;
        }

        addLog(`[AGENT_STEP] Step ${loopState.step}/${MAX_STEPS}`);

        // Stage 1: CAPTURE
        const tCap = performance.now();
        const pageData = await capturePage(tab.id!);
        const capDur = Math.round(performance.now() - tCap);

        // Stage 2 & 3: PARALLELIZED MULTI-MODAL PERCEPTION (Vision DETR + WASM OCR)
        const tPerception = performance.now();
        const ocrProvider = ocrEngine === 'mock' ? new MockOCRProvider() : new RealOCRProvider();

        const [visualResult, ocrResp] = await Promise.all([
          detectVisualPII(pageData.screenshot, pageData.viewport.devicePixelRatio),
          ocrProvider.runOCR(pageData.screenshot, pageData.viewport.devicePixelRatio)
        ]);
        const perceptionDur = Math.round(performance.now() - tPerception);
        const visDur = visualResult.telemetry?.inferenceLatencyMs || perceptionDur;
        const ocrDur = perceptionDur;
        setPerceptionLatencyMs(perceptionDur);
        setRuntimeEngine(visualResult.telemetry?.runtime || 'WASM');
        updateMemoryEstimate();

        // Stage 4: PRIVACY_PROCESS & REDACTION
        const tPriv = performance.now();
        const rawPrivacyRegions = runPrivacyIntelligence(pageData.elements, ocrResp.results, visualResult.regions);
        
        const { updatedRegions: privacyRegions, summary: policySummary } = applyRedactionPolicy(rawPrivacyRegions, budgetManager.state);
        const privDur = Math.round(performance.now() - tPriv);

        const tRedact = performance.now();
        const safeImage = await redactScreenshot(pageData.screenshot, privacyRegions, pageData.viewport.devicePixelRatio);
        const sanitizedElements = sanitizeDOM(pageData.elements, privacyRegions as any);
        const redactDur = Math.round(performance.now() - tRedact);

        // Update Dashboard Aggregates
        const catCounts: Record<string, number> = {};
        let sDom = 0, sOcr = 0, sVis = 0;
        let cBlack = 0, cBlur = 0, cPreserve = 0;

        for (const r of privacyRegions) {
          const cat = r.category.toUpperCase();
          catCounts[cat] = (catCounts[cat] || 0) + 1;
          if (r.source === 'dom') sDom++;
          else if (r.source === 'ocr') sOcr++;
          else if (r.source === 'vision') sVis++;

          if (r.protection === 'BLACK') cBlack++;
          else if (r.protection === 'BLUR') cBlur++;
          else cPreserve++;
        }

        setDetectionCounts(catCounts);
        setSourceCounts({ dom: sDom, ocr: sOcr, vision: sVis });
        setRedactionCounts({ black: cBlack, blur: cBlur, preserve: cPreserve });
        setPolicyMode(policySummary.budgetMode);
        setUpgradedVisualCount(policySummary.upgradedCount);

        setAbstractRegions(privacyRegions.map(r => ({
          category: r.category,
          bbox: r.bbox,
          strategy: r.protection as any
        })));

        // Live Inspector Overlay Rendering on Active Tab
        try {
          await browserAPI.scripting.executeScript({
            target: { tabId: tab.id! },
            func: (regions: any, isEnabled: boolean) => {
              let overlayContainer = document.getElementById('sih-privacy-inspector-overlay') as HTMLDivElement | null;
              if (!isEnabled) {
                if (overlayContainer) overlayContainer.remove();
                return;
              }
              if (!overlayContainer) {
                overlayContainer = document.createElement('div');
                overlayContainer.id = 'sih-privacy-inspector-overlay';
                overlayContainer.style.position = 'fixed';
                overlayContainer.style.top = '0';
                overlayContainer.style.left = '0';
                overlayContainer.style.width = '100vw';
                overlayContainer.style.height = '100vh';
                overlayContainer.style.pointerEvents = 'none';
                overlayContainer.style.zIndex = '2147483647';
                document.body.appendChild(overlayContainer);
              }
              overlayContainer.innerHTML = '';
              regions.forEach((reg: any) => {
                const box = document.createElement('div');
                box.style.position = 'absolute';
                box.style.left = `${reg.bbox.x}px`;
                box.style.top = `${reg.bbox.y}px`;
                box.style.width = `${reg.bbox.width}px`;
                box.style.height = `${reg.bbox.height}px`;
                box.style.boxSizing = 'border-box';
                box.style.pointerEvents = 'none';
                let strokeColor = '#22c55e'; // Green for DOM
                if (reg.source === 'vision') strokeColor = '#3b82f6'; // Blue for Vision
                if (reg.source === 'ocr') strokeColor = '#ef4444'; // Red for OCR
                box.style.border = `2px dashed ${strokeColor}`;
                box.style.backgroundColor = reg.protection === 'BLACK' ? 'rgba(0,0,0,0.25)' : 'rgba(59,130,246,0.15)';
                box.style.borderRadius = '3px';
                const label = document.createElement('span');
                label.innerText = `${reg.category} (${reg.source.toUpperCase()})`;
                label.style.position = 'absolute';
                label.style.top = '-18px';
                label.style.left = '0';
                label.style.backgroundColor = strokeColor;
                label.style.color = '#ffffff';
                label.style.fontSize = '10px';
                label.style.fontWeight = 'bold';
                label.style.padding = '1px 5px';
                label.style.borderRadius = '3px';
                label.style.whiteSpace = 'nowrap';
                box.appendChild(label);
                overlayContainer?.appendChild(box);
              });
            },
            args: [privacyRegions, inspectorOverlayActive]
          });
        } catch (e) {
          // Non-blocking catch for tab scripting errors
        }

        // Stage 4.5: PRIVACY BUDGET CHECK
        const privacyCost = calculatePrivacyCost(privacyRegions);

        if (!budgetManager.canAfford(privacyCost.totalCost)) {
          loopState.status = "privacy_budget_exhausted";
          setStatus("privacy_budget_exhausted");
          setNetworkBoundary({
            rawScreenshotBlocked: true,
            rawPiiBlocked: true,
            sanitizedContextTransmitted: false,
            budgetEnforced: true,
            transmissionStatus: 'blocked',
            blockReason: `Step cost (${privacyCost.totalCost}) exceeds remaining budget (${budgetManager.state.remainingBudget})`
          });
          addLog(`[PRIVACY_BUDGET_EXHAUSTED] Step cost (${privacyCost.totalCost}) exceeds remaining budget (${budgetManager.state.remainingBudget}/${DEFAULT_PRIVACY_BUDGET}). Terminating before network call.`);
          setBudgetState(budgetManager.state);
          break;
        }

        const currentBudget = budgetManager.recordStep(privacyCost.totalCost);
        setBudgetState(currentBudget);

        setNetworkBoundary({
          rawScreenshotBlocked: true,
          rawPiiBlocked: true,
          sanitizedContextTransmitted: true,
          budgetEnforced: true,
          transmissionStatus: 'allowed'
        });

        // Stage 5: VLM PLAN
        const tVlm = performance.now();
        const plan = await fetchAgentPlan(task, {
          pageTitle: tab.title || "",
          url: tab.url || "",
          sanitizedDOM: { viewport: pageData.viewport, elements: sanitizedElements },
          visibleElements: sanitizedElements,
          sanitizedScreenshot: safeImage
        }, loopState.step);
        const vlmDur = Math.round(performance.now() - tVlm);

        addLog(`[VLM] Status: ${plan.status} | Reasoning: ${plan.reasoning}`);

        if (plan.status === 'complete' || !plan.actions || plan.actions.length === 0) {
          loopState.status = 'completed';
          setStatus('completed');
          addLog(`[AGENT_COMPLETE] status=complete steps=${loopState.step}`);
          break;
        }

        const action = plan.actions[0];
        const actionSig = `${action.action}:${(action as any).element_id || (action as any).direction || ''}`;

        if (actionSig === loopState.lastActionSignature) {
          loopState.repeatedActionCount++;
        } else {
          loopState.lastActionSignature = actionSig;
          loopState.repeatedActionCount = 1;
        }

        if (loopState.repeatedActionCount >= 3) {
          loopState.status = 'failed';
          setStatus('failed');
          addLog(`[AGENT_LOOP_GUARD] Repeated action "${actionSig}" 3 times. Terminating.`);
          break;
        }

        if ((action as any).element_id) {
          const targetExists = sanitizedElements.some((e: any) => e.id === (action as any).element_id);
          if (!targetExists) {
            loopState.status = 'failed';
            setStatus('failed');
            addLog(`[ACTION_VALIDATION_ERROR] Action target "${(action as any).element_id}" does not exist in DOM.`);
            break;
          }
        }

        // Stage 6: ACTION EXECUTION
        const tAct = performance.now();
        addLog(`[ACTION] Executing: ${action.action} -> ${(action as any).element_id || (action as any).direction || ''}`);
        const scriptRes = await browserAPI.scripting.executeScript({
          target: { tabId: tab.id! },
          func: injectedActionExecutor,
          args: [action]
        });
        const actDur = Math.round(performance.now() - tAct);
        const execSuccess = scriptRes && scriptRes[0] && scriptRes[0].result === true;

        if (!execSuccess && action.action !== 'scroll') {
          loopState.status = 'failed';
          setStatus('failed');
          addLog(`[ACTION_FAILURE] Action ${action.action} failed on target.`);
          break;
        }

        // Stage 7: BOUNDED SETTLE
        await new Promise(r => setTimeout(r, 750));

        const stepTotal = Math.round(performance.now() - stepStart);

        // Record Step Telemetry
        const stepRecord: StepTelemetry = {
          step: loopState.step,
          timings: {
            captureMs: capDur,
            visionMs: visDur,
            ocrMs: ocrDur,
            privacyMs: privDur,
            redactionMs: redactDur,
            vlmMs: vlmDur,
            actionMs: actDur,
            totalMs: stepTotal
          },
          privacyCost: privacyCost.totalCost,
          remainingBudget: currentBudget.remainingBudget,
          regionCounts: catCounts,
          sourceCounts: { dom: sDom, ocr: sOcr, vision: sVis },
          redactionCounts: { black: cBlack, blur: cBlur, preserve: cPreserve },
          policyMode: policySummary.budgetMode,
          actionSummary: {
            actionType: action.action,
            targetId: (action as any).element_id || (action as any).direction,
            durationMs: actDur,
            status: execSuccess ? 'success' : 'failed'
          }
        };

        setStepHistory(prev => [...prev.slice(-9), stepRecord]);
        loopState.step++;
      }

      setElapsedMs(Date.now() - startedAt);

    } catch (e: any) {
      console.error(e);
      setStatus('failed');
      addLog(`[AGENT_ERROR] Pipeline failure: ${e.message}`);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'idle':
        return <span style={{ backgroundColor: '#334155', color: '#94a3b8', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>IDLE</span>;
      case 'running':
        return <span style={{ backgroundColor: '#0284c7', color: '#e0f2fe', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}><Zap size={12} style={{ animation: 'spin 1s linear infinite' }} /> RUNNING</span>;
      case 'completed':
        return <span style={{ backgroundColor: '#166534', color: '#4ade80', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>COMPLETED</span>;
      case 'privacy_budget_exhausted':
        return <span style={{ backgroundColor: '#991b1b', color: '#fca5a5', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>BUDGET EXHAUSTED</span>;
      case 'max_steps':
        return <span style={{ backgroundColor: '#6b21a8', color: '#e9d5ff', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>MAX STEPS</span>;
      case 'timeout':
        return <span style={{ backgroundColor: '#92400e', color: '#fde68a', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>TIMEOUT</span>;
      default:
        return <span style={{ backgroundColor: '#991b1b', color: '#fca5a5', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>FAILED</span>;
    }
  };

  const getBudgetColor = () => {
    if (!budgetState || budgetState.remainingBudget <= 0) return '#ef4444';
    const ratio = budgetState.remainingBudget / budgetState.initialBudget;
    if (ratio >= 0.5) return '#22c55e';
    if (ratio >= 0.2) return '#f59e0b';
    return '#f97316';
  };

  return (
    <div style={{ width: '380px', backgroundColor: '#0f172a', color: '#f8fafc', padding: '14px', fontFamily: 'system-ui, -apple-system, sans-serif', boxSizing: 'border-box' }}>
      
      {/* 1. HEADER BAR */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield style={{ color: '#22c55e' }} size={20} />
          <div>
            <h1 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#f8fafc' }}>Privacy Agent V2</h1>
            <span style={{ fontSize: '10px', color: '#64748b' }}>SIH 2026 Audit Dashboard</span>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* AGENT METRICS TICKER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#1e293b', padding: '8px 12px', borderRadius: '6px', marginBottom: '12px', fontSize: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8' }}>
          <Layers size={13} /> Step: <span style={{ color: '#f8fafc', fontWeight: 'bold' }}>{currentStep} / {maxSteps}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8' }}>
          <Clock size={13} /> Elapsed: <span style={{ color: '#f8fafc', fontWeight: 'bold' }}>{(elapsedMs / 1000).toFixed(1)}s</span>
        </div>
      </div>

      {/* 2. PRIVACY RISK BUDGET */}
      {budgetState && (
        <div style={{ backgroundColor: '#1e293b', border: `1px solid ${budgetState.remainingBudget <= 0 ? '#ef4444' : '#334155'}`, padding: '10px', borderRadius: '6px', marginBottom: '12px', fontSize: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontWeight: 'bold', color: getBudgetColor(), display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Lock size={13} /> Privacy Risk Budget
            </span>
            <span style={{ color: '#cbd5e1' }}>
              {budgetState.remainingBudget} / {budgetState.initialBudget} Remaining ({((budgetState.remainingBudget / budgetState.initialBudget) * 100).toFixed(0)}%)
            </span>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: '#0f172a', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${Math.min(100, (budgetState.consumedBudget / budgetState.initialBudget) * 100)}%`, 
              height: '100%', 
              backgroundColor: getBudgetColor(), 
              transition: 'width 0.3s ease' 
            }} />
          </div>
        </div>
      )}

      {/* LIVE INSPECTOR OVERLAY TOGGLE CONTROL */}
      <div style={{ backgroundColor: '#1e293b', padding: '8px 10px', borderRadius: '6px', marginBottom: '12px', fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 'bold', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {inspectorOverlayActive ? <Eye size={14} style={{ color: '#38bdf8' }} /> : <EyeOff size={14} style={{ color: '#94a3b8' }} />}
          Live Inspector Overlay (Page)
        </span>
        <button
          onClick={() => setInspectorOverlayActive(!inspectorOverlayActive)}
          style={{
            backgroundColor: inspectorOverlayActive ? '#0284c7' : '#334155',
            color: '#ffffff',
            border: 'none',
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {inspectorOverlayActive ? 'ACTIVE (ON)' : 'DISABLED (OFF)'}
        </button>
      </div>

      {/* REAL-TIME CLIENT RESOURCE TELEMETRY (20% Evaluation Metric) */}
      <div style={{ backgroundColor: '#1e293b', padding: '8px 10px', borderRadius: '6px', marginBottom: '12px', fontSize: '11px' }}>
        <div style={{ fontWeight: 'bold', color: '#38bdf8', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Activity size={13} /> Client Resource Telemetry</span>
          <span style={{ backgroundColor: runtimeEngine === 'WebGPU' ? '#0284c7' : '#475569', color: '#ffffff', padding: '2px 6px', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold' }}>
            {runtimeEngine} Mode
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', color: '#cbd5e1', fontSize: '10px' }}>
          <div>JS Heap: <span style={{ color: '#f8fafc', fontWeight: 'bold' }}>{memoryMb === 'N/A' ? 'N/A' : `${memoryMb} MB`}</span></div>
          <div>Preprocess: <span style={{ color: '#f8fafc', fontWeight: 'bold' }}>{perceptionLatencyMs} ms</span></div>
          <div>Vision Thresh: <span style={{ color: '#f8fafc', fontWeight: 'bold' }}>{confidenceThreshold.toFixed(2)}</span></div>
        </div>
      </div>

      {/* 3. PII DETECTION & REDACTION SUMMARY */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
        
        {/* PII Detection Grid */}
        <div style={{ backgroundColor: '#1e293b', padding: '10px', borderRadius: '6px', fontSize: '11px' }}>
          <div style={{ fontWeight: 'bold', color: '#38bdf8', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FileText size={12} /> PII Detected
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', color: '#cbd5e1' }}>
            <div>EMAIL: <span style={{ color: '#f8fafc', fontWeight: 'bold' }}>{detectionCounts['EMAIL'] || 0}</span></div>
            <div>PHONE: <span style={{ color: '#f8fafc', fontWeight: 'bold' }}>{detectionCounts['PHONE'] || 0}</span></div>
            <div>AADHAAR: <span style={{ color: '#f8fafc', fontWeight: 'bold' }}>{detectionCounts['AADHAAR'] || 0}</span></div>
            <div>PAN: <span style={{ color: '#f8fafc', fontWeight: 'bold' }}>{detectionCounts['PAN'] || 0}</span></div>
            <div>CARD: <span style={{ color: '#f8fafc', fontWeight: 'bold' }}>{detectionCounts['CREDIT_CARD'] || 0}</span></div>
            <div>FACE: <span style={{ color: '#f8fafc', fontWeight: 'bold' }}>{detectionCounts['FACE'] || 0}</span></div>
          </div>
          <div style={{ marginTop: '6px', paddingTop: '4px', borderTop: '1px solid #334155', color: '#94a3b8', fontSize: '10px' }}>
            Sources: DOM ({sourceCounts.dom}) | OCR ({sourceCounts.ocr}) | Vis ({sourceCounts.vision})
          </div>
        </div>

        {/* Redaction Strategy */}
        <div style={{ backgroundColor: '#1e293b', padding: '10px', borderRadius: '6px', fontSize: '11px' }}>
          <div style={{ fontWeight: 'bold', color: '#a855f7', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldAlert size={12} /> Redaction Policy
          </div>
          <div style={{ color: '#cbd5e1', marginBottom: '4px' }}>
            Mode: <span style={{ color: policyMode === 'NORMAL' ? '#22c55e' : policyMode === 'AGGRESSIVE' ? '#f59e0b' : '#ef4444', fontWeight: 'bold' }}>{policyMode}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2px', color: '#cbd5e1' }}>
            <div>BLACK: <span style={{ fontWeight: 'bold', color: '#ef4444' }}>{redactionCounts.black}</span></div>
            <div>BLUR: <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>{redactionCounts.blur}</span></div>
            <div>KEEP: <span style={{ fontWeight: 'bold', color: '#22c55e' }}>{redactionCounts.preserve}</span></div>
          </div>
          {upgradedVisualCount > 0 && (
            <div style={{ marginTop: '4px', color: '#f59e0b', fontSize: '9px' }}>
              ⚠️ {upgradedVisualCount} visual regions upgraded to BLACK
            </div>
          )}
        </div>
      </div>

      {/* 4. SAFE ABSTRACT PRIVACY REGION MAP (NO RAW PIXELS) */}
      {abstractRegions.length > 0 && (
        <div style={{ backgroundColor: '#1e293b', padding: '8px', borderRadius: '6px', marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Safe Abstract Privacy Region Overlay</span>
            <span style={{ fontSize: '9px', color: '#64748b' }}>Zero Raw Pixels Rendered</span>
          </div>
          <div style={{ width: '100%', height: '100px', backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
            {abstractRegions.map((reg, idx) => {
              const leftPct = (reg.bbox.x / 1280) * 100;
              const topPct = (reg.bbox.y / 800) * 100;
              const widthPct = Math.max(5, (reg.bbox.width / 1280) * 100);
              const heightPct = Math.max(8, (reg.bbox.height / 800) * 100);
              const bg = reg.strategy === 'BLACK' ? 'rgba(239, 68, 68, 0.5)' : reg.strategy === 'BLUR' ? 'rgba(56, 189, 248, 0.4)' : 'rgba(34, 197, 94, 0.4)';
              const border = reg.strategy === 'BLACK' ? '#ef4444' : reg.strategy === 'BLUR' ? '#38bdf8' : '#22c55e';
              return (
                <div 
                  key={idx} 
                  style={{ 
                    position: 'absolute', 
                    left: `${leftPct}%`, 
                    top: `${topPct}%`, 
                    width: `${widthPct}%`, 
                    height: `${heightPct}%`, 
                    backgroundColor: bg, 
                    border: `1px solid ${border}`, 
                    borderRadius: '2px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '8px', 
                    color: 'white', 
                    fontWeight: 'bold' 
                  }}
                  title={`${reg.category} (${reg.strategy})`}
                >
                  {reg.category.substring(0, 4)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. AGENT INPUT & CONTROL */}
      <div style={{ marginBottom: '12px' }}>
        <input 
          type="text" 
          placeholder="e.g. Search products and submit form" 
          value={task}
          onChange={(e) => setTask(e.target.value)}
          style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '4px', border: '1px solid #334155', backgroundColor: '#1e293b', color: 'white', fontSize: '12px' }}
        />
        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
          <button 
            onClick={runPipeline}
            disabled={status === 'running'}
            style={{ flex: 1, padding: '8px', borderRadius: '4px', border: 'none', backgroundColor: status === 'running' ? '#334155' : '#3b82f6', color: 'white', fontWeight: 'bold', cursor: status === 'running' ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px' }}
          >
            <Zap size={14} style={{ marginRight: '6px' }} /> Execute Task
          </button>
          <button 
            onClick={exportAuditTelemetry}
            style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #334155', backgroundColor: 'transparent', color: '#94a3b8', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '12px' }}
            title="Export Safe Audit Summary (JSON)"
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* 6. NETWORK PRIVACY BOUNDARY STATUS */}
      <div style={{ backgroundColor: networkBoundary.transmissionStatus === 'blocked' ? '#450a0a' : '#1e293b', border: `1px solid ${networkBoundary.transmissionStatus === 'blocked' ? '#ef4444' : '#334155'}`, padding: '8px 10px', borderRadius: '6px', marginBottom: '12px', fontSize: '11px' }}>
        <div style={{ fontWeight: 'bold', color: networkBoundary.transmissionStatus === 'blocked' ? '#fca5a5' : '#4ade80', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {networkBoundary.transmissionStatus === 'blocked' ? <XCircle size={13} /> : <CheckCircle2 size={13} />}
          Network Privacy Boundary
        </div>
        {networkBoundary.transmissionStatus === 'blocked' ? (
          <div style={{ color: '#fca5a5', fontWeight: 'bold' }}>
            ⚠️ TRANSMISSION BLOCKED: {networkBoundary.blockReason}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', color: '#cbd5e1', fontSize: '10px' }}>
            <div>✓ Raw screenshot blocked</div>
            <div>✓ Raw PII blocked</div>
            <div>✓ Context sanitized</div>
            <div>✓ Budget enforced</div>
          </div>
        )}
      </div>

      {/* 7. AGENT STEP TIMELINE */}
      {stepHistory.length > 0 && (
        <div style={{ backgroundColor: '#1e293b', padding: '10px', borderRadius: '6px', marginBottom: '12px', fontSize: '11px' }}>
          <div style={{ fontWeight: 'bold', color: '#f8fafc', marginBottom: '6px' }}>
            Agent Action History ({stepHistory.length} Steps)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {stepHistory.map((st) => (
              <div key={st.step} style={{ backgroundColor: '#0f172a', padding: '6px 8px', borderRadius: '4px', border: '1px solid #334155' }}>
                <div 
                  onClick={() => setExpandedStep(expandedStep === st.step ? null : st.step)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                >
                  <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>Step {st.step} ({st.actionSummary?.actionType || 'process'})</span>
                  <span style={{ color: '#94a3b8', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {st.timings.totalMs}ms {expandedStep === st.step ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </span>
                </div>
                {expandedStep === st.step && (
                  <div style={{ marginTop: '6px', paddingTop: '4px', borderTop: '1px solid #1e293b', fontSize: '10px', color: '#cbd5e1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                    <div>Capture: {st.timings.captureMs}ms</div>
                    <div>Vision: {st.timings.visionMs}ms</div>
                    <div>OCR: {st.timings.ocrMs}ms</div>
                    <div>Redact: {st.timings.redactionMs}ms</div>
                    <div>VLM Plan: {st.timings.vlmMs}ms</div>
                    <div>Action Exec: {st.timings.actionMs}ms</div>
                    <div>Step Risk Cost: <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{st.privacyCost}</span></div>
                    <div>Remaining Budget: <span style={{ color: '#22c55e', fontWeight: 'bold' }}>{st.remainingBudget}</span></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AUDIT LOG CONSOLE */}
      {logs.length > 0 && (
        <div style={{ backgroundColor: '#1e293b', padding: '8px 10px', borderRadius: '6px', fontSize: '10px', color: '#94a3b8', maxHeight: '80px', overflowY: 'auto', fontFamily: 'monospace' }}>
          {logs.slice(-5).map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}
    </div>
  );
}
