import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
window.scrollTo = vi.fn();

// Run cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock document.queryCommandSupported for Monaco Editor in JSDOM
if (typeof document !== 'undefined') {
  document.queryCommandSupported = () => true;
}
