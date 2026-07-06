import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getAdminOrder, getAdminOrders, updateAdminOrderStatus } from '../services/adminService';
import { formatCategory } from '../constants/categories';
import './AdminOrdersPage.css';

const statusOptions = ['order_placed', 'confirmed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

const statusLabel = (status) => {
  const labels = {
    awaiting_payment: 'Awaiting Payment',
    payment_failed: 'Payment Failed',
    order_placed: 'Order Placed',
    confirmed: 'Confirmed',
    shipped: 'Shipped',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    pending: 'Order Placed',
    paid: 'Order Placed',
    created: 'Awaiting Payment'
  };
  return labels[status] || 'Order Placed';
};

const paymentStatusLabel = (order) => {
  if (order.paymentMethod === 'COD' || order.paymentStatus === 'cash_on_delivery' || order.paymentStatus === 'cod') {
    return 'Cash on Delivery';
  }
  if (order.paymentStatus === 'created' || order.paymentStatus === 'pending') return 'Awaiting Payment';
  if (order.paymentStatus === 'failed') return 'Payment Failed';
  if (order.paymentStatus === 'paid') return 'Paid';
  return statusLabel(order.paymentStatus);
};

const isUnpaidOnlineOrder = (order) => (
  order.paymentMethod === 'ONLINE' && order.paymentStatus !== 'paid'
);

const deliveryStatusKey = (order) => {
  if (isUnpaidOnlineOrder(order)) {
    return order.paymentStatus === 'failed' ? 'payment_failed' : 'awaiting_payment';
  }
  if (statusOptions.includes(order.status)) return order.status;
  if (order.status === 'pending' || order.status === 'paid') return 'order_placed';
  return 'order_placed';
};

const badgeClass = (status) => {
  if (status === 'awaiting_payment' || status === 'order_placed' || status === 'pending' || status === 'paid') return 'info';
  if (status === 'payment_failed' || status === 'cancelled') return 'danger';
  if (status === 'delivered') return 'success';
  return 'warning';
};

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, totalOrders: 0 });
  const [filters, setFilters] = useState({ search: '', status: 'all', page: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState('');
  const [orderDetails, setOrderDetails] = useState({});
  const [loadingDetailsId, setLoadingDetailsId] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getAdminOrders(filters);
      if (data.status) {
        setOrders(data.orders || []);
        setPagination(data.pagination || pagination);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      page: key === 'page' ? Number(value) : 1
    }));
  };

  const handleStatusChange = async (orderId, status) => {
    setUpdatingId(orderId);
    try {
      const data = await updateAdminOrderStatus(orderId, status);
      if (data.status) {
        setOrders((current) => current.map((order) => (
          order._id === orderId ? { ...order, status } : order
        )));
        toast.success('Order status updated');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId('');
    }
  };

  const toggleOrderDetails = async (orderId) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId('');
      return;
    }

    setExpandedOrderId(orderId);
    if (orderDetails[orderId]) return;

    setLoadingDetailsId(orderId);
    try {
      const data = await getAdminOrder(orderId);
      if (data.status) {
        setOrderDetails((current) => ({ ...current, [orderId]: data.order }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load order details');
    } finally {
      setLoadingDetailsId('');
    }
  };

  return (
    <div className="page-container admin-orders-page animate-fade-in">
      <div className="admin-header">
        <h1 className="page-title">Order Management</h1>
      </div>

      <div className="admin-order-filters glass-panel">
        <input
          className="form-control"
          type="search"
          placeholder="Search order ID, user ID, mobile, address"
          value={filters.search}
          onChange={(event) => updateFilter('search', event.target.value)}
        />
        <select
          className="form-control"
          value={filters.status}
          onChange={(event) => updateFilter('status', event.target.value)}
        >
          <option value="all">All delivery statuses</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>{statusLabel(status)}</option>
          ))}
        </select>
      </div>

      {!loading && (
        <div className="admin-order-count glass-panel">
          Total Orders: <strong>{pagination.totalOrders}</strong>
        </div>
      )}

      <div className="admin-orders-list">
        {loading ? (
          <div className="loading-state"><div className="spinner"></div></div>
        ) : orders.length === 0 ? (
          <div className="empty-state glass-panel">
            <h2>No orders found</h2>
            <p>Try another search or status filter.</p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order._id}
              className="admin-order-card glass-panel"
              role="button"
              tabIndex="0"
              onClick={() => toggleOrderDetails(order._id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') toggleOrderDetails(order._id);
              }}
            >
              <div className="admin-order-card-header">
                <div>
                  <span className="order-id">Order #{order._id.slice(-8).toUpperCase()}</span>
                  <p>{new Date(order.date).toLocaleString()}</p>
                </div>
                <span className={`badge badge-${badgeClass(deliveryStatusKey(order))}`}>
                  {statusLabel(deliveryStatusKey(order))}
                </span>
              </div>

              <div className="admin-order-grid">
                <div>
                  <h4>Customer</h4>
                  <p>{order.deliveryDetails?.mobile}</p>
                  <p>{order.deliveryDetails?.address}</p>
                  <p>PIN: {order.deliveryDetails?.pincode}</p>
                </div>
                <div>
                  <h4>Payment</h4>
                  <p>{order.paymentMethod === 'ONLINE' ? 'Razorpay' : 'Cash on Delivery'}</p>
                  <p>Status: {paymentStatusLabel(order)}</p>
                  <p>Total: ₹{order.totalAmount}</p>
                </div>
                <div>
                  <h4>Items</h4>
                  <p>{order.products?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0} item(s)</p>
                </div>
                <div>
                  <h4>Status</h4>
                  <select
                    className="form-control"
                    value={isUnpaidOnlineOrder(order) ? 'awaiting_payment' : deliveryStatusKey(order)}
                    disabled={updatingId === order._id || isUnpaidOnlineOrder(order)}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => handleStatusChange(order._id, event.target.value)}
                  >
                    {isUnpaidOnlineOrder(order) && (
                      <option value="awaiting_payment">Awaiting Payment</option>
                    )}
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{statusLabel(status)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {expandedOrderId === order._id && (
                <div className="admin-order-items">
                  <h4>Ordered Items</h4>
                  {loadingDetailsId === order._id ? (
                    <p>Loading items...</p>
                  ) : (
                    <div className="admin-order-items-list">
                      {(orderDetails[order._id]?.products || []).map((item) => (
                        <div key={`${order._id}-${item.item}`} className="admin-order-item">
                          <div>
                            <strong>{item.product?.name || 'Product unavailable'}</strong>
                            <span>{formatCategory(item.product?.category)}</span>
                          </div>
                          <span>Qty: {item.quantity}</span>
                          <span>₹{item.product?.price || 0}</span>
                        </div>
                      ))}
                      {(orderDetails[order._id]?.products || []).length === 0 && (
                        <p>No item details found.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {!loading && pagination.totalPages > 1 && (
        <div className="pagination-controls">
          <button
            className="btn btn-secondary"
            disabled={pagination.page <= 1}
            onClick={() => updateFilter('page', pagination.page - 1)}
          >
            Previous
          </button>
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <button
            className="btn btn-secondary"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => updateFilter('page', pagination.page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
