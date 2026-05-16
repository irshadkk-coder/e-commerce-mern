import { Link } from 'react-router-dom';
import './OrderSuccessPage.css';

const OrderSuccessPage = () => {
  return (
    <div className="page-container success-container animate-fade-in">
      <div className="success-card glass-panel">
        <div className="success-icon animate-bounce">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="20 6 9 17 4 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        <h1 className="success-title text-gradient">Order Placed Successfully!</h1>
        <p className="success-message">
          Thank you for your purchase. We've received your order and are currently processing it.
        </p>

        <div className="success-actions">
          <Link to="/orders" className="btn btn-primary">
            View Your Orders
          </Link>
          <Link to="/" className="btn btn-secondary mt-3">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
