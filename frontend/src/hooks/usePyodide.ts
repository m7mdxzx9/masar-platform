import { useState, useEffect, useCallback } from 'react';
import type { PyodideInterface } from 'pyodide';

interface PyodideState {
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
  runPython: (code: string) => Promise<{ output: string; error: string | null; duration: number }>;
  retry: () => void;
}

declare global {
  interface Window {
    loadPyodide: (options: { indexURL: string }) => Promise<PyodideInterface>;
    __pyodideInstance?: PyodideInterface | null;
    __pyodideInitPromise?: Promise<PyodideInterface> | null;
  }
}

export function usePyodide(): PyodideState {
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initPyodide = useCallback(async () => {
    // Check if already initialized on window (survives HMR)
    if (window.__pyodideInstance) {
      setIsReady(true);
      setIsLoading(false);
      return;
    }

    // Check if initialization is already in progress
    if (window.__pyodideInitPromise) {
      setIsLoading(true);
      try {
        await window.__pyodideInitPromise;
        setIsReady(true);
        setIsLoading(false);
      } catch (err: any) {
        setError(err.message || 'فشل تحميل Python');
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    setIsReady(false);
    setError(null);

    const loadScript = async (): Promise<PyodideInterface> => {
      const CDN_URL = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/';
      
      if (!document.querySelector(`script[src="${CDN_URL}pyodide.js"]`)) {
        const script = document.createElement('script');
        script.src = `${CDN_URL}pyodide.js`;
        script.async = true;
        document.head.appendChild(script);
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = () => reject(new Error('فشل تحميل ملف Pyodide من الشبكة.'));
        });
      }

      // Wait for window.loadPyodide to be defined
      let retries = 100;
      while (!window.loadPyodide && retries > 0) {
        await new Promise(r => setTimeout(r, 100));
        retries--;
      }

      if (!window.loadPyodide) {
        throw new Error('فشل العثور على دالة loadPyodide.');
      }

      const py = await window.loadPyodide({
        indexURL: CDN_URL
      });

      // Load common scientific packages
      await py.loadPackage(['numpy', 'pandas']);
      
      // Init stdout/stderr redirection
      await py.runPythonAsync(`
import sys
import io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
      `);
      
      return py;
    };

    try {
      window.__pyodideInitPromise = loadScript();
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('انتهى وقت تحميل Python (30 ثانية).')), 30000);
      });

      const py = await Promise.race([window.__pyodideInitPromise, timeoutPromise]);
      window.__pyodideInstance = py;
      setIsReady(true);
      setIsLoading(false);
    } catch (err: any) {
      window.__pyodideInitPromise = null;
      window.__pyodideInstance = null;
      setError(err instanceof Error ? err.message : 'فشل تحميل Python');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initPyodide();
  }, [initPyodide]);

  const runPython = useCallback(async (code: string): Promise<{ output: string; error: string | null; duration: number }> => {
    const py = window.__pyodideInstance;
    if (!py) return { output: '', error: 'Python غير جاهز بعد.', duration: 0 };

    const start = performance.now();
    try {
      // Clear previous outputs
      await py.runPythonAsync(`
import sys
sys.stdout.truncate(0)
sys.stdout.seek(0)
sys.stderr.truncate(0)
sys.stderr.seek(0)
      `);
      
      await py.runPythonAsync(code);
      
      const stdout = py.runPython('sys.stdout.getvalue()');
      const stderr = py.runPython('sys.stderr.getvalue()');
      
      return { output: stdout || '', error: stderr || null, duration: Math.round(performance.now() - start) };
    } catch (err: any) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return { output: '', error: errorMsg, duration: Math.round(performance.now() - start) };
    }
  }, []);

  return { isLoading, isReady, error, runPython, retry: () => {
    window.__pyodideInitPromise = null;
    window.__pyodideInstance = null;
    initPyodide();
  }};
}
