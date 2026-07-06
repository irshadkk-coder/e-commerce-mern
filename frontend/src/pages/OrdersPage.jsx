import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getOrders, cancelOrder } from '../services/orderService';
import { getProductImage } from '../services/assetUrl';
import { formatCategory } from '../constants/categories';
import './OrdersPage.css';

const deliverySteps = [
  { value: 'order_placed', label: 'Order Placed' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' }
];

const getPaymentLabel = (order) => {
  if (order.paymentMethod === 'COD') return order.status === 'delivered' ? 'Paid' : 'Due on Delivery';
  if (order.paymentStatus === 'created' || order.paymentStatus === 'pending') return 'Awaiting Payment';
  if (order.paymentStatus === 'failed') return 'Payment Failed';
  if (order.paymentStatus === 'paid') return 'Paid';
  return 'Awaiting Payment';
};

const getPaymentBadgeClass = (order) => {
  if (order.paymentMethod === 'COD') return 'badge-warning';
  if (order.paymentStatus === 'paid') return 'badge-success';
  if (order.paymentStatus === 'failed') return 'badge-danger';
  return 'badge-warning';
};

const getDeliveryLabel = (status) => {
  if (status === 'order_placed' || status === 'pending' || status === 'paid') return 'Order Placed';
  if (status === 'confirmed') return 'Confirmed';
  if (status === 'shipped') return 'Shipped';
  if (status === 'out_for_delivery') return 'Out for Delivery';
  if (status === 'delivered') return 'Delivered';
  if (status === 'cancelled') return 'Cancelled';
  return 'Order Placed';
};

const getDeliveryBadgeClass = (status) => {
  if (status === 'delivered') return 'badge-success';
  if (status === 'cancelled') return 'badge-danger';
  return 'badge-primary';
};

const getDeliveryStepIndex = (status) => {
  if (status === 'delivered') return 4;
  if (status === 'out_for_delivery') return 3;
  if (status === 'shipped') return 2;
  if (status === 'confirmed') return 1;
  return 0;
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await getOrders();
      if (data.status) {
        const fetchedOrders = data.orders || [];
        setOrders(fetchedOrders);

        const itemsMap = {};
        fetchedOrders.forEach((order) => {
          itemsMap[order._id] = order.products || [];
        });
        setOrderItems(itemsMap);
      }
    } catch (err) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      setLoading(true);
      const data = await cancelOrder(orderId);
      if (data.status) {
        toast.success('Order cancelled successfully');
        fetchOrders(); // Refresh the list
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
      setLoading(false);
    }
  };

  if (loading) return <div className="page-container loading-state"><div className="spinner"></div></div>;

  return (
    <div className="page-container orders-page animate-fade-in">
      <div className="orders-page-header">
        <h1 className="page-title">My Orders</h1>
        <Link to="/products" className="btn btn-secondary">Continue Shopping</Link>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state glass-panel">
          <h2>No orders yet</h2>
          <p>You haven't placed any orders. Start shopping today!</p>
          <Link to="/products" className="btn btn-primary mt-4">Continue Shopping</Link>
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
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="order-badges">
                  <span className={`badge ${getDeliveryBadgeClass(order.status)}`}>
                    {getDeliveryLabel(order.status)}
                  </span>
                  <span className={`badge ${getPaymentBadgeClass(order)}`}>
                    {getPaymentLabel(order)}
                  </span>
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
                  <p>Status: {getPaymentLabel(order)}</p>
                  <p className="order-total">Total: ₹{order.totalAmount}</p>
                </div>

                <div className="order-details-col">
                  <h4>Delivery Status</h4>
                  <p>{getDeliveryLabel(order.status)}</p>
                  <div className="delivery-steps" aria-label={`Delivery status: ${getDeliveryLabel(order.status)}`}>
                    {deliverySteps.map((step, index) => (
                      <div
                        key={step.value}
                        className={`delivery-step ${index <= getDeliveryStepIndex(order.status) ? 'active' : ''}`}
                      >
                        <span className="delivery-step-dot"></span>
                        <span>{step.label}</span>
                      </div>
                    ))}
                  </div>
                  <p className="tracking-placeholder">Tracking details will appear here once the order ships.</p>
                  {(order.status === 'order_placed' || order.status === 'confirmed') && (
                    <button 
                      className="btn btn-danger mt-3" 
                      onClick={() => handleCancelOrder(order._id)}
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>

              <div className="order-items-section">
                <h4>Ordered Items</h4>
                <div className="order-items-list">
                  {(orderItems[order._id] || []).map((item) => (
                    <div key={`${order._id}-${item.item}`} className="order-item-row">
                      {item.product?._id && (
                        <img
                          src={getProductImage(item.product)}
                          alt={item.product.name}
                          className="order-item-image"
                          loading="lazy"
                          onError={(event) => { event.currentTarget.style.display = 'none'; }}
                        />
                      )}
                      <div className="order-item-info">
                        <strong>{item.product?.name || 'Product unavailable'}</strong>
                        <span>{formatCategory(item.product?.category)}</span>
                      </div>
                      <span>Qty: {item.quantity}</span>
                      <span>₹{item.product?.price || 0}</span>
                    </div>
                  ))}
                  {(orderItems[order._id] || []).length === 0 && (
                    <p className="tracking-placeholder">Item details are not available for this order.</p>
                  )}
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
