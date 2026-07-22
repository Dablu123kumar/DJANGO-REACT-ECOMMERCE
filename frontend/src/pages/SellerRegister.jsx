import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { registerSeller } from '../redux/slices/sellerSlice';
import toast from 'react-hot-toast';
import {
  Store, Mail, Lock, User, Phone, MapPin, Globe,
  FileText, Building2, Eye, EyeOff, ArrowRight, CheckCircle
} from 'lucide-react';

export default function SellerRegister() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', password: '', password_confirm: '',
    store_name: '', description: '', store_phone: '', address: '', website: '', gstin: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const nextStep = (e) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.password || !form.password_confirm) {
      toast.error('Please fill all required fields'); return;
    }
    if (form.password !== form.password_confirm) {
      toast.error('Passwords do not match'); return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters'); return;
    }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.store_name) { toast.error('Store name is required'); return; }
    setLoading(true);
    const result = await dispatch(registerSeller(form));
    setLoading(false);
    if (registerSeller.fulfilled.match(result)) {
      toast.success('Application submitted! Please log in to check your status.');
      navigate('/login');
    } else {
      const errs = result.payload;
      const msg = typeof errs === 'object'
        ? Object.entries(errs).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join(' | ')
        : 'Registration failed';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)] flex items-center justify-center px-4 py-16 transition-colors duration-300">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-xl relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-cyan-500 mb-4 shadow-glow">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-[var(--text-primary)]">Become a Seller</h1>
          <p className="text-[var(--text-muted)] mt-2">Register your store and start selling on ShopElite</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8">
          {[1, 2].map((s) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step > s ? 'bg-emerald-500 text-white' :
                step === s ? 'bg-primary-600 text-white shadow-glow' :
                'bg-[var(--bg-surface-hover)] text-[var(--text-subtle)] border border-[var(--border-color)]'
              }`}>
                {step > s ? <CheckCircle className="w-4 h-4" /> : s}
              </div>
              <span className={`text-sm font-medium ${step >= s ? 'text-[var(--text-primary)]' : 'text-[var(--text-subtle)]'}`}>
                {s === 1 ? 'Account Info' : 'Store Details'}
              </span>
              {s < 2 && <div className={`flex-1 h-px ${step > s ? 'bg-primary-600' : 'bg-[var(--border-color)]'}`} />}
            </div>
          ))}
        </div>

        <div className="card p-8">
          {/* Step 1: Account Info */}
          {step === 1 && (
            <form onSubmit={nextStep} className="space-y-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Your Account</h2>

              <div>
                <label className="label">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-subtle)]" />
                  <input className="input pl-10" placeholder="John Doe" required
                    value={form.full_name} onChange={e => set('full_name', e.target.value)} />
                </div>
              </div>

              <div>
                <label className="label">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-subtle)]" />
                  <input className="input pl-10" type="email" placeholder="you@example.com" required
                    value={form.email} onChange={e => set('email', e.target.value)} />
                </div>
              </div>

              <div>
                <label className="label">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-subtle)]" />
                  <input className="input pl-10" placeholder="+91 98765 43210"
                    value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>
              </div>

              <div>
                <label className="label">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-subtle)]" />
                  <input className="input pl-10 pr-10" type={showPwd ? 'text' : 'password'}
                    placeholder="Min 8 characters" required minLength={8}
                    value={form.password} onChange={e => set('password', e.target.value)} />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] hover:text-[var(--text-primary)]">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="label">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-subtle)]" />
                  <input className="input pl-10" type="password" placeholder="Repeat password" required
                    value={form.password_confirm} onChange={e => set('password_confirm', e.target.value)} />
                </div>
              </div>

              <button type="submit" className="btn-primary w-full mt-2 justify-center">
                Continue to Store Details <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Step 2: Store Details */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Your Store</h2>

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
                      value={form.store_phone} onChange={e => set('store_phone', e.target.value)} />
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

              {/* Terms */}
              <div className="p-3 rounded-xl bg-[var(--bg-surface-hover)] border border-[var(--border-color)] text-xs text-[var(--text-muted)]">
                By submitting, you agree to ShopElite's Seller Terms of Service. Your store will be reviewed
                and activated within 24–48 hours.
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 justify-center">
                  Back
                </button>
                <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-[var(--text-muted)] mt-6 text-sm">
          Already a seller?{' '}
          <Link to="/login" className="text-primary-500 hover:text-primary-600 font-medium">Sign in</Link>
          {' '} · {' '}
          <Link to="/" className="text-[var(--text-subtle)] hover:text-[var(--text-primary)]">Back to shop</Link>
        </p>
      </div>
    </div>
  );
}
