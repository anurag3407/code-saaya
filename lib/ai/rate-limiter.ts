/**
 * RateLimitedTaskQueue — Token Bucket concurrency controller
 *
 * Prevents hitting OpenRouter or custom API rate limits by enforcing:
 * - Maximum concurrent tasks (parallelism cap)
 * - Maximum requests per minute (RPM sliding window)
 * - Exponential backoff on 429 responses
 */
export class RateLimitedTaskQueue {
  private queue: (() => Promise<unknown>)[] = [];
  private activeCount = 0;
  private requestTimestamps: number[] = [];

  constructor(
    private maxConcurrency: number,
    private maxRpm: number
  ) {}

  async enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await this.executeWithRetry(task);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
      this.processQueue();
    });
  }

  private async executeWithRetry<T>(
    task: () => Promise<T>,
    retries = 3,
    delay = 2000
  ): Promise<T> {
    try {
      return await task();
    } catch (error: unknown) {
      const err = error as { status?: number; statusCode?: number };
      if ((err?.status === 429 || err?.statusCode === 429) && retries > 0) {
        console.warn(
          `[RateLimiter] 429 hit. Retrying in ${delay}ms... (${retries} left)`
        );
        await new Promise((res) => setTimeout(res, delay));
        return this.executeWithRetry(task, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  private processQueue() {
    if (this.queue.length === 0 || this.activeCount >= this.maxConcurrency) {
      return;
    }

    // Sliding window: remove timestamps older than 60s
    const now = Date.now();
    this.requestTimestamps = this.requestTimestamps.filter(
      (t) => now - t < 60_000
    );

    if (this.requestTimestamps.length >= this.maxRpm) {
      const oldest = this.requestTimestamps[0];
      const waitDelay = 60_000 - (now - oldest) + 200;
      setTimeout(() => this.processQueue(), waitDelay);
      return;
    }

    const nextTask = this.queue.shift();
    if (!nextTask) return;

    this.activeCount++;
    this.requestTimestamps.push(Date.now());

    nextTask().finally(() => {
      this.activeCount--;
      this.processQueue();
    });
  }

  get pending() {
    return this.queue.length;
  }

  get active() {
    return this.activeCount;
  }
}

/**
 * Creates a queue configured for the given provider tier
 */
export function createQueueForTier(isFreeTier: boolean, customRpm?: number, customConcurrency?: number) {
  if (customRpm && customConcurrency) {
    return new RateLimitedTaskQueue(customConcurrency, customRpm);
  }
  return isFreeTier
    ? new RateLimitedTaskQueue(3, 20)   // Free: 3 concurrent, 20 RPM
    : new RateLimitedTaskQueue(10, 200); // Paid: 10 concurrent, 200 RPM
}
