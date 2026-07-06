import api from './api';

export const getOrderSummary = async () => {
  const response = await api.get('/place-order');
  return response.data;
};

export const placeOrder = async (orderData) => {
  const response = await api.post('/place-order', orderData);
  return response.data;
};

export const verifyPayment = async (paymentDetails, order, checkout) => {
  const response = await api.post('/verify-payment', {
    payment: paymentDetails,
    order: {
      id: order.id,
      receipt: order.receipt,
      amount: order.amount,
      currency: order.currency
    },
    checkout
  });
  return response.data;
};

export const getOrders = async () => {
  const response = await api.get('/orders');
  return response.data;
};

export const getOrderProducts = async (orderId) => {
  const response = await api.get(`/orders/${orderId}/products`);
  return response.data;
};

export const cancelOrder = async (orderId) => {
  const response = await api.patch(`/orders/${orderId}/cancel`);
  return response.data;
};
