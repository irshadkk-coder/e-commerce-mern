import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getAdminStats } from '../services/adminService';
import './AdminDashboard.css';

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
});

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getAdminStats();
        if (data.status) setStats(data.stats || stats);
      } catch (err) {
        toast.error('Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="page-container loading-state"><div className="spinner"></div></div>;

  return (
    <div className="page-container admin-container animate-fade-in">
      <div className="admin-header">
        <h1 className="page-title">Admin Dashboard</h1>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card glass-panel">
          <span>Total Products</span>
          <strong>{stats.totalProducts}</strong>
        </div>
        <div className="admin-stat-card glass-panel">
          <span>Total Orders</span>
          <strong>{stats.totalOrders}</strong>
        </div>
        <div className="admin-stat-card glass-panel">
          <span>Pending Orders</span>
          <strong>{stats.pendingOrders}</strong>
        </div>
        <div className="admin-stat-card glass-panel">
          <span>Total Revenue</span>
          <strong>{currency.format(stats.totalRevenue || 0)}</strong>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
