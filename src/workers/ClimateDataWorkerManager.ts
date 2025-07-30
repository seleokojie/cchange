/**
 * @fileoverview Web Worker Manager for Climate Data Processing
 * Manages communication with Web Workers for heavy computations
 */

import { ClimateDataPoint } from '../../types';

interface ProcessedClimateData {
  data: ClimateDataPoint[];
  stats: Record<string, number>;
}

interface WorkerMessage {
  type: string;
  requestId: string;
  data?: ClimateDataPoint[] | object;
  stats?: Record<string, number>;
  year?: string;
  error?: string;
}

interface PendingRequest<T = unknown> {
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

export class ClimateDataWorkerManager {
  private worker: Worker | null = null;
  private processingRequests: Map<
    string,
    PendingRequest<ProcessedClimateData>
  > = new Map();
  private statisticsRequests: Map<
    string,
    PendingRequest<Record<string, number>>
  > = new Map();
  private requestIdCounter = 0;

  /**
   * Initializes the Web Worker
   */
  async init(): Promise<void> {
    if (!this.worker) {
      // Create worker with proper module support
      this.worker = new Worker(
        new URL('./climateDataWorker.ts', import.meta.url),
        { type: 'module' }
      );

      this.worker.onmessage = this.handleWorkerMessage.bind(this);
      this.worker.onerror = this.handleWorkerError.bind(this);
    }
  }

  /**
   * Processes climate data using Web Worker
   * @param data - Raw year data array
   * @param year - Target year string
   * @returns Promise resolving to processed climate data
   */
  async processClimateData(
    data: number[],
    year: string
  ): Promise<ProcessedClimateData> {
    if (!this.worker) {
      await this.init();
    }

    const requestId = this.generateRequestId();

    return new Promise((resolve, reject) => {
      this.processingRequests.set(requestId, { resolve, reject });

      this.worker!.postMessage({
        type: 'PROCESS_CLIMATE_DATA',
        data,
        year,
        requestId,
      });
    });
  }

  /**
   * Calculates statistics using Web Worker
   * @param data - Climate data points
   * @returns Promise resolving to statistics
   */
  async calculateStatistics(
    data: ClimateDataPoint[]
  ): Promise<Record<string, number>> {
    if (!this.worker) {
      await this.init();
    }

    const requestId = this.generateRequestId();

    return new Promise((resolve, reject) => {
      this.statisticsRequests.set(requestId, { resolve, reject });

      this.worker!.postMessage({
        type: 'CALCULATE_STATISTICS',
        data,
        requestId,
      });
    });
  }

  /**
   * Handles messages from the Web Worker
   * @param event - Message event from worker
   */
  private handleWorkerMessage(event: MessageEvent<WorkerMessage>): void {
    const { type, requestId, data, stats, error } = event.data;

    // Try to find the request in either map
    const pendingRequest =
      this.processingRequests.get(requestId) ||
      this.statisticsRequests.get(requestId);

    if (!pendingRequest) {
      console.warn('Received message for unknown request:', requestId);
      return;
    }

    // Remove from both maps (only one will have the entry)
    this.processingRequests.delete(requestId);
    this.statisticsRequests.delete(requestId);

    switch (type) {
      case 'CLIMATE_DATA_PROCESSED': {
        const processingRequest = this.processingRequests.get(requestId);
        if (processingRequest && data && stats) {
          processingRequest.resolve({
            data: data as ClimateDataPoint[],
            stats,
          });
        } else if (processingRequest) {
          processingRequest.reject(new Error('Invalid climate data response'));
        }
        break;
      }

      case 'STATISTICS_CALCULATED': {
        const statisticsRequest = this.statisticsRequests.get(requestId);
        if (statisticsRequest && stats) {
          statisticsRequest.resolve(stats);
        } else if (statisticsRequest) {
          statisticsRequest.reject(new Error('Invalid statistics response'));
        }
        break;
      }

      case 'ERROR': {
        if (pendingRequest) {
          pendingRequest.reject(new Error(error || 'Worker error'));
        }
        break;
      }

      default: {
        if (pendingRequest) {
          pendingRequest.reject(new Error(`Unknown response type: ${type}`));
        }
      }
    }
  }

  /**
   * Handles Web Worker errors
   * @param error - Error event from worker
   */
  private handleWorkerError(error: ErrorEvent): void {
    console.error('Web Worker error:', error);

    // Reject all pending requests
    for (const [_requestId, request] of this.processingRequests) {
      request.reject(new Error(`Worker error: ${error.message}`));
    }
    for (const [_requestId, request] of this.statisticsRequests) {
      request.reject(new Error(`Worker error: ${error.message}`));
    }
    this.processingRequests.clear();
    this.statisticsRequests.clear();
  }

  /**
   * Generates a unique request ID
   * @returns Unique request identifier
   */
  private generateRequestId(): string {
    return `req_${++this.requestIdCounter}_${Date.now()}`;
  }

  /**
   * Terminates the Web Worker and cleans up resources
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    // Reject all pending requests
    for (const [_requestId, request] of this.processingRequests) {
      request.reject(new Error('Worker terminated'));
    }
    for (const [_requestId, request] of this.statisticsRequests) {
      request.reject(new Error('Worker terminated'));
    }
    this.processingRequests.clear();
    this.statisticsRequests.clear();
  }
}
