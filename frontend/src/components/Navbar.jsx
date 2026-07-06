import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, LogOut, User, LayoutDashboard, Package, Tags, ClipboardList, Search, ChevronDown, Smartphone, Laptop, Headphones, TabletSmartphone, Heart } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { logout } from '../services/authService';
import { CATEGORIES, formatCategory } from '../constants/categories';
import { DUMMY_PRODUCTS } from '../constants/dummyProducts';
import './Navbar.css';

const Navbar = () => {
  const { user, logoutContext, cartCount, wishlistIds } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on route change
  useEffect(() => {
    setIsDropdownOpen(false);
  }, [location.pathname]);

  // Handle outside click and Escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isDropdownOpen]);
  const suggestions = searchQuery.trim()
    ? DUMMY_PRODUCTS
        .filter((product) => product.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
        .slice(0, 5)
    : DUMMY_PRODUCTS.slice(0, 4);

  const categoryIcons = {
    Smartphones: <Smartphone size={18} />,
    Laptops: <Laptop size={18} />,
    Accessories: <Headphones size={18} />,
    Mobiles: <TabletSmartphone size={18} />
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch(e) {}
    logoutContext();
    navigate('/login');
  };



  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleSuggestionClick = (term) => {
    setSearchQuery('');
    navigate(`/products?q=${encodeURIComponent(term)}`);
  };

  return (
    <header className={`navbar-header${scrolled ? ' scrolled' : ''}`}>
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          NeoShop
        </Link>

        <div className="category-menu">
          <button className="category-menu-trigger" type="button">
            Categories <ChevronDown size={16} />
          </button>
          <div className="category-megamenu">
            {CATEGORIES.map((cat) => (
              <Link key={cat} to={`/products?category=${cat}`} className="mega-category-link">
                <span className="mega-category-icon">{categoryIcons[cat]}</span>
                <span>
                  <strong>{formatCategory(cat)}</strong>
                  <small>{DUMMY_PRODUCTS.filter((product) => product.category === cat).length} curated picks</small>
                </span>
              </Link>
            ))}
          </div>
        </div>

        <form className="navbar-search" onSubmit={handleSearch}>
          <Search size={16} className="navbar-search-icon" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="navbar-search-input"
          />
          {searchFocused && suggestions.length > 0 && (
            <div className="search-suggestions">
              {suggestions.map((product) => (
                <button
                  key={product._id}
                  type="button"
                  className="search-suggestion-item"
                  onMouseDown={() => handleSuggestionClick(product.name)}
                >
                  <span>{product.name}</span>
                  <small>{formatCategory(product.category)}</small>
                </button>
              ))}
            </div>
          )}
        </form>

        {user?.role === 'admin' && (
          <nav className="navbar-links admin-links">
             <Link to="/admin" className={`nav-link ${isActive('/admin')}`}>
               <LayoutDashboard size={18} />
               <span>Dashboard</span>
             </Link>
             <Link to="/admin/products" className={`nav-link ${isActive('/admin/products')}`}>
               <Package size={18} />
               <span>Products</span>
             </Link>
             <Link to="/admin/categories" className={`nav-link ${isActive('/admin/categories')}`}>
               <Tags size={18} />
               <span>Categories</span>
             </Link>
             <Link to="/admin/orders" className={`nav-link ${isActive('/admin/orders')}`}>
               <ClipboardList size={18} />
               <span>Orders</span>
             </Link>
          </nav>
        )}

        <div className="navbar-actions">
          {user ? (
            <>
              {user.role !== 'admin' && (
                <>
                  <Link to="/orders" className={`nav-link ${isActive('/orders')}`}>Orders</Link>
                  <Link to="/wishlist" className={`cart-icon ${isActive('/wishlist')}`} title="Wishlist">
                    <Heart size={20} />
                    {wishlistIds?.length > 0 && <span className="cart-badge">{wishlistIds.length}</span>}
                  </Link>
                  <Link to="/cart" className={`cart-icon ${isActive('/cart')}`}>
                    <ShoppingCart size={20} />
                    {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                  </Link>
                </>
              )}
              
              <div className="account-dropdown-container" ref={dropdownRef}>
                <button 
                  className="account-dropdown-trigger" 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  aria-expanded={isDropdownOpen}
                >
                  <User size={16} />
                  <span className="user-name">{user.name || 'User'}</span>
                  <ChevronDown size={14} />
                </button>
                <div className={`account-dropdown-menu ${isDropdownOpen ? 'show' : ''}`}>
                  <Link to="/orders" className={`dropdown-item ${isActive('/orders')}`} onClick={() => setIsDropdownOpen(false)}>
                    <ClipboardList size={16} />
                    <span>Orders</span>
                  </Link>
                  <Link to="/wishlist" className={`dropdown-item ${isActive('/wishlist')}`} onClick={() => setIsDropdownOpen(false)}>
                    <Heart size={16} />
                    <span>Wishlist</span>
                  </Link>
                  
                  <div className="dropdown-divider"></div>
                  
                  <button onClick={() => { handleLogout(); setIsDropdownOpen(false); }} className="dropdown-item dropdown-logout">
                    <LogOut size={16} className="icon-danger" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>Log in</Link>
              <Link to="/signup" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Sign up</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
