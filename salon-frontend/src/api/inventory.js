import api from './axiosClient';

// ==========================================
// 1. PRODUCT APIs
// ==========================================

export const getProducts = async (params = {}) => {
  const response = await api.get('/products', { params });
  return response.data.data;
};

export const getProduct = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data.data;
};

export const createProduct = async (productData) => {
  const response = await api.post('/products', productData);
  return response.data.data;
};

export const updateProduct = async (id, productData) => {
  const response = await api.put(`/products/${id}`, productData);
  return response.data.data;
};

export const deleteProduct = async (id) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};

// ==========================================
// 2. STOCK MOVEMENT APIs
// ==========================================

export const recordStockMovement = async (productId, movementData) => {
  const response = await api.post(`/products/${productId}/movements`, movementData);
  return response.data.data;
};

export const getStockMovements = async (productId, params = {}) => {
  const response = await api.get(`/products/${productId}/movements`, { params });
  return response.data.data;
};

export const getAllStockMovements = async (params = {}) => {
  const response = await api.get('/stock-movements', { params });
  return response.data.data;
};

// ==========================================
// 3. SUPPLIER APIs
// ==========================================

export const getSuppliers = async () => {
  const response = await api.get('/suppliers');
  return response.data.data;
};

export const getSupplier = async (id) => {
  const response = await api.get(`/suppliers/${id}`);
  return response.data.data;
};

export const createSupplier = async (supplierData) => {
  const response = await api.post('/suppliers', supplierData);
  return response.data.data;
};

export const updateSupplier = async (id, supplierData) => {
  const response = await api.put(`/suppliers/${id}`, supplierData);
  return response.data.data;
};

export const deleteSupplier = async (id) => {
  const response = await api.delete(`/suppliers/${id}`);
  return response.data;
};

// ==========================================
// 4. PURCHASE ORDER APIs
// ==========================================

export const getPurchaseOrders = async (params = {}) => {
  const response = await api.get('/purchase-orders', { params });
  return response.data.data;
};

export const getPurchaseOrder = async (id) => {
  const response = await api.get(`/purchase-orders/${id}`);
  return response.data.data;
};

export const createPurchaseOrder = async (poData) => {
  const response = await api.post('/purchase-orders', poData);
  return response.data.data;
};

export const updatePurchaseOrderStatus = async (id, statusData) => {
  const response = await api.patch(`/purchase-orders/${id}/status`, statusData);
  return response.data.data;
};

// ==========================================
// 5. SERVICE CONSUMPTION APIs
// ==========================================

export const getServiceConsumptions = async (serviceId) => {
  const response = await api.get(`/service-consumptions/service/${serviceId}`);
  return response.data.data;
};

export const createServiceConsumption = async (data) => {
  const response = await api.post('/service-consumptions', data);
  return response.data.data;
};

export const deleteServiceConsumption = async (id) => {
  const response = await api.delete(`/service-consumptions/${id}`);
  return response.data;
};
