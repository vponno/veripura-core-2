/**
 * VeriPura Logger - Tiered logging for grant demonstrations
 * 
 * Levels:
 * - DEMO: Key milestones for presentation (green ✓, yellow ⚠, red ✗)
 * - INFO: Important system events
 * - DEBUG: Detailed debugging info
 * 
 * Set VITE_LOG_LEVEL='demo' for clean presentation mode
 */

type LogLevel = 'demo' | 'info' | 'debug';

const getLogLevel = (): LogLevel => {
  if (typeof import.meta !== 'undefined') {
    return (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'demo';
  }
  return 'demo';
};

const currentLevel = getLogLevel();

const shouldLog = (level: LogLevel): boolean => {
  const levels: Record<LogLevel, number> = { demo: 0, info: 1, debug: 2 };
  return levels[level] >= levels[currentLevel];
};

// Demo-friendly format with emojis for grant presentations
const formatDemo = (emoji: string, prefix: string, ...args: unknown[]) => {
  const timestamp = new Date().toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
  console.log(`\u001b[90m${timestamp}\u001b[0m ${emoji} [\u001b[36m${prefix}\u001b[0m]`, ...args);
};

export const logger = {
  // ═══════════════════════════════════════════════════════════
  // DEMO LEVEL - Key events for grant presentations
  // ═══════════════════════════════════════════════════════════
  
  // Success events (green checkmark)
  demo: (message: string, ...args: unknown[]) => {
    if (shouldLog('demo')) formatDemo('\u001b[32m✓\u001b[0m', 'VERIPURA', message, ...args);
  },
  
  // Warning events (yellow ⚠)
  warn: (message: string, ...args: unknown[]) => {
    if (shouldLog('demo')) formatDemo('\u001b[33m⚠\u001b[0m', 'VERIPURA', message, ...args);
  },
  
  // Error events (red ✗)
  error: (message: string, ...args: unknown[]) => {
    if (shouldLog('demo')) formatDemo('\u001b[31m✗\u001b[0m', 'VERIPURA', message, ...args);
  },

  // ═══════════════════════════════════════════════════════════
  // INFO LEVEL - System events
  // ═══════════════════════════════════════════════════════════
  info: (message: string, ...args: unknown[]) => {
    if (shouldLog('info')) formatDemo('\u001b[34mℹ\u001b[0m', 'INFO', message, ...args);
  },

  // ═══════════════════════════════════════════════════════════
  // DEBUG LEVEL - Detailed logging
  // ═══════════════════════════════════════════════════════════
  debug: (message: string, ...args: unknown[]) => {
    if (shouldLog('debug')) formatDemo('\u001b[90m⋯\u001b[0m', 'DEBUG', message, ...args);
  },

  // Aliases for backward compatibility
  log: (message: string, ...args: unknown[]) => logger.demo(message, ...args),
  
  // ═══════════════════════════════════════════════════════════
  // Grant Demo Helpers - Pre-formatted for presentations
  // ═══════════════════════════════════════════════════════════
  
  // Document processing milestones
  doc: {
    uploaded: (filename: string) => logger.demo(`Document uploaded: ${filename}`),
    parsed: (type: string) => logger.demo(`Parsed ${type} successfully`),
    validated: (result: string) => logger.demo(`Validated: ${result}`, '\u001b[32mCOMPLIANT\u001b[0m'),
    flagged: (issue: string) => logger.warn(`Flagged: ${issue}`, '\u001b[33mREVIEW NEEDED\u001b[0m'),
  },
  
  // Agent activities
  agent: {
    started: (name: string) => logger.demo(`Agent activated: ${name}`),
    analyzing: (task: string) => logger.info(`Analyzing: ${task}`),
    completed: (result: string) => logger.demo(`Analysis complete: ${result}`),
  },
  
  // Blockchain anchoring
  blockchain: {
    anchoring: (docId: string) => logger.info(`Anchoring to IOTA: ${docId.substring(0, 8)}...`),
    anchored: (txId: string) => logger.demo(`Hash anchored on blockchain`, `\u001b[90mTX: ${txId.substring(0, 12)}...\u001b[0m`),
    verified: () => logger.demo(`Integrity verified`, '\u001b[32mIMMUTABLE\u001b[0m'),
  },
  
  // Compliance checks
  compliance: {
    checking: (rule: string) => logger.info(`Checking: ${rule}`),
    passed: (rule: string) => logger.demo(`${rule}: PASSED`, '\u001b[32m✓\u001b[0m'),
    failed: (rule: string, reason: string) => logger.warn(`${rule}: FAILED - ${reason}`, '\u001b[31m✗\u001b[0m'),
    warning: (rule: string, note: string) => logger.warn(`${rule}: WARNING - ${note}`, '\u001b[33m⚠\u001b[0m'),
  }
};
