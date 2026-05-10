import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  fetchSellerDashboard, fetchSellerProducts, fetchSellerOrders
} from '../redux/slices/sellerSlice';
import {
  Store, Package, ShoppingBag, DollarSign, AlertTriangle,
  Plus, Eye, Trash2, RefreshCw, Loader2, X, CheckCircle,
  BarChart2, TrendingUp
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function SellerDashboard() {
  const dispatch = useDispatch();
  const { dashboard, products, orders, loading } = useSelector((s) => s.seller);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    dispatch(fetchSellerDashboard());
    dispatch(fetchSellerProducts());
    dispatch(fetchSellerOrders());
  }, [dispatch]);

  const handleDeleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/seller/products/${id}/`);
      dispatch(fetchSellerProducts());
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
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-medium transition-all ${
              tab === id ? 'bg-primary-600 text-white shadow-glow' : 'text-dark-400 hover:text-white hover:bg-dark-700'
            }`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
        <div className="mt-auto mb-6 px-3">
          <button onClick={() => { dispatch(fetchSellerDashboard()); dispatch(fetchSellerProducts()); dispatch(fetchSellerOrders()); }}
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
                <h2 className="text-xl font-heading font-bold text-white">My Products</h2>
                <Link to="/seller/products/new" className="btn-primary btn-sm">
                  <Plus className="w-4 h-4" /> Add Product
                </Link>
              </div>
              {products.length === 0 ? (
                <div className="card p-12 text-center">
                  <Package className="w-12 h-12 text-dark-600 mx-auto mb-3" />
                  <p className="text-dark-400">No products yet.</p>
                  <Link to="/seller/products/new" className="btn-primary mt-4 inline-flex">
                    <Plus className="w-4 h-4" /> Add Your First Product
                  </Link>
                </div>
              ) : (
                <div className="card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="table-header">
                        {['Product', 'Price', 'Stock', 'Category', 'Active', 'Actions'].map(h => (
                          <th key={h} className="px-4 py-3 text-left">{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {products.map(p => (
                          <tr key={p.id} className="table-row">
                            <td className="px-4 py-3 font-medium text-white max-w-[200px] truncate">{p.name}</td>
                            <td className="px-4 py-3 text-dark-300">₹{parseFloat(p.effective_price || p.price).toLocaleString('en-IN')}</td>
                            <td className="px-4 py-3">
                              <span className={p.stock === 0 ? 'text-danger' : p.stock <= 10 ? 'text-amber-400' : 'text-green-400'}>
                                {p.stock}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-dark-400">{p.category_name}</td>
                            <td className="px-4 py-3">
                              {p.is_active ? <CheckCircle className="w-4 h-4 text-green-400" /> : <X className="w-4 h-4 text-red-400" />}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Link to={`/products/${p.slug}`} className="btn-ghost p-1.5 rounded-lg text-dark-400 hover:text-white" title="View Product">
                                  <Eye className="w-4 h-4" />
                                </Link>
                                <Link to={`/seller/products/${p.id}/edit`} className="btn-ghost p-1.5 rounded-lg text-dark-400 hover:text-primary-400" title="Edit Product">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </Link>
                                <button onClick={() => handleDeleteProduct(p.id)} className="btn-ghost p-1.5 rounded-lg text-dark-400 hover:text-danger" title="Delete Product">
                                  <Trash2 className="w-4 h-4" />
                                </button>
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
    </div>
  );
}
