import React, { useState } from 'react';
import { Shield, ShieldAlert, Zap, Lock, Eye, EyeOff, Activity, Download } from 'lucide-react';
import { capturePage } from '../capture/page-capture';
import { MockOCRProvider, RealOCRProvider } from '../vision/ocr';
import { runPrivacyIntelligence } from '../privacy/intelligence';
import { redactScreenshot } from '../privacy/redactor';
import { MockActionProvider } from '../network/api-client';
import { PageCapture } from '../shared/types';
import { sanitizeDOM } from '../privacy/dom-sanitizer'; // keep text sanitization



// Inline action executor to guarantee execution without content script listeners
function injectedActionExecutor(action: any): any {
  function validate(act: any) {
    if (!act || !act.action) return { valid: false, error: 'Malformed action' };
    if (!['click', 'type', 'scroll', 'select', 'wait', 'navigate'].includes(act.action)) return { valid: false, error: 'Unsupported action' };
    
    if (act.action === 'navigate') {
      try {
        const url = new URL(act.url);
        if (url.protocol === 'javascript:' || url.protocol === 'data:' || url.protocol === 'vbscript:') return { valid: false, error: 'Unsafe URL' };
      } catch { return { valid: false, error: 'Unsafe URL' }; }
      return { valid: true };
    }
    
    if (['click', 'type', 'select'].includes(act.action)) {
      if (!act.element_id) return { valid: false, error: 'Missing element_id' };
      const el = document.querySelector(`[data-agent-id="${act.element_id}"]`) as HTMLElement;
      if (!el) return { valid: false, error: 'Element not found' };
      
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return { valid: false, error: 'Element not visible' };
      
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return { valid: false, error: 'Element not visible' };
      if ((el as any).disabled) return { valid: false, error: 'Element is disabled' };
    }
    return { valid: true };
  }

  const val = validate(action);
  if (!val.valid) return { success: false, error: val.error };

  try {
    if (action.action === 'click') {
      const el = document.querySelector(`[data-agent-id="${action.element_id}"]`) as HTMLElement;
      el.click();
      return { success: true };
    }
    
    if (action.action === 'type') {
      const el = document.querySelector(`[data-agent-id="${action.element_id}"]`) as HTMLElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        el.value = action.text;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      } else if (el.isContentEditable) {
        el.innerText = action.text;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
      return { success: true };
    }
    
    if (action.action === 'scroll') {
      const amt = Math.min(action.amount || 600, 5000);
      const scrollAmt = action.direction === 'down' ? amt : -amt;
      window.scrollBy({ top: scrollAmt, behavior: 'smooth' });
      return { success: true };
    }
    
    if (action.action === 'select') {
      const el = document.querySelector(`[data-agent-id="${action.element_id}"]`) as HTMLSelectElement;
      let found = false;
      for (let i = 0; i < el.options.length; i++) {
        if (el.options[i].value === action.value || el.options[i].text === action.value) {
          el.selectedIndex = i; found = true; break;
        }
      }
      if (!found) return { success: false, error: 'Option not found' };
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return { success: true };
    }
    
    if (action.action === 'wait') {
      // Async wait inside executeScript is tricky to serialize properly back to popup, 
      // but we can just sleep synchronously or handle it via Promises if manifest v3 allows.
      // Better to handle wait asynchronously outside the injected script, or return a signal to wait.
      return { success: true, wait_duration: action.duration };
    }
    
    if (action.action === 'navigate') {
      window.location.href = action.url;
      return { success: true };
    }
  } catch (e: any) {
    return { success: false, error: e.message };
  }
  return { success: false, error: 'Unknown execution error' };
}

