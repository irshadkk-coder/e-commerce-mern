import { Toaster } from 'react-hot-toast';
import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import OrdersPage from './pages/OrdersPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminOrdersPage from './pages/AdminOrdersPage';
import ProductDetailPage from './pages/ProductDetailPage';

function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-content">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* User Protected Routes */}
          <Route element={<ProtectedRoute />}>
             <Route path="/cart" element={<CartPage />} />
             <Route path="/checkout" element={<CheckoutPage />} />
             <Route path="/order-success" element={<OrderSuccessPage />} />
             <Route path="/orders" element={<OrdersPage />} />
          </Route>

          {/* Admin Protected Routes */}
          <Route element={<ProtectedRoute adminOnly={true} />}>
             <Route path="/admin" element={<AdminDashboard />} />
             <Route path="/admin/products" element={<AdminDashboard />} />
             <Route path="/admin/orders" element={<AdminOrdersPage />} />
          </Route>
        </Routes>
      </main>

      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#14141d',
            color: '#fcfcfd',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(10px)',
          },
          success: {
            iconTheme: { primary: '#31d0aa', secondary: '#14141d' },
          },
        }}
      />
    </div>
  );
}

export default App;
