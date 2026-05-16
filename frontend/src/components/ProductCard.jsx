import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { addToCart } from '../services/cartService';
import { productImageUrl } from '../services/assetUrl';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { user, fetchCartCount } = useAuth();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);

  // Fallback image if product image isn't available
  const imageUrl = productImageUrl(product._id);

  const handleAddToCart = async (e) => {
    e.preventDefault(); // Prevent navigating to product detail
    
    if (!user) {
      toast('Please login to add to cart', { icon: '🔒' });
      navigate('/login');
      return;
    }

    if (user.role === 'admin') {
      toast.error('Admins cannot purchase items');
      return;
    }

    try {
      setAdding(true);
      await addToCart(product._id);
      await fetchCartCount();
      toast.success(`${product.name} added to cart!`);
    } catch (err) {
      toast.error('Failed to add product to cart');
    } finally {
      setAdding(false);
    }
  };

  return (
    <Link to={`/products/${product._id}`} className="product-card glass-panel">
      <div className="product-image-container">
        <img 
          src={imageUrl} 
          alt={product.name} 
          className="product-image"
          loading="lazy"
          onError={(e) => { e.target.src = 'https://via.placeholder.com/300x300/14141d/8c8c9a?text=No+Image'; }}
        />
        <div className="product-overlay">
          <button 
            className="btn btn-primary add-to-cart-btn" 
            onClick={handleAddToCart}
            disabled={adding}
          >
            {adding ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
      </div>
      
      <div className="product-info">
        <div className="product-header">
          <h3 className="product-title">{product.name}</h3>
          <span className="product-price">₹{product.price}</span>
        </div>
        
        <p className="product-category">{product.category}</p>
        <p className="product-desc">{product.description}</p>
      </div>
    </Link>
  );
};

export default ProductCard;
