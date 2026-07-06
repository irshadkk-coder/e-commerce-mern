import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
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

  return (
    <div className="page-container animate-fade-in">
      <button className="btn btn-secondary back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="product-detail-layout glass-panel">
        <div className="product-detail-image">
          <img 
            src={getProductImage(product)}
            alt={product.name}
            onError={(e) => { e.target.src = 'https://via.placeholder.com/600x600/14141d/8c8c9a?text=No+Image'; }}
          />
        </div>

        <div className="product-detail-info">
          <div className="badge badge-primary">{formatCategory(product.category)}</div>
          <h1 className="detail-title">{product.name}</h1>
          <div className="detail-price">₹{product.price}</div>
          
          <div className="detail-description">
            <h3>Description</h3>
            <p>{product.description}</p>
          </div>

          <div className="detail-actions">
            <button 
              className="btn btn-primary add-cart-large" 
              onClick={handleAddToCart}
              disabled={adding}
            >
              {adding ? 'Adding to Cart...' : 'Add to Cart — ₹' + product.price}
            </button>
          </div>
          
          <div className="detail-features">
            <div className="feature-item">
              <span className="feature-icon">🚚</span>
              <p>Free Delivery</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🛡️</span>
              <p>1 Year Warranty</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🔄</span>
              <p>30 Days Return</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
