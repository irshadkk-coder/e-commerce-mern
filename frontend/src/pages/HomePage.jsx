import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content animate-fade-in">
          <div className="badge badge-primary hero-badge">Welcome to the future of shopping</div>
          <h1 className="hero-title">
            Discover <span className="text-gradient">Premium</span> Products
          </h1>
          <p className="hero-subtitle">
            Experience next-level ecommerce with our curated collection of high-quality electronics and accessories. Designed for the modern consumer.
          </p>
          <div className="hero-actions">
            <Link to="/products" className="btn btn-primary hero-btn">
              Shop Now
            </Link>
            <Link to="/signup" className="btn btn-secondary hero-btn">
              Create Account
            </Link>
          </div>
        </div>
        
        <div className="hero-image-wrapper animate-float">
          {/* Abstract geometric element serving as hero image */}
          <div className="abstract-shape shape-1"></div>
          <div className="abstract-shape shape-2"></div>
          <div className="abstract-shape shape-3 glass-panel">
            <div className="shape-content">
              <h3>Latest Tech</h3>
              <p>Explore our new arrivals</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories (Static representation) */}
      <section className="categories-section">
        <h2 className="section-title">Shop by Category</h2>
        <div className="categories-grid">
          {['Laptops', 'Smartphones', 'Accessories', 'Audio'].map((cat, idx) => (
            <Link to={`/products?category=${cat}`} key={idx} className="category-card glass-panel">
              <h3>{cat}</h3>
              <span className="category-arrow">→</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
