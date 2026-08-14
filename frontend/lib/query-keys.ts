/** Shared TanStack Query keys — keeps cache hits across routes. */

export type GarmentCatalogListQueryKeyParams = {
  category?: string;
  search?: string;
  page?: number;
  page_size?: number;
};

export const queryKeys = {
  laundries: (city?: string) => ['laundries', city ?? 'all'] as const,
  laundrySearch: (params: {
    q: string;
    sort?: string;
    minRating?: number;
    city?: string;
  }) => ['laundries', 'search', params] as const,
  laundry: (id: string) => ['laundry', id] as const,
  laundryPriceList: (id: string) => ['laundry-price-list', id] as const,
  reviews: (laundryId: string) => ['reviews', laundryId] as const,
  orders: (limit = 10, offset = 0) => ['orders', { limit, offset }] as const,
  order: (id: string) => ['order', id] as const,
  orderEvents: (id: string) => ['order-events', id] as const,
  pickupEvidence: (orderId: string, scope: 'customer' | 'partner' | 'admin') =>
    ['pickup-evidence', scope, orderId] as const,
  inventoryVerification: (orderId: string, scope: 'customer' | 'partner' | 'admin') =>
    ['inventory-verification', scope, orderId] as const,
  complaints: () => ['complaints'] as const,
  complaint: (id: string) => ['complaint', id] as const,
  adminDisputes: () => ['admin-disputes'] as const,
  adminDisputesTable: (filters?: object) => ['admin-disputes-table', filters ?? {}] as const,
  adminDisputeMetrics: () => ['admin-dispute-metrics'] as const,
  adminDisputeAssignees: () => ['admin-dispute-assignees'] as const,
  adminDisputeDetail: (id: string) => ['admin-dispute-detail', id] as const,
  adminDispute: (id: string) => ['admin-dispute', id] as const,
  adminBookingRequests: (filters?: object) => ['admin-booking-requests', filters ?? {}] as const,
  adminBookingRequestDetail: (id: string) => ['admin-booking-request-detail', id] as const,
  adminBookingRequestsByPhone: (phone: string) =>
    ['admin-booking-requests-by-phone', phone] as const,
  adminBookingRequestSuggestLaundries: (id: string) =>
    ['admin-booking-request-suggest-laundries', id] as const,
  adminCustomerDeskLookup: (key: string) => ['admin-customer-desk', 'lookup', key] as const,
  adminCustomerDeskSearch: (q: string) => ['admin-customer-desk', 'search', q] as const,
  adminCustomerDeskOrders: (key: string, filters?: object) =>
    ['admin-customer-desk', 'orders', key, filters ?? {}] as const,
  partnerCustomerDeskLookup: (key: string) => ['partner-customer-desk', 'lookup', key] as const,
  partnerCustomerDeskSearch: (q: string) => ['partner-customer-desk', 'search', q] as const,
  partnerCustomerDeskOrders: (key: string, filters?: object) =>
    ['partner-customer-desk', 'orders', key, filters ?? {}] as const,
  partnerCustomerInsightRow: (key: string) =>
    ['partner-customer-insight-row', key] as const,
  partnerBookingRequests: (filters?: object) =>
    ['partner-booking-requests', filters ?? {}] as const,
  partnerBookingRequestDetail: (id: string) => ['partner-booking-request-detail', id] as const,
  partnerBookingRequestsByPhone: (phone: string) =>
    ['partner-booking-requests-by-phone', phone] as const,
  adminTrustScores: () => ['admin-trust-scores'] as const,
  adminTrustScore: (userId: string) => ['admin-trust-score', userId] as const,
  adminLaundryTrustScores: () => ['admin-laundry-trust-scores'] as const,
  adminLaundryTrustScore: (laundryId: string) => ['admin-laundry-trust-score', laundryId] as const,
  partnerTrustScore: () => ['partner-trust-score'] as const,
  adminFraudAlerts: (status?: string) => ['admin-fraud-alerts', status ?? 'all'] as const,
  adminFraudAlert: (alertId: string) => ['admin-fraud-alert', alertId] as const,
  adminFraudSummary: () => ['admin-fraud-summary'] as const,
  adminInventoryChanges: () => ['admin-inventory-changes'] as const,
  deliveryOtp: (orderId: string) => ['delivery-otp', orderId] as const,
  deliveryVerification: (orderId: string, scope: 'partner' | 'customer') =>
    ['delivery-verification', scope, orderId] as const,
  deliveryProof: (orderId: string, scope: 'customer' | 'partner' | 'admin') =>
    ['delivery-proof', scope, orderId] as const,
  custodyTimeline: (orderId: string, scope: 'customer' | 'partner' | 'admin') =>
    ['custody-timeline', scope, orderId] as const,
  addresses: () => ['addresses'] as const,
  partnerAnalytics: () => ['partner-analytics'] as const,
  partnerAnalyticsOverview: (period: string) => ['partner-analytics-overview', period] as const,
  partnerAnalyticsDashboard: (period: string) => ['partner-analytics-dashboard', period] as const,
  partnerOrders: (params?: object) =>
    ['partner-orders', params ?? {}] as const,
  partnerOrder: (id: string) => ['partner-order', id] as const,
  partnerWalkInOrders: () => ['partner-walk-in-orders'] as const,
  partnerCustomers: () => ['partner-customers'] as const,
  partnerCustomerInsightsDashboard: () => ['partner-customer-insights-dashboard'] as const,
  partnerCustomerInsights: (list?: string, segment?: string) =>
    ['partner-customer-insights', list ?? 'all', segment ?? 'all'] as const,
  partnerStaff: () => ['partner-staff'] as const,
  partnerStaffDashboard: () => ['partner-staff-dashboard'] as const,
  partnerStaffMembers: () => ['partner-staff-members'] as const,
  partnerStaffActivity: (staffId?: string) => ['partner-staff-activity', staffId ?? 'all'] as const,
  partnerOperations: () => ['partner-operations'] as const,
  partnerOperationsDashboard: () => ['partner-operations-dashboard'] as const,
  partnerOperationsPickups: () => ['partner-operations-pickups'] as const,
  partnerOperationsDeliveries: () => ['partner-operations-deliveries'] as const,
  partnerOperationsDoneToday: () => ['partner-operations-done-today'] as const,
  partnerOperationsDrivers: () => ['partner-operations-drivers'] as const,
  partnerStorefront: () => ['partner-storefront'] as const,
  partnerServiceCatalog: () => ['partner-service-catalog'] as const,
  partnerGarmentCatalog: (params?: GarmentCatalogListQueryKeyParams) =>
    ['partner-garment-catalog', params ?? {}] as const,
  partnerGarmentCatalogSummary: () => ['partner-garment-catalog-summary'] as const,
  partnerGarmentCatalogClothWall: () => ['partner-garment-catalog-cloth-wall'] as const,
  partnerGarmentCatalogItem: (id: string) => ['partner-garment-catalog-item', id] as const,
  partnerCoupons: () => ['partner-coupons'] as const,
  partnerPriceList: () => ['partner-price-list'] as const,
  partnerStorefrontTemplates: () => ['partner-storefront-templates'] as const,
  laundryStorefront: (id: string) => ['laundry-storefront', id] as const,
  adminDashboard: () => ['admin-dashboard'] as const,
  adminPending: () => ['admin-pending'] as const,
  adminLaundries: () => ['admin-laundries'] as const,
  adminOrders: () => ['admin-orders'] as const,
  adminUsers: () => ['admin-users'] as const,
  adminCommission: () => ['admin-commission'] as const,
  adminPlatformConfig: () => ['admin-platform-config'] as const,
  adminPlatformConfigAudit: () => ['admin-platform-config-audit'] as const,
  appConfig: () => ['app-config'] as const,
  adminBusinessHealth: () => ['admin-business-health'] as const,
  partnerReviewAnalytics: () => ['partner-review-analytics'] as const,
  partnerReviews: (rating?: string, reply?: string, sentiment?: string) =>
    ['partner-reviews', rating ?? 'all', reply ?? 'all', sentiment ?? 'all'] as const,
  adminReviewDashboard: () => ['admin-review-dashboard'] as const,
  adminReviews: (status?: string, abuse?: boolean, fake?: boolean) =>
    ['admin-reviews', status ?? 'all', abuse ? 'abuse' : 'all', fake ? 'fake' : 'all'] as const,
  adminReviewAudit: (reviewId?: string) => ['admin-review-audit', reviewId ?? 'all'] as const,
  adminAnalytics: (days?: number) => ['admin-analytics', days ?? 14] as const,
  adminLaundriesManagement: () => ['admin-laundries-management'] as const,
  adminAuditLogs: (filters?: object) => ['admin-audit-logs', filters ?? {}] as const,
  adminRevenueAnalytics: (filters?: object) => ['admin-revenue-analytics', filters ?? {}] as const,
  adminRevenueLaundries: (filters?: object) => ['admin-revenue-laundries', filters ?? {}] as const,
  adminRevenueCharts: (filters?: object) => ['admin-revenue-charts', filters ?? {}] as const,
  adminRevenueLaundryDetail: (laundryId: string, filters?: object) =>
    ['admin-revenue-laundry', laundryId, filters ?? {}] as const,
  adminDisputeAnalytics: (filters?: object) => ['admin-dispute-analytics', filters ?? {}] as const,
  adminDisputeCharts: (filters?: object) => ['admin-dispute-charts', filters ?? {}] as const,
  adminSettlementDashboard: () => ['admin-settlement-dashboard'] as const,
  adminSettlementAnalytics: () => ['admin-settlement-analytics'] as const,
  adminSettlementAudit: (settlementId?: string) => ['admin-settlement-audit', settlementId ?? 'all'] as const,
  adminSettlementsTable: (filters?: object) => ['admin-settlements-table', filters ?? {}] as const,
  adminSettlementDetail: (id: string) => ['admin-settlement-detail', id] as const,
  partnerSettlements: (page?: number, pageSize?: number) =>
    ['partner-settlements', page ?? 1, pageSize ?? 10] as const,
  platformPartnerDashboard: () => ['platform-partner-dashboard'] as const,
  platformPartnerProfitSharing: () => ['platform-partner-profit-sharing'] as const,
  adminProfitSharingOverview: () => ['admin-profit-sharing-overview'] as const,
  adminProfitSharingExpenses: (year: number, month: number) => ['admin-profit-sharing-expenses', year, month] as const,
  adminProfitSharingPendingPayouts: () => ['admin-profit-sharing-pending-payouts'] as const,
  adminProfitSharingPayoutHistory: () => ['admin-profit-sharing-payout-history'] as const,
  adminAnnouncements: (status?: string) => ['admin-announcements', status ?? 'all'] as const,
  activeAnnouncements: () => ['active-announcements'] as const,
  marketingStats: () => ['marketing-stats'] as const,
  marketingTestimonials: (limit = 6) => ['marketing-testimonials', limit] as const,
} as const;
