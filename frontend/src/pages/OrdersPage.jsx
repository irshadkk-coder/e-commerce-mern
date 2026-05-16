import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getOrders, getOrderProducts } from '../services/orderService';
import './OrdersPage.css';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await getOrders();
      if (data.status) {
        setOrders(data.orders || []);
      }
    } catch (err) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page-container loading-state"><div className="spinner"></div></div>;

  return (
    <div className="page-container animate-fade-in">
      <h1 className="page-title">My Orders</h1>
      
      {orders.length === 0 ? (
        <div className="empty-state glass-panel">
          <span className="empty-icon">📦</span>
          <h2>No orders yet</h2>
          <p>You haven't placed any orders. Start shopping today!</p>
          <Link to="/" className="btn btn-primary mt-4">Browse Products</Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order._id} className="order-card glass-panel">
              <div className="order-header">
                <div>
                  <span className="order-id">Order #{order._id.substring(order._id.length - 8).toUpperCase()}</span>
                  <span className="order-date">
                    {new Date(order.date).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className={`badge ${order.status === 'placed' ? 'badge-success' : 'badge-warning'}`}>
                  {order.status.toUpperCase()}
                </div>
              </div>

              <div className="order-body">
                <div className="order-details-col">
                  <h4>Delivery Address</h4>
                  <p>{order.deliveryDetails?.address}</p>
                  <p>Mobile: {order.deliveryDetails?.mobile}</p>
                  <p>PIN: {order.deliveryDetails?.pincode}</p>
                </div>

                <div className="order-details-col">
                  <h4>Payment Summary</h4>
                  <p>Method: {order.paymentMethod === 'ONLINE' ? 'Razorpay' : 'COD'}</p>
                  <p className="order-total">Total: ₹{order.totalAmount}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
