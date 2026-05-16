import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getAdminOrders, updateAdminOrderStatus } from '../services/adminService';
import './AdminOrdersPage.css';

const statusOptions = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

const statusLabel = (status) => (status || 'pending').charAt(0).toUpperCase() + (status || 'pending').slice(1);

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, totalOrders: 0 });
  const [filters, setFilters] = useState({ search: '', status: 'all', page: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');

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
          <option value="all">All statuses</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>{statusLabel(status)}</option>
          ))}
        </select>
      </div>

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
            <div key={order._id} className="admin-order-card glass-panel">
              <div className="admin-order-card-header">
                <div>
                  <span className="order-id">Order #{order._id.slice(-8).toUpperCase()}</span>
                  <p>{new Date(order.date).toLocaleString()}</p>
                </div>
                <span className={`badge badge-${order.status === 'cancelled' ? 'danger' : order.status === 'pending' ? 'warning' : 'success'}`}>
                  {statusLabel(order.status)}
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
                  <p>Status: {statusLabel(order.paymentStatus)}</p>
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
                    value={order.status || 'pending'}
                    disabled={updatingId === order._id}
                    onChange={(event) => handleStatusChange(order._id, event.target.value)}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{statusLabel(status)}</option>
                    ))}
                  </select>
                </div>
              </div>
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
