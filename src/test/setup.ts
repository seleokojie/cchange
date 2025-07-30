/**
 * @fileoverview Test setup configuration for Vitest
 * Configures the testing environment with necessary polyfills and utilities
 */

import { beforeEach, vi } from 'vitest';

// Mock Three.js WebGL context for testing
const mockWebGLContext = {
  getExtension: vi.fn(),
  getParameter: vi.fn(),
  createShader: vi.fn(),
  shaderSource: vi.fn(),
  compileShader: vi.fn(),
  getShaderParameter: vi.fn().mockReturnValue(true),
  createProgram: vi.fn(),
  attachShader: vi.fn(),
  linkProgram: vi.fn(),
  getProgramParameter: vi.fn().mockReturnValue(true),
  useProgram: vi.fn(),
  createBuffer: vi.fn(),
  bindBuffer: vi.fn(),
  bufferData: vi.fn(),
  enableVertexAttribArray: vi.fn(),
  vertexAttribPointer: vi.fn(),
  drawArrays: vi.fn(),
  viewport: vi.fn(),
  clearColor: vi.fn(),
  clear: vi.fn(),
  enable: vi.fn(),
  disable: vi.fn(),
  cullFace: vi.fn(),
  frontFace: vi.fn(),
  blendFunc: vi.fn(),
  blendEquation: vi.fn(),
};

// Mock WebGL rendering context
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn().mockReturnValue(mockWebGLContext),
  writable: true,
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})) as any;

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})) as any;

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
  return setTimeout(cb, 16) as any;
}) as any;
global.cancelAnimationFrame = vi.fn((id: number) => clearTimeout(id as any));

// Clean up after each test
beforeEach(() => {
  vi.clearAllMocks();
});
