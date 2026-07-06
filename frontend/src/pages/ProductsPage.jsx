import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, X, PackageX, TrendingUp, ChevronRight, Star } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { getCategories, getProducts } from '../services/productService';
import { CATEGORIES, formatCategory } from '../constants/categories';
import './ProductsPage.css';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(CATEGORIES);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, totalPages: 1, totalProducts: 0 });
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  const filters = {
    q: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    minRating: searchParams.get('minRating') || '',
    sort: searchParams.get('sort') || 'newest',
    page: Number(searchParams.get('page') || 1),
    limit: 12
  };

  const [sliderMin, setSliderMin] = useState(() => {
    const minP = filters.minPrice;
    return minP !== '' && minP !== null ? Number(minP) : 0;
  });
  
  const [sliderMax, setSliderMax] = useState(() => {
    const maxP = filters.maxPrice;
    return maxP !== '' && maxP !== null ? Number(maxP) : 300000;
  });

  // Sync range slider UI values with search parameters (reactive)
  useEffect(() => {
    const minP = filters.minPrice;
    const maxP = filters.maxPrice;
    setSliderMin(minP !== '' && minP !== null ? Number(minP) : 0);
    setSliderMax(maxP !== '' && maxP !== null ? Number(maxP) : 300000);
  }, [filters.minPrice, filters.maxPrice]);

  // Sync search input state with search parameters when URL changes
  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);

  // Debounce search input changes to search as you type
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if ((searchParams.get('q') || '') !== searchQuery) {
        updateParams({ q: searchQuery });
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    fetchData();
  }, [searchParams]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined)
      );
      const [productsData, categoriesData] = await Promise.all([
        getProducts(params).catch(() => ({ status: false })),
        getCategories().catch(() => ({ status: false }))
      ]);

      if (categoriesData.status && categoriesData.categories?.length) {
        setCategories(categoriesData.categories);
      }

      if (productsData.status) {
        setProducts(productsData.products || []);
        setPagination(productsData.pagination || { page: 1, limit: 12, totalPages: 1, totalProducts: (productsData.products || []).length });
      } else {
        setProducts([]);
        setPagination({ page: 1, limit: 12, totalPages: 1, totalProducts: 0 });
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const updateParams = (updates) => {
    const next = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined || value === 'all') {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });

    if (!Object.prototype.hasOwnProperty.call(updates, 'page')) {
      next.set('page', '1');
    }

    setSearchParams(next);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSearchParams({});
    setMobileFiltersOpen(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateParams({ q: searchQuery });
  };

  const handleMinChange = (e) => {
    const value = Math.min(Number(e.target.value), sliderMax - 5000);
    setSliderMin(value);
  };

  const handleMaxChange = (e) => {
    const value = Math.max(Number(e.target.value), sliderMin + 5000);
    setSliderMax(value);
  };

  const handleSliderRelease = () => {
    updateParams({ 
      minPrice: sliderMin === 0 ? '' : String(sliderMin), 
      maxPrice: sliderMax === 300000 ? '' : String(sliderMax) 
    });
  };

  // UI structure for filters
  const FilterPanel = () => (
    <div className="filter-panel">
      <div className="filter-header-mobile">
        <h3>Filters</h3>
        <button onClick={() => setMobileFiltersOpen(false)}><X size={20} /></button>
      </div>
      
      <div className="filter-section">
        <h4 className="filter-title">Categories</h4>
        <ul className="filter-list">
          <li>
            <button
              className={`filter-btn ${filters.category === '' ? 'active' : ''}`}
              onClick={() => updateParams({ category: '' })}
            >
              All Products
            </button>
          </li>
          {categories.map((cat) => (
            <li key={cat}>
              <button
                className={`filter-btn ${filters.category === cat ? 'active' : ''}`}
                onClick={() => updateParams({ category: cat })}
              >
                {formatCategory(cat)}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="filter-section">
        <h4 className="filter-title">Price Range</h4>
        <div className="range-slider-container">
          <div className="range-slider-values">
            <span>₹{sliderMin.toLocaleString()}</span>
            <span>₹{sliderMax.toLocaleString()}</span>
          </div>
          <div className="dual-slider">
            <div className="slider-track"></div>
            <div 
              className="slider-range" 
              style={{
                left: `${(sliderMin / 300000) * 100}%`,
                right: `${100 - (sliderMax / 300000) * 100}%`
              }}
            ></div>
            <input
              type="range"
              min="0"
              max="300000"
              step="5000"
              value={sliderMin}
              onChange={handleMinChange}
              onMouseUp={handleSliderRelease}
              onTouchEnd={handleSliderRelease}
              className="thumb thumb-left"
              style={{ zIndex: sliderMin > 150000 ? '5' : '3' }}
            />
            <input
              type="range"
              min="0"
              max="300000"
              step="5000"
              value={sliderMax}
              onChange={handleMaxChange}
              onMouseUp={handleSliderRelease}
              onTouchEnd={handleSliderRelease}
              className="thumb thumb-right"
              style={{ zIndex: sliderMin > 150000 ? '3' : '5' }}
            />
          </div>
        </div>
      </div>

      <div className="filter-section">
        <h4 className="filter-title">Rating</h4>
        <div className="rating-filter-list">
          {[4.5, 4, 3.5].map((rating) => (
            <button
              key={rating}
              className={`rating-filter-btn ${Number(filters.minRating) === rating ? 'active' : ''}`}
              onClick={() => updateParams({ minRating: Number(filters.minRating) === rating ? '' : String(rating) })}
            >
              <span className="rating-stars">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={13}
                    className={i < Math.floor(rating) ? 'star-filled' : 'star-empty'}
                    fill={i < Math.floor(rating) ? 'currentColor' : 'none'}
                  />
                ))}
              </span>
              {rating}+ stars
            </button>
          ))}
        </div>
      </div>

      <div className="filter-actions-mobile">
        <button className="btn btn-primary" onClick={() => setMobileFiltersOpen(false)}>
          Apply Filters
        </button>
        <button className="btn btn-secondary" onClick={clearFilters}>
          Clear All
        </button>
      </div>
    </div>
  );

  return (
    <div className="page-container products-page">
      {/* Breadcrumbs & Header */}
      <div className="products-page-header">
        <div className="breadcrumbs">
          <Link to="/">Home</Link>
          <ChevronRight size={14} />
          <span className="current">Products</span>
        </div>
        <h1 className="page-title">
          {filters.category ? formatCategory(filters.category) : 'Explore Collection'}
        </h1>
        <p className="page-subtitle">
          {pagination.totalProducts > 0 
            ? `${pagination.totalProducts.toLocaleString()} products available`
            : 'Discover our premium selection of tech gear.'}
        </p>
      </div>

      {/* Toolbar & Product Discovery */}
      <div className="discovery-section">
        <div className="toolbar">
          <form className="search-bar" onSubmit={handleSearchSubmit}>
            <Search size={18} className="search-icon" />
            <input
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </form>

          <div className="toolbar-actions">
            <div className="sort-wrapper">
              <span className="sort-label">Sort:</span>
              <select
                className="sort-select"
                value={filters.sort}
                onChange={(e) => updateParams({ sort: e.target.value })}
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
            <button 
              className="btn btn-secondary mobile-filter-btn"
              onClick={() => setMobileFiltersOpen(true)}
            >
              <SlidersHorizontal size={18} /> Filters
            </button>
          </div>
        </div>

        {/* Discovery Chips */}
        <div className="discovery-chips">
          <div className="chip-group">
            <span className="chip-label"><TrendingUp size={14} /> Trending:</span>
            {['Headphones', 'Gaming', 'Smartwatches'].map(term => (
              <button 
                key={term} 
                className="chip"
                onClick={() => {
                  setSearchQuery(term);
                  updateParams({ q: term });
                }}
              >
                {term}
              </button>
            ))}
          </div>
          <div className="chip-group hide-mobile">
            <span className="chip-label">Popular Categories:</span>
            {categories.slice(0, 3).map(cat => (
              <button 
                key={cat} 
                className={`chip ${filters.category === cat ? 'active' : ''}`}
                onClick={() => updateParams({ category: cat })}
              >
                {formatCategory(cat)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="products-layout">
        {/* Desktop Sidebar */}
        <aside className="desktop-sidebar">
          <FilterPanel />
        </aside>

        {/* Mobile Filter Drawer Overlay */}
        <AnimatePresence>
          {mobileFiltersOpen && (
            <>
              <motion.div 
                className="drawer-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileFiltersOpen(false)}
              />
              <motion.div 
                className="filter-drawer"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween', duration: 0.3 }}
              >
                <FilterPanel />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Product Grid */}
        <main className="products-main">
          {/* Active Filters Summary */}
          {(filters.q || filters.category || filters.minPrice || filters.maxPrice || filters.minRating) && (
            <div className="active-filters">
              <span>Active Filters:</span>
              {filters.q && <span className="active-chip">Search: {filters.q}</span>}
              {filters.category && <span className="active-chip">{formatCategory(filters.category)}</span>}
              {(filters.minPrice || filters.maxPrice) && (
                <span className="active-chip">
                  Price: {filters.minPrice ? `₹${filters.minPrice}` : '0'} - {filters.maxPrice ? `₹${filters.maxPrice}` : 'Any'}
                </span>
              )}
              {filters.minRating && <span className="active-chip">{filters.minRating}+ stars</span>}
              <button className="clear-filters-text" onClick={clearFilters}>Clear All</button>
            </div>
          )}

          {loading ? (
            <div className="products-grid">
              <span className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}>Loading products...</span>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <ProductCard key={i} skeleton />
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="products-grid">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
              
              {pagination.totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="btn btn-secondary"
                    disabled={pagination.page <= 1}
                    onClick={() => updateParams({ page: String(pagination.page - 1) })}
                  >
                    Previous
                  </button>
                  <span className="page-info">Page {pagination.page} of {pagination.totalPages}</span>
                  <button
                    className="btn btn-secondary"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => updateParams({ page: String(pagination.page + 1) })}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <motion.div 
              className="empty-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="empty-state-icon">
                <PackageX size={64} strokeWidth={1} />
              </div>
              <h2>No products match your criteria</h2>
              <p>Try adjusting your filters, searching for something else, or browse our popular categories.</p>
              <div className="empty-state-actions">
                <button className="btn btn-primary" onClick={clearFilters}>
                  Clear All Filters
                </button>
                <Link to="/products" className="btn btn-secondary" onClick={clearFilters}>
                  View All Products
                </Link>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProductsPage;
