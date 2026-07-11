import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import { getProductImage } from '../services/assetUrl';
import { formatCategory } from '../constants/categories';

const DEFAULT_HERO_BADGE = { label: 'Featured Deal', emoji: '🎯' };
const CAROUSEL_INTERVAL = 4500;

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

const HeroCarousel = ({ heroProducts, fallbackImg }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  const goTo = useCallback((idx, dir) => {
    setDirection(dir);
    setActiveIdx(idx);
  }, []);

  const goNext = useCallback(() => {
    if (heroProducts.length === 0) return;
    const next = (activeIdx + 1) % heroProducts.length;
    goTo(next, 1);
  }, [activeIdx, heroProducts.length, goTo]);

  const goPrev = useCallback(() => {
    if (heroProducts.length === 0) return;
    const prev = (activeIdx - 1 + heroProducts.length) % heroProducts.length;
    goTo(prev, -1);
  }, [activeIdx, heroProducts.length, goTo]);

  useEffect(() => {
    if (isPaused || heroProducts.length === 0) return;
    const timer = setInterval(goNext, CAROUSEL_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, goNext, heroProducts.length]);

  if (heroProducts.length === 0) return null;

  const activeHero = heroProducts[activeIdx];
  const heroDiscount = activeHero?.discount || 15;
  const heroOriginalPrice = activeHero
    ? Math.round(Number(activeHero.price || 0) / (1 - heroDiscount / 100))
    : 0;
  const heroSavings = heroOriginalPrice - (activeHero?.price || 0);
  const heroBadge = DEFAULT_HERO_BADGE;

  return (
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
                    onError={(e) => { e.target.src = fallbackImg; }}
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
                    onError={(e) => { e.target.src = fallbackImg; }}
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
  );
};

export default HeroCarousel;
