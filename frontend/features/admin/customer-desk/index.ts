export { CustomerDeskView } from '@/features/admin/customer-desk/customer-desk-view';
export { CustomerDeskSearch } from '@/features/admin/customer-desk/components/customer-desk-search';
export { CustomerDeskDrawer } from '@/features/admin/customer-desk/components/customer-desk-drawer';
export { CustomerDeskPlaceOrderForm } from '@/features/admin/customer-desk/components/customer-desk-place-order-form';
export {
  phoneSearchSchema,
  assistedOrderFormSchema,
} from '@/features/admin/customer-desk/schemas';
export {
  normalizeIndianPhoneInput,
  isValidIndianMobileE164,
  buildCustomerWhatsAppUrl,
} from '@/features/admin/customer-desk/phone';
