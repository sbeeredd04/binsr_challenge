/**
 * Performance Monitor
 * Tracks execution time for each phase of PDF generation
 */

export class PerformanceMonitor {
  private timings = new Map<string, number>();
  private startTimes = new Map<string, number>();
  private phaseOrder: string[] = [];

  /**
   * Start timing a phase
   */
  public startPhase(phaseName: string): void {
    this.startTimes.set(phaseName, Date.now());
    if (!this.phaseOrder.includes(phaseName)) {
      this.phaseOrder.push(phaseName);
    }
  }

  /**
   * End timing a phase
   */
  public endPhase(phaseName: string): number {
    const startTime = this.startTimes.get(phaseName);
    if (!startTime) {
      console.warn(`No start time found for phase: ${phaseName}`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.timings.set(phaseName, duration);
    this.startTimes.delete(phaseName);
    return duration;
  }

  /**
   * Get timing for a specific phase
   */
  public getPhaseTime(phaseName: string): number {
    return this.timings.get(phaseName) || 0;
  }

  /**
   * Get total execution time
   */
  public getTotalTime(): number {
    return Array.from(this.timings.values()).reduce((sum, time) => sum + time, 0);
  }

  /**
   * Generate detailed timing report
   */
  public generateReport(): string {
    const totalTime = this.getTotalTime();
    const lines: string[] = [];

    lines.push('\n' + '='.repeat(80));
    lines.push('⏱️  PERFORMANCE REPORT');
    lines.push('='.repeat(80));
    lines.push('');

    // Sort by order of execution
    const sortedPhases = this.phaseOrder.filter(phase => this.timings.has(phase));

    sortedPhases.forEach(phase => {
      const time = this.timings.get(phase)!;
      const percentage = totalTime > 0 ? (time / totalTime * 100).toFixed(1) : '0.0';
      const bar = this.generateBar(time, totalTime);
      
      lines.push(`${phase.padEnd(40)} ${this.formatTime(time).padStart(10)} ${percentage.padStart(6)}% ${bar}`);
    });

    lines.push('');
    lines.push('-'.repeat(80));
    lines.push(`TOTAL EXECUTION TIME:                   ${this.formatTime(totalTime).padStart(10)}`);
    lines.push('='.repeat(80));

    return lines.join('\n');
  }

  /**
   * Format time in human-readable format
   */
  private formatTime(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(2)}s`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = ((ms % 60000) / 1000).toFixed(2);
      return `${minutes}m ${seconds}s`;
    }
  }

  /**
   * Generate visual progress bar
   */
  private generateBar(time: number, totalTime: number): string {
    const maxBarLength = 20;
    const percentage = totalTime > 0 ? time / totalTime : 0;
    const filledLength = Math.round(maxBarLength * percentage);
    const filled = '█'.repeat(filledLength);
    const empty = '░'.repeat(maxBarLength - filledLength);
    return `[${filled}${empty}]`;
  }

  /**
   * Log phase completion
   */
  public logPhaseCompletion(phaseName: string): void {
    const duration = this.endPhase(phaseName);
    console.log(`✓ ${phaseName}: ${this.formatTime(duration)}`);
  }

  /**
   * Reset all timings
   */
  public reset(): void {
    this.timings.clear();
    this.startTimes.clear();
    this.phaseOrder = [];
  }
}

