class MetricsCollector {
  private totalRequests = 0;
  private totalInputTokens = 0;
  private totalOutputTokens = 0;
  private totalDurationMs = 0;
  private toolUsage = new Map<string, number>();
  private errorCounts = new Map<string, number>();
  private toolDurations = new Map<string, number[]>();
  private requestLog: Array<{
    domain: string;
    durationMs: number;
    inputTokens: number;
    outputTokens: number;
    toolsUsed: string[];
    error?: string;
  }> = [];
  private maxLogSize = 1000;

  recordRequest(params: {
    domain: string;
    durationMs: number;
    inputTokens: number;
    outputTokens: number;
    toolsUsed: string[];
    error?: string;
  }) {
    this.totalRequests++;
    this.totalInputTokens += params.inputTokens;
    this.totalOutputTokens += params.outputTokens;
    this.totalDurationMs += params.durationMs;

    for (const tool of params.toolsUsed) {
      this.toolUsage.set(tool, (this.toolUsage.get(tool) || 0) + 1);
    }

    if (params.error) {
      this.errorCounts.set(params.error, (this.errorCounts.get(params.error) || 0) + 1);
    }

    this.requestLog.push(params);
    if (this.requestLog.length > this.maxLogSize) {
      this.requestLog.shift();
    }
  }

  recordError(type: string, context: string = ""): void {
    const key = context ? `${type}:${context}` : type;
    this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1);
  }

  recordToolDuration(toolName: string, startTime: number): void {
    const duration = Date.now() - startTime;
    if (!this.toolDurations.has(toolName)) {
      this.toolDurations.set(toolName, []);
    }
    const durations = this.toolDurations.get(toolName)!;
    durations.push(duration);
    if (durations.length > 100) durations.shift();
  }

  getStats() {
    const avgDuration = this.totalRequests > 0
      ? Math.round(this.totalDurationMs / this.totalRequests)
      : 0;
    const avgTokens = this.totalRequests > 0
      ? Math.round((this.totalInputTokens + this.totalOutputTokens) / this.totalRequests)
      : 0;

    const toolStats: Record<string, { calls: number; avgDurationMs: number }> = {};
    for (const [tool, durations] of this.toolDurations) {
      const avg = durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;
      toolStats[tool] = {
        calls: this.toolUsage.get(tool) || 0,
        avgDurationMs: avg,
      };
    }

    return {
      totalRequests: this.totalRequests,
      totalInputTokens: this.totalInputTokens,
      totalOutputTokens: this.totalOutputTokens,
      totalDurationMs: this.totalDurationMs,
      avgDurationMs: avgDuration,
      avgTokensPerRequest: avgTokens,
      toolUsage: toolStats,
      errors: Object.fromEntries(this.errorCounts),
      cacheHits: 0,
      cacheMisses: 0,
    };
  }

  reset(): void {
    this.totalRequests = 0;
    this.totalInputTokens = 0;
    this.totalOutputTokens = 0;
    this.totalDurationMs = 0;
    this.toolUsage.clear();
    this.errorCounts.clear();
    this.toolDurations.clear();
    this.requestLog = [];
  }
}

export const metrics = new MetricsCollector();
