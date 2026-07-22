import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { store } from './redux/store';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { fetchProfile } from './redux/slices/authSlice';
import { ThemeProvider, useTheme } from './context/ThemeContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Wishlist from './pages/Wishlist';
import AdminDashboard from './pages/AdminDashboard';
import SellerRegister from './pages/SellerRegister';
import ApplySeller from './pages/ApplySeller';
import SellerPending from './pages/SellerPending';
import SellerDashboard from './pages/SellerDashboard';
import SellerProductForm from './pages/SellerProductForm';
import AdminProductForm from './pages/AdminProductForm';

// Protected route wrapper
function PrivateRoute({ children }) {
  const { user } = useSelector((s) => s.auth);
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user } = useSelector((s) => s.auth);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

// Approved seller only
function SellerRoute({ children }) {
  const { user } = useSelector((s) => s.auth);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'seller') return <Navigate to="/" replace />;
  return children;
}

function AppLayout({ children }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-16">{children}</main>
      <Footer />
    </>
  );
}

function AppInit({ children }) {
  const dispatch = useDispatch();
  const { isAuthenticated, user, loading } = useSelector(s => s.auth);
  const [init, setInit] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !user) {
      dispatch(fetchProfile()).finally(() => setInit(true));
    } else {
      setInit(true);
    }
  }, [dispatch, isAuthenticated, user]);

  if (!init || (loading && !user && isAuthenticated)) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return children;
}

function ThemedToaster() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: isDark ? '#1e293b' : '#ffffff',
          color: isDark ? '#f1f5f9' : '#0f172a',
          border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
          boxShadow: isDark ? '0 10px 25px -5px rgba(0,0,0,0.5)' : '0 10px 25px -5px rgba(0,0,0,0.1)',
          borderRadius: '12px',
          fontSize: '14px',
        },
        success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
        error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
      }}
    />
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<AppLayout><Home /></AppLayout>} />
      <Route path="/products" element={<AppLayout><ProductList /></AppLayout>} />
      <Route path="/products/:slug" element={<AppLayout><ProductDetail /></AppLayout>} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/cart" element={<AppLayout><Cart /></AppLayout>} />

      {/* Protected routes */}
      <Route path="/checkout" element={<PrivateRoute><AppLayout><Checkout /></AppLayout></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><AppLayout><Profile /></AppLayout></PrivateRoute>} />
      <Route path="/orders" element={<PrivateRoute><AppLayout><Orders /></AppLayout></PrivateRoute>} />
      <Route path="/orders/:id" element={<PrivateRoute><AppLayout><OrderDetail /></AppLayout></PrivateRoute>} />
      <Route path="/wishlist" element={<PrivateRoute><AppLayout><Wishlist /></AppLayout></PrivateRoute>} />

      {/* Admin routes */}
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/products/new" element={<AdminRoute><AdminProductForm /></AdminRoute>} />
      <Route path="/admin/products/:slug/edit" element={<AdminRoute><AdminProductForm /></AdminRoute>} />

      {/* Seller routes */}
      <Route path="/seller/register" element={<SellerRegister />} />
      <Route path="/seller/apply" element={<PrivateRoute><AppLayout><ApplySeller /></AppLayout></PrivateRoute>} />
      <Route path="/seller/pending" element={<PrivateRoute><SellerPending /></PrivateRoute>} />
      <Route path="/seller/dashboard" element={<SellerRoute><SellerDashboard /></SellerRoute>} />
      <Route path="/seller/products/new" element={<SellerRoute><SellerProductForm /></SellerRoute>} />
      <Route path="/seller/products/:id/edit" element={<SellerRoute><SellerProductForm /></SellerRoute>} />

      {/* 404 */}
      <Route path="*" element={
        <AppLayout>
          <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
            <h1 className="text-8xl font-heading font-bold text-gradient mb-4">404</h1>
            <p className="text-xl text-[var(--text-muted)] mb-8">Page not found</p>
            <a href="/" className="btn-primary btn-lg">Go Home</a>
          </div>
        </AppLayout>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <HelmetProvider>
          <Router>
            <AppInit>
              <AppRoutes />
            </AppInit>
            <ThemedToaster />
          </Router>
        </HelmetProvider>
      </ThemeProvider>
    </Provider>
  );
}
