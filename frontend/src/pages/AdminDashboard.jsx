import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingBag, Users, Store,
  Plus, Trash2, Eye, RefreshCw, X, Loader2, AlertTriangle,
  CheckCircle, DollarSign, Clock, XCircle, ChevronDown, ChevronLeft, ChevronRight, List, Layers
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { fetchAdminStores, approveStore, rejectStore } from '../redux/slices/sellerSlice';
import api from '../services/api';
import toast from 'react-hot-toast';
import ProductDetailsModal from '../components/ProductDetailsModal';
import CreateCategoryModal from '../components/CreateCategoryModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:8000';

export default function AdminDashboard() {
  const { user } = useSelector((s) => s.auth);
  const { adminStores } = useSelector((s) => s.seller);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [tab, setTab] = useState(location.state?.activeTab || 'overview');
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]); // Add categories storage
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState(null); 
  const [rejectReason, setRejectReason] = useState('');
  const [viewProductModal, setViewProductModal] = useState(null);
  const [isProductsOpen, setIsProductsOpen] = useState(false); // Toggle for sidebar group
  const [isCatModalOpen, setIsCatModalOpen] = useState(false); // For quickly creating cats
  const [catModalMode, setCatModalMode] = useState('category'); // 'category' or 'subcategory'


  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [productsLoading, setProductsLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return; }
    loadData();
    dispatch(fetchAdminStores());
  }, [user]);

  useEffect(() => {
    if (tab === 'products') {
      fetchProducts(currentPage);
    }
  }, [currentPage, tab]);

  const fetchProducts = async (page) => {
    setProductsLoading(true);
    try {
      const res = await api.get(`/products/?page=${page}&page_size=12`);
      setProducts(res.data.results || res.data);
      setTotalProducts(res.data.count || res.data.length);
      setTotalPages(Math.ceil((res.data.count || res.data.length) / 12));
    } catch (err) {
      toast.error('Failed to update products page');
    }
    setProductsLoading(false);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsP, statsO, ords, usrs, cats] = await Promise.all([
        api.get('/products/admin/stats/'),
        api.get('/orders/admin/stats/'),
        api.get('/orders/?page_size=50'),
        api.get('/auth/users/'),
        api.get('/categories/'),
      ]);
      setStats({ products: statsP.data, orders: statsO.data });
      setOrders(ords.data.results || ords.data);
      setUsers(usrs.data.results || usrs.data);
      setCategories(cats.data.results || cats.data);
      
      // Load products page 1 explicitly
      await fetchProducts(1);
      setCurrentPage(1);
    } catch (err) {
      toast.error('Failed to load admin dashboard metrics');
    }
    setLoading(false);
  };

  const handleApprove = async (storeId) => {
    const result = await dispatch(approveStore(storeId));
    if (approveStore.fulfilled.match(result)) toast.success('Store approved!');
    else toast.error('Could not approve store');
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    const result = await dispatch(rejectStore({ storeId: rejectModal, reason: rejectReason }));
    if (rejectStore.fulfilled.match(result)) { toast.success('Store rejected'); setRejectModal(null); setRejectReason(''); }
    else toast.error('Could not reject store');
  };

  const handleDeleteProduct = async (slug) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${slug}/`);
      fetchProducts(currentPage);
      toast.success('Product deleted');
    } catch { toast.error('Could not delete product'); }
  };

  const handleOrderStatus = async (orderId, status) => {
    try {
      const res = await api.patch(`/orders/${orderId}/update/`, { order_status: status });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...res.data } : o));
      toast.success('Status updated');
    } catch { toast.error('Could not update status'); }
  };

  const handleProductApproval = async (productId, rawAction) => {
    const actionMap = { 'approved': 'approve', 'rejected': 'reject', 'pending': 'pending' };
    const normalized = actionMap[rawAction] || rawAction;
    try {
      const res = await api.post(`/products/${productId}/approval/${normalized}/`);
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, approval_status: res.data.approval_status } : p));
      toast.success(`Status updated successfully!`);
    } catch { toast.error('Update failed'); }
  };

  const cycleProductApproval = (product) => {
    const cycleMap = { 'pending': 'approved', 'approved': 'rejected', 'rejected': 'pending' };
    const next = cycleMap[product.approval_status] || 'pending';
    handleProductApproval(product.id, next);
  };

  const handleToggleProductActive = async (product) => {
    try {
      const res = await api.patch(`/products/${product.slug}/`, { is_active: !product.is_active });
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: res.data.is_active } : p));
      toast.success(`Visibility updated!`);
    } catch { toast.error('Update failed'); }
  };

  const CHART_DATA = [
    { month: 'Jan', orders: 12, revenue: 45000 },
    { month: 'Feb', orders: 18, revenue: 67000 },
    { month: 'Mar', orders: 15, revenue: 52000 },
    { month: 'Apr', orders: 24, revenue: 89000 },
    { month: 'May', orders: orders.length, revenue: orders.reduce((a, o) => a + parseFloat(o.total_price || 0), 0) },
  ];

  const STAT_CARDS = stats ? [
    { label: 'Total Products', value: stats.products?.total_products || 0, icon: Package, color: 'text-primary-400', bg: 'bg-primary-900/30 border-primary-700/50', change: `${stats.products?.active_products} active` },
    { label: 'Total Orders', value: stats.orders?.total_orders || 0, icon: ShoppingBag, color: 'text-cyan-400', bg: 'bg-cyan-900/30 border-cyan-700/50', change: `${stats.orders?.pending_orders || 0} pending` },
    { label: 'Total Revenue', value: `₹${parseFloat(stats.orders?.total_revenue || 0).toLocaleString('en-IN')}`, icon: DollarSign, color: 'text-green-400', bg: 'bg-green-900/30 border-green-700/50', change: 'all time' },
    { label: 'Total Users', value: users.length, icon: Users, color: 'text-amber-400', bg: 'bg-amber-900/30 border-amber-700/50', change: 'registered' },
  ] : [];

  const TABS = [
    { id: 'overview',  label: 'Overview',  icon: LayoutDashboard },
    { id: 'products',  label: 'Products',  icon: Package },
    { id: 'orders',    label: 'Orders',    icon: ShoppingBag },
    { id: 'users',     label: 'Users',     icon: Users },
    { id: 'sellers',   label: 'Sellers',   icon: Store },
  ];

  if (loading) return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
    </div>
  );

  return (
    <div className="h-screen bg-dark-900 flex overflow-hidden pb-16 lg:pb-0">
      <aside className="hidden lg:flex flex-col w-56 bg-dark-800 border-r border-dark-700 h-full pt-6 px-3 flex-shrink-0">
        <div className="mb-8 px-3 flex items-center justify-between">
          <p className="text-xs text-dark-500 font-semibold uppercase tracking-wider">Admin Panel</p>
          <Link to="/" className="text-xs text-primary-400 hover:text-primary-300">Exit</Link>
        </div>
        {/* Overview */}
        <button onClick={() => setTab('overview')}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-medium transition-all ${tab === 'overview' ? 'bg-primary-600 text-white shadow-glow' : 'text-dark-400 hover:text-white hover:bg-dark-700'}`}>
          <LayoutDashboard className="w-4 h-4" /> Overview
        </button>

        {/* Products Dropdown Group */}
        <div className="mb-1">
          <button onClick={() => setIsProductsOpen(!isProductsOpen)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${(tab === 'products' || tab === 'categories' || tab === 'subcategories') ? 'text-white' : 'text-dark-400 hover:text-white hover:bg-dark-700'}`}>
            <div className="flex items-center gap-3">
              <Package className="w-4 h-4" /> Products
            </div>
            {isProductsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
          
          {isProductsOpen && (
            <div className="ml-5 pl-3 border-l border-dark-700 mt-1 space-y-1 animate-slide-down">
              <button onClick={() => setTab('products')} 
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === 'products' ? 'text-primary-400 bg-primary-900/20' : 'text-dark-400 hover:text-white hover:bg-dark-800'}`}>
                <List className="w-3 h-3" /> Product List
              </button>
              <button onClick={() => setTab('categories')} 
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === 'categories' ? 'text-primary-400 bg-primary-900/20' : 'text-dark-400 hover:text-white hover:bg-dark-800'}`}>
                <Package className="w-3 h-3" /> Category List
              </button>
              <button onClick={() => setTab('subcategories')} 
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === 'subcategories' ? 'text-primary-400 bg-primary-900/20' : 'text-dark-400 hover:text-white hover:bg-dark-800'}`}>
                <Layers className="w-3 h-3" /> Subcategory List
              </button>
            </div>
          )}
        </div>

        {/* Remaining Tabs */}
        {[
          { id: 'orders',    label: 'Orders',    icon: ShoppingBag },
          { id: 'users',     label: 'Users',     icon: Users },
          { id: 'sellers',   label: 'Sellers',   icon: Store },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-medium transition-all ${tab === id ? 'bg-primary-600 text-white shadow-glow' : 'text-dark-400 hover:text-white hover:bg-dark-700'}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
        <div className="mt-auto mb-6 px-3">
          <button onClick={loadData} className="flex items-center gap-2 text-xs text-dark-500 hover:text-dark-300">
            <RefreshCw className="w-3 h-3" /> Refresh Data
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full relative min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto pb-24 lg:pb-8">
          {tab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              <h1 className="text-2xl font-heading font-bold text-white">Dashboard Overview</h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {STAT_CARDS.map(({ label, value, icon: Icon, color, bg, change }) => (
                  <div key={label} className={`card border p-5 ${bg}`}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-dark-400">{label}</p>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg}`}>
                        <Icon className={`w-5 h-5 ${color}`} />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <p className="text-xs text-dark-500 mt-1">{change}</p>
                  </div>
                ))}
              </div>
              {stats?.products?.out_of_stock > 0 && (
                <div className="card p-4 border-amber-700/50 bg-amber-900/10 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <p className="text-sm text-amber-300">{stats.products.out_of_stock} products are out of stock</p>
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card p-5">
                  <h3 className="font-semibold text-white mb-4">Orders (Last 5 Months)</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={CHART_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }} />
                      <Bar dataKey="orders" fill="#3b82f6" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="card p-5">
                  <h3 className="font-semibold text-white mb-4">Revenue (Last 5 Months)</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={CHART_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }} />
                      <Line type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="card p-5">
                <h3 className="font-semibold text-white mb-4">Recent Orders</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="table-header">
                      {['Order#', 'Customer', 'Amount', 'Status', 'Payment', 'Date'].map(h => (
                        <th key={h} className="px-3 py-2 text-left">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {orders.slice(0, 8).map(o => (
                        <tr key={o.id} className="table-row">
                          <td className="px-3 py-2.5 font-mono text-primary-400">#{o.order_number}</td>
                          <td className="px-3 py-2.5 text-dark-300">{o.user_email}</td>
                          <td className="px-3 py-2.5 font-semibold text-white">₹{parseFloat(o.total_price).toLocaleString('en-IN')}</td>
                          <td className="px-3 py-2.5"><span className={`status-${o.order_status}`}>{o.order_status}</span></td>
                          <td className="px-3 py-2.5"><span className={`status-${o.payment_status}`}>{o.payment_status}</span></td>
                          <td className="px-3 py-2.5 text-dark-400">{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === 'products' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-heading font-bold text-white">Products</h2>
                  <span className="bg-dark-800 text-dark-400 text-xs px-2 py-0.5 rounded-full border border-dark-700">Total: {totalProducts}</span>
                </div>
                <Link to="/admin/products/new" className="btn-primary btn-sm"><Plus className="w-4 h-4" /> Add Product</Link>
              </div>
              <div className="card overflow-hidden relative">
                {productsLoading && (
                  <div className="absolute inset-0 bg-dark-900/40 backdrop-blur-[1px] z-20 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="table-header">
                      {['Image', 'Product', 'Price', 'Stock', 'Category', 'Added By', 'Status', 'Active', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left whitespace-nowrap">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.id} className="table-row">
                          <td className="px-4 py-3">
                            <div className="w-10 h-10 rounded-lg bg-dark-800 border border-dark-750 overflow-hidden flex items-center justify-center p-1 flex-shrink-0 shadow-sm">
                              {p.primary_image?.image ? (
                                <img 
                                  src={p.primary_image.image.startsWith('http') ? p.primary_image.image : `${API_BASE}${p.primary_image.image}`} 
                                  alt="" 
                                  className="w-full h-full object-contain transition-transform hover:scale-125"
                                />
                              ) : (
                                <Package className="w-5 h-5 text-dark-600" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-medium text-white max-w-[200px] truncate" title={p.name}>{p.name}</td>
                          <td className="px-4 py-3 text-dark-300 font-semibold">₹{parseFloat(p.effective_price || p.price).toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3"><span className={`font-mono px-2 py-0.5 rounded-md text-xs border ${p.stock === 0 ? 'text-danger border-red-950 bg-red-950/20' : p.stock <= 10 ? 'text-amber-400 border-amber-950 bg-amber-950/20' : 'text-green-400 border-green-950 bg-green-950/20'}`}>{p.stock}</span></td>
                          <td className="px-4 py-3 text-dark-400 truncate max-w-[120px]">{p.category_name}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border shadow-sm ${
                              p.seller_name === 'Admin' 
                                ? 'bg-indigo-900/30 text-indigo-400 border-indigo-800/50' 
                                : 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50'
                            }`}>
                              {p.seller_name}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => cycleProductApproval(p)} className="flex items-center justify-center hover:scale-110 transition-transform" title="Click to cycle approval status">
                              {p.approval_status === 'approved' && <CheckCircle className="w-4 h-4 text-green-400" />}
                              {p.approval_status === 'rejected' && <XCircle className="w-4 h-4 text-red-400" />}
                              {p.approval_status === 'pending'  && <Clock className="w-4 h-4 text-amber-400" />}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => handleToggleProductActive(p)} className="flex items-center justify-center hover:scale-110 transition-transform" title="Toggle active visibility">
                              {p.is_active ? <CheckCircle className="w-4 h-4 text-green-400" /> : <X className="w-4 h-4 text-red-400" />}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => setViewProductModal(p.slug)} className="btn-ghost p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700" title="View Detail"><Eye className="w-4 h-4" /></button>
                              
                              {!p.seller && (
                                <>
                                  <Link to={`/admin/products/${p.slug}/edit`} className="btn-ghost p-1.5 rounded-lg text-dark-400 hover:text-primary-400 hover:bg-dark-700" title="Edit">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                  </Link>
                                  <button onClick={() => handleDeleteProduct(p.slug)} className="btn-ghost p-1.5 rounded-lg text-dark-400 hover:text-danger hover:bg-dark-700" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Visual Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between bg-dark-850 px-5 py-3.5 border border-dark-700 mt-4 rounded-xl shadow-lg animate-fade-in">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="btn-secondary btn-sm"
                    >
                      Previous
                    </button>
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="btn-secondary btn-sm ml-3"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs text-dark-400">
                        Showing <span className="font-bold text-white">{(currentPage - 1) * 12 + 1}</span> to <span className="font-bold text-white">{Math.min(currentPage * 12, totalProducts)}</span> of <span className="font-bold text-white">{totalProducts}</span> products
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex rounded-md shadow-sm gap-1.5" aria-label="Pagination">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className={`relative inline-flex items-center rounded-lg px-2.5 py-2 text-dark-400 border border-dark-700 bg-dark-800 hover:bg-dark-700 hover:text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95`}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        
                        {[...Array(totalPages)].map((_, idx) => {
                          const pNum = idx + 1;
                          if (totalPages > 7 && Math.abs(pNum - currentPage) > 2 && pNum !== 1 && pNum !== totalPages) {
                            if (Math.abs(pNum - currentPage) === 3) return <span key={pNum} className="text-dark-600 px-1 flex items-end pb-1">...</span>;
                            return null;
                          }
                          
                          return (
                            <button
                              key={pNum}
                              onClick={() => setCurrentPage(pNum)}
                              className={`relative inline-flex items-center px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all border cursor-pointer active:scale-95
                                ${currentPage === pNum 
                                  ? 'bg-primary-600 border-primary-500 text-white shadow-glow z-10 scale-105' 
                                  : 'text-dark-400 border-dark-700 bg-dark-800 hover:bg-dark-700 hover:text-white'}`}
                            >
                              {pNum}
                            </button>
                          );
                        })}

                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className={`relative inline-flex items-center rounded-lg px-2.5 py-2 text-dark-400 border border-dark-700 bg-dark-800 hover:bg-dark-700 hover:text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95`}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'categories' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-heading font-bold text-white">Categories</h2>
                <button onClick={() => { setCatModalMode('category'); setIsCatModalOpen(true); }} className="btn-primary btn-sm"><Plus className="w-4 h-4" /> Create Category</button>

              </div>
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="table-header">
                      {['Image', 'Name', 'Slug', 'Subcategories', 'Total Products'].map(h => (
                        <th key={h} className="px-4 py-3 text-left">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {categories.filter(c => !c.parent).map(c => (
                        <tr key={c.id} className="table-row">
                          <td className="px-4 py-3">
                            <div className="w-10 h-10 rounded-lg bg-dark-800 border border-dark-750 overflow-hidden flex items-center justify-center p-1">
                              {c.image ? (
                                <img src={c.image.startsWith('http') ? c.image : `${API_BASE}${c.image}`} alt="" className="w-full h-full object-contain" />
                              ) : (
                                <Package className="w-5 h-5 text-dark-600" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                          <td className="px-4 py-3 text-dark-300">{c.slug}</td>
                          <td className="px-4 py-3 text-dark-400">
                            {categories.filter(sc => sc.parent === c.id).length} items
                          </td>
                          <td className="px-4 py-3 text-dark-400 font-bold">{c.product_count || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === 'subcategories' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-heading font-bold text-white">Subcategories</h2>
                <button onClick={() => { setCatModalMode('subcategory'); setIsCatModalOpen(true); }} className="btn-primary btn-sm"><Plus className="w-4 h-4" /> Create Subcategory</button>

              </div>
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="table-header">
                      {['Image', 'Subcategory', 'Parent Category', 'Slug', 'Total Products'].map(h => (
                        <th key={h} className="px-4 py-3 text-left">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {categories.filter(c => c.parent).map(c => {
                        const parent = categories.find(pc => pc.id === c.parent);
                        return (
                          <tr key={c.id} className="table-row">
                            <td className="px-4 py-3">
                              <div className="w-8 h-8 rounded-lg bg-dark-800 border border-dark-750 overflow-hidden flex items-center justify-center p-1">
                                {c.image ? (
                                  <img src={c.image.startsWith('http') ? c.image : `${API_BASE}${c.image}`} alt="" className="w-full h-full object-contain" />
                                ) : (
                                  <Layers className="w-4 h-4 text-dark-600" />
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                            <td className="px-4 py-3">
                              <span className="text-xs font-medium px-2 py-0.5 rounded bg-dark-700 text-primary-300 border border-dark-600">
                                {parent ? parent.name : 'Main'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-dark-300">{c.slug}</td>
                            <td className="px-4 py-3 text-dark-400 font-bold">{c.product_count || 0}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === 'orders' && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-xl font-heading font-bold text-white">All Orders</h2>
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="table-header">
                      {['Order#', 'Customer', 'Amount', 'Payment', 'Status', 'Date', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {orders.map(o => (
                        <tr key={o.id} className="table-row">
                          <td className="px-4 py-3 font-mono text-primary-400 text-xs">#{o.order_number}</td>
                          <td className="px-4 py-3 text-dark-300 max-w-[160px] truncate">{o.user_email}</td>
                          <td className="px-4 py-3 font-semibold text-white">₹{parseFloat(o.total_price).toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3"><span className={`status-${o.payment_status}`}>{o.payment_status}</span></td>
                          <td className="px-4 py-3">
                            <select value={o.order_status} onChange={(e) => handleOrderStatus(o.id, e.target.value)}
                              className="text-xs bg-dark-700 border border-dark-600 text-white rounded-lg px-2 py-1 focus:outline-none focus:border-primary-500">
                              {['pending','confirmed','processing','shipped','out_for_delivery','delivered','cancelled'].map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 text-dark-400 text-xs">{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                          <td className="px-4 py-3">
                            <Link to={`/orders/${o.id}`} className="btn-ghost p-1.5 rounded-lg text-dark-400 hover:text-white"><Eye className="w-4 h-4" /></Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === 'users' && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-xl font-heading font-bold text-white">All Users</h2>
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="table-header">
                      {['User', 'Email', 'Phone', 'Role', 'Joined', 'Status'].map(h => (
                        <th key={h} className="px-4 py-3 text-left">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} className="table-row">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-cyan-500 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                {u.full_name?.[0]?.toUpperCase() || 'U'}
                              </div>
                              <span className="font-medium text-white">{u.full_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-dark-300">{u.email}</td>
                          <td className="px-4 py-3 text-dark-400">{u.phone || '—'}</td>
                          <td className="px-4 py-3"><span className={u.role === 'admin' ? 'badge-primary badge' : u.role === 'seller' ? 'badge-success badge' : 'badge-gray badge'}>{u.role}</span></td>
                          <td className="px-4 py-3 text-dark-400 text-xs">{new Date(u.date_joined).toLocaleDateString('en-IN')}</td>
                          <td className="px-4 py-3"><span className="badge-success badge">Active</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Sellers Tab ── */}
          {tab === 'sellers' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-heading font-bold text-white">Seller Applications</h2>
                <div className="flex gap-2">
                  {['', 'pending', 'approved', 'rejected'].map(s => (
                    <button key={s || 'all'}
                      onClick={() => dispatch(fetchAdminStores(s))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        s === '' ? 'bg-dark-700 border-dark-600 text-white' :
                        s === 'pending'  ? 'bg-amber-900/30 border-amber-700/50 text-amber-400' :
                        s === 'approved' ? 'bg-green-900/30 border-green-700/50 text-green-400' :
                        'bg-red-900/30 border-red-700/50 text-red-400'
                      }`}>
                      {s || 'All'} {s && `(${adminStores.filter(st => st.status === s).length})`}
                    </button>
                  ))}
                </div>
              </div>

              {adminStores.length === 0 ? (
                <div className="card p-12 text-center">
                  <Store className="w-12 h-12 text-dark-600 mx-auto mb-3" />
                  <p className="text-dark-400">No seller applications yet.</p>
                </div>
              ) : (
                <div className="card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="table-header">
                        {['Store', 'Owner', 'Contact', 'GSTIN', 'Status', 'Applied', 'Actions'].map(h => (
                          <th key={h} className="px-4 py-3 text-left">{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {adminStores.map(s => (
                          <tr key={s.id} className="table-row">
                            <td className="px-4 py-3">
                              <div className="font-medium text-white">{s.store_name}</div>
                              {s.description && <div className="text-xs text-dark-500 truncate max-w-[160px]">{s.description}</div>}
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-dark-300">{s.owner_name}</div>
                              <div className="text-xs text-dark-500">{s.owner_email}</div>
                            </td>
                            <td className="px-4 py-3 text-dark-400">{s.phone || '—'}</td>
                            <td className="px-4 py-3 font-mono text-xs text-dark-400">{s.gstin || '—'}</td>
                            <td className="px-4 py-3">
                              {s.status === 'pending'  && <span className="status-pending flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>}
                              {s.status === 'approved' && <span className="status-delivered flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Approved</span>}
                              {s.status === 'rejected' && <span className="status-cancelled flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</span>}
                            </td>
                            <td className="px-4 py-3 text-dark-400 text-xs">{new Date(s.created_at).toLocaleDateString('en-IN')}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {s.status !== 'approved' && (
                                  <button onClick={() => handleApprove(s.id)}
                                    className="px-2 py-1 rounded-lg text-xs font-semibold bg-green-900/30 border border-green-700/50 text-green-400 hover:bg-green-900/50 transition-colors">
                                    ✓ Approve
                                  </button>
                                )}
                                {s.status !== 'rejected' && (
                                  <button onClick={() => { setRejectModal(s.id); setRejectReason(''); }}
                                    className="px-2 py-1 rounded-lg text-xs font-semibold bg-red-900/30 border border-red-700/50 text-red-400 hover:bg-red-900/50 transition-colors">
                                    ✗ Reject
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
        
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-dark-800 border-t border-dark-700 flex z-40">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors ${tab === id ? 'text-primary-400 bg-primary-900/10' : 'text-dark-500'}`}>
              <Icon className="w-5 h-5 mb-1" />{label}
            </button>
          ))}
        </div>
      </div>

      {/* Reject Reason Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="card p-6 w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Reject Store</h3>
              <button onClick={() => setRejectModal(null)} className="btn-ghost p-1"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-dark-400 mb-4">Provide a reason for rejection (optional — will be shown to the seller):</p>
            <textarea className="input" rows={3}
              placeholder="e.g. Incomplete business information, invalid GSTIN, etc."
              value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setRejectModal(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={handleReject} className="btn-danger flex-1 justify-center">Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}

      {/* View Product Modal */}
      {viewProductModal && (
        <ProductDetailsModal
          slug={viewProductModal}
          onClose={() => setViewProductModal(null)}
        />
      )}

      {/* Create Category Modal */}
      <CreateCategoryModal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        isSubcategory={catModalMode === 'subcategory'}
        parentCategories={categories}
        onSuccess={(newCat) => {
          loadData(); // Refresh table after create
          if (newCat.parent) setTab('subcategories'); else setTab('categories');
        }}
      />
    </div>
  );
}

