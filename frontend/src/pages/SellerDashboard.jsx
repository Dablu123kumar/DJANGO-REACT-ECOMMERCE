import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import {
  fetchSellerDashboard, fetchSellerOrders
} from '../redux/slices/sellerSlice';
import {
  Store, Package, ShoppingBag, DollarSign, AlertTriangle,
  Plus, Eye, Trash2, RefreshCw, Loader2, X, CheckCircle, Clock, XCircle,
  BarChart2, TrendingUp, ChevronDown, ChevronLeft, ChevronRight, List, Layers
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../services/api';
import toast from 'react-hot-toast';
import ProductDetailsModal from '../components/ProductDetailsModal';
import CreateCategoryModal from '../components/CreateCategoryModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:8000';

export default function SellerDashboard() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { dashboard, orders, loading } = useSelector((s) => s.seller);
  const [tab, setTab] = useState(location.state?.activeTab || 'overview');
  const [viewProductModal, setViewProductModal] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catModalMode, setCatModalMode] = useState('category');

  const [localProducts, setLocalProducts] = useState([]);
  const [localProductsLoading, setLocalProductsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const loadCategories = async () => {
    try {
      const res = await api.get('/categories/');
      setCategories(res.data.results || res.data);
    } catch {}
  };

  const fetchProducts = async (page) => {
    setLocalProductsLoading(true);
    try {
      const res = await api.get(`/seller/products/?page=${page}&page_size=12`);
      setLocalProducts(res.data.results || res.data);
      setTotalProducts(res.data.count || res.data.length);
      setTotalPages(Math.ceil((res.data.count || res.data.length) / 12));
    } catch {
      toast.error('Failed to fetch products');
    }
    setLocalProductsLoading(false);
  };

  useEffect(() => {
    dispatch(fetchSellerDashboard());
    dispatch(fetchSellerOrders());
    loadCategories();
    fetchProducts(1);
    setCurrentPage(1);
  }, [dispatch]);

  useEffect(() => {
    if (tab === 'products') {
      fetchProducts(currentPage);
    }
  }, [currentPage, tab]);

  const handleDeleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/seller/products/${id}/`);
      fetchProducts(currentPage);
      toast.success('Product deleted');
    } catch { toast.error('Could not delete product'); }
  };

  const TABS = [
    { id: 'overview',  label: 'Overview',  icon: BarChart2 },
    { id: 'products',  label: 'Products',  icon: Package },
    { id: 'orders',    label: 'Orders',    icon: ShoppingBag },
  ];

  const STAT_CARDS = dashboard ? [
    { label: 'Total Products', value: dashboard.total_products,  icon: Package,     color: 'text-primary-500', sub: `${dashboard.active_products} active` },
    { label: 'Total Orders',   value: dashboard.total_orders,    icon: ShoppingBag, color: 'text-cyan-500',    sub: `${dashboard.pending_orders} pending` },
    { label: 'Revenue (paid)', value: `₹${parseFloat(dashboard.total_revenue || 0).toLocaleString('en-IN')}`, icon: DollarSign, color: 'text-emerald-500', sub: 'paid orders only' },
    { label: 'Out of Stock',   value: dashboard.out_of_stock,    icon: AlertTriangle, color: 'text-amber-500', sub: 'needs restocking' },
  ] : [];

  const chartData = (() => {
    const months = {};
    (orders || []).forEach(o => {
      const m = new Date(o.created_at).toLocaleString('en', { month: 'short' });
      months[m] = (months[m] || 0) + 1;
    });
    return Object.entries(months).map(([month, count]) => ({ month, orders: count }));
  })();

  if (loading && !dashboard) return (
    <div className="min-h-screen pt-24 flex items-center justify-center bg-[var(--bg-page)]">
      <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
    </div>
  );

  return (
    <div className="h-screen bg-[var(--bg-page)] flex overflow-hidden transition-colors duration-300">
      <aside className="hidden lg:flex flex-col w-56 bg-[var(--bg-surface)] border-r border-[var(--border-color)] h-full pt-6 px-3 flex-shrink-0">
        <div className="mb-8 px-3 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Store className="w-4 h-4 text-primary-500" />
              <p className="text-xs text-[var(--text-subtle)] font-semibold uppercase tracking-wider">Seller Panel</p>
            </div>
            {dashboard?.store && (
              <p className="text-sm text-[var(--text-primary)] font-medium truncate max-w-[140px]">{dashboard.store.store_name}</p>
            )}
          </div>
          <Link to="/" className="text-xs text-primary-500 hover:text-primary-600 font-medium pt-1">Exit</Link>
        </div>

        {/* Overview */}
        <button onClick={() => setTab('overview')}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-medium transition-all ${tab === 'overview' ? 'bg-primary-600 text-white shadow-glow font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'}`}>
          <BarChart2 className="w-4 h-4" /> Overview
        </button>

        {/* Products Dropdown */}
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
                <Package className="w-3 h-3" /> Categories
              </button>
              <button onClick={() => setTab('subcategories')} 
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === 'subcategories' ? 'text-primary-500 font-bold bg-primary-500/10' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'}`}>
                <Layers className="w-3 h-3" /> Subcategories
              </button>
            </div>
          )}
        </div>

        {/* Orders */}
        <button onClick={() => setTab('orders')}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-medium transition-all ${tab === 'orders' ? 'bg-primary-600 text-white shadow-glow font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'}`}>
          <ShoppingBag className="w-4 h-4" /> Orders
        </button>
        <div className="mt-auto mb-6 px-3">
          <button onClick={() => { dispatch(fetchSellerDashboard()); fetchProducts(currentPage); dispatch(fetchSellerOrders()); }}
            className="flex items-center gap-2 text-xs text-[var(--text-subtle)] hover:text-[var(--text-primary)]">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full relative min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto pb-24 lg:pb-8">

          {/* ── Overview ── */}
          {tab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-heading font-bold text-[var(--text-primary)]">Seller Dashboard</h1>
                <Link to="/seller/products/new" className="btn-primary btn-sm">
                  <Plus className="w-4 h-4" /> Add Product
                </Link>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {STAT_CARDS.map(({ label, value, icon: Icon, color, sub }) => (
                  <div key={label} className="card p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-[var(--text-muted)]">{label}</p>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--bg-surface-hover)] border border-[var(--border-color)]">
                        <Icon className={`w-5 h-5 ${color}`} />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
                    <p className="text-xs text-[var(--text-subtle)] mt-1">{sub}</p>
                  </div>
                ))}
              </div>

              {/* Chart */}
              {chartData.length > 0 && (
                <div className="card p-5">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary-500" /> Orders by Month
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                      <XAxis dataKey="month" stroke="var(--text-subtle)" fontSize={12} />
                      <YAxis stroke="var(--text-subtle)" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                      <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Recent orders */}
              {orders.length > 0 && (
                <div className="card p-5">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-4">Recent Orders</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="table-header">
                        {['Order#', 'Customer', 'Amount', 'Status', 'Date'].map(h => (
                          <th key={h} className="px-3 py-2 text-left">{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {orders.slice(0, 6).map(o => (
                          <tr key={o.id} className="table-row">
                            <td className="px-3 py-2.5 font-mono text-primary-500 text-xs font-semibold">#{o.order_number}</td>
                            <td className="px-3 py-2.5 text-[var(--text-muted)]">{o.user_email}</td>
                            <td className="px-3 py-2.5 font-semibold text-[var(--text-primary)]">₹{parseFloat(o.total_price).toLocaleString('en-IN')}</td>
                            <td className="px-3 py-2.5"><span className={`status-${o.order_status}`}>{o.order_status}</span></td>
                            <td className="px-3 py-2.5 text-[var(--text-subtle)]">{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Products ── */}
          {tab === 'products' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-heading font-bold text-[var(--text-primary)]">My Products</h2>
                  <span className="badge badge-gray">Total: {totalProducts}</span>
                </div>
                <Link to="/seller/products/new" className="btn-primary btn-sm">
                  <Plus className="w-4 h-4" /> Add Product
                </Link>
              </div>
              
              {localProducts.length === 0 && !localProductsLoading ? (
                <div className="card p-12 text-center">
                  <Package className="w-12 h-12 text-[var(--text-subtle)] mx-auto mb-3" />
                  <p className="text-[var(--text-muted)]">No products yet.</p>
                  <Link to="/seller/products/new" className="btn-primary mt-4 inline-flex">
                    <Plus className="w-4 h-4" /> Add Your First Product
                  </Link>
                </div>
              ) : (
                <>
                  <div className="card overflow-hidden relative">
                    {localProductsLoading && (
                      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] z-20 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                      </div>
                    )}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="table-header">
                          {['Image', 'Product', 'Price', 'Stock', 'Category', 'Status', 'Active', 'Actions'].map(h => (
                            <th key={h} className="px-4 py-3 text-left whitespace-nowrap">{h}</th>
                          ))}
                        </tr></thead>
                        <tbody>
                          {localProducts.map(p => {
                            const img = p.primary_image?.image;
                            const imageUrl = img ? (img.startsWith('http') ? img : `${API_BASE}${img}`) : null;
                            return (
                              <tr key={p.id} className="table-row">
                                <td className="px-4 py-3">
                                  <div className="w-10 h-10 rounded-lg bg-[var(--bg-surface-hover)] border border-[var(--border-color)] flex items-center justify-center overflow-hidden shrink-0 p-1 shadow-sm">
                                    {imageUrl ? (
                                      <img src={imageUrl} alt={p.name} className="w-full h-full object-contain" />
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
                                <td className="px-4 py-3">
                                  <span className={`font-mono px-2 py-0.5 rounded-md text-xs border ${p.stock === 0 ? 'badge-danger' : p.stock <= 10 ? 'badge-warning' : 'badge-success'}`}>
                                    {p.stock}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-[var(--text-muted)] truncate max-w-[140px]">{p.category_name}</td>
                                <td className="px-4 py-3">
                                  {p.approval_status === 'approved' && <CheckCircle className="w-4 h-4 text-emerald-500" title="Approved" />}
                                  {p.approval_status === 'rejected' && <XCircle className="w-4 h-4 text-red-500" title="Rejected" />}
                                  {p.approval_status === 'pending'  && <Clock className="w-4 h-4 text-amber-500" title="Pending Approval" />}
                                </td>
                                <td className="px-4 py-3">
                                  {p.is_active ? <CheckCircle className="w-4 h-4 text-emerald-500" title="Active" /> : <X className="w-4 h-4 text-red-500" title="Inactive" />}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1.5">
                                    <button onClick={() => setViewProductModal(p.slug)} className="btn-ghost p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]" title="View Product">
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <Link to={`/seller/products/${p.id}/edit`} className="btn-ghost p-1.5 rounded-lg text-[var(--text-muted)] hover:text-primary-500" title="Edit Product">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    </Link>
                                    <button onClick={() => handleDeleteProduct(p.id)} className="btn-ghost p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-500" title="Delete Product">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
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
                </>
              )}
            </div>
          )}

          {tab === 'categories' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-heading font-bold text-[var(--text-primary)]">Categories</h2>
                <button onClick={() => { setCatModalMode('category'); setIsCatModalOpen(true); }} className="btn-primary btn-sm"><Plus className="w-4 h-4" /> Create Category</button>
              </div>
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="table-header">
                      {['Image', 'Category Name', 'Total Products Count'].map(h => (
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
                          <td className="px-4 py-3 text-[var(--text-muted)]">{c.product_count || 0}</td>
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
                <button onClick={() => { setCatModalMode('subcategory'); setIsCatModalOpen(true); }} className="btn-primary btn-sm"><Plus className="w-4 h-4" /> Create Subcategory</button>
              </div>
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="table-header">
                      {['Image', 'Subcategory Name', 'Parent', 'Total Products'].map(h => (
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
                            <td className="px-4 py-3 text-primary-500 font-medium">
                               {parent ? parent.name : '-'}
                            </td>
                            <td className="px-4 py-3 text-[var(--text-muted)]">{c.product_count || 0}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Orders ── */}
          {tab === 'orders' && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-xl font-heading font-bold text-[var(--text-primary)]">My Orders</h2>
              {orders.length === 0 ? (
                <div className="card p-12 text-center">
                  <ShoppingBag className="w-12 h-12 text-[var(--text-subtle)] mx-auto mb-3" />
                  <p className="text-[var(--text-muted)]">No orders yet. Share your products to get your first sale!</p>
                </div>
              ) : (
                <div className="card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="table-header">
                        {['Order#', 'Customer', 'Amount', 'Payment', 'Status', 'Date'].map(h => (
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
                            <td className="px-4 py-3"><span className={`status-${o.order_status}`}>{o.order_status}</span></td>
                            <td className="px-4 py-3 text-[var(--text-subtle)] text-xs">{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
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
          loadCategories();
          if (newCat.parent) setTab('subcategories'); else setTab('categories');
        }}
      />
    </div>
  );
}
