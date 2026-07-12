import { api, type ApiEnvelope } from '@/lib/api';

export type FraudRiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type FraudSubjectType = 'customer' | 'partner';
export type FraudAlertStatus = 'open' | 'acknowledged' | 'resolved';

export const FRAUD_RISK_LABELS: Record<FraudRiskLevel, string> = {
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk',
  critical: 'Critical Risk',
};

export interface FraudAlert {
  id: string;
  subject_type: FraudSubjectType;
  subject_id: string;
  subject_name: string | null;
  signal_type: string;
  signal_label: string;
  risk_level: FraudRiskLevel;
  risk_label: string;
  title: string;
  description: string;
  status: FraudAlertStatus;
  reference_type: string | null;
  reference_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
}

export interface FraudRiskSummary {
  open_by_risk: Record<string, number>;
  total_open: number;
}

export async function listFraudAlerts(params?: {
  status?: FraudAlertStatus;
  risk_level?: FraudRiskLevel;
  subject_type?: FraudSubjectType;
}): Promise<FraudAlert[]> {
  const { data } = await api.get<ApiEnvelope<FraudAlert[]>>('/admin/fraud/alerts', { params });
  return data.data;
}

export async function getFraudAlert(alertId: string): Promise<FraudAlert> {
  const { data } = await api.get<ApiEnvelope<FraudAlert>>(`/admin/fraud/alerts/${alertId}`);
  return data.data;
}

export async function getFraudRiskSummary(): Promise<FraudRiskSummary> {
  const { data } = await api.get<ApiEnvelope<FraudRiskSummary>>('/admin/fraud/summary');
  return data.data;
}

export async function acknowledgeFraudAlert(alertId: string): Promise<FraudAlert> {
  const { data } = await api.post<ApiEnvelope<FraudAlert>>(`/admin/fraud/alerts/${alertId}/acknowledge`);
  return data.data;
}

export async function resolveFraudAlert(alertId: string): Promise<FraudAlert> {
  const { data } = await api.post<ApiEnvelope<FraudAlert>>(`/admin/fraud/alerts/${alertId}/resolve`);
  return data.data;
}
