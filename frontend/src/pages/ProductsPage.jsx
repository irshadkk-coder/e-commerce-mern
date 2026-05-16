import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { getProducts, getCategories } from '../services/productService';
import './ProductsPage.css';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, totalPages: 1, totalProducts: 0 });
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = {
    q: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || 'newest',
    page: Number(searchParams.get('page') || 1),
    limit: 12
  };

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
        getProducts(params),
        getCategories()
      ]);

      if (productsData.status) {
        setProducts(productsData.products || []);
        setPagination(productsData.pagination || { page: 1, limit: 12, totalPages: 1, totalProducts: 0 });
      }
      if (categoriesData.status) setCategories(categoriesData.categories || []);
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
    setSearchParams({});
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="products-header">
        <h1 className="page-title">
          {filters.category ? `${filters.category} Products` : 'All Products'}
        </h1>
        <p className="page-subtitle">Discover the best tech gear.</p>
      </div>

      <div className="product-toolbar glass-panel">
        <input
          className="form-control search-input"
          type="search"
          placeholder="Search products"
          value={filters.q}
          onChange={(event) => updateParams({ q: event.target.value })}
        />
        <select
          className="form-control sort-select"
          value={filters.sort}
          onChange={(event) => updateParams({ sort: event.target.value })}
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="popular">Popular</option>
        </select>
      </div>

      <div className="products-layout">
        <aside className="filters-sidebar glass-panel">
          <h3>Categories</h3>
          <ul className="category-list">
            <li>
              <button
                className={`category-btn ${filters.category === '' ? 'active' : ''}`}
                onClick={() => updateParams({ category: '' })}
              >
                All Products
              </button>
            </li>
            {categories.map((cat) => (
              <li key={cat}>
                <button
                  className={`category-btn ${filters.category === cat ? 'active' : ''}`}
                  onClick={() => updateParams({ category: cat })}
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>

          <div className="price-filter">
            <h3>Price</h3>
            <input
              className="form-control"
              type="number"
              min="0"
              placeholder="Min"
              value={filters.minPrice}
              onChange={(event) => updateParams({ minPrice: event.target.value })}
            />
            <input
              className="form-control"
              type="number"
              min="0"
              placeholder="Max"
              value={filters.maxPrice}
              onChange={(event) => updateParams({ maxPrice: event.target.value })}
            />
          </div>
        </aside>

        <main className="products-main">
          <div className="results-meta">
            <span>{pagination.totalProducts} products found</span>
            {(filters.q || filters.category || filters.minPrice || filters.maxPrice) && (
              <button className="link-button" onClick={clearFilters}>Clear filters</button>
            )}
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading products...</p>
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid-cards">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
              <div className="pagination-controls">
                <button
                  className="btn btn-secondary"
                  disabled={pagination.page <= 1}
                  onClick={() => updateParams({ page: String(pagination.page - 1) })}
                >
                  Previous
                </button>
                <span>Page {pagination.page} of {pagination.totalPages}</span>
                <button
                  className="btn btn-secondary"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => updateParams({ page: String(pagination.page + 1) })}
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state glass-panel">
              <span className="empty-icon">Search</span>
              <h2>No products found</h2>
              <p>Try changing your filters or search term.</p>
              <button className="btn btn-primary mt-4" onClick={clearFilters}>
                Clear Filters
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProductsPage;
