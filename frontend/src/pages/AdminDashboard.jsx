import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingBag, Users, Store,
  Plus, Trash2, Eye, RefreshCw, X, Loader2, AlertTriangle,
  CheckCircle, DollarSign, Clock, XCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { fetchAdminStores, approveStore, rejectStore } from '../redux/slices/sellerSlice';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const { user } = useSelector((s) => s.auth);
  const { adminStores } = useSelector((s) => s.seller);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState(null); // storeId
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return; }
    loadData();
    dispatch(fetchAdminStores());
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsP, statsO, prods, ords, usrs] = await Promise.all([
        api.get('/products/admin/stats/'),
        api.get('/orders/admin/stats/'),
        api.get('/products/?page_size=100'),
        api.get('/orders/?page_size=50'),
        api.get('/auth/users/'),
      ]);
      setStats({ products: statsP.data, orders: statsO.data });
      setProducts(prods.data.results || prods.data);
      setOrders(ords.data.results || ords.data);
      setUsers(usrs.data.results || usrs.data);
    } catch (err) {
      toast.error('Failed to load admin data');
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
      loadData();
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
    <div className="h-screen bg-dark-900 flex overflow-hidden">
      <aside className="hidden lg:flex flex-col w-56 bg-dark-800 border-r border-dark-700 h-full pt-6 px-3 flex-shrink-0">
        <div className="mb-8 px-3 flex items-center justify-between">
          <p className="text-xs text-dark-500 font-semibold uppercase tracking-wider">Admin Panel</p>
          <Link to="/" className="text-xs text-primary-400 hover:text-primary-300">Exit</Link>
        </div>
        {TABS.map(({ id, label, icon: Icon }) => (
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
                <h2 className="text-xl font-heading font-bold text-white">Products</h2>
                <Link to="/admin/products/new" className="btn-primary btn-sm"><Plus className="w-4 h-4" /> Add Product</Link>
              </div>
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
                          <td className="px-4 py-3"><span className={p.stock === 0 ? 'text-danger' : p.stock <= 10 ? 'text-amber-400' : 'text-green-400'}>{p.stock}</span></td>
                          <td className="px-4 py-3 text-dark-400">{p.category_name}</td>
                          <td className="px-4 py-3">{p.is_active ? <CheckCircle className="w-4 h-4 text-green-400" /> : <X className="w-4 h-4 text-red-400" />}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Link to={`/products/${p.slug}`} className="btn-ghost p-1.5 rounded-lg text-dark-400 hover:text-white" title="View Product"><Eye className="w-4 h-4" /></Link>
                              <Link to={`/admin/products/${p.slug}/edit`} className="btn-ghost p-1.5 rounded-lg text-dark-400 hover:text-primary-400" title="Edit Product">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </Link>
                              <button onClick={() => handleDeleteProduct(p.slug)} className="btn-ghost p-1.5 rounded-lg text-dark-400 hover:text-danger" title="Delete Product"><Trash2 className="w-4 h-4" /></button>
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
    </div>
  );
}

