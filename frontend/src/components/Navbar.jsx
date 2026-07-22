import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ShoppingCart, User, Search, Menu, X, Package, ChevronDown, Heart, LogOut, LayoutDashboard, Store, Sun, Moon } from 'lucide-react';
import { logoutUser } from '../redux/slices/authSlice';
import { fetchCart } from '../redux/slices/cartSlice';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user } = useSelector((s) => s.auth);
  const { total_items } = useSelector((s) => s.cart);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (user) dispatch(fetchCart());
  }, [user]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setUserMenuOpen(false);
  }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success('Logged out!');
    navigate('/login');
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/products', label: 'Products' },
    { to: '/wishlist', label: 'Wishlist' },
    { to: '/orders', label: 'Orders' },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-[var(--navbar-scrolled-bg)] backdrop-blur-md border-b border-[var(--border-color)] shadow-md' 
        : 'bg-[var(--navbar-bg)] backdrop-blur-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-cyan-500 rounded-lg flex items-center justify-center group-hover:shadow-glow transition-all">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-bold text-[var(--text-primary)] text-lg tracking-tight">ShopElite</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <Link 
                key={to} 
                to={to}
                className={`nav-link px-3 py-2 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-all ${
                  location.pathname === to ? 'nav-link-active bg-[var(--bg-surface-hover)] font-semibold' : ''
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Search + Actions */}
          <div className="flex items-center gap-2">
            {/* Search bar (desktop) */}
            <form onSubmit={handleSearch} className="hidden lg:flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-subtle)]" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="input pl-9 pr-4 py-1.5 text-sm w-48 focus:w-64 transition-all duration-300"
                />
              </div>
            </form>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="btn-ghost btn-icon p-2 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors relative"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400 hover:rotate-45 transition-transform duration-300" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-600 hover:-rotate-12 transition-transform duration-300" />
              )}
            </button>

            {/* Cart */}
            <Link to="/cart" className="relative btn-ghost btn-icon p-2">
              <ShoppingCart className="w-5 h-5" />
              {total_items > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {total_items > 9 ? '9+' : total_items}
                </span>
              )}
            </Link>

            {/* User menu or login */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-cyan-500 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm">
                    {user.full_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <ChevronDown className={`w-3 h-3 text-[var(--text-subtle)] transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl py-2 shadow-2xl z-50 animate-slide-up">
                    <div className="px-4 py-2 border-b border-[var(--border-color)]">
                      <p className="font-semibold text-[var(--text-primary)] text-sm">{user.full_name}</p>
                      <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
                    </div>
                    {[
                      { to: '/profile', label: 'My Profile', icon: User },
                      { to: '/orders', label: 'My Orders', icon: Package },
                      { to: '/wishlist', label: 'Wishlist', icon: Heart },
                      ...(user.role === 'seller' && user.store_status === 'approved' ? [{ to: '/seller/dashboard', label: 'Seller Dashboard', icon: Store }] : []),
                      ...(user.role === 'admin' ? [{ to: '/admin', label: 'Admin Panel', icon: LayoutDashboard }] : []),
                    ].map(({ to, label, icon: Icon }) => (
                      <Link 
                        key={to} 
                        to={to} 
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                      >
                        <Icon className="w-4 h-4" /> {label}
                      </Link>
                    ))}
                    <div className="border-t border-[var(--border-color)] mt-1 pt-1">
                      <button 
                        onClick={handleLogout} 
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:text-red-600 hover:bg-[var(--bg-surface-hover)] transition-colors w-full"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn-primary btn-sm">Sign In</Link>
            )}

            {/* Mobile menu toggle */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="btn-ghost btn-icon md:hidden">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-[var(--border-color)] py-3 space-y-2 animate-fade-in">
            <form onSubmit={handleSearch} className="flex items-center mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-subtle)]" />
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search products..." className="input pl-9 w-full" />
              </div>
            </form>
            {navLinks.map(({ to, label }) => (
              <Link 
                key={to} 
                to={to} 
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === to 
                    ? 'bg-primary-500/10 text-primary-500 font-semibold' 
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
