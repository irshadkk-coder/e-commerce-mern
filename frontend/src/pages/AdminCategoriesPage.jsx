import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { addAdminCategory, deleteAdminCategory, getAdminCategories } from '../services/adminService';
import './AdminDashboard.css';

const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await getAdminCategories();
      if (data.status) setCategories(data.categories || []);
    } catch (err) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (event) => {
    event.preventDefault();
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      const data = await addAdminCategory(name);
      if (data.status) {
        setCategories((current) => [...current, data.category].sort((a, b) => a.name.localeCompare(b.name)));
        setName('');
        setError('');
        toast.success('Category added');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add category');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;

    try {
      const data = await deleteAdminCategory(id);
      if (data.status) {
        setCategories((current) => current.filter((category) => category._id !== id));
        toast.success('Category deleted');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    }
  };

  if (loading) return <div className="page-container loading-state"><div className="spinner"></div></div>;

  return (
    <div className="page-container admin-container animate-fade-in">
      <div className="admin-header">
        <h1 className="page-title">Manage Categories</h1>
      </div>

      <div className="admin-add-form glass-panel">
        <h3>Add Category</h3>
        <form className="category-management-form" onSubmit={handleAdd}>
          <div>
            <input
              type="text"
              className="form-control"
              placeholder="Category name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError('');
              }}
            />
            {error && <p className="form-error">{error}</p>}
          </div>
          <button type="submit" className="btn btn-primary">Add</button>
        </form>
      </div>

      <div className="admin-products-table glass-panel">
        <div className="category-list-table">
          {categories.map((category) => (
            <div key={category._id} className="category-row">
              <strong>{category.name}</strong>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(category._id)}>Delete</button>
            </div>
          ))}
          {categories.length === 0 && <p className="text-center p-4">No categories found.</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminCategoriesPage;
