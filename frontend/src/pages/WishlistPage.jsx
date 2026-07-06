import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { getWishlist } from '../services/wishlistService';
import ProductCard from '../components/ProductCard';
import './WishlistPage.css';

const WishlistPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const data = await getWishlist();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to fetch wishlist', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductWishlistUpdate = (productId, isWishlisted) => {
    if (!isWishlisted) {
      setProducts((prev) => prev.filter((p) => p._id !== productId));
    }
  };

  if (loading) {
    return (
      <div className="wishlist-page">
        <div className="wishlist-loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <div className="wishlist-header">
        <h1 className="wishlist-title">My Wishlist</h1>
        <p className="wishlist-subtitle">
          {products.length} {products.length === 1 ? 'item' : 'items'} saved
        </p>
      </div>

      {products.length === 0 ? (
        <div className="wishlist-empty">
          <Heart className="wishlist-empty-icon" size={64} />
          <h2 className="wishlist-empty-title">Your wishlist is empty</h2>
          <p className="wishlist-empty-desc">
            Save your favorite items to your wishlist to keep track of them and easily find them later.
          </p>
          <Link to="/products" className="btn btn-primary">
            Explore Products
          </Link>
        </div>
      ) : (
        <div className="wishlist-grid">
          {products.map((product) => (
            <ProductCard 
              key={product._id} 
              product={product} 
              onWishlistUpdate={handleProductWishlistUpdate} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
