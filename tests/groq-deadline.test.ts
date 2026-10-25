import { describe, expect, it, vi } from "vitest";
import { createDeadline, DeadlineExceededError } from "@/lib/groq/deadline";

describe("createDeadline", () => {
  it("resolves work that finishes within the budget and clears the timer", async () => {
    const deadline = createDeadline(200, "test");
    const result = await new Promise<string>((resolve, reject) => {
      deadline.signal.addEventListener("abort", () => reject(deadline.signal.reason), {
        once: true,
      });
      setTimeout(() => resolve("done"), 10);
    });

    expect(result).toBe("done");
    expect(deadline.exceeded).toBe(false);
    expect(deadline.remainingMs).toBeGreaterThan(150);
    deadline.cancel();
  });

  it("aborts with DeadlineExceededError once the budget runs out", async () => {
    const deadline = createDeadline(25, "test");

    const reason = await new Promise<unknown>((resolve) => {
      deadline.signal.addEventListener("abort", () => resolve(deadline.signal.reason), {
        once: true,
      });
    });

    expect(reason).toBeInstanceOf(DeadlineExceededError);
    expect((reason as DeadlineExceededError).limitMs).toBe(25);
    expect(deadline.exceeded).toBe(true);
    expect(deadline.remainingMs).toBe(0);
    deadline.cancel();
  });

  it("cancelling before the budget prevents the abort", async () => {
    vi.useFakeTimers();
    try {
      const deadline = createDeadline(100, "test");
      deadline.cancel();
      await vi.advanceTimersByTimeAsync(150);

      expect(deadline.signal.aborted).toBe(false);
      expect(deadline.exceeded).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("remainingMs shrinks as time passes and never goes negative", async () => {
    vi.useFakeTimers();
    try {
      const deadline = createDeadline(100, "test");
      await vi.advanceTimersByTimeAsync(40);
      expect(deadline.remainingMs).toBe(60);
      await vi.advanceTimersByTimeAsync(120);
      expect(deadline.remainingMs).toBe(0);
      deadline.cancel();
    } finally {
      vi.useRealTimers();
    }
  });
});
