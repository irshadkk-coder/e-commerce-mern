import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Truck, RefreshCw, Clock, ArrowRight, Star } from 'lucide-react';
import { CATEGORIES, formatCategory } from '../constants/categories';
import { getCategories, getProducts } from '../services/productService';
import ProductCard from '../components/ProductCard';
import HeroCarousel from '../components/HeroCarousel';
import './HomePage.css';

const CATEGORY_IMAGES = {
  laptops: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?q=80&w=600&auto=format&fit=crop',
  smartphones: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=600&auto=format&fit=crop',
  accessories: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop',
  mobiles: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600&auto=format&fit=crop',
};

const CATEGORY_ORDER = ['Smartphones', 'Laptops', 'Accessories', 'Mobiles'];
const FALLBACK_IMG = CATEGORY_IMAGES.accessories;

const getCategoryImage = (cat) => CATEGORY_IMAGES[String(cat).toLowerCase()] || FALLBACK_IMG;

const HomePage = () => {
  const [categories, setCategories] = useState(CATEGORIES);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hero carousel data state
  const [heroProducts, setHeroProducts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catData, prodData] = await Promise.all([
          getCategories().catch(() => ({ status: false })),
          getProducts({ limit: 8 }).catch(() => ({ status: false }))
        ]);

        if (catData.status && catData.categories?.length) {
          setCategories(catData.categories);
        }

        if (prodData.status && prodData.products?.length) {
          const sliced = prodData.products.slice(0, 8);
          setFeaturedProducts(sliced);
          setHeroProducts(prodData.products.slice(0, 5));
        } else {
          setFeaturedProducts([]);
          setHeroProducts([]);
        }
      } catch (err) {
        console.error('Failed to fetch homepage data', err);
        setFeaturedProducts([]);
        setHeroProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const trustFeatures = [
    { icon: <Truck size={22} />, title: 'Free Shipping', desc: 'Orders over ₹5,000' },
    { icon: <ShieldCheck size={22} />, title: 'Secure Payments', desc: '100% protected' },
    { icon: <RefreshCw size={22} />, title: 'Easy Returns', desc: '30-day policy' },
    { icon: <Clock size={22} />, title: '24/7 Support', desc: 'Always available' }
  ];

  const testimonials = [
    { name: 'Alex Johnson', role: 'Tech Enthusiast', content: 'The quality of the electronics is unmatched. Fast shipping and excellent customer service. Highly recommended!', rating: 5 },
    { name: 'Sarah Williams', role: 'Designer', content: "I bought my entire workspace setup here. The premium feel of the products exactly matches the website's aesthetic.", rating: 5 },
    { name: 'Michael Chen', role: 'Developer', content: 'Finally an e-commerce store that feels modern and trustworthy. The ordering process was incredibly smooth.', rating: 4 }
  ];

  const visibleCategories = CATEGORY_ORDER.filter((cat) =>
    categories.some((item) => item.toLowerCase() === cat.toLowerCase())
  );

  return (
    <div className="home-container">

      {/* ─── HERO CAROUSEL ─────────────────────────────────────────────── */}
      <HeroCarousel heroProducts={heroProducts} fallbackImg={FALLBACK_IMG} />

      {/* ─── TRUST STRIP ───────────────────────────────────────────────── */}
      <section className="trust-strip">
        <div className="page-container">
          <div className="trust-strip-grid">
            {trustFeatures.map((feature) => (
              <div key={feature.title} className="trust-strip-item">
                <span className="trust-strip-icon">{feature.icon}</span>
                <strong>{feature.title}</strong>
                <span className="trust-strip-sep">·</span>
                <span className="trust-strip-desc">{feature.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURED PRODUCTS ─────────────────────────────────────────── */}
      <section className="section-compact">
        <div className="page-container">
          <div className="section-header flex-between">
            <div>
              <h2 className="section-title">Featured Products</h2>
              <p className="section-subtitle">Handpicked electronics with verified matching imagery</p>
            </div>
            <Link to="/products" className="btn btn-secondary view-all-btn">
              View All <ArrowRight size={16} />
            </Link>
          </div>

          <div className="products-grid-home">
            {loading
              ? [1, 2, 3, 4, 5, 6, 7, 8].map((i) => <ProductCard key={i} skeleton />)
              : featuredProducts.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
          </div>
        </div>
      </section>

      {/* ─── CATEGORIES ────────────────────────────────────────────────── */}
      <section id="categories" className="section-compact">
        <div className="page-container">
          <div className="section-header">
            <h2 className="section-title">Shop by Category</h2>
            <p className="section-subtitle">Find exactly what you need</p>
          </div>

          <div className="categories-grid">
            {visibleCategories.map((cat, idx) => (
              <motion.div
                key={cat}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
              >
                <Link to={`/products?category=${cat}`} className="category-card">
                  <div className="category-image-wrapper">
                    <img
                      src={getCategoryImage(cat)}
                      alt={formatCategory(cat)}
                      className="category-image"
                      onError={(e) => { e.target.src = FALLBACK_IMG; }}
                    />
                    <div className="category-overlay" />
                  </div>
                  <div className="category-content">
                    <div className="category-info">
                      <h3 className="category-name">{formatCategory(cat)}</h3>
                      <span className="category-count">Browse products</span>
                    </div>
                    <span className="category-arrow">
                      <ArrowRight size={18} />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ──────────────────────────────────────────────── */}
      <section className="section-compact testimonials-section">
        <div className="page-container">
          <div className="section-header text-center">
            <h2 className="section-title">What Our Customers Say</h2>
            <p className="section-subtitle">Don't just take our word for it</p>
          </div>

          <div className="testimonials-grid">
            {testimonials.map((test, idx) => (
              <motion.div
                key={test.name}
                className="testimonial-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="testimonial-stars">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className={i < test.rating ? 'star-filled' : 'star-empty'} fill={i < test.rating ? 'currentColor' : 'none'} />
                  ))}
                </div>
                <p className="testimonial-content">"{test.content}"</p>
                <div className="testimonial-author">
                  <div className="author-avatar">{test.name.charAt(0)}</div>
                  <div className="author-info">
                    <h4 className="author-name">{test.name}</h4>
                    <span className="author-role">{test.role}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
