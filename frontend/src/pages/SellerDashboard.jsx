import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import {
  fetchSellerDashboard, fetchSellerProducts, fetchSellerOrders
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
  const [catModalMode, setCatModalMode] = useState('category'); // 'category' or 'subcategory'


  // Local state pagination
  const [localProducts, setLocalProducts] = useState([]);
  const [localProductsLoading, setLocalProductsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const loadCategories = async () => {
    try {
      const res = await api.get('/categories/');
      setCategories(res.data.results || res.data);
    } catch (e) {}
  };

  const fetchProducts = async (page) => {
    setLocalProductsLoading(true);
    try {
      const res = await api.get(`/seller/products/?page=${page}&page_size=12`);
      setLocalProducts(res.data.results || res.data);
      setTotalProducts(res.data.count || res.data.length);
      setTotalPages(Math.ceil((res.data.count || res.data.length) / 12));
    } catch (err) {
      toast.error('Failed to fetch products');
    }
    setLocalProductsLoading(false);
  };

  useEffect(() => {
    dispatch(fetchSellerDashboard());
    dispatch(fetchSellerOrders());
    loadCategories();
    // Seed products page 1
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
    { label: 'Total Products', value: dashboard.total_products,  icon: Package,     color: 'text-primary-400', bg: 'bg-primary-900/30 border-primary-700/50', sub: `${dashboard.active_products} active` },
    { label: 'Total Orders',   value: dashboard.total_orders,    icon: ShoppingBag, color: 'text-cyan-400',    bg: 'bg-cyan-900/30 border-cyan-700/50',       sub: `${dashboard.pending_orders} pending` },
    { label: 'Revenue (paid)', value: `₹${parseFloat(dashboard.total_revenue || 0).toLocaleString('en-IN')}`, icon: DollarSign, color: 'text-green-400', bg: 'bg-green-900/30 border-green-700/50', sub: 'paid orders only' },
    { label: 'Out of Stock',   value: dashboard.out_of_stock,    icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-900/30 border-amber-700/50',   sub: 'needs restocking' },
  ] : [];

  // Build simple chart data from orders
  const chartData = (() => {
    const months = {};
    (orders || []).forEach(o => {
      const m = new Date(o.created_at).toLocaleString('en', { month: 'short' });
      months[m] = (months[m] || 0) + 1;
    });
    return Object.entries(months).map(([month, count]) => ({ month, orders: count }));
  })();

  if (loading && !dashboard) return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
    </div>
  );

  return (
    <div className="h-screen bg-dark-900 flex overflow-hidden">
      <aside className="hidden lg:flex flex-col w-56 bg-dark-800 border-r border-dark-700 h-full pt-6 px-3 flex-shrink-0">
        <div className="mb-8 px-3 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Store className="w-4 h-4 text-primary-400" />
              <p className="text-xs text-dark-500 font-semibold uppercase tracking-wider">Seller Panel</p>
            </div>
            {dashboard?.store && (
              <p className="text-sm text-white font-medium truncate max-w-[140px]">{dashboard.store.store_name}</p>
            )}
          </div>
          <Link to="/" className="text-xs text-primary-400 hover:text-primary-300 pt-1">Exit</Link>
        </div>
        {/* Overview */}
        <button onClick={() => setTab('overview')}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-medium transition-all ${tab === 'overview' ? 'bg-primary-600 text-white shadow-glow' : 'text-dark-400 hover:text-white hover:bg-dark-700'}`}>
          <BarChart2 className="w-4 h-4" /> Overview
        </button>

        {/* Products Dropdown */}
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
                <Package className="w-3 h-3" /> Categories
              </button>
              <button onClick={() => setTab('subcategories')} 
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === 'subcategories' ? 'text-primary-400 bg-primary-900/20' : 'text-dark-400 hover:text-white hover:bg-dark-800'}`}>
                <Layers className="w-3 h-3" /> Subcategories
              </button>
            </div>
          )}
        </div>

        {/* Orders */}
        <button onClick={() => setTab('orders')}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-medium transition-all ${tab === 'orders' ? 'bg-primary-600 text-white shadow-glow' : 'text-dark-400 hover:text-white hover:bg-dark-700'}`}>
          <ShoppingBag className="w-4 h-4" /> Orders
        </button>
        <div className="mt-auto mb-6 px-3">
          <button onClick={() => { dispatch(fetchSellerDashboard()); fetchProducts(currentPage); dispatch(fetchSellerOrders()); }}
            className="flex items-center gap-2 text-xs text-dark-500 hover:text-dark-300">
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
                <h1 className="text-2xl font-heading font-bold text-white">Seller Dashboard</h1>
                <Link to="/seller/products/new" className="btn-primary btn-sm">
                  <Plus className="w-4 h-4" /> Add Product
                </Link>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {STAT_CARDS.map(({ label, value, icon: Icon, color, bg, sub }) => (
                  <div key={label} className={`card border p-5 ${bg}`}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-dark-400">{label}</p>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg}`}>
                        <Icon className={`w-5 h-5 ${color}`} />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <p className="text-xs text-dark-500 mt-1">{sub}</p>
                  </div>
                ))}
              </div>

              {/* Chart */}
              {chartData.length > 0 && (
                <div className="card p-5">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary-400" /> Orders by Month
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }} />
                      <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Recent orders */}
              {orders.length > 0 && (
                <div className="card p-5">
                  <h3 className="font-semibold text-white mb-4">Recent Orders</h3>
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
                            <td className="px-3 py-2.5 font-mono text-primary-400 text-xs">#{o.order_number}</td>
                            <td className="px-3 py-2.5 text-dark-300">{o.user_email}</td>
                            <td className="px-3 py-2.5 font-semibold text-white">₹{parseFloat(o.total_price).toLocaleString('en-IN')}</td>
                            <td className="px-3 py-2.5"><span className={`status-${o.order_status}`}>{o.order_status}</span></td>
                            <td className="px-3 py-2.5 text-dark-400">{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
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
                  <h2 className="text-xl font-heading font-bold text-white">My Products</h2>
                  <span className="bg-dark-800 text-dark-400 text-xs px-2 py-0.5 rounded-full border border-dark-700">Total: {totalProducts}</span>
                </div>
                <Link to="/seller/products/new" className="btn-primary btn-sm">
                  <Plus className="w-4 h-4" /> Add Product
                </Link>
              </div>
              
              {localProducts.length === 0 && !localProductsLoading ? (
                <div className="card p-12 text-center">
                  <Package className="w-12 h-12 text-dark-600 mx-auto mb-3" />
                  <p className="text-dark-400">No products yet.</p>
                  <Link to="/seller/products/new" className="btn-primary mt-4 inline-flex">
                    <Plus className="w-4 h-4" /> Add Your First Product
                  </Link>
                </div>
              ) : (
                <>
                  <div className="card overflow-hidden relative">
                    {localProductsLoading && (
                      <div className="absolute inset-0 bg-dark-900/40 backdrop-blur-[1px] z-20 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
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
                                  <div className="w-10 h-10 rounded-lg bg-dark-800 border border-dark-750 flex items-center justify-center overflow-hidden shrink-0 p-1 shadow-sm">
                                    {imageUrl ? (
                                      <img src={imageUrl} alt={p.name} className="w-full h-full object-contain transition-transform hover:scale-125" />
                                    ) : (
                                      <Package className="w-5 h-5 text-dark-500" />
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 font-medium text-white max-w-[200px] truncate" title={p.name}>{p.name}</td>
                                <td className="px-4 py-3 text-dark-300 font-semibold">₹{parseFloat(p.effective_price || p.price).toLocaleString('en-IN')}</td>
                                <td className="px-4 py-3">
                                  <span className={`font-mono px-2 py-0.5 rounded-md text-xs border ${p.stock === 0 ? 'text-danger border-red-950 bg-red-950/20' : p.stock <= 10 ? 'text-amber-400 border-amber-950 bg-amber-950/20' : 'text-green-400 border-green-950 bg-green-950/20'}`}>
                                    {p.stock}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-dark-400 truncate max-w-[140px]">{p.category_name}</td>
                                <td className="px-4 py-3">
                                  {p.approval_status === 'approved' && <CheckCircle className="w-4 h-4 text-green-400" title="Approved" />}
                                  {p.approval_status === 'rejected' && <XCircle className="w-4 h-4 text-red-400" title="Rejected" />}
                                  {p.approval_status === 'pending'  && <Clock className="w-4 h-4 text-amber-400" title="Pending Approval" />}
                                </td>
                                <td className="px-4 py-3">
                                  {p.is_active ? <CheckCircle className="w-4 h-4 text-green-400" title="Active" /> : <X className="w-4 h-4 text-red-400" title="Inactive" />}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1.5">
                                    <button onClick={() => setViewProductModal(p.slug)} className="btn-ghost p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700" title="View Product">
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <Link to={`/seller/products/${p.id}/edit`} className="btn-ghost p-1.5 rounded-lg text-dark-400 hover:text-primary-400 hover:bg-dark-700" title="Edit Product">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    </Link>
                                    <button onClick={() => handleDeleteProduct(p.id)} className="btn-ghost p-1.5 rounded-lg text-dark-400 hover:text-danger hover:bg-dark-700" title="Delete Product">
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
                              className="relative inline-flex items-center rounded-lg px-2.5 py-2 text-dark-400 border border-dark-700 bg-dark-800 hover:bg-dark-700 hover:text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
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
                              className="relative inline-flex items-center rounded-lg px-2.5 py-2 text-dark-400 border border-dark-700 bg-dark-800 hover:bg-dark-700 hover:text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </nav>
                        </div>
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
                <h2 className="text-xl font-heading font-bold text-white">Categories</h2>
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
                            <div className="w-10 h-10 rounded-lg bg-dark-800 border border-dark-750 overflow-hidden flex items-center justify-center p-1">
                              {c.image ? (
                                <img src={c.image.startsWith('http') ? c.image : `${API_BASE}${c.image}`} alt="" className="w-full h-full object-contain" />
                              ) : (
                                <Package className="w-5 h-5 text-dark-600" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                          <td className="px-4 py-3 text-dark-400">{c.product_count || 0}</td>
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
                              <div className="w-8 h-8 rounded-lg bg-dark-800 border border-dark-750 overflow-hidden flex items-center justify-center p-1">
                                {c.image ? (
                                  <img src={c.image.startsWith('http') ? c.image : `${API_BASE}${c.image}`} alt="" className="w-full h-full object-contain" />
                                ) : (
                                  <Layers className="w-4 h-4 text-dark-600" />
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                            <td className="px-4 py-3 text-primary-300">
                               {parent ? parent.name : '-'}
                            </td>
                            <td className="px-4 py-3 text-dark-400">{c.product_count || 0}</td>
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
              <h2 className="text-xl font-heading font-bold text-white">My Orders</h2>
              {orders.length === 0 ? (
                <div className="card p-12 text-center">
                  <ShoppingBag className="w-12 h-12 text-dark-600 mx-auto mb-3" />
                  <p className="text-dark-400">No orders yet. Share your products to get your first sale!</p>
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
                            <td className="px-4 py-3 font-mono text-primary-400 text-xs">#{o.order_number}</td>
                            <td className="px-4 py-3 text-dark-300 max-w-[160px] truncate">{o.user_email}</td>
                            <td className="px-4 py-3 font-semibold text-white">₹{parseFloat(o.total_price).toLocaleString('en-IN')}</td>
                            <td className="px-4 py-3"><span className={`status-${o.payment_status}`}>{o.payment_status}</span></td>
                            <td className="px-4 py-3"><span className={`status-${o.order_status}`}>{o.order_status}</span></td>
                            <td className="px-4 py-3 text-dark-400 text-xs">{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
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
