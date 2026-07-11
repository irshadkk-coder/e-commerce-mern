import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { Route, Routes, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Footer from './components/Footer';
import PageLoader from './components/PageLoader';

// Eagerly loaded Page
import HomePage from './pages/HomePage';

// Lazy loaded Pages
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminProductsPage = lazy(() => import('./pages/AdminProductsPage'));
const AdminCategoriesPage = lazy(() => import('./pages/AdminCategoriesPage'));
const AdminOrdersPage = lazy(() => import('./pages/AdminOrdersPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));

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
            <Suspense fallback={<PageLoader />}>
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
            </Suspense>
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
