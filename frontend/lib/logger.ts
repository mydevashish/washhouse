type LogCtx = Record<string, unknown> | undefined;

const isProd = process.env.NODE_ENV === 'production';

function send(level: 'debug' | 'info' | 'warn' | 'error', msg: string, ctx?: LogCtx) {
  if (!isProd) {
    // eslint-disable-next-line no-console
    console[level === 'debug' ? 'log' : level](`[${level}]`, msg, ctx ?? '');
    return;
  }
  // In prod, forward to Sentry breadcrumb if available (lazy import to avoid bundling cost here).
  // Sentry.addBreadcrumb({ category: msg, level, data: ctx });
}

export const logger = {
  debug: (msg: string, ctx?: LogCtx) => send('debug', msg, ctx),
  info:  (msg: string, ctx?: LogCtx) => send('info', msg, ctx),
  warn:  (msg: string, ctx?: LogCtx) => send('warn', msg, ctx),
  error: (msg: string, ctx?: LogCtx) => send('error', msg, ctx),
};
