import api from './api';

export const getAdminProducts = async () => {
  const response = await api.get('/admin/products');
  return response.data;
};

export const getAdminStats = async () => {
  const response = await api.get('/admin/stats');
  return response.data;
};

export const getAdminCategories = async () => {
  const response = await api.get('/admin/categories');
  return response.data;
};

export const addAdminCategory = async (name) => {
  const response = await api.post('/admin/categories', { name });
  return response.data;
};

export const deleteAdminCategory = async (id) => {
  const response = await api.delete(`/admin/categories/${id}`);
  return response.data;
};

export const addAdminProduct = async (formData) => {
  // Use multipart form data for image uploads
  const response = await api.post('/admin/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const updateAdminProduct = async (id, formData) => {
  const response = await api.put(`/admin/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const deleteAdminProduct = async (id) => {
  const response = await api.delete(`/admin/products/${id}`);
  return response.data;
};

export const getAdminOrders = async (params = {}) => {
  const response = await api.get('/admin/orders', { params });
  return response.data;
};

export const getAdminOrder = async (id) => {
  const response = await api.get(`/admin/orders/${id}`);
  return response.data;
};

export const updateAdminOrderStatus = async (id, status) => {
  const response = await api.patch(`/admin/orders/${id}/status`, { status });
  return response.data;
};
