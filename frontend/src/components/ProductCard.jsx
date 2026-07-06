import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ShoppingCart, Heart, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { addToCart } from '../services/cartService';
import { toggleWishlist } from '../services/wishlistService';
import { getProductImage } from '../services/assetUrl';
import { formatCategory } from '../constants/categories';
import './ProductCard.css';

const ProductCard = ({ product, skeleton = false, onWishlistUpdate }) => {
  // ─── Skeleton loader ───────────────────────────────────────────────────
  if (skeleton) {
    return (
      <div className="product-card-wrapper">
        <div className="product-card product-card-skeleton">
          <div className="skeleton-img shimmer" />
          <div className="product-info">
            <div className="skeleton-line short shimmer" />
            <div className="skeleton-line shimmer" />
            <div className="skeleton-line shimmer" style={{ width: '70%' }} />
            <div className="skeleton-line xshort shimmer" style={{ marginTop: '1rem' }} />
          </div>
        </div>
      </div>
    );
  }

  // ─── Normal card ──────────────────────────────────────────────────────────
  const { user, fetchCartCount, wishlistIds, fetchWishlist } = useAuth();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  
  const isWishlisted = wishlistIds?.includes(product?._id) || false;

  const imageUrl = getProductImage(product);
  const rating = product.rating || 4.5;
  const reviewCount = product.numReviews || 42;
  const discountPercentage = product.discount || 15;
  const currentPrice = Number(product.price || 0);
  const originalPrice = product.originalPrice || Math.round(currentPrice / (1 - discountPercentage / 100));

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

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

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast('Please login to use wishlist', { icon: '🔒' });
      return;
    }

    try {
      const response = await toggleWishlist(product._id);
      await fetchWishlist();
      
      if (response.added) {
        toast.success('Added to wishlist');
      } else {
        toast.success('Removed from wishlist');
      }
      
      if (onWishlistUpdate) {
        onWishlistUpdate(product._id, response.added);
      }
    } catch (err) {
      toast.error('Failed to update wishlist');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="product-card-wrapper"
    >
      <Link to={`/products/${product._id}`} className="product-card">
        <div className="product-image-wrapper">
          <div className="discount-badge">-{discountPercentage}%</div>
          <button
            className={`wishlist-btn ${isWishlisted ? 'active' : ''}`}
            onClick={handleWishlist}
            aria-label="Add to wishlist"
          >
            <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>
          <img
            src={imageUrl}
            alt={product.name}
            className="product-image"
            loading="lazy"
            onError={(e) => { e.target.src = 'https://via.placeholder.com/400x400/111111/666666?text=No+Image'; }}
          />
          <div className="product-overlay">
            <span className="quick-view-chip">
              <Eye size={15} />
              Quick View
            </span>
            <button
              className="btn btn-primary add-to-cart-btn"
              onClick={handleAddToCart}
              disabled={adding}
            >
              <ShoppingCart size={16} />
              {adding ? 'Adding...' : 'Add to Cart'}
            </button>
          </div>
        </div>

        <div className="product-info">
          <p className="product-category">{formatCategory(product.category)}</p>
          <h3 className="product-title">{product.name}</h3>

          <div className="product-rating">
            <div className="stars">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={i < Math.floor(rating) ? 'star-filled' : 'star-empty'}
                  fill={i < Math.floor(rating) ? 'currentColor' : 'none'}
                />
              ))}
            </div>
            <span className="rating-count">({reviewCount})</span>
          </div>

          <div className="product-footer">
            <div className="price-stack">
              <span className="product-original-price">₹{originalPrice.toLocaleString()}</span>
              <span className="product-price">₹{currentPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
