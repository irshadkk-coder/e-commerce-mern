import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getAdminProducts, addAdminProduct, deleteAdminProduct } from '../services/adminService';
import { productImageUrl } from '../services/assetUrl';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Add product form state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    image: null
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await getAdminProducts();
      if (data.status) {
        setProducts(data.products || []);
      }
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const data = await deleteAdminProduct(id);
      if (data.status) {
        toast.success('Product deleted');
        setProducts(prev => prev.filter(p => p._id !== id));
      }
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      setFormData(prev => ({ ...prev, image: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image) {
      toast.error('Please upload an image');
      return;
    }

    const payload = new FormData();
    payload.append('name', formData.name);
    payload.append('category', formData.category);
    payload.append('price', formData.price);
    payload.append('description', formData.description);
    payload.append('image', formData.image);

    try {
      const data = await addAdminProduct(payload);
      if (data.status) {
        toast.success('Product added successfully');
        setShowAddForm(false);
        setFormData({ name: '', category: '', price: '', description: '', image: null });
        fetchProducts(); // Refresh list
      }
    } catch (err) {
      toast.error('Failed to add product: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <div className="page-container loading-state"><div className="spinner"></div></div>;

  return (
    <div className="page-container admin-container animate-fade-in">
      <div className="admin-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : '+ Add New Product'}
        </button>
      </div>

      {showAddForm && (
        <div className="admin-add-form glass-panel">
          <h3>Add New Product</h3>
          <form onSubmit={handleAddSubmit}>
            <div className="form-group">
              <label className="form-label">Product Name</label>
              <input type="text" name="name" className="form-control" required value={formData.name} onChange={handleInputChange} />
            </div>
            
            <div className="admin-form-row">
              <div className="form-group">
                <label className="form-label">Category</label>
                <input type="text" name="category" className="form-control" required value={formData.category} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Price (₹)</label>
                <input type="number" name="price" className="form-control" required value={formData.price} onChange={handleInputChange} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea name="description" className="form-control" rows="3" required value={formData.description} onChange={handleInputChange}></textarea>
            </div>

            <div className="form-group">
              <label className="form-label">Product Image</label>
              <input type="file" name="image" className="form-control" accept="image/png" required onChange={handleInputChange} />
            </div>

            <button type="submit" className="btn btn-success mt-4">Save Product</button>
          </form>
        </div>
      )}

      <div className="admin-products-table glass-panel">
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product._id}>
                  <td>
                    <img src={productImageUrl(product._id)} alt={product.name} className="admin-product-img" loading="lazy" onError={(e) => { e.target.src = 'https://via.placeholder.com/50/14141d/8c8c9a?text=img'; }} />
                  </td>
                  <td className="admin-product-name">{product.name}</td>
                  <td>{product.category}</td>
                  <td>₹{product.price}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(product._id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center p-4">No products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
