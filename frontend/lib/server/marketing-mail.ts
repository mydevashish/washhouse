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

const recentSubmissions = new Map<string, number[]>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_SUBMISSIONS_PER_IP = 5;

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
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

function getTransporter() {
  const port = Number(process.env.SMTP_PORT ?? 587);
  const secure = process.env.SMTP_USE_SSL === 'true' || port === 465;

  return nodemailer.createTransport({
    host: requiredEnv('SMTP_HOST'),
    port,
    secure,
    auth: {
      user: requiredEnv('SMTP_USERNAME'),
      pass: requiredEnv('SMTP_PASSWORD'),
    },
    requireTLS: process.env.SMTP_USE_TLS !== 'false' && !secure,
  });
}

function sendMail(payload: MarketingPayload, subject: string, text: string) {
  const from = requiredEnv('SMTP_FROM_EMAIL');
  const to = process.env.SUPPORT_EMAIL?.trim() || from;

  return getTransporter().sendMail({
    from,
    to,
    replyTo: 'email' in payload ? payload.email : undefined,
    subject,
    text,
  });
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