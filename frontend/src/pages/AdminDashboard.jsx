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
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState(null); 
  const [rejectReason, setRejectReason] = useState('');
  const [viewProductModal, setViewProductModal] = useState(null);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catModalMode, setCatModalMode] = useState('category');
  const [editCategoryData, setEditCategoryData] = useState(null);

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
    } catch {
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
      
      await fetchProducts(1);
      setCurrentPage(1);
    } catch {
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

  const handleDeleteCategory = async (slug) => {
    if (!confirm('Delete this category? This might affect products!')) return;
    try {
      await api.delete(`/categories/${slug}/`);
      loadData();
      toast.success('Category deleted');
    } catch { toast.error('Could not delete category'); }
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
    { label: 'Total Products', value: stats.products?.total_products || 0, icon: Package, color: 'text-primary-500', change: `${stats.products?.active_products} active` },
    { label: 'Total Orders', value: stats.orders?.total_orders || 0, icon: ShoppingBag, color: 'text-cyan-500', change: `${stats.orders?.pending_orders || 0} pending` },
    { label: 'Total Revenue', value: `₹${parseFloat(stats.orders?.total_revenue || 0).toLocaleString('en-IN')}`, icon: DollarSign, color: 'text-emerald-500', change: 'all time' },
    { label: 'Total Users', value: users.length, icon: Users, color: 'text-amber-500', change: 'registered' },
  ] : [];

  const TABS = [
    { id: 'overview',  label: 'Overview',  icon: LayoutDashboard },
    { id: 'products',  label: 'Products',  icon: Package },
    { id: 'orders',    label: 'Orders',    icon: ShoppingBag },
    { id: 'users',     label: 'Users',     icon: Users },
    { id: 'sellers',   label: 'Sellers',   icon: Store },
  ];

  if (loading) return (
    <div className="min-h-screen pt-24 flex items-center justify-center bg-[var(--bg-page)]">
      <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
    </div>
  );

  return (
    <div className="h-screen bg-[var(--bg-page)] flex overflow-hidden pb-16 lg:pb-0 transition-colors duration-300">
      <aside className="hidden lg:flex flex-col w-56 bg-[var(--bg-surface)] border-r border-[var(--border-color)] h-full pt-6 px-3 flex-shrink-0">
        <div className="mb-8 px-3 flex items-center justify-between">
          <p className="text-xs text-[var(--text-subtle)] font-semibold uppercase tracking-wider">Admin Panel</p>
          <Link to="/" className="text-xs text-primary-500 hover:text-primary-600 font-medium">Exit</Link>
        </div>
        
        {/* Overview */}
        <button onClick={() => setTab('overview')}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-medium transition-all ${tab === 'overview' ? 'bg-primary-600 text-white shadow-glow font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'}`}>
          <LayoutDashboard className="w-4 h-4" /> Overview
        </button>

        {/* Products Dropdown Group */}
        <div className="mb-1">
          <button onClick={() => setIsProductsOpen(!isProductsOpen)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${(tab === 'products' || tab === 'categories' || tab === 'subcategories') ? 'text-[var(--text-primary)] font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'}`}>
            <div className="flex items-center gap-3">
              <Package className="w-4 h-4" /> Products
            </div>
            {isProductsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
          
          {isProductsOpen && (
            <div className="ml-5 pl-3 border-l border-[var(--border-color)] mt-1 space-y-1 animate-slide-down">
              <button onClick={() => setTab('products')} 
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === 'products' ? 'text-primary-500 font-bold bg-primary-500/10' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'}`}>
                <List className="w-3 h-3" /> Product List
              </button>
              <button onClick={() => setTab('categories')} 
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === 'categories' ? 'text-primary-500 font-bold bg-primary-500/10' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'}`}>
                <Package className="w-3 h-3" /> Category List
              </button>
              <button onClick={() => setTab('subcategories')} 
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === 'subcategories' ? 'text-primary-500 font-bold bg-primary-500/10' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'}`}>
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
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-medium transition-all ${tab === id ? 'bg-primary-600 text-white shadow-glow font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
        <div className="mt-auto mb-6 px-3">
          <button onClick={loadData} className="flex items-center gap-2 text-xs text-[var(--text-subtle)] hover:text-[var(--text-primary)]">
            <RefreshCw className="w-3 h-3" /> Refresh Data
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full relative min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto pb-24 lg:pb-8">
          {tab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              <h1 className="text-2xl font-heading font-bold text-[var(--text-primary)]">Dashboard Overview</h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {STAT_CARDS.map(({ label, value, icon: Icon, color, change }) => (
                  <div key={label} className="card p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-[var(--text-muted)]">{label}</p>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--bg-surface-hover)] border border-[var(--border-color)]">
                        <Icon className={`w-5 h-5 ${color}`} />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
                    <p className="text-xs text-[var(--text-subtle)] mt-1">{change}</p>
                  </div>
                ))}
              </div>
              {stats?.products?.out_of_stock > 0 && (
                <div className="card p-4 border-amber-500/40 bg-amber-500/10 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <p className="text-sm text-amber-600 dark:text-amber-300 font-medium">{stats.products.out_of_stock} products are out of stock</p>
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card p-5">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-4">Orders (Last 5 Months)</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={CHART_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                      <XAxis dataKey="month" stroke="var(--text-subtle)" fontSize={12} />
                      <YAxis stroke="var(--text-subtle)" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                      <Bar dataKey="orders" fill="#3b82f6" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="card p-5">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-4">Revenue (Last 5 Months)</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={CHART_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                      <XAxis dataKey="month" stroke="var(--text-subtle)" fontSize={12} />
                      <YAxis stroke="var(--text-subtle)" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                      <Line type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="card p-5">
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">Recent Orders</h3>
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
                          <td className="px-3 py-2.5 font-mono text-primary-500 font-semibold">#{o.order_number}</td>
                          <td className="px-3 py-2.5 text-[var(--text-muted)]">{o.user_email}</td>
                          <td className="px-3 py-2.5 font-semibold text-[var(--text-primary)]">₹{parseFloat(o.total_price).toLocaleString('en-IN')}</td>
                          <td className="px-3 py-2.5"><span className={`status-${o.order_status}`}>{o.order_status}</span></td>
                          <td className="px-3 py-2.5"><span className={`status-${o.payment_status}`}>{o.payment_status}</span></td>
                          <td className="px-3 py-2.5 text-[var(--text-subtle)]">{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
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
                  <h2 className="text-xl font-heading font-bold text-[var(--text-primary)]">Products</h2>
                  <span className="badge badge-gray">Total: {totalProducts}</span>
                </div>
                <Link to="/admin/products/new" className="btn-primary btn-sm"><Plus className="w-4 h-4" /> Add Product</Link>
              </div>
              <div className="card overflow-hidden relative">
                {productsLoading && (
                  <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] z-20 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
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
                            <div className="w-10 h-10 rounded-lg bg-[var(--bg-surface-hover)] border border-[var(--border-color)] overflow-hidden flex items-center justify-center p-1 flex-shrink-0 shadow-sm">
                              {p.primary_image?.image ? (
                                <img 
                                  src={p.primary_image.image.startsWith('http') ? p.primary_image.image : `${API_BASE}${p.primary_image.image}`} 
                                  alt="" 
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <Package className="w-5 h-5 text-[var(--text-subtle)]" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-medium text-[var(--text-primary)] max-w-[200px] truncate" title={p.name}>{p.name}</td>
                          <td className="px-4 py-3 text-[var(--text-muted)] font-semibold">
                            {p.discount_price ? (
                              <div className="flex flex-col leading-tight">
                                <span className="text-[var(--text-primary)]">₹{parseFloat(p.effective_price).toLocaleString('en-IN')}</span>
                                <span className="text-[10px] text-[var(--text-subtle)] line-through">₹{parseFloat(p.price).toLocaleString('en-IN')}</span>
                              </div>
                            ) : (
                              <span className="text-[var(--text-primary)]">₹{parseFloat(p.price).toLocaleString('en-IN')}</span>
                            )}
                          </td>
                          <td className="px-4 py-3"><span className={`font-mono px-2 py-0.5 rounded-md text-xs border ${p.stock === 0 ? 'badge-danger' : p.stock <= 10 ? 'badge-warning' : 'badge-success'}`}>{p.stock}</span></td>
                          <td className="px-4 py-3 text-[var(--text-muted)] truncate max-w-[120px]">{p.category_name}</td>
                          <td className="px-4 py-3">
                            <span className="badge badge-primary">
                              {p.seller_name}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => cycleProductApproval(p)} className="flex items-center justify-center hover:scale-110 transition-transform" title="Click to cycle approval status">
                              {p.approval_status === 'approved' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                              {p.approval_status === 'rejected' && <XCircle className="w-4 h-4 text-red-500" />}
                              {p.approval_status === 'pending'  && <Clock className="w-4 h-4 text-amber-500" />}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => handleToggleProductActive(p)} className="flex items-center justify-center hover:scale-110 transition-transform" title="Toggle active visibility">
                              {p.is_active ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-red-500" />}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => setViewProductModal(p.slug)} className="btn-ghost p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]" title="View Detail"><Eye className="w-4 h-4" /></button>
                              
                              {!p.seller && (
                                <>
                                  <Link to={`/admin/products/${p.slug}/edit`} className="btn-ghost p-1.5 rounded-lg text-[var(--text-muted)] hover:text-primary-500" title="Edit">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                  </Link>
                                  <button onClick={() => handleDeleteProduct(p.slug)} className="btn-ghost p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-500" title="Delete"><Trash2 className="w-4 h-4" /></button>
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

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between card px-5 py-3.5 mt-4">
                  <p className="text-xs text-[var(--text-muted)]">
                    Showing <span className="font-bold text-[var(--text-primary)]">{(currentPage - 1) * 12 + 1}</span> to <span className="font-bold text-[var(--text-primary)]">{Math.min(currentPage * 12, totalProducts)}</span> of <span className="font-bold text-[var(--text-primary)]">{totalProducts}</span> products
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="btn-secondary btn-sm disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
                    {[...Array(totalPages)].map((_, idx) => {
                      const pNum = idx + 1;
                      if (totalPages > 7 && Math.abs(pNum - currentPage) > 2 && pNum !== 1 && pNum !== totalPages) return null;
                      return (
                        <button key={pNum} onClick={() => setCurrentPage(pNum)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border ${currentPage === pNum ? 'bg-primary-600 border-primary-500 text-white' : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
                          {pNum}
                        </button>
                      );
                    })}
                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="btn-secondary btn-sm disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'categories' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-heading font-bold text-[var(--text-primary)]">Categories</h2>
                <button onClick={() => { setEditCategoryData(null); setCatModalMode('category'); setIsCatModalOpen(true); }} className="btn-primary btn-sm"><Plus className="w-4 h-4" /> Create Category</button>
              </div>
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="table-header">
                      {['Image', 'Name', 'Slug', 'Subcategories', 'Total Products', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {categories.filter(c => !c.parent).map(c => (
                        <tr key={c.id} className="table-row">
                          <td className="px-4 py-3">
                            <div className="w-10 h-10 rounded-lg bg-[var(--bg-surface-hover)] border border-[var(--border-color)] overflow-hidden flex items-center justify-center p-1">
                              {c.image ? (
                                <img src={c.image.startsWith('http') ? c.image : `${API_BASE}${c.image}`} alt="" className="w-full h-full object-contain" />
                              ) : (
                                <Package className="w-5 h-5 text-[var(--text-subtle)]" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{c.name}</td>
                          <td className="px-4 py-3 text-[var(--text-muted)]">{c.slug}</td>
                          <td className="px-4 py-3 text-[var(--text-muted)]">
                            {categories.filter(sc => sc.parent === c.id).length} items
                          </td>
                          <td className="px-4 py-3 text-[var(--text-primary)] font-bold">{c.product_count || 0}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => { setEditCategoryData(c); setCatModalMode('category'); setIsCatModalOpen(true); }} className="btn-ghost p-1.5 rounded-lg text-[var(--text-muted)] hover:text-primary-500" title="Edit">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </button>
                              <button onClick={() => handleDeleteCategory(c.slug)} className="btn-ghost p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-500" title="Delete"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
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
                <h2 className="text-xl font-heading font-bold text-[var(--text-primary)]">Subcategories</h2>
                <button onClick={() => { setEditCategoryData(null); setCatModalMode('subcategory'); setIsCatModalOpen(true); }} className="btn-primary btn-sm"><Plus className="w-4 h-4" /> Create Subcategory</button>
              </div>
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="table-header">
                      {['Image', 'Subcategory', 'Parent Category', 'Slug', 'Total Products', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {categories.filter(c => c.parent).map(c => {
                        const parent = categories.find(pc => pc.id === c.parent);
                        return (
                          <tr key={c.id} className="table-row">
                            <td className="px-4 py-3">
                              <div className="w-8 h-8 rounded-lg bg-[var(--bg-surface-hover)] border border-[var(--border-color)] overflow-hidden flex items-center justify-center p-1">
                                {c.image ? (
                                  <img src={c.image.startsWith('http') ? c.image : `${API_BASE}${c.image}`} alt="" className="w-full h-full object-contain" />
                                ) : (
                                  <Layers className="w-4 h-4 text-[var(--text-subtle)]" />
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{c.name}</td>
                            <td className="px-4 py-3">
                              <span className="badge badge-gray">
                                {parent ? parent.name : 'Main'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[var(--text-muted)]">{c.slug}</td>
                            <td className="px-4 py-3 text-[var(--text-primary)] font-bold">{c.product_count || 0}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <button onClick={() => { setEditCategoryData(c); setCatModalMode('subcategory'); setIsCatModalOpen(true); }} className="btn-ghost p-1.5 rounded-lg text-[var(--text-muted)] hover:text-primary-500" title="Edit">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
                                <button onClick={() => handleDeleteCategory(c.slug)} className="btn-ghost p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-500" title="Delete"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
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
              <h2 className="text-xl font-heading font-bold text-[var(--text-primary)]">All Orders</h2>
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
                          <td className="px-4 py-3 font-mono text-primary-500 text-xs font-semibold">#{o.order_number}</td>
                          <td className="px-4 py-3 text-[var(--text-muted)] max-w-[160px] truncate">{o.user_email}</td>
                          <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">₹{parseFloat(o.total_price).toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3"><span className={`status-${o.payment_status}`}>{o.payment_status}</span></td>
                          <td className="px-4 py-3">
                            <select value={o.order_status} onChange={(e) => handleOrderStatus(o.id, e.target.value)}
                              className="input text-xs py-1 px-2">
                              {['pending','confirmed','processing','shipped','out_for_delivery','delivered','cancelled'].map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 text-[var(--text-subtle)] text-xs">{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                          <td className="px-4 py-3">
                            <Link to={`/orders/${o.id}`} className="btn-ghost p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"><Eye className="w-4 h-4" /></Link>
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
              <h2 className="text-xl font-heading font-bold text-[var(--text-primary)]">All Users</h2>
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
                              <span className="font-medium text-[var(--text-primary)]">{u.full_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[var(--text-muted)]">{u.email}</td>
                          <td className="px-4 py-3 text-[var(--text-subtle)]">{u.phone || '—'}</td>
                          <td className="px-4 py-3"><span className={u.role === 'admin' ? 'badge-primary badge' : u.role === 'seller' ? 'badge-success badge' : 'badge-gray badge'}>{u.role}</span></td>
                          <td className="px-4 py-3 text-[var(--text-subtle)] text-xs">{new Date(u.date_joined).toLocaleDateString('en-IN')}</td>
                          <td className="px-4 py-3"><span className="badge-success badge">Active</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === 'sellers' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-heading font-bold text-[var(--text-primary)]">Seller Applications</h2>
                <div className="flex gap-2">
                  {['', 'pending', 'approved', 'rejected'].map(s => (
                    <button key={s || 'all'}
                      onClick={() => dispatch(fetchAdminStores(s))}
                      className="btn-secondary btn-sm text-xs font-semibold capitalize">
                      {s || 'All'} {s && `(${adminStores.filter(st => st.status === s).length})`}
                    </button>
                  ))}
                </div>
              </div>

              {adminStores.length === 0 ? (
                <div className="card p-12 text-center">
                  <Store className="w-12 h-12 text-[var(--text-subtle)] mx-auto mb-3" />
                  <p className="text-[var(--text-muted)]">No seller applications yet.</p>
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
                              <div className="font-medium text-[var(--text-primary)]">{s.store_name}</div>
                              {s.description && <div className="text-xs text-[var(--text-subtle)] truncate max-w-[160px]">{s.description}</div>}
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-[var(--text-muted)]">{s.owner_name}</div>
                              <div className="text-xs text-[var(--text-subtle)]">{s.owner_email}</div>
                            </td>
                            <td className="px-4 py-3 text-[var(--text-subtle)]">{s.phone || '—'}</td>
                            <td className="px-4 py-3 font-mono text-xs text-[var(--text-subtle)]">{s.gstin || '—'}</td>
                            <td className="px-4 py-3">
                              {s.status === 'pending'  && <span className="status-pending flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>}
                              {s.status === 'approved' && <span className="status-delivered flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Approved</span>}
                              {s.status === 'rejected' && <span className="status-cancelled flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</span>}
                            </td>
                            <td className="px-4 py-3 text-[var(--text-subtle)] text-xs">{new Date(s.created_at).toLocaleDateString('en-IN')}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {s.status !== 'approved' && (
                                  <button onClick={() => handleApprove(s.id)}
                                    className="px-2 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20 transition-colors">
                                    ✓ Approve
                                  </button>
                                )}
                                {s.status !== 'rejected' && (
                                  <button onClick={() => { setRejectModal(s.id); setRejectReason(''); }}
                                    className="px-2 py-1 rounded-lg text-xs font-semibold bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 transition-colors">
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
        
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg-surface)] border-t border-[var(--border-color)] flex z-40">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors ${tab === id ? 'text-primary-500 font-semibold' : 'text-[var(--text-muted)]'}`}>
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
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Reject Store</h3>
              <button onClick={() => setRejectModal(null)} className="btn-ghost p-1"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-4">Provide a reason for rejection (optional — will be shown to the seller):</p>
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

      {/* Create/Edit Category Modal */}
      <CreateCategoryModal
        isOpen={isCatModalOpen}
        onClose={() => { setIsCatModalOpen(false); setEditCategoryData(null); }}
        isSubcategory={catModalMode === 'subcategory'}
        parentCategories={categories}
        initialData={editCategoryData}
        onSuccess={(newCat) => {
          loadData();
          if (newCat.parent) setTab('subcategories'); else setTab('categories');
        }}
      />
    </div>
  );
}
