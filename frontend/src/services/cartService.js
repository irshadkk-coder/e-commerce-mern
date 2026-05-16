import api from './api';

export const getCart = async () => {
  const response = await api.get('/cart');
  return response.data;
};

export const addToCart = async (productId) => {
  const response = await api.post(`/cart/${productId}`);
  return response.data;
};

export const updateCartQuantity = async (cartId, productId, count, currentQuantity) => {
  const response = await api.put('/cart/quantity', {
    cart: cartId,
    product: productId,
    count,
    quantity: currentQuantity
  });
  return response.data;
};
