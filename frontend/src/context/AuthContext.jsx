import { createContext, useState, useEffect } from 'react';
import { getToken, removeToken, getUser } from '../services/tokenStorage';
import { getCart } from '../services/cartService';
import { getWishlist } from '../services/wishlistService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistIds, setWishlistIds] = useState([]);

  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      if (token) {
        setUser(getUser());
        await fetchCartCount();
        await fetchWishlist();
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

  const fetchWishlist = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const data = await getWishlist();
      setWishlistIds(data.products?.map(p => p._id) || []);
    } catch (error) {
      console.error('Failed to fetch wishlist');
    }
  };

  const loginContext = async (userData) => {
    setUser(userData);
    await fetchCartCount();
    await fetchWishlist();
  };

  const logoutContext = () => {
    removeToken();
    setUser(null);
    setCartCount(0);
    setWishlistIds([]);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginContext, logoutContext, cartCount, fetchCartCount, wishlistIds, fetchWishlist, setWishlistIds }}>
      {children}
    </AuthContext.Provider>
  );
};
