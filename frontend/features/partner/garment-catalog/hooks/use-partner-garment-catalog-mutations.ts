'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getApiErrorMessage } from '@/lib/api-error-message';
import { queryKeys } from '@/lib/query-keys';
import {
  createPartnerGarment,
  deletePartnerGarment,
  updatePartnerGarment,
  uploadGarmentImage,
  previewGarmentImport,
  confirmGarmentImport,
  bulkDeletePartnerGarments,
  bulkSetGarmentsVisible,
  type GarmentCatalogCreateInput,
  type GarmentCatalogUpdateInput,
  type GarmentImportConfirmInput,
  type GarmentBulkDeleteInput,
  type GarmentBulkVisibleInput,
} from '@/services/partner-garment-catalog';

export function usePartnerGarmentCatalogMutations() {
  const queryClient = useQueryClient();

  const invalidateCatalog = () => {
    void queryClient.invalidateQueries({ queryKey: ['partner-garment-catalog'] });
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerGarmentCatalogSummary() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerGarmentCatalogClothWall() });
  };

  const createM = useMutation({
    mutationFn: (input: GarmentCatalogCreateInput) => createPartnerGarment(input),
    onSuccess: () => {
      toast.success('Garment added');
      invalidateCatalog();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not add garment')),
  });

  const updateM = useMutation({
    mutationFn: ({ id, input }: { id: string; input: GarmentCatalogUpdateInput }) =>
      updatePartnerGarment(id, input),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.partnerGarmentCatalogItem(vars.id) });
      toast.success('Garment updated');
      invalidateCatalog();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not update garment')),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deletePartnerGarment(id),
    onSuccess: () => {
      toast.success('Garment removed');
      invalidateCatalog();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not delete garment')),
  });

  const uploadImageM = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => uploadGarmentImage(id, file),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.partnerGarmentCatalogItem(vars.id) });
      invalidateCatalog();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Image upload failed')),
  });

  const previewImportM = useMutation({
    mutationFn: (file: File) => previewGarmentImport(file),
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not preview import')),
  });

  const confirmImportM = useMutation({
    mutationFn: (input: GarmentImportConfirmInput) => confirmGarmentImport(input),
    onSuccess: () => invalidateCatalog(),
    onError: (e) => toast.error(getApiErrorMessage(e, 'Import failed')),
  });

  const bulkDeleteM = useMutation({
    mutationFn: (input: GarmentBulkDeleteInput) => bulkDeletePartnerGarments(input),
    onSuccess: (data) => {
      toast.success(`Removed ${data.deleted_count} garment${data.deleted_count === 1 ? '' : 's'}`);
      invalidateCatalog();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Bulk delete failed')),
  });

  const bulkVisibleM = useMutation({
    mutationFn: (input: GarmentBulkVisibleInput) => bulkSetGarmentsVisible(input),
    onSuccess: (data) => {
      toast.success(
        `Made ${data.updated_count} garment${data.updated_count === 1 ? '' : 's'} visible on this page`,
      );
      invalidateCatalog();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not update visibility')),
  });

  return {
    createM,
    updateM,
    deleteM,
    uploadImageM,
    previewImportM,
    confirmImportM,
    bulkDeleteM,
    bulkVisibleM,
    invalidateCatalog,
  };
}
