import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { apiClient } from '../services/api';
// @ts-ignore
import pyodideWorkerCode from '../workers/pyodide.worker.js?raw';

interface PyodideState {
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
  runPython: (code: string, files?: { filename: string; content: string }[]) => Promise<{ output: string; error: string | null; duration: number }>;
  retry: () => void;
}

export function usePyodide(): PyodideState {
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const workerRef = useRef<Worker | null>(null);
  const runResolverRef = useRef<((value: any) => void) | null>(null);

  const initWorker = useCallback(() => {
    setIsLoading(true);
    setIsReady(false);
    setError(null);

    try {
      // Instantiate worker using raw blob URL to bypass electron file:// CORS limitations
      const blob = new Blob([pyodideWorkerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      const worker = new Worker(workerUrl);

      worker.onmessage = (e: MessageEvent) => {
        const { type, error, output, duration } = e.data;

        if (type === 'ready') {
          setIsReady(true);
          setIsLoading(false);
        } else if (type === 'error') {
          setError(error || 'فشل تشغيل بيئة Python');
          setIsLoading(false);
        } else if (type === 'run_result') {
          if (runResolverRef.current) {
            runResolverRef.current({ output, error, duration });
            runResolverRef.current = null;
          }
        }
      };

      worker.onerror = (e) => {
        console.error('Pyodide Worker Error:', e);
        setError('خطأ في تشغيل Worker الخاص بـ Python');
        setIsLoading(false);
      };

      worker.postMessage({ type: 'init' });
      workerRef.current = worker;
    } catch (err: any) {
      setError(err.message || 'فشل إنشاء Web Worker');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initWorker();
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [initWorker]);

  const runPython = useCallback(
    async (code: string, files?: { filename: string; content: string }[]): Promise<{ output: string; error: string | null; duration: number }> => {
      if (!workerRef.current || !isReady || error) {
        const startTime = performance.now();
        try {
          const response = await axios.post(`${apiClient.defaults.baseURL}/labs/run`, { code, language: 'python' })
          const duration = Math.round(performance.now() - startTime);
          return {
            output: response.data.output || '',
            error: response.data.error || null,
            duration,
          };
        } catch (err: any) {
          const duration = Math.round(performance.now() - startTime);
          return {
            output: '',
            error: err.response?.data?.detail || err.message || 'فشل تشغيل الكود عبر الخادم المرفق',
            duration,
          };
        }
      }

      return new Promise((resolve) => {
        runResolverRef.current = resolve;
        workerRef.current?.postMessage({
          type: 'run',
          code,
          files,
        });
      });
    },
    [isReady, error]
  );

  const retry = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    initWorker();
  }, [initWorker]);

  return {
    isLoading,
    isReady,
    error,
    runPython,
    retry,
  };
}
