import { useState, useCallback } from 'react';

interface GPUDevice {
  // Basic GPU device interface
  readonly label: string;
}

export function useWebGPU() {
  const [device, setDevice] = useState<GPUDevice | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const init = useCallback(async () => {
    if (!('gpu' in navigator)) {
      setIsSupported(false);
      return null;
    }
    try {
      const adapter = await (navigator as any).gpu.requestAdapter();
      if (!adapter) return null;
      const gpuDevice = await adapter.requestDevice();
      setDevice(gpuDevice);
      setIsSupported(true);
      return gpuDevice;
    } catch (e) {
      console.error('WebGPU init error:', e);
      return null;
    }
  }, []);

  return { device, isSupported, init };
}
