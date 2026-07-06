import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Truck, RefreshCw, Clock, ArrowRight, Star, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import { CATEGORIES, formatCategory } from '../constants/categories';
import { getCategories, getProducts } from '../services/productService';
import { getProductImage } from '../services/assetUrl';
import ProductCard from '../components/ProductCard';
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

// Default hero badge fallback
const DEFAULT_HERO_BADGE = { label: 'Featured Deal', emoji: '🎯' };

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

const imgVariants = {
  enter: (dir) => ({ x: dir > 0 ? 80 : -80, opacity: 0, scale: 0.94 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir) => ({ x: dir > 0 ? -80 : 80, opacity: 0, scale: 0.94 }),
};

const CAROUSEL_INTERVAL = 4500;

const HomePage = () => {
  const [categories, setCategories] = useState(CATEGORIES);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carousel state
  const [heroProducts, setHeroProducts] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

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

  // Auto-advance carousel
  const goTo = useCallback((idx, dir) => {
    setDirection(dir);
    setActiveIdx(idx);
  }, []);

  const goNext = useCallback(() => {
    const next = (activeIdx + 1) % heroProducts.length;
    goTo(next, 1);
  }, [activeIdx, heroProducts.length, goTo]);

  const goPrev = useCallback(() => {
    const prev = (activeIdx - 1 + heroProducts.length) % heroProducts.length;
    goTo(prev, -1);
  }, [activeIdx, heroProducts.length, goTo]);

  useEffect(() => {
    if (isPaused || heroProducts.length === 0) return;
    const timer = setInterval(goNext, CAROUSEL_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, goNext, heroProducts.length]);

  const activeHero = heroProducts[activeIdx];
  const heroDiscount = activeHero?.discount || 15;
  const heroOriginalPrice = activeHero
    ? Math.round(Number(activeHero.price || 0) / (1 - heroDiscount / 100))
    : 0;
  const heroSavings = heroOriginalPrice - (activeHero?.price || 0);
  const heroBadge = DEFAULT_HERO_BADGE;

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
      <section
        className="hero-section"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Animated background accent synced to slide */}
        <div className="hero-bg-orb" key={activeIdx} />

        <div className="page-container hero-container">

          {/* LEFT — product info */}
          <div className="hero-content">
            <AnimatePresence mode="wait" custom={direction}>
              {activeHero && (
                <motion.div
                  key={activeHero._id}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.42, ease: 'easeInOut' }}
                  className="hero-slide-content"
                >
                  {/* Top badge row: Featured Deal + Best Seller/New Arrival */}
                  <div className="hero-badge-row">
                    <div className="hero-badge">
                      <span className="badge-pulse" />
                      Featured Deal
                    </div>
                    {heroBadge && (
                      <div className="hero-product-badge">
                        {heroBadge.emoji} {heroBadge.label}
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h1 className="hero-title">{activeHero.name}</h1>

                  {/* Star Rating */}
                  {activeHero.rating && (
                    <div className="hero-rating-row">
                      <div className="hero-stars">
                        {[1,2,3,4,5].map((s) => (
                          <Star
                            key={s}
                            size={15}
                            fill={s <= Math.round(activeHero.rating) ? 'currentColor' : 'none'}
                            className={s <= Math.round(activeHero.rating) ? 'star-filled' : 'star-empty'}
                          />
                        ))}
                      </div>
                      <span className="hero-rating-num">{activeHero.rating.toFixed(1)}</span>
                      <span className="hero-rating-sep">•</span>
                      <span className="hero-rating-reviews">
                        {activeHero.numReviews >= 1000
                          ? `${(activeHero.numReviews / 1000).toFixed(1)}k`
                          : activeHero.numReviews} Reviews
                      </span>
                    </div>
                  )}

                  {/* Description */}
                  <p className="hero-subtitle">
                    {activeHero.description}
                  </p>

                  {/* Price row */}
                  <div className="hero-price-row">
                    <span className="hero-original-price">₹{heroOriginalPrice.toLocaleString()}</span>
                    <span className="hero-price">₹{activeHero.price?.toLocaleString()}</span>
                    <div className="hero-discount-group">
                      <span className="hero-discount-badge">-{heroDiscount}% OFF</span>
                      <span className="hero-savings">Save ₹{heroSavings.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="hero-actions">
                    <Link to={`/products/${activeHero._id}`} className="btn btn-primary btn-lg">
                      <ShoppingBag size={18} /> Buy Now
                    </Link>
                    <Link to="/products" className="btn btn-secondary btn-lg">
                      Browse All
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Dot indicators + prev/next controls ── */}
            {heroProducts.length > 0 && (
              <div className="hero-carousel-controls">
                <button
                  className="carousel-arrow"
                  onClick={goPrev}
                  aria-label="Previous product"
                >
                  <ChevronLeft size={18} />
                </button>

                <div className="carousel-dots">
                  {heroProducts.map((p, i) => (
                    <button
                      key={p._id}
                      className={`carousel-dot${i === activeIdx ? ' active' : ''}`}
                      onClick={() => goTo(i, i > activeIdx ? 1 : -1)}
                      aria-label={`Go to ${p.name}`}
                    />
                  ))}
                </div>

                <button
                  className="carousel-arrow"
                  onClick={goNext}
                  aria-label="Next product"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}

            {/* Thumbnail strip */}
            {heroProducts.length > 0 && (
              <div className="hero-thumbnails">
                {heroProducts.map((p, i) => (
                  <button
                    key={p._id}
                    className={`hero-thumb${i === activeIdx ? ' active' : ''}`}
                    onClick={() => goTo(i, i > activeIdx ? 1 : -1)}
                    aria-label={p.name}
                  >
                    <img
                      src={getProductImage(p)}
                      alt={p.name}
                      onError={(e) => { e.target.src = FALLBACK_IMG; }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT — product image */}
          <div className="hero-visual">
            <AnimatePresence mode="wait" custom={direction}>
              {activeHero && (
                <motion.div
                  key={activeHero._id + '-img'}
                  custom={direction}
                  variants={imgVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.46, ease: 'easeInOut' }}
                  className="hero-product-showcase"
                >
                  <Link to={`/products/${activeHero._id}`} className="hero-img-link">
                    <img
                      src={getProductImage(activeHero)}
                      alt={activeHero.name}
                      className="hero-main-img"
                      onError={(e) => { e.target.src = FALLBACK_IMG; }}
                    />
                    <div className="hero-product-tag">
                      <span className="hero-product-tag-cat">{formatCategory(activeHero.category)}</span>
                    </div>
                    {/* Progress bar at bottom of image */}
                    {!isPaused && (
                      <div className="hero-progress-bar">
                        <div
                          key={activeIdx}
                          className="hero-progress-fill"
                          style={{ animationDuration: `${CAROUSEL_INTERVAL}ms` }}
                        />
                      </div>
                    )}
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

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
