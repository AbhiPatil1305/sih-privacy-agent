import React, { useState } from 'react';
import { Shield, ShieldAlert, Zap, Lock, Eye, EyeOff, Activity, Download } from 'lucide-react';
import { fetchAgentPlan } from '../network/api-client';
import { sanitizeScreenshot } from '../privacy/redactor';
import { SafeBrowserContext, PageStructure, ScreenshotData, SafeElement, SensitiveRegion } from '../shared/types';
import { detectSensitiveDOM } from '../privacy/dom-detector';
import { sanitizeDOM } from '../privacy/dom-sanitizer';

function injectedDOMExtractor() {
  const INTERESTING_TAGS = ['INPUT', 'BUTTON', 'A', 'TEXTAREA', 'SELECT', 'LABEL', 'FORM', 'H1', 'H2', 'H3', 'P', 'SPAN', 'DIV'];
  
  function isElementVisible(el: HTMLElement): boolean {
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  let counter = 1;
  const elements: any[] = [];
  const seenBoxes = new Set<string>();
  
  const allElements = Array.from(document.querySelectorAll<HTMLElement>('*'));

  // Iterate in REVERSE (children first) to prioritize semantic tags over generic wrappers
  for (let i = allElements.length - 1; i >= 0; i--) {
    const el = allElements[i];

    if (!INTERESTING_TAGS.includes(el.tagName)) {
      if (el.tagName !== 'DIV' && el.tagName !== 'SPAN') continue;
      if (!el.onclick && !el.textContent?.trim()) continue;
    }

    if (!isElementVisible(el)) continue;

    const rect = el.getBoundingClientRect();
    
    // Deduplicate overlapping wrappers with identical visual bounds
    const bboxKey = `${Math.round(rect.x)},${Math.round(rect.y)},${Math.round(rect.width)},${Math.round(rect.height)}`;
    if (seenBoxes.has(bboxKey)) {
      // The child (which we processed earlier) was identical, skip this parent wrapper!
      continue;
    }
    seenBoxes.add(bboxKey);

    const id = `el_${String(counter++).padStart(3, '0')}`;
    el.setAttribute('data-agent-id', id);
    
    let type = undefined;
    if (el instanceof HTMLInputElement) {
      type = el.type; 
    }

    let role = el.getAttribute('role') || undefined;
    let label = el.getAttribute('aria-label') || el.getAttribute('placeholder') || undefined;
    
    const isInputNode = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement;
    const isEditable = el.isContentEditable;
    
    if (!label && !isInputNode && !isEditable) {
       const text = el.innerText || el.textContent?.trim() || undefined;
       if (text) {
         label = text.length > 50 ? text.substring(0, 50) + '...' : text;
       }
    }

    const safeElement: any = {
      id,
      tag: el.tagName.toLowerCase(),
      bbox: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      }
    };

    if (type) safeElement.type = type;
    if (role) safeElement.role = role;
    if (label) safeElement.label = label;

    elements.push(safeElement);
  }

  // Reverse back to normal document flow order (top-down, left-right) for the final array
  elements.reverse();

  return {
    url: window.location.href, 
    title: document.title,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1
    },
    elements
  };
}

function injectedActionExecutor(action: any) {
  const el = document.querySelector(`[data-agent-id="${action.target.elementId}"]`) as HTMLElement;
  if (!el) return false;

  if (action.type === 'click') {
    el.click();
    return true;
  }
  
  if (action.type === 'type') {
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      el.value = action.text;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
  }
  
  if (action.type === 'scroll') {
    window.scrollBy({
      top: action.direction === 'down' ? window.innerHeight / 2 : -window.innerHeight / 2,
      behavior: 'smooth'
    });
    return true;
  }

  return false;
}


