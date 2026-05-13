import { create } from 'zustand';

interface LabState {
  code: string;
  output: string;
  error: string;
  isRunning: boolean;
  setCode: (c: string) => void;
  setOutput: (o: string) => void;
  setError: (e: string) => void;
  setIsRunning: (r: boolean) => void;
  reset: () => void;
}

const DEFAULT_PYTHON = `import numpy as np

def sigmoid(x):
    return 1 / (1 + np.exp(-x))

def relu(x):
    return np.maximum(0, x)

np.random.seed(42)
W1 = np.random.randn(3, 4) * 0.01
b1 = np.zeros((1, 4))
X = np.random.randn(2, 3)
A1 = relu(np.dot(X, W1) + b1)

print("Input shape:", X.shape)
print("Output shape:", A1.shape)
print("Output:", A1)`;

export const useLabStore = create<LabState>((set) => ({
  code: DEFAULT_PYTHON,
  output: '',
  error: '',
  isRunning: false,
  setCode: (c) => set({ code: c }),
  setOutput: (o) => set({ output: o }),
  setError: (e) => set({ error: e }),
  setIsRunning: (r) => set({ isRunning: r }),
  reset: () => set({ output: '', error: '' }),
}));
