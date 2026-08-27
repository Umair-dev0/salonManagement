import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
} from '../../../api/inventory';

export const useSuppliers = () => {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: getSuppliers,
  });
};

export const useSupplier = (id) => {
  return useQuery({
    queryKey: ['supplier', id],
    queryFn: () => getSupplier(id),
    enabled: !!id,
  });
};

export const useCreateSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
};

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateSupplier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
};

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
};

export const usePurchaseOrders = (params = {}) => {
  return useQuery({
    queryKey: ['purchase-orders', params],
    queryFn: () => getPurchaseOrders(params),
  });
};

export const usePurchaseOrder = (id) => {
  return useQuery({
    queryKey: ['purchase-order', id],
    queryFn: () => getPurchaseOrder(id),
    enabled: !!id,
  });
};

export const useCreatePurchaseOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPurchaseOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdatePOStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updatePurchaseOrderStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
    },
  });
};