export default function App() {
  const [task, setTask] = useState('');
  const [status, setStatus] = useState('Idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [demoMode, setDemoMode] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [sanitizedImage, setSanitizedImage] = useState<string | null>(null);
  const [ocrEngine, setOcrEngine] = useState<'mock' | 'tesseract'>('mock');

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

  const getActiveTab = async () => {
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (!tabs || tabs.length === 0 || !tabs[0].id) {
       const allTabs = await chrome.tabs.query({ active: true });
       if (allTabs && allTabs.length > 0 && allTabs[0].id) {
         return allTabs[0];
       }
       throw new Error("No active tab found.");
    }
    return tabs[0];
  };

  const analyzePage = async () => {
    setStatus('Analyzing Page...');
    setLogs([]);
    try {
      const tab = await getActiveTab();
      if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('edge://')) {
        throw new Error("Cannot analyze browser settings pages.");
      }
      
      addLog('Extracting DOM & Capturing Device-Pixel Screenshot...');
      const pageData: PageCapture = await capturePage(tab.id!);
      
      const objectUrl = URL.createObjectURL(pageData.screenshot);
      setOriginalImage(objectUrl);

      addLog(`Executing Local ML Engine (${ocrEngine === 'mock' ? 'Mock' : 'Tesseract'})...`);
      const ocrProvider = ocrEngine === 'mock' ? new MockOCRProvider() : new RealOCRProvider();
      const ocrResults = await ocrProvider.runOCR(pageData.screenshot);

      let externalVisionMocks: any[] = [];
      if (demoMode) {
        externalVisionMocks.push({
          id: 'pr_vision_mock',
          bbox: { x: 100, y: 100, width: 150, height: 150 },
          category: 'PERSON',
          confidence: 0.95,
          source: 'vision',
          protection: 'BLUR'
        });
        addLog('[Integration Test] Injecting external Vision ML coordinates');
      }

      addLog('Running Privacy Intelligence Fusion (DOM + ML)...');
      const privacyRegions = runPrivacyIntelligence(pageData.elements, ocrResults, externalVisionMocks);

      addLog(`Applying OffscreenCanvas Visual Redaction (${privacyRegions.length} regions)...`);
      const safeImage = await redactScreenshot(pageData.screenshot, privacyRegions, pageData.viewport.devicePixelRatio);
      setSanitizedImage(safeImage);

      // Text sanitization based on regions
      const sanitizedElements = sanitizeDOM(pageData.elements, privacyRegions as any);

      const contextJson = {
        viewport: pageData.viewport,
        screenshot: safeImage.substring(0, 50) + "...", // Do not save massive base64 in json file for readability
        elements: sanitizedElements
      };

      console.log("=== UNIFIED OUTPUT FOR ML TEAMS ===");
      console.log(JSON.stringify(contextJson, null, 2));

      downloadFile(safeImage, 'screenshot.png', false);
      downloadFile(JSON.stringify(contextJson, null, 2), 'context.json', true);

      setStatus('Analysis Complete. Payloads Exported.');
      addLog('Exported sanitized screenshot.png payload');
      addLog('Exported SafeBrowserContext context.json');
    } catch (e: any) {
      console.error(e);
      setStatus('Error');
      addLog(`Failed: ${e.message}`);
    }
  };

  const runPipeline = async () => {
    if (!task) return;
    setStatus('Running Pipeline...');
    setLogs([]);
    const m: Record<string, number> = {};
    const startTotal = performance.now();

    try {
      const tab = await getActiveTab();
      
      const t0 = performance.now();
      addLog('Extracting DOM & Capturing Device-Pixel Screenshot...');
      const pageData = await capturePage(tab.id!);
      m['Page Capture'] = Math.round(performance.now() - t0);

      const t1 = performance.now();
      addLog(`Executing Local ML Engine (${ocrEngine === 'mock' ? 'Mock' : 'Tesseract'})...`);
      const ocr = ocrEngine === 'mock' ? new MockOCRProvider() : new RealOCRProvider();
      const ocrResults = await ocr.runOCR(pageData.screenshot);
      const privacyRegions = runPrivacyIntelligence(pageData.elements, ocrResults);
      m['Intelligence'] = Math.round(performance.now() - t1);

      const t2 = performance.now();
      addLog(`Applying OffscreenCanvas Visual Redaction (${privacyRegions.length} regions)...`);
      const safeImage = await redactScreenshot(pageData.screenshot, privacyRegions, pageData.viewport.devicePixelRatio);
      const sanitizedElements = sanitizeDOM(pageData.elements, privacyRegions as any);
      m['Redaction'] = Math.round(performance.now() - t2);

      const t3 = performance.now();
      addLog('Transmitting SafeBrowserContext to Local Server...');
      const actionProvider = new MockActionProvider();
      const plan = await actionProvider.getAction(task, {
        pageTitle: tab.title || "",
        url: tab.url || "",
        sanitizedDOM: { viewport: pageData.viewport, elements: sanitizedElements },
        visibleElements: sanitizedElements,
        sanitizedScreenshot: safeImage
      });
      m['Network'] = Math.round(performance.now() - t3);
      addLog(`VLM Reasoning: ${plan.reasoning}`);

      if (plan.actions.length > 0) {
        const t4 = performance.now();
        for (const action of plan.actions) {
          addLog(`Autonomous Execution: ${action.action} -> ${(action as any).element_id || ''}`);
          
          if (action.action === 'wait') {
            await new Promise(r => setTimeout(r, (action as any).duration || 1000));
            continue;
          }

          const execRes = await chrome.scripting.executeScript({
            target: { tabId: tab.id! },
            func: injectedActionExecutor,
            args: [action]
          });
          
          const result = execRes[0].result;

          if (!result || !result.success) {
             throw new Error(result?.error || 'Action execution failed');
          }
        }
        m['Action Exec'] = Math.round(performance.now() - t4);
      } else {
        addLog("No actions generated by AI.");
      }

      setStatus('Success');
      m['Total'] = Math.round(performance.now() - startTotal);
      setMetrics(m);

    } catch (e: any) {
      console.error(e);
      setStatus('Error');
      addLog(`Failed: ${e.message}`);
    }
  };

  return (
    <div style={{ width: '400px', backgroundColor: '#0f172a', color: '#f8fafc', padding: '16px', fontFamily: 'system-ui' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <Shield style={{ color: '#22c55e', marginRight: '8px' }} />
        <h2 style={{ margin: 0, fontSize: '18px' }}>Privacy Agent V2 (Integration)</h2>
        <div style={{ flex: 1 }} />
        <button 
          onClick={() => setDemoMode(!demoMode)}
          style={{ background: 'transparent', color: '#94a3b8', border: '1px solid #334155', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '12px' }}
        >
          {demoMode ? <EyeOff size={14} style={{ marginRight: '4px' }}/> : <Eye size={14} style={{ marginRight: '4px' }}/>}
          Demo
        </button>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <button 
          onClick={analyzePage}
          style={{ width: '100%', marginBottom: '8px', padding: '8px', borderRadius: '4px', border: '1px solid #3b82f6', backgroundColor: 'transparent', color: '#3b82f6', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
        >
          <Download size={16} style={{ marginRight: '8px' }} /> Unified Capture (ML Export)
        </button>
      </div>
      
      <div style={{ marginBottom: '16px', fontSize: '12px' }}>
        <label style={{ color: '#94a3b8', marginRight: '8px' }}>OCR Engine:</label>
        <select value={ocrEngine} onChange={(e) => setOcrEngine(e.target.value as any)} style={{ background: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '4px', padding: '4px' }}>
          <option value="mock">Mock (Fast & Safe)</option>
          <option value="tesseract">Tesseract.js (Real)</option>
        </select>
      </div>

      <hr style={{ borderColor: '#334155', marginBottom: '16px' }} />

      <div style={{ marginBottom: '16px' }}>
        <input 
          type="text" 
          placeholder="e.g. Scroll down" 
          value={task}
          onChange={(e) => setTask(e.target.value)}
          style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '4px', border: '1px solid #334155', backgroundColor: '#1e293b', color: 'white' }}
        />
        <button 
          onClick={runPipeline}
          style={{ width: '100%', marginTop: '8px', padding: '8px', borderRadius: '4px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
        >
          <Zap size={16} style={{ marginRight: '8px' }} /> Execute Task
        </button>
      </div>

      {status !== 'Idle' && (
        <div style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: status === 'Error' ? '#ef4444' : 'inherit' }}>Status: {status}</span>
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', maxHeight: '100px', overflowY: 'auto', fontFamily: 'monospace' }}>
            {logs.map((l, i) => <div key={i} style={{ color: l.startsWith('Failed') ? '#ef4444' : 'inherit' }}>{l}</div>)}
          </div>
        </div>
      )}

      {Object.keys(metrics).length > 0 && (
        <div style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', fontWeight: 'bold' }}>
            <Activity size={14} style={{ marginRight: '4px' }} /> Metrics
          </div>
          {Object.entries(metrics).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', color: k === 'Total' ? '#38bdf8' : '#cbd5e1' }}>
              <span>{k}</span>
              <span>{v} ms</span>
            </div>
          ))}
        </div>
      )}

      {demoMode && originalImage && sanitizedImage && (
        <div style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '6px', fontSize: '12px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#fbbf24' }}>
            <ShieldAlert size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
            Integration Redaction Demo
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: '4px', color: '#ef4444' }}>Original</div>
              <img src={originalImage} style={{ width: '100%', border: '1px solid #334155', borderRadius: '4px' }} alt="Original" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: '4px', color: '#22c55e' }}>Sanitized (Scaled via DPR)</div>
              <img src={sanitizedImage} style={{ width: '100%', border: '1px solid #334155', borderRadius: '4px' }} alt="Sanitized" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


