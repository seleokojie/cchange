/**
 * @fileoverview Unit tests for utility functions
 * Tests data processing, validation, and helper functions
 */

import { describe, it, expect } from 'vitest';

/**
 * Mock data structure for testing
 */
const mockTemperatureData = [
  { year: 1980, temperature: 0.26 },
  { year: 1990, temperature: 0.45 },
  { year: 2000, temperature: 0.61 },
  { year: 2010, temperature: 0.72 },
];

/**
 * Utility function to validate temperature data
 * @param data - Array of temperature data points
 * @returns boolean indicating if data is valid
 */
function validateTemperatureData(
  data: Array<{ year: number; temperature: number }>
): boolean {
  if (!Array.isArray(data) || data.length === 0) {
    return false;
  }

  return data.every(
    point =>
      typeof point.year === 'number' &&
      typeof point.temperature === 'number' &&
      point.year >= 1880 &&
      point.year <= new Date().getFullYear()
  );
}

/**
 * Utility function to normalize temperature values
 * @param temperature - Raw temperature value
 * @returns normalized temperature between 0 and 1
 */
function normalizeTemperature(temperature: number): number {
  const minTemp = -0.5;
  const maxTemp = 1.2;
  return Math.max(
    0,
    Math.min(1, (temperature - minTemp) / (maxTemp - minTemp))
  );
}

/**
 * Utility function to convert decimal year to decade
 * @param year - Full year number
 * @returns decade as string (e.g., "1980s")
 */
function getDecade(year: number): string {
  const decade = Math.floor(year / 10) * 10;
  return `${decade}s`;
}

describe('Utility Functions', () => {
  describe('validateTemperatureData', () => {
    it('should return true for valid temperature data', () => {
      expect(validateTemperatureData(mockTemperatureData)).toBe(true);
    });

    it('should return false for empty array', () => {
      expect(validateTemperatureData([])).toBe(false);
    });

    it('should return false for invalid data structure', () => {
      const invalidData = [{ year: '1980', temperature: 0.26 }] as any;
      expect(validateTemperatureData(invalidData)).toBe(false);
    });

    it('should return false for years outside valid range', () => {
      const invalidYearData = [{ year: 1800, temperature: 0.26 }];
      expect(validateTemperatureData(invalidYearData)).toBe(false);
    });
  });

  describe('normalizeTemperature', () => {
    it('should normalize temperature values correctly', () => {
      expect(normalizeTemperature(0)).toBeCloseTo(0.294, 2);
      expect(normalizeTemperature(0.5)).toBeCloseTo(0.588, 2);
      expect(normalizeTemperature(1.0)).toBeCloseTo(0.882, 2);
    });

    it('should clamp values to 0-1 range', () => {
      expect(normalizeTemperature(-1)).toBe(0);
      expect(normalizeTemperature(2)).toBe(1);
    });
  });

  describe('getDefinitely', () => {
    it('should return correct decade strings', () => {
      expect(getDecade(1985)).toBe('1980s');
      expect(getDecade(1990)).toBe('1990s');
      expect(getDecade(2005)).toBe('2000s');
      expect(getDecade(2010)).toBe('2010s');
    });
  });
});
