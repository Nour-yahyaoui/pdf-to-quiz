/**
 * A hard wall-clock budget for the whole generation sequence.
 *
 * Serverless platforms terminate the function at its maxDuration and return
 * a non-JSON 504, which the client cannot explain. An in-process deadline
 * lets us abort model calls ourselves and answer with a proper JSON error
 * while there is still time left in the invocation.
 */
export class DeadlineExceededError extends Error {
  constructor(
    public readonly label: string,
    public readonly limitMs: number,
  ) {
    super(`${label} exceeded its ${limitMs}ms budget`);
    this.name = "DeadlineExceededError";
  }
}

export interface Deadline {
  /** Aborts with DeadlineExceededError when the budget runs out. */
  signal: AbortSignal;
  /** Milliseconds left before the budget is spent (never negative). */
  readonly remainingMs: number;
  /** True once the deadline has fired. */
  readonly exceeded: boolean;
  /** Stop the timer once the work finished in time. */
  cancel(): void;
}

export function createDeadline(ms: number, label: string): Deadline {
  const controller = new AbortController();
  const startedAt = Date.now();
  let exceeded = false;

  const timer = setTimeout(() => {
    exceeded = true;
    controller.abort(new DeadlineExceededError(label, ms));
  }, ms);
  // The deadline must not keep a serverless instance alive on its own.
  timer.unref?.();

  return {
    signal: controller.signal,
    get remainingMs() {
      return Math.max(0, ms - (Date.now() - startedAt));
    },
    get exceeded() {
      return exceeded;
    },
    cancel() {
      clearTimeout(timer);
    },
  };
}
