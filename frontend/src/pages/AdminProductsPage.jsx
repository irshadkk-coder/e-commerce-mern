import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  addAdminCategory,
  addAdminProduct,
  deleteAdminProduct,
  getAdminCategories,
  getAdminProducts,
  updateAdminProduct
} from '../services/adminService';
import { productImageUrl } from '../services/assetUrl';
import { CATEGORIES, formatCategory } from '../constants/categories';
import './AdminDashboard.css';

const emptyForm = {
  name: '',
  category: CATEGORIES[0],
  price: '',
  stock: '',
  description: '',
  image: null
};

const AdminProductsPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [categories, setCategories] = useState(CATEGORIES);
  const [showInlineCategory, setShowInlineCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [imagePreview, setImagePreview] = useState('');

  const formTitle = editingProduct ? 'Edit Product' : 'Add New Product';

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!formData.image) {
      setImagePreview('');
      return undefined;
    }

    const previewUrl = URL.createObjectURL(formData.image);
    setImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [formData.image]);

  const productRows = useMemo(() => products, [products]);

  const fetchCategories = async () => {
    try {
      const data = await getAdminCategories();
      if (data.status) {
        const names = (data.categories || []).map((category) => category.name || category);
        setCategories(names.length ? names : CATEGORIES);
        setFormData((current) => ({
          ...current,
          category: current.category || names[0] || CATEGORIES[0]
        }));
      }
    } catch (err) {
      toast.error('Failed to load categories');
    }
  };

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

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingProduct(null);
    setShowForm(false);
    setShowInlineCategory(false);
    setNewCategory('');
    setFormErrors({});
  };

  const handleCancel = () => {
    resetForm();
    navigate('/admin');
  };

  const handleAddClick = () => {
    setEditingProduct(null);
    setFormData({ ...emptyForm, category: categories[0] || CATEGORIES[0] });
    setFormErrors({});
    setShowForm(true);
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      category: formatCategory(product.category || categories[0] || CATEGORIES[0]),
      price: product.price ?? '',
      stock: product.stock ?? '',
      description: product.description || '',
      image: null
    });
    setShowForm(true);
    setFormErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const data = await deleteAdminProduct(id);
      if (data.status) {
        toast.success('Product deleted');
        setProducts((prev) => prev.filter((p) => p._id !== id));
      }
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      setFormData((prev) => ({ ...prev, image: files[0] || null }));
      setFormErrors((prev) => ({ ...prev, image: '' }));
      return;
    }
    if (name === 'category' && value === '__add_new__') {
      setShowInlineCategory(true);
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Product name is required';
    if (!formData.category.trim()) errors.category = 'Category is required';
    if (!formData.price) errors.price = 'Price is required';
    if (formData.stock === '') errors.stock = 'Stock/quantity is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (!editingProduct && !formData.image) errors.image = 'Product image is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInlineCategoryAdd = async () => {
    if (!newCategory.trim()) {
      setFormErrors((prev) => ({ ...prev, category: 'Category name is required' }));
      return;
    }

    try {
      const data = await addAdminCategory(newCategory);
      if (data.status) {
        const categoryName = data.category.name;
        setCategories((current) => [...current, categoryName].sort());
        setFormData((current) => ({ ...current, category: categoryName }));
        setNewCategory('');
        setShowInlineCategory(false);
        setFormErrors((prev) => ({ ...prev, category: '' }));
        toast.success('Category added');
      }
    } catch (err) {
      setFormErrors((prev) => ({
        ...prev,
        category: err.response?.data?.message || 'Failed to add category'
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = new FormData();
    payload.append('name', formData.name);
    payload.append('category', formData.category);
    payload.append('price', formData.price);
    payload.append('stock', formData.stock);
    payload.append('description', formData.description);
    if (formData.image) payload.append('image', formData.image);

    try {
      const data = editingProduct
        ? await updateAdminProduct(editingProduct._id, payload)
        : await addAdminProduct(payload);

      if (data.status) {
        toast.success(editingProduct ? 'Product updated successfully' : 'Product added successfully');
        resetForm();
        fetchProducts();
      }
    } catch (err) {
      toast.error('Failed to save product: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <div className="page-container loading-state"><div className="spinner"></div></div>;

  return (
    <div className="page-container admin-container animate-fade-in">
      <div className="admin-header">
        <h1 className="page-title">All Products</h1>
        {!showForm && (
          <button className="btn btn-primary" onClick={handleAddClick}>
            + Add New Product
          </button>
        )}
      </div>

      {showForm && (
        <div className="admin-add-form glass-panel">
          <h3>{formTitle}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Product Name</label>
              <input type="text" name="name" className="form-control" value={formData.name} onChange={handleInputChange} />
              {formErrors.name && <p className="form-error">{formErrors.name}</p>}
            </div>

            <div className="admin-form-row">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select name="category" className="form-control" value={formData.category} onChange={handleInputChange}>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                  <option value="__add_new__">+ Add New Category...</option>
                </select>
                {showInlineCategory && (
                  <div className="inline-category-add">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="New category name"
                      value={newCategory}
                      onChange={(event) => setNewCategory(event.target.value)}
                    />
                    <button type="button" className="btn btn-primary btn-sm" onClick={handleInlineCategoryAdd}>Add</button>
                  </div>
                )}
                {formErrors.category && <p className="form-error">{formErrors.category}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Price (₹)</label>
                <input type="number" name="price" className="form-control" min="1" placeholder="Example: ₹9999" value={formData.price} onChange={handleInputChange} />
                {formErrors.price && <p className="form-error">{formErrors.price}</p>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Stock/Quantity</label>
              <input type="number" name="stock" className="form-control" min="0" value={formData.stock} onChange={handleInputChange} />
              {formErrors.stock && <p className="form-error">{formErrors.stock}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea name="description" className="form-control" rows="3" value={formData.description} onChange={handleInputChange}></textarea>
              {formErrors.description && <p className="form-error">{formErrors.description}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Product Image</label>
              <input type="file" name="image" className="form-control" accept="image/png" onChange={handleInputChange} />
              {formErrors.image && <p className="form-error">{formErrors.image}</p>}
              {(imagePreview || editingProduct) && (
                <img
                  src={imagePreview || productImageUrl(editingProduct._id)}
                  alt="Product preview"
                  className="admin-image-preview"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
            </div>

            <div className="admin-form-actions">
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>Cancel</button>
              <button type="submit" className="btn btn-primary">{editingProduct ? 'Update Product' : 'Save Product'}</button>
            </div>
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
                <th>Stock</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {productRows.map((product) => (
                <tr key={product._id}>
                  <td>
                    <img src={productImageUrl(product._id)} alt={product.name} className="admin-product-img" loading="lazy" onError={(e) => { e.target.src = 'https://via.placeholder.com/50/14141d/8c8c9a?text=img'; }} />
                  </td>
                  <td className="admin-product-name">{product.name}</td>
                  <td>{formatCategory(product.category)}</td>
                  <td>{product.stock ?? 0}</td>
                  <td>₹{product.price}</td>
                  <td>
                    <div className="admin-table-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEditClick(product)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(product._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center p-4">No products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminProductsPage;
