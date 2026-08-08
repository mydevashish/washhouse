import {
  canRunCapability,
  filterStaffByCapability,
  isAssignableForCapability,
  isStaffOnShift,
  parseStaffCapability,
  staffCoverage,
  staffHref,
  staffRoleFamily,
  staffRoleVisual,
  staffStatus,
} from '@/features/partner/lib/owner-staff';
import type { StaffMember, WorkSchedule } from '@/services/staff-management';

function member(partial: Partial<StaffMember> & Pick<StaffMember, 'id' | 'name' | 'role'>): StaffMember {
  return {
    laundry_id: 'l1',
    laundry_name: 'Shop',
    user_id: null,
    email: null,
    phone: null,
    role_label: String(partial.role),
    is_active: true,
    is_suspended: false,
    suspended_reason: null,
    work_schedule: null,
    last_login_at: null,
    last_active_at: null,
    created_at: '2026-01-01T00:00:00Z',
    ...partial,
  };
}

describe('owner-staff', () => {
  it('maps roles to families and visuals', () => {
    expect(staffRoleFamily('pickup_agent')).toBe('pickup');
    expect(staffRoleFamily('delivery_only')).toBe('delivery');
    expect(staffRoleFamily('operator')).toBe('inventory');
    expect(staffRoleFamily('manager')).toBe('full');
    expect(staffRoleVisual('pickup_agent').blurb).toMatch(/Collects/i);
    expect(staffRoleVisual('delivery_agent').imageSrc).toBeTruthy();
  });

  it('status pills are text-labeled', () => {
    expect(staffStatus({ is_active: true, is_suspended: false }).label).toBe('Active');
    expect(staffStatus({ is_active: true, is_suspended: true }).label).toBe('Suspended');
    expect(staffStatus({ is_active: false, is_suspended: false }).label).toBe('Offline');
    expect(staffStatus({ is_active: false, is_suspended: false }).description).toMatch(/Offline/i);
  });

  it('capability eligibility matches logistics roles', () => {
    expect(canRunCapability('pickup_agent', 'pickup')).toBe(true);
    expect(canRunCapability('pickup_agent', 'delivery')).toBe(false);
    expect(canRunCapability('manager', 'delivery')).toBe(true);
    expect(
      isAssignableForCapability(
        { role: 'delivery_agent', is_active: true, is_suspended: false },
        'delivery',
      ),
    ).toBe(true);
    expect(
      isAssignableForCapability(
        { role: 'delivery_agent', is_active: false, is_suspended: false },
        'delivery',
      ),
    ).toBe(false);
  });

  it('builds coverage gap when nobody ready', () => {
    const members = [
      member({ id: '1', name: 'A', role: 'operator', is_active: true }),
      member({ id: '2', name: 'B', role: 'pickup_agent', is_active: false }),
    ];
    expect(staffCoverage(members, 'pickup').gap).toBe(true);
    expect(staffCoverage(members, 'pickup').ready).toHaveLength(0);

    const withRider = [...members, member({ id: '3', name: 'C', role: 'pickup_agent' })];
    expect(staffCoverage(withRider, 'pickup').gap).toBe(false);
    expect(staffCoverage(withRider, 'pickup').ready).toHaveLength(1);
  });

  it('filters roster by capability and parses query', () => {
    expect(parseStaffCapability('pickup')).toBe('pickup');
    expect(parseStaffCapability('x')).toBeNull();
    const members = [
      member({ id: '1', name: 'A', role: 'pickup_agent' }),
      member({ id: '2', name: 'B', role: 'delivery_agent' }),
    ];
    expect(filterStaffByCapability(members, 'pickup')).toHaveLength(1);
    expect(staffHref({ capability: 'delivery', action: 'add' })).toBe(
      '/partner/staff?capability=delivery&action=add',
    );
  });

  it('derives on-shift from schedule in Asia/Kolkata', () => {
    const schedule: WorkSchedule = {
      days: ['sat'],
      start_time: '09:00',
      end_time: '18:00',
      timezone: 'Asia/Kolkata',
    };
    // 2026-08-08 is a Saturday
    const saturdayNoonIst = new Date('2026-08-08T06:30:00Z'); // 12:00 IST
    expect(isStaffOnShift(schedule, saturdayNoonIst)).toBe(true);
    const sundayNoonIst = new Date('2026-08-09T06:30:00Z');
    expect(isStaffOnShift(schedule, sundayNoonIst)).toBe(false);
    expect(isStaffOnShift(null, saturdayNoonIst)).toBe(true);
  });
});
