import { api, type ApiEnvelope } from '@/lib/api';
import type { User } from '@/types/user';

export interface Address {
  id: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AddressInput {
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  is_default?: boolean;
  notes?: string;
}

export async function updateProfile(full_name: string): Promise<User> {
  const { data } = await api.patch<ApiEnvelope<User>>('/users/me', { full_name });
  return data.data;
}

export async function listAddresses(): Promise<Address[]> {
  const { data } = await api.get<ApiEnvelope<Address[]>>('/users/me/addresses');
  return data.data;
}

export async function createAddress(input: AddressInput): Promise<Address> {
  const { data } = await api.post<ApiEnvelope<Address>>('/users/me/addresses', input);
  return data.data;
}

export async function deleteAddress(id: string): Promise<void> {
  await api.delete(`/users/me/addresses/${id}`);
}
