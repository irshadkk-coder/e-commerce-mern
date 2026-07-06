import api from './api';
import { setToken, setUser } from './tokenStorage';

export const login = async (email, password) => {
  const { data } = await api.post('/login', { email, password });
  if (data.status && data.token) {
    setToken(data.token);
    setUser(data.user);
  }
  return data;
};

export const signup = async (userData) => {
  const { data } = await api.post('/signup', userData);
  return data;
};

export const logout = async () => {
  try {
    await api.post('/logout');
  } catch (err) {
    // ignore
  }
};

export const verifyEmail = async (email, otp) => {
  const { data } = await api.post('/verify-email', { email, otp });
  return data;
};

export const resendVerificationEmail = async (email) => {
  const { data } = await api.post('/resend-verification', { email });
  return data;
};

export const forgotPassword = async (email) => {
  const { data } = await api.post('/forgot-password', { email });
  return data;
};

export const resetPassword = async (token, newPassword) => {
  const { data } = await api.post('/reset-password', { token, newPassword });
  return data;
};


export const logoutAll = async () => {
  const { data } = await api.post('/logout-all');
  return data;
};
