/**
 * @fileoverview Unit tests for data loading functionality
 * Tests JSON data fetching, parsing, and error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Mock data loader class for testing
 */
class DataLoader {
  /**
   * Loads temperature data from JSON file
   * @param url - URL to fetch data from
   * @returns Promise resolving to temperature data array
   */
  async loadTemperatureData(
    url: string
  ): Promise<Array<{ year: number; temperature: number }>> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return this.validateAndParseData(data);
    } catch (error) {
      console.error('Failed to load temperature data:', error);
      throw error;
    }
  }

  /**
   * Validates and parses raw JSON data
   * @param rawData - Raw data from JSON file
   * @returns Parsed and validated temperature data
   */
  private validateAndParseData(
    rawData: any
  ): Array<{ year: number; temperature: number }> {
    if (!Array.isArray(rawData)) {
      throw new Error('Data must be an array');
    }

    return rawData.map((item, index) => {
      if (
        typeof item.year !== 'number' ||
        typeof item.temperature !== 'number'
      ) {
        throw new Error(`Invalid data format at index ${index}`);
      }
      return {
        year: item.year,
        temperature: item.temperature,
      };
    });
  }
}

describe('DataLoader', () => {
  let dataLoader: DataLoader;

  beforeEach(() => {
    dataLoader = new DataLoader();
    vi.clearAllMocks();
  });

  describe('loadTemperatureData', () => {
    it('should successfully load and parse valid data', async () => {
      const mockData = [
        { year: 1980, temperature: 0.26 },
        { year: 1990, temperature: 0.45 },
      ];

      // Mock fetch
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await dataLoader.loadTemperatureData('/data/test.json');

      expect(result).toEqual(mockData);
      expect(fetch).toHaveBeenCalledWith('/data/test.json');
    });

    it('should handle HTTP errors', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(
        dataLoader.loadTemperatureData('/data/missing.json')
      ).rejects.toThrow('HTTP error! status: 404');
    });

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      await expect(
        dataLoader.loadTemperatureData('/data/test.json')
      ).rejects.toThrow('Network error');
    });

    it('should handle invalid JSON data', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => 'invalid data',
      });

      await expect(
        dataLoader.loadTemperatureData('/data/invalid.json')
      ).rejects.toThrow('Data must be an array');
    });

    it('should handle malformed data items', async () => {
      const malformedData = [
        { year: '1980', temperature: 0.26 }, // Invalid year type
      ];

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => malformedData,
      });

      await expect(
        dataLoader.loadTemperatureData('/data/malformed.json')
      ).rejects.toThrow('Invalid data format at index 0');
    });
  });
});
