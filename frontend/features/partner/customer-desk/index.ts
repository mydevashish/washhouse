export { PartnerCustomerDeskView } from '@/features/partner/customer-desk/partner-customer-desk-view';
export { PartnerCustomerDeskSearch } from '@/features/partner/customer-desk/components/partner-customer-desk-search';
export { PartnerCustomerDeskDrawer } from '@/features/partner/customer-desk/components/partner-customer-desk-drawer';
export { PartnerCustomerDeskPlaceOrderForm } from '@/features/partner/customer-desk/components/partner-customer-desk-place-order-form';
export {
  phoneSearchSchema,
  assistedOrderFormSchema,
  parseItemSummary,
} from '@/features/partner/customer-desk/schemas';
export {
  normalizeIndianPhoneInput,
  isValidIndianMobileE164,
  buildCustomerWhatsAppUrl,
  buildNewOrderHref,
  buildWalkInPrefillHref,
} from '@/features/partner/customer-desk/phone';
