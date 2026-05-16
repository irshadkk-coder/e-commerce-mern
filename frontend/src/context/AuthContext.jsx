import { createContext, useState, useEffect } from 'react';
import { getToken, removeToken, getUser } from '../services/tokenStorage';
import { getCart } from '../services/cartService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      if (token) {
        setUser(getUser());
        await fetchCartCount();
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const fetchCartCount = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const data = await getCart();
      // Calculate total quantity of items (not just unique types)
      const count = data.products?.reduce((acc, p) => acc + p.quantity, 0) || 0;
      setCartCount(count);
    } catch (error) {
      console.error('Failed to fetch cart count');
    }
  };

  const loginContext = async (userData) => {
    setUser(userData);
    await fetchCartCount();
  };

  const logoutContext = () => {
    removeToken();
    setUser(null);
    setCartCount(0);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginContext, logoutContext, cartCount, fetchCartCount }}>
      {children}
    </AuthContext.Provider>
  );
};
