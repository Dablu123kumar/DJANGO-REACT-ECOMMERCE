import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { applyToBecomeSeller } from '../redux/slices/sellerSlice';
import { fetchProfile } from '../redux/slices/authSlice';
import toast from 'react-hot-toast';
import {
  Store, Phone, MapPin, Globe,
  FileText, Building2, ArrowRight
} from 'lucide-react';

export default function ApplySeller() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    store_name: '', description: '', phone: '', address: '', website: '', gstin: '',
  });

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.role === 'seller') {
       navigate('/seller/pending');
    }
  }, [user, navigate]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.store_name) { toast.error('Store name is required'); return; }
    setLoading(true);
    const result = await dispatch(applyToBecomeSeller(form));
    
    if (applyToBecomeSeller.fulfilled.match(result)) {
      toast.success('Application submitted successfully!');
      await dispatch(fetchProfile()); 
      setLoading(false);
      navigate('/seller/pending');
    } else {
      setLoading(false);
      const errs = result.payload;
      const msg = typeof errs === 'object'
        ? Object.entries(errs).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join(' | ')
        : 'Application submission failed';
      toast.error(msg);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[var(--bg-page)] flex items-center justify-center px-4 py-16 pt-24 transition-colors duration-300">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-xl relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-cyan-500 mb-4 shadow-glow">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-[var(--text-primary)]">Convert to Seller Account</h1>
          <p className="text-[var(--text-muted)] mt-2">Tell us about your business to start selling on ShopElite</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-surface-hover)] border border-[var(--border-color)] mb-4 text-sm text-[var(--text-secondary)]">
               <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>
               You are applying using: <strong className="text-[var(--text-primary)]">{user.email}</strong>
            </div>

            <div>
              <label className="label">Store Name *</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-subtle)]" />
                <input className="input pl-10" placeholder="My Awesome Store" required
                  value={form.store_name} onChange={e => set('store_name', e.target.value)} />
              </div>
            </div>

            <div>
              <label className="label">Store Description</label>
              <textarea className="input" rows={3}
                placeholder="Tell customers what you sell..."
                value={form.description} onChange={e => set('description', e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Store Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-subtle)]" />
                  <input className="input pl-10" placeholder="+91 99999 00000"
                    value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Website</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-subtle)]" />
                  <input className="input pl-10" placeholder="https://mystore.com"
                    value={form.website} onChange={e => set('website', e.target.value)} />
                </div>
              </div>
            </div>

            <div>
              <label className="label">Business Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-[var(--text-subtle)]" />
                <textarea className="input pl-10" rows={2} placeholder="123 Street, City, State, PIN"
                  value={form.address} onChange={e => set('address', e.target.value)} />
              </div>
            </div>

            <div>
              <label className="label">GSTIN <span className="text-[var(--text-subtle)]">(optional)</span></label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-subtle)]" />
                <input className="input pl-10" placeholder="22AAAAA0000A1Z5" maxLength={20}
                  value={form.gstin} onChange={e => set('gstin', e.target.value.toUpperCase())} />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-surface-hover)] border border-[var(--border-color)] text-xs text-[var(--text-muted)]">
              By submitting, you agree to ShopElite's Seller Terms of Service. Your application will enter review
              and normally be processed within 24–48 hours.
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center font-semibold">
              {loading ? 'Submitting Your Application...' : 'Submit & Request Access'} <ArrowRight className="ml-2 w-4 h-4" />
            </button>
          </form>
        </div>

        <p className="text-center text-[var(--text-muted)] mt-6 text-sm">
          Changed your mind?{' '}
          <Link to="/profile" className="text-primary-500 hover:text-primary-600 font-medium">Back to Profile</Link>
        </p>
      </div>
    </div>
  );
}
