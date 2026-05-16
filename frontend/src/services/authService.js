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
