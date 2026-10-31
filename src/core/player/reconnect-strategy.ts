export interface ReconnectOptions {
  baseDelayMs?: number;
  maxDelayMs?: number;
  maxAttempts?: number;
  randomFn?: () => number;
}

export class ReconnectStrategy {
  private readonly baseDelayMs: number;
  private readonly maxDelayMs: number;
  private maxAttempts: number;
  private readonly randomFn: () => number;
  private attempt = 0;

  constructor(options: ReconnectOptions = {}) {
    this.baseDelayMs = options.baseDelayMs ?? 1000;
    this.maxDelayMs = options.maxDelayMs ?? 30000;
    this.maxAttempts = options.maxAttempts ?? 8;
    this.randomFn = options.randomFn ?? Math.random;
  }

  public setMaxAttempts(maxAttempts: number): void {
    this.maxAttempts = Math.max(0, maxAttempts);
  }

  public reset(): void {
    this.attempt = 0;
  }

  public getCurrentAttempt(): number {
    return this.attempt;
  }

  /**
   * Returns next delay in ms using exponential backoff + jitter,
   * or null if maxAttempts has been reached.
   */
  public nextDelayMs(): number | null {
    if (this.attempt >= this.maxAttempts) {
      return null;
    }
    this.attempt += 1;
    const expCap = Math.min(
      this.maxDelayMs,
      this.baseDelayMs * Math.pow(2, this.attempt - 1)
    );
    // Equal jitter: half deterministic + half random
    const half = expCap / 2;
    const jittered = half + this.randomFn() * half;
    return Math.round(jittered);
  }
}