function App() {
  const [task, setTask] = useState('');
  const [status, setStatus] = useState('Idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [demoMode, setDemoMode] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [sanitizedImage, setSanitizedImage] = useState<string | null>(null);

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
      addLog('Capturing screenshot...');
      const tab = await getActiveTab();
      if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('edge://')) {
        throw new Error("Cannot analyze browser settings pages.");
      }
      
      const screenshotResp = await chrome.runtime.sendMessage({ action: 'CAPTURE_SCREENSHOT' });
      const screenshotData: ScreenshotData = screenshotResp.data;

      addLog('Extracting DOM via scripting injection...');
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        func: injectedDOMExtractor
      });
      
      if (!results || !results[0] || !results[0].result) {
        throw new Error("Failed to extract DOM from page.");
      }
      
      const pageStructure: PageStructure = results[0].result as PageStructure;
      
      addLog('Detecting PII...');
      const sensitiveRegions = detectSensitiveDOM(pageStructure.elements);
      
      addLog('Sanitizing DOM...');
      const sanitizedElements = sanitizeDOM(pageStructure.elements, sensitiveRegions);

      const contextJson = {
        viewport: pageStructure.viewport,
        elements: sanitizedElements
      };

      console.log("=== OUTPUT FOR MEMBER 1 & 2 ===");
      console.log("Screenshot (Base64):", screenshotData.image.substring(0, 50) + "...");
      console.log("Context.json:");
      console.log(JSON.stringify(contextJson, null, 2));

      downloadFile(screenshotData.image, 'screenshot.png', false);
      downloadFile(JSON.stringify(contextJson, null, 2), 'context.json', true);

      setStatus('Analysis Complete. Files downloaded.');
      addLog('screenshot.png downloaded');
      addLog('context.json downloaded');
      addLog('Data logged to local console.');
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
      addLog('Capturing screenshot...');
      const t0 = performance.now();
      const tab = await getActiveTab();
      if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('edge://')) {
        throw new Error("Cannot run on browser settings pages.");
      }
      
      const screenshotResp = await chrome.runtime.sendMessage({ action: 'CAPTURE_SCREENSHOT' });
      const screenshotData: ScreenshotData = screenshotResp.data;
      m['Screenshot Capture'] = Math.round(performance.now() - t0);
      setOriginalImage(screenshotData.image);

      addLog('Extracting DOM via scripting injection...');
      const t1 = performance.now();
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        func: injectedDOMExtractor
      });
      
      if (!results || !results[0] || !results[0].result) {
        throw new Error("Failed to extract DOM from page.");
      }
      const pageStructure: PageStructure = results[0].result as PageStructure;
      m['DOM Extraction'] = Math.round(performance.now() - t1);

      addLog('Detecting PII...');
      const t2 = performance.now();
      const sensitiveRegions = detectSensitiveDOM(pageStructure.elements);
      m['PII Detection'] = Math.round(performance.now() - t2);

      addLog(`Sanitizing ${sensitiveRegions.length} regions...`);
      const t3 = performance.now();
      const safeImage = await sanitizeScreenshot(screenshotData, sensitiveRegions);
      setSanitizedImage(safeImage);
      
      const sanitizedElements = sanitizeDOM(pageStructure.elements, sensitiveRegions);
      m['Sanitization'] = Math.round(performance.now() - t3);

      const context: SafeBrowserContext = {
        pageTitle: pageStructure.title,
        url: pageStructure.url,
        sanitizedDOM: { viewport: pageStructure.viewport, elements: sanitizedElements },
        visibleElements: sanitizedElements,
        sanitizedScreenshot: safeImage
      };

      addLog('Sending safe context to server...');
      const t4 = performance.now();
      const plan = await fetchAgentPlan(task, context);
      m['Network'] = Math.round(performance.now() - t4);
      addLog(`AI Plan: ${plan.reasoning}`);

      if (plan.actions.length > 0) {
        addLog(`Executing action: ${plan.actions[0].type}`);
        const t5 = performance.now();
        await chrome.scripting.executeScript({
          target: { tabId: tab.id! },
          func: injectedActionExecutor,
          args: [plan.actions[0]]
        });
        m['Action Execution'] = Math.round(performance.now() - t5);
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
        <h2 style={{ margin: 0, fontSize: '18px' }}>Privacy Agent V1</h2>
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
          <Download size={16} style={{ marginRight: '8px' }} /> Analyze Page (For ML Team)
        </button>
      </div>
      
      <hr style={{ borderColor: '#334155', marginBottom: '16px' }} />

      <div style={{ marginBottom: '16px' }}>
        <input 
          type="text" 
          placeholder="e.g. Find the submit button and click it" 
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
            <Activity size={14} style={{ marginRight: '4px' }} /> Performance Metrics
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
            Privacy Filter Demo
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: '4px', color: '#ef4444' }}>Original</div>
              <img src={originalImage} style={{ width: '100%', border: '1px solid #334155', borderRadius: '4px' }} alt="Original" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: '4px', color: '#22c55e' }}>Sanitized</div>
              <img src={sanitizedImage} style={{ width: '100%', border: '1px solid #334155', borderRadius: '4px' }} alt="Sanitized" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
