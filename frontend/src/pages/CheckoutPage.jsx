import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getOrderSummary, placeOrder, verifyPayment } from '../services/orderService';
import { useAuth } from '../hooks/useAuth';
import './CheckoutPage.css';

const CheckoutPage = () => {
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    mobile: '',
    address: '',
    pincode: '',
    'payment-method': 'COD'
  });

  const { fetchCartCount } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await getOrderSummary();
        if (data.status) {
          setTotal(data.total);
          // Auto fill user details if available, skipping for now
        }
      } catch (err) {
        toast.error('Failed to load checkout details');
        navigate('/cart');
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = await placeOrder(formData);
      
      if (data.successCOD || data.succesCOD) {
        await fetchCartCount();
        toast.success('Order placed successfully!');
        navigate('/order-success');
      } else {
        verifyRazorpayPayment(data.order || data.paymentOrder);
      }
    } catch (err) {
      toast.error('Failed to place order');
      setIsSubmitting(false);
    }
  };

  const verifyRazorpayPayment = (order) => {
    if (!window.Razorpay) {
      toast.error('Razorpay SDK failed to load');
      setIsSubmitting(false);
      return;
    }

    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!razorpayKey) {
      toast.error('Razorpay key is not configured');
      setIsSubmitting(false);
      return;
    }

    const options = {
      key: razorpayKey,
      amount: order.amount,
      currency: 'INR',
      name: 'NeoShop',
      description: 'Test Transaction',
      order_id: order.id,
      handler: async (response) => {
        try {
          const verifyData = await verifyPayment(response, order);
          if (verifyData.status) {
            await fetchCartCount();
            toast.success('Payment successful!');
            navigate('/order-success');
          } else {
            toast.error('Payment verification failed');
          }
        } catch (err) {
          toast.error(err.response?.data?.message || 'Payment verification failed');
          setIsSubmitting(false);
        }
      },
      prefill: {
        name: 'Test User',
        email: 'test@example.com',
        contact: formData.mobile
      },
      theme: {
        color: '#7645d9'
      },
      modal: {
        ondismiss: function() {
          toast.error('Payment cancelled');
          setIsSubmitting(false);
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  if (loading) return <div className="page-container loading-state"><div className="spinner"></div></div>;

  return (
    <div className="page-container animate-fade-in">
      <h1 className="page-title">Checkout</h1>
      
      <div className="checkout-layout">
        <div className="checkout-form-container glass-panel">
          <h3>Delivery Details</h3>
          <form onSubmit={handleCheckout} className="checkout-form">
            <div className="form-group">
              <label className="form-label">Full Address</label>
              <textarea 
                className="form-control" 
                name="address"
                placeholder="123 Main St, Apartment 4B"
                rows="3"
                required
                value={formData.address}
                onChange={handleInputChange}
              ></textarea>
            </div>
            
            <div className="form-row">
              <div className="form-group flex-1">
                <label className="form-label">Pincode</label>
                <input 
                  type="text" 
                  className="form-control" 
                  name="pincode"
                  placeholder="600001"
                  required
                  value={formData.pincode}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group flex-1">
                <label className="form-label">Mobile Number</label>
                <input 
                  type="text" 
                  className="form-control" 
                  name="mobile"
                  placeholder="+91 9999999999"
                  required
                  value={formData.mobile}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="payment-methods">
              <label className="form-label">Payment Method</label>
              <div className="payment-options">
                <label className={`payment-card ${formData['payment-method'] === 'COD' ? 'active' : ''}`}>
                  <input 
                    type="radio" 
                    name="payment-method" 
                    value="COD"
                    checked={formData['payment-method'] === 'COD'}
                    onChange={handleInputChange}
                  />
                  <span>Cash on Delivery</span>
                </label>
                
                <label className={`payment-card ${formData['payment-method'] === 'ONLINE' ? 'active' : ''}`}>
                  <input 
                    type="radio" 
                    name="payment-method" 
                    value="ONLINE"
                    checked={formData['payment-method'] === 'ONLINE'}
                    onChange={handleInputChange}
                  />
                  <span>Pay Online (Razorpay)</span>
                </label>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary place-order-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : `Place Order (₹${total})`}
            </button>
          </form>
        </div>

        <div className="checkout-summary glass-panel">
          <h3>Amount Summary</h3>
          <div className="summary-item">
            <span>Subtotal</span>
            <span>₹{total}</span>
          </div>
          <div className="summary-item">
            <span>Shipping</span>
            <span className="text-success">Free</span>
          </div>
          <div className="summary-divider"></div>
          <div className="summary-total">
            <span>Total Pay</span>
            <span className="text-primary">₹{total}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
