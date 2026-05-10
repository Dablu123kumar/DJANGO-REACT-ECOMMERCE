import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { User, Package, Lock, Camera, Loader2, Save } from 'lucide-react';
import { fetchProfile, updateProfile } from '../redux/slices/authSlice';
import { fetchOrders } from '../redux/slices/orderSlice';
import api from '../services/api';
import toast from 'react-hot-toast';

const TABS = ['Profile', 'Security', 'Orders'];

export default function Profile() {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((s) => s.auth);
  const { list: orders } = useSelector((s) => s.orders);
  const [tab, setTab] = useState('Profile');
  const [profileForm, setProfileForm] = useState({ full_name: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '', new_password_confirm: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchProfile());
    dispatch(fetchOrders());
  }, []);

  useEffect(() => {
    if (user) setProfileForm({ full_name: user.full_name || '', phone: user.phone || '' });
  }, [user]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await dispatch(updateProfile(profileForm)).unwrap();
      toast.success('Profile updated!');
    } catch { toast.error('Could not update profile'); } finally { setSaving(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.new_password_confirm) { toast.error('Passwords do not match'); return; }
    setSaving(true);
    try {
      await api.post('/auth/change-password/', passwordForm);
      toast.success('Password changed successfully!');
      setPasswordForm({ old_password: '', new_password: '', new_password_confirm: '' });
    } catch (err) {
      const msg = Object.values(err.response?.data || {}).flat()[0] || 'Could not change password';
      toast.error(msg);
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen pt-20">
      <div className="section max-w-4xl mx-auto">
        {/* Header */}
        <div className="card p-6 mb-6 flex items-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-cyan-500 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-glow">
              {user?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
          <div>
            <h1 className="text-xl font-heading font-bold text-white">{user?.full_name}</h1>
            <p className="text-dark-400 text-sm">{user?.email}</p>
            <span className={user?.role === 'admin' ? 'badge badge-primary mt-1' : 'badge badge-gray mt-1'}>{user?.role}</span>
          </div>
          <div className="ml-auto hidden sm:flex gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-white">{orders.length}</p>
              <p className="text-xs text-dark-400">Orders</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{orders.filter(o => o.order_status === 'delivered').length}</p>
              <p className="text-xs text-dark-400">Delivered</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-dark-800 rounded-xl p-1 mb-6">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === t ? 'bg-primary-600 text-white shadow-glow' : 'text-dark-400 hover:text-white'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {tab === 'Profile' && (
          <div className="card p-6 animate-fade-in">
            <h2 className="font-heading font-semibold text-white mb-5 flex items-center gap-2"><User className="w-5 h-5 text-primary-400" /> Personal Information</h2>
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input value={profileForm.full_name} onChange={(e) => setProfileForm(p => ({ ...p, full_name: e.target.value }))} className="input" placeholder="John Doe" />
              </div>
              <div>
                <label className="label">Email (read-only)</label>
                <input value={user?.email || ''} className="input opacity-50 cursor-not-allowed" readOnly />
              </div>
              <div>
                <label className="label">Phone</label>
                <input value={profileForm.phone} onChange={(e) => setProfileForm(p => ({ ...p, phone: e.target.value }))} className="input" placeholder="+91 9876543210" />
              </div>
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
              </button>
            </form>
          </div>
        )}

        {/* Security Tab */}
        {tab === 'Security' && (
          <div className="card p-6 animate-fade-in">
            <h2 className="font-heading font-semibold text-white mb-5 flex items-center gap-2"><Lock className="w-5 h-5 text-primary-400" /> Change Password</h2>
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              {[['old_password','Current Password'],['new_password','New Password'],['new_password_confirm','Confirm New Password']].map(([key, label]) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <input type="password" value={passwordForm[key]} onChange={(e) => setPasswordForm(p => ({ ...p, [key]: e.target.value }))} className="input" placeholder="••••••••" required />
                </div>
              ))}
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} Update Password
              </button>
            </form>
          </div>
        )}

        {/* Orders Tab */}
        {tab === 'Orders' && (
          <div className="space-y-4 animate-fade-in">
            {orders.length === 0 ? (
              <div className="card p-8 text-center">
                <Package className="w-12 h-12 text-dark-600 mx-auto mb-3" />
                <p className="text-dark-400">No orders yet</p>
              </div>
            ) : orders.map(order => (
              <div key={order.id} className="card p-4 flex items-center justify-between hover:border-dark-600 transition-colors">
                <div>
                  <span className="font-mono font-bold text-primary-400 text-sm">#{order.order_number}</span>
                  <p className="text-xs text-dark-400 mt-0.5">{new Date(order.created_at).toLocaleDateString('en-IN')}</p>
                </div>
                <span className={`status-${order.order_status}`}>{order.order_status}</span>
                <span className="font-bold text-white">₹{parseFloat(order.total_price).toLocaleString('en-IN')}</span>
                <a href={`/orders/${order.id}`} className="btn-outline btn-sm">View</a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
