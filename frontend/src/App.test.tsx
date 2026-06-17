import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

// Mock dependencies
vi.mock('@/services/syncManager', () => ({
  syncManager: {
    initialize: vi.fn(),
  },
}));

// Mock window.matchMedia which is not present in JSDOM
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('App Component', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
  });
});
