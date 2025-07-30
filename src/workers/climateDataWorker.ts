/**
 * @fileoverview Climate Data Processing Web Worker
 * Handles heavy data processing operations in a background thread
 */

interface ClimateDataPoint {
  lat: number;
  lon: number;
  delta: number;
}

// Remove unused YearData interface

/**
 * Processes raw climate data into visualization-ready format
 * @param yearData - Raw year data array
 * @param _year - Target year string (unused in processing)
 * @returns Processed climate data points
 */
function processClimateData(
  yearData: number[],
  _year: string
): ClimateDataPoint[] {
  const output: ClimateDataPoint[] = [];

  for (let i = 0; i < yearData.length; i += 3) {
    const lat = yearData[i];
    const lon = yearData[i + 1];
    const delta = yearData[i + 2];

    // Skip invalid data points
    if (lat === undefined || lon === undefined || delta === undefined) {
      continue;
    }

    // Skip zero temperature anomalies for performance
    if (delta === 0) {
      continue;
    }

    const dataObject: ClimateDataPoint = {
      lat: lat,
      lon: lon,
      delta: delta,
    };

    output.push(dataObject);
  }

  return output;
}

/**
 * Calculates temperature statistics for a dataset
 * @param data - Climate data points
 * @returns Statistical summary
 */
function calculateStatistics(data: ClimateDataPoint[]): {
  count: number;
  minDelta: number;
  maxDelta: number;
  avgDelta: number;
  nonZeroCount: number;
} {
  if (data.length === 0) {
    return {
      count: 0,
      minDelta: 0,
      maxDelta: 0,
      avgDelta: 0,
      nonZeroCount: 0,
    };
  }

  let minDelta = data[0].delta;
  let maxDelta = data[0].delta;
  let sum = 0;
  let nonZeroCount = 0;

  for (const point of data) {
    sum += point.delta;
    if (point.delta !== 0) nonZeroCount++;
    if (point.delta < minDelta) minDelta = point.delta;
    if (point.delta > maxDelta) maxDelta = point.delta;
  }

  return {
    count: data.length,
    minDelta,
    maxDelta,
    avgDelta: sum / data.length,
    nonZeroCount,
  };
}

// Web Worker message handler
self.onmessage = function (e: MessageEvent) {
  const { type, data, year, requestId } = e.data;

  try {
    switch (type) {
      case 'PROCESS_CLIMATE_DATA': {
        const processedData = processClimateData(data, year);
        const stats = calculateStatistics(processedData);

        self.postMessage({
          type: 'CLIMATE_DATA_PROCESSED',
          requestId,
          data: processedData,
          stats,
          year,
        });
        break;
      }

      case 'CALCULATE_STATISTICS': {
        const statistics = calculateStatistics(data);

        self.postMessage({
          type: 'STATISTICS_CALCULATED',
          requestId,
          stats: statistics,
        });
        break;
      }

      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
