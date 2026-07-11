import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import OrdersPage from './pages/OrdersPage';
import WishlistPage from './pages/WishlistPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminProductsPage from './pages/AdminProductsPage';
import AdminCategoriesPage from './pages/AdminCategoriesPage';
import AdminOrdersPage from './pages/AdminOrdersPage';
import ProductDetailPage from './pages/ProductDetailPage';
import Footer from './components/Footer';
function App() {
  const location = useLocation();

  useEffect(() => {
    // Wait for Framer Motion's exit transition (220ms) before scrolling up
    const timeoutId = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, 250);
    return () => clearTimeout(timeoutId);
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            className="route-transition"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <Routes location={location}>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* User Protected Routes */}
              <Route element={<ProtectedRoute />}>
                 <Route path="/cart" element={<CartPage />} />
                 <Route path="/checkout" element={<CheckoutPage />} />
                 <Route path="/order-success" element={<OrderSuccessPage />} />
                 <Route path="/orders" element={<OrdersPage />} />
                 <Route path="/wishlist" element={<WishlistPage />} />
              </Route>

              {/* Admin Protected Routes */}
              <Route element={<ProtectedRoute adminOnly={true} />}>
                 <Route path="/admin" element={<AdminDashboard />} />
                 <Route path="/admin/products" element={<AdminProductsPage />} />
                 <Route path="/admin/categories" element={<AdminCategoriesPage />} />
                 <Route path="/admin/orders" element={<AdminOrdersPage />} />
              </Route>
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />

      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#111111',
            color: '#ffffff',
            border: '1px solid #1a1a1a',
            backdropFilter: 'blur(10px)',
          },
          success: {
            iconTheme: { primary: '#f5c518', secondary: '#111111' },
          },
        }}
      />
    </div>
  );
}

export default App;
