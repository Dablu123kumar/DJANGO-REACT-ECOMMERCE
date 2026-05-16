import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ShoppingCart, User, Search, Menu, X, Package, ChevronDown, Heart, LogOut, LayoutDashboard, Store } from 'lucide-react';
import { logoutUser } from '../redux/slices/authSlice';
import { fetchCart } from '../redux/slices/cartSlice';
import toast from 'react-hot-toast';

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
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
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-dark-900/95 backdrop-blur-md border-b border-dark-800 shadow-xl' : 'bg-dark-900/80 backdrop-blur-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-cyan-500 rounded-lg flex items-center justify-center group-hover:shadow-glow transition-all">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-bold text-white text-lg tracking-tight">ShopElite</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <Link key={to} to={to}
                className={`nav-link px-3 py-2 rounded-lg hover:bg-dark-800 transition-all ${location.pathname === to ? 'nav-link-active bg-dark-800' : ''}`}>
                {label}
              </Link>
            ))}
          </nav>

          {/* Search + Actions */}
          <div className="flex items-center gap-2">
            {/* Search bar (desktop) */}
            <form onSubmit={handleSearch} className="hidden lg:flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="input pl-9 pr-4 py-1.5 text-sm w-48 focus:w-64 transition-all duration-300"
                />
              </div>
            </form>

            {/* Cart */}
            <Link to="/cart" className="relative btn-ghost btn-icon">
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
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-dark-800 transition-colors"
                >
                  <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-cyan-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {user.full_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <ChevronDown className={`w-3 h-3 text-dark-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 glass-card py-2 z-50">
                    <div className="px-4 py-2 border-b border-dark-700/50">
                      <p className="font-semibold text-white text-sm">{user.full_name}</p>
                      <p className="text-xs text-dark-400">{user.email}</p>
                    </div>
                    {[
                      { to: '/profile', label: 'My Profile', icon: User },
                      { to: '/orders', label: 'My Orders', icon: Package },
                      { to: '/wishlist', label: 'Wishlist', icon: Heart },
                      ...(user.role === 'seller' && user.store_status === 'approved' ? [{ to: '/seller/dashboard', label: 'Seller Dashboard', icon: Store }] : []),
                      ...(user.role === 'admin' ? [{ to: '/admin', label: 'Admin Panel', icon: LayoutDashboard }] : []),
                    ].map(({ to, label, icon: Icon }) => (
                      <Link key={to} to={to} className="flex items-center gap-2.5 px-4 py-2 text-sm text-dark-300 hover:text-white hover:bg-dark-800/50 transition-colors">
                        <Icon className="w-4 h-4" /> {label}
                      </Link>
                    ))}
                    <div className="border-t border-dark-700/50 mt-1 pt-1">
                      <button onClick={handleLogout} className="flex items-center gap-2.5 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-dark-800/50 transition-colors w-full">
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
          <div className="md:hidden border-t border-dark-800 py-3 space-y-1 animate-fade-in">
            <form onSubmit={handleSearch} className="flex items-center mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="input pl-9 w-full" />
              </div>
            </form>
            {navLinks.map(({ to, label }) => (
              <Link key={to} to={to} className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === to ? 'bg-primary-600/20 text-primary-400' : 'text-dark-300 hover:text-white hover:bg-dark-800'}`}>
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
