import 'server-only';

import nodemailer from 'nodemailer';

import {
  marketingContactCreateSchema,
  marketingFranchiseInquiryCreateSchema,
  marketingBookNowCreateSchema,
  type MarketingContactCreate,
  type MarketingFranchiseInquiryCreate,
  type MarketingBookNowCreate,
} from '@/lib/api/marketing';

type MarketingPayload = MarketingContactCreate | MarketingFranchiseInquiryCreate;

export class SmtpNotConfiguredError extends Error {
  readonly variable: string;

  constructor(variable: string) {
    super(`Missing ${variable}`);
    this.name = 'SmtpNotConfiguredError';
    this.variable = variable;
  }
}

const recentSubmissions = new Map<string, number[]>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_SUBMISSIONS_PER_IP = 5;
const SMTP_TIMEOUT_MS = 15_000;

let transporter: ReturnType<typeof nodemailer.createTransport> | undefined;

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new SmtpNotConfiguredError(name);
  return value;
}

function smtpPassword(): string {
  // Gmail app passwords are often copied with spaces.
  return requiredEnv('SMTP_PASSWORD').replace(/\s+/g, '');
}

function getClientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

export function checkMarketingRateLimit(request: Request): boolean {
  const now = Date.now();
  const key = getClientIp(request);
  const recent = (recentSubmissions.get(key) ?? []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= MAX_SUBMISSIONS_PER_IP) return false;
  recent.push(now);
  recentSubmissions.set(key, recent);
  return true;
}

export function isSmtpNotConfiguredError(error: unknown): boolean {
  return error instanceof SmtpNotConfiguredError;
}

function smtpErrorCode(error: unknown): string {
  if (!error || typeof error !== 'object' || !('code' in error)) return 'UNKNOWN';
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : 'UNKNOWN';
}

function shouldRetryWithImplicitTls(error: unknown): boolean {
  const code = smtpErrorCode(error);
  return (
    code === 'ETIMEDOUT' ||
    code === 'ESOCKET' ||
    code === 'ECONNECTION' ||
    code === 'ECONNRESET' ||
    code === 'ECONNREFUSED' ||
    code === 'ETLS'
  );
}

function createTransporter(forceImplicitTls: boolean) {
  const host = requiredEnv('SMTP_HOST');
  const configuredPort = Number(process.env.SMTP_PORT ?? 587);
  const useSsl = process.env.SMTP_USE_SSL === 'true' || forceImplicitTls;
  const port = useSsl ? 465 : configuredPort || 587;
  const secure = useSsl || port === 465;
  const useTls = process.env.SMTP_USE_TLS !== 'false';

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: requiredEnv('SMTP_USERNAME'),
      pass: smtpPassword(),
    },
    requireTLS: useTls && !secure,
    // Vercel/Gmail: prefer IPv4; IPv6 from serverless often times out.
    family: 4,
    tls: {
      minVersion: 'TLSv1.2',
      servername: host,
    },
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
    pool: false,
  });
}

function getTransporter(forceImplicitTls = false) {
  if (transporter && !forceImplicitTls) return transporter;
  transporter = createTransporter(forceImplicitTls);
  return transporter;
}

function resetTransporter() {
  transporter = undefined;
}

function logSmtpFailure(error: unknown, attempt: 'primary' | 'ssl-fallback') {
  console.error('marketing.smtp.failed', {
    attempt,
    code: smtpErrorCode(error),
    message: error instanceof Error ? error.message : 'unknown',
    hasHost: Boolean(process.env.SMTP_HOST?.trim()),
    hasUser: Boolean(process.env.SMTP_USERNAME?.trim()),
    hasPass: Boolean(process.env.SMTP_PASSWORD?.trim()),
    hasFrom: Boolean(process.env.SMTP_FROM_EMAIL?.trim()),
    port: process.env.SMTP_PORT ?? '587',
  });
}

async function sendMail(payload: MarketingPayload, subject: string, text: string) {
  const from = requiredEnv('SMTP_FROM_EMAIL');
  const to = process.env.SUPPORT_EMAIL?.trim() || from;
  const mail = {
    from,
    to,
    replyTo: 'email' in payload ? payload.email : undefined,
    subject,
    text,
  };

  try {
    await getTransporter().sendMail(mail);
    return;
  } catch (error) {
    resetTransporter();
    logSmtpFailure(error, 'primary');
    if (!shouldRetryWithImplicitTls(error)) throw error;
  }

  try {
    await getTransporter(true).sendMail(mail);
  } catch (error) {
    resetTransporter();
    logSmtpFailure(error, 'ssl-fallback');
    throw error;
  }
}

export async function sendMarketingContact(payload: MarketingContactCreate) {
  const body = marketingContactCreateSchema.parse(payload);
  await sendMail(
    body,
    `[WashHouse Contact] ${body.subject}: ${body.name}`,
    `New contact form submission\n\nName: ${body.name}\nPhone: ${body.phone}\nEmail: ${body.email || '(none)'}\nSubject: ${body.subject}\n\n${body.message}`,
  );
}

export async function sendMarketingFranchiseInquiry(payload: MarketingFranchiseInquiryCreate) {
  const body = marketingFranchiseInquiryCreateSchema.parse(payload);
  await sendMail(
    body,
    `[WashHouse Franchise] ${body.city}: ${body.name}`,
    `New franchise inquiry\n\nName: ${body.name}\nPhone: ${body.phone}\nEmail: ${body.email}\nCity: ${body.city}\nInvestment: ${body.investment_range}\n\n${body.message}`,
  );
}

export async function sendBookNowInquiry(payload: MarketingContactCreate) {
  const body = marketingContactCreateSchema.parse(payload);
  await sendMail(
    body,
    `[WashHouse Book Now] ${body.subject}: ${body.name}`,
    `New book now inquiry\n\nName: ${body.name}\nPhone: ${body.phone}\nEmail: ${body.email || '(none)'}\nSubject: ${body.subject}\n\n${body.message}`,
  );
}

export async function sendMarketingBookNow(payload: MarketingBookNowCreate) {
  const body = marketingBookNowCreateSchema.parse(payload);
  const contactPayload: MarketingContactCreate = {
    name: body.name,
    phone: body.phone,
    subject: 'order-help',
    message: `Service: ${body.service}\nPreferred pickup time: ${body.preferred_time}\n\n${body.message}`,
  };
  await sendMail(
    contactPayload,
    `[WashHouse Book Now] ${body.name}`,
    `New book now inquiry\n\nName: ${body.name}\nPhone: ${body.phone}\nService: ${body.service}\nPreferred pickup time: ${body.preferred_time}\n\n${body.message}`,
  );
}
