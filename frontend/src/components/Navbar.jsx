import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Navbar.css';

const Navbar = () => {
  const { user, logoutContext, cartCount } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutContext();
    navigate('/login');
  };

  return (
    <header className="navbar-header glass-nav">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="text-gradient">Neo</span>Shop
        </Link>

        {user?.role === 'admin' && (
          <nav className="navbar-links admin-links">
             <Link to="/admin">Dashboard</Link>
             <Link to="/admin/products">All Products</Link>
             <Link to="/admin/orders">Orders</Link>
          </nav>
        )}

        <div className="navbar-actions">
          {user ? (
            <>
              {user.role !== 'admin' && (
                <>
                  <Link to="/cart" className="cart-icon">
                    <svg stroke="currentColor" fill="none" viewBox="0 0 24 24">
                      <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                    {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                  </Link>
                  <Link to="/orders" className="nav-link">Orders</Link>
                </>
              )}
              
              <div className="user-menu">
                <span className="user-name">{user.name || 'User'}</span>
                <button onClick={handleLogout} className="btn-logout">Logout</button>
              </div>
            </>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>Login</Link>
              <Link to="/signup" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
