import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Star, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getProductById } from '../services/productService';
import { addToCart } from '../services/cartService';
import { getProductImage } from '../services/assetUrl';
import { formatCategory } from '../constants/categories';
import { DUMMY_PRODUCTS } from '../constants/dummyProducts';
import './ProductDetailPage.css';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, fetchCartCount } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchProduct = async () => {
      try {
        const localProduct = DUMMY_PRODUCTS.find((item) => item._id === id);
        if (localProduct) {
          setProduct(localProduct);
          return;
        }

        const data = await getProductById(id);
        if (data.status) {
          setProduct(data.product);
        } else {
          toast.error('Product not found');
          navigate('/products');
        }
      } catch (err) {
        toast.error('Failed to load product details');
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, navigate]);

  const handleAddToCart = async () => {
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
      if (String(product._id).startsWith('dummy-')) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        toast.success(`${product.name} added to cart!`);
      } else {
        await addToCart(product._id);
        await fetchCartCount();
        toast.success(`${product.name} added to cart!`);
      }
    } catch (err) {
      toast.error('Failed to add product to cart');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container loading-state">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!product) return null;

  // Determine Related Products (up to 5 items in the same category)
  const relatedProducts = DUMMY_PRODUCTS
    .filter(p => p.category === product.category && p._id !== product._id)
    .slice(0, 5);

  const rating = product.rating || 4.8;
  const numReviews = product.numReviews || 245;
  const discount = product.discount || 0;
  const currentPrice = product.price;
  const originalPrice = discount > 0 ? Math.round(currentPrice * (100 / (100 - discount))) : null;

  return (
    <div className="page-container animate-fade-in product-detail-wrapper">
      <button className="btn btn-secondary back-btn" onClick={() => navigate(-1)} aria-label="Go back">
        ← Back
      </button>

      <div className="product-detail-layout glass-panel">
        <div className="product-detail-image-container">
          <div className="product-detail-image">
            <img 
              src={getProductImage(product)}
              alt={product.name}
              onError={(e) => { e.target.src = 'https://via.placeholder.com/600x600/14141d/8c8c9a?text=No+Image'; }}
            />
          </div>
        </div>

        <div className="product-detail-info">
          <div className="detail-header-meta">
            <div className="badge badge-primary">{formatCategory(product.category)}</div>
            <div className="detail-rating" aria-label={`Rated ${rating} out of 5 stars from ${numReviews} reviews`}>
              <Star size={16} fill="var(--primary)" color="var(--primary)" />
              <span className="rating-value">{rating}</span>
              <span className="review-count">({numReviews} reviews)</span>
            </div>
          </div>
          
          <h1 className="detail-title">{product.name}</h1>
          
          <div className="detail-price-section">
            <span className="detail-price">₹{currentPrice.toLocaleString('en-IN')}</span>
            {originalPrice && (
              <>
                <span className="detail-original-price">₹{originalPrice.toLocaleString('en-IN')}</span>
                <span className="detail-discount-badge">{discount}% OFF</span>
              </>
            )}
          </div>
          
          <div className="detail-description">
            <h3>Description</h3>
            <p>{product.description}</p>
          </div>

          <div className="detail-actions">
            <button 
              className="btn btn-primary add-cart-large" 
              onClick={handleAddToCart}
              disabled={adding}
              aria-label={`Add ${product.name} to cart for ₹${currentPrice.toLocaleString('en-IN')}`}
            >
              {adding ? 'Adding to Cart...' : 'Add to Cart — ₹' + currentPrice.toLocaleString('en-IN')}
            </button>
          </div>
          
          <div className="detail-features">
            <div className="feature-item glass-panel-subtle">
              <span className="feature-icon"><Truck size={24} strokeWidth={1.5} /></span>
              <p>Free Delivery</p>
            </div>
            <div className="feature-item glass-panel-subtle">
              <span className="feature-icon"><ShieldCheck size={24} strokeWidth={1.5} /></span>
              <p>1 Year Warranty</p>
            </div>
            <div className="feature-item glass-panel-subtle">
              <span className="feature-icon"><RefreshCw size={24} strokeWidth={1.5} /></span>
              <p>30 Days Return</p>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications Section */}
      <div className="product-specs-section">
        <h2 className="section-title">Specifications</h2>
        <div className="specs-table glass-panel">
          <div className="spec-row">
            <span className="spec-key">Category</span>
            <span className="spec-value">{formatCategory(product.category)}</span>
          </div>
          <div className="spec-row">
            <span className="spec-key">Availability</span>
            <span className="spec-value">
              {product.countInStock > 0 ? (
                <span className="status-in-stock">In Stock ({product.countInStock} available)</span>
              ) : (
                <span className="status-out-stock">Out of Stock</span>
              )}
            </span>
          </div>
          <div className="spec-row">
            <span className="spec-key">Brand</span>
            <span className="spec-value">NeoShop Standard</span>
          </div>
          <div className="spec-row">
            <span className="spec-key">Warranty</span>
            <span className="spec-value">1 Year Manufacturer Warranty</span>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="related-products-section">
          <h2 className="section-title">Similar Products</h2>
          <div className="related-products-scroll">
            {relatedProducts.map(rp => (
              <div 
                key={rp._id} 
                className="related-product-card glass-panel" 
                onClick={() => navigate(`/products/${rp._id}`)}
                role="button"
                tabIndex={0}
                aria-label={`View ${rp.name}`}
              >
                <div className="related-product-image">
                  <img src={getProductImage(rp)} alt={rp.name} />
                </div>
                <div className="related-product-info">
                  <h4 className="related-name">{rp.name}</h4>
                  <span className="related-price">₹{rp.price.toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Sticky Purchase Bar */}
      <div className="mobile-sticky-purchase-bar glass-panel">
        <div className="sticky-price-info">
          <span className="sticky-price">₹{currentPrice.toLocaleString('en-IN')}</span>
          {originalPrice && <span className="sticky-original">₹{originalPrice.toLocaleString('en-IN')}</span>}
        </div>
        <button 
          className="btn btn-primary sticky-buy-btn" 
          onClick={handleAddToCart}
          disabled={adding}
        >
          {adding ? 'Adding...' : 'Add to Cart'}
        </button>
      </div>

    </div>
  );
};

export default ProductDetailPage;
