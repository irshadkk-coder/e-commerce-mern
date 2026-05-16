import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getCart, updateCartQuantity } from '../services/cartService';
import { useAuth } from '../hooks/useAuth';
import { productImageUrl } from '../services/assetUrl';
import './CartPage.css';

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const { fetchCartCount } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const data = await getCart();
      if (data.status) {
        setCartItems(data.products || []);
        setTotal(data.totalValue || 0);
      }
    } catch (err) {
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (productId, count, currentQuantity) => {
    try {
      // Optistic UI update logic could go here
      const data = await updateCartQuantity(null, productId, count, currentQuantity);
      
      if (data.removeProduct) {
        toast.success('Item removed from cart');
      }
      
      // Refresh cart state from backend
      await fetchCart();
      await fetchCartCount();
    } catch (err) {
      toast.error('Failed to update quantity');
    }
  };

  if (loading) {
    return (
      <div className="page-container loading-state">
        <div className="spinner"></div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="page-container empty-state glass-panel" style={{ maxWidth: '800px', margin: '4rem auto' }}>
        <span className="empty-icon">🛒</span>
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added any products to your cart yet.</p>
        <Link to="/products" className="btn btn-primary mt-4">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      <h1 className="page-title" style={{ marginBottom: '2rem' }}>Your Cart</h1>
      
      <div className="cart-layout">
        <div className="cart-items-list">
          {cartItems.map((item) => (
            <div key={item.item} className="cart-item glass-panel">
              <img 
                src={productImageUrl(item.product._id)}
                alt={item.product.name} 
                className="cart-item-image"
                loading="lazy"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/150/14141d/8c8c9a?text=img'; }}
              />
              
              <div className="cart-item-details">
                <Link to={`/products/${item.product._id}`} className="cart-item-title">
                  {item.product.name}
                </Link>
                <div className="cart-item-category">{item.product.category}</div>
                <div className="cart-item-price">₹{item.product.price}</div>
              </div>

              <div className="cart-item-actions">
                <div className="quantity-controls">
                  <button 
                    className="qty-btn"
                    onClick={() => handleQuantityChange(item.product._id, -1, item.quantity)}
                  >
                    {item.quantity === 1 ? '🗑️' : '−'}
                  </button>
                  <span className="qty-value">{item.quantity}</span>
                  <button 
                    className="qty-btn"
                    onClick={() => handleQuantityChange(item.product._id, 1, item.quantity)}
                  >
                    +
                  </button>
                </div>
                <div className="cart-item-total">
                  ₹{Number(item.product.price) * item.quantity}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-summary glass-panel">
          <h3>Order Summary</h3>
          <div className="summary-row">
            <span>Items ({cartItems.reduce((acc, i) => acc + i.quantity, 0)})</span>
            <span>₹{total}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span className="text-success">Free</span>
          </div>
          <div className="summary-divider"></div>
          <div className="summary-row total-row">
            <span>Total Amount</span>
            <span className="total-price">₹{total}</span>
          </div>
          <button 
            className="btn btn-primary checkout-btn"
            onClick={() => navigate('/checkout')}
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
