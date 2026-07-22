import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, Lock, Eye, EyeOff, User, Phone, Loader2, Package } from 'lucide-react';
import { registerUser, clearError } from '../redux/slices/authSlice';
import toast from 'react-hot-toast';

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading } = useSelector((s) => s.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', password_confirm: '' });

  useEffect(() => {
    if (user) navigate('/');
    return () => dispatch(clearError());
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password_confirm) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    try {
      await dispatch(registerUser(form)).unwrap();
      toast.success('Account created! Welcome to ShopElite 🎉');
      navigate('/');
    } catch (err) {
      const errors = Object.values(err || {}).flat();
      toast.error(errors[0] || 'Registration failed. Please try again.');
    }
  };

  const fields = [
    { name: 'full_name', label: 'Full Name', type: 'text', icon: User, placeholder: 'John Doe' },
    { name: 'email', label: 'Email Address', type: 'email', icon: Mail, placeholder: 'you@example.com' },
    { name: 'phone', label: 'Phone (optional)', type: 'tel', icon: Phone, placeholder: '+91 9876543210' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-page)] flex items-center justify-center px-4 py-8 transition-colors duration-300">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>
      <div className="relative w-full max-w-md my-8">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-glow">
              <Package className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading font-bold text-[var(--text-primary)] text-2xl">ShopElite</span>
          </Link>
          <h1 className="text-2xl font-heading font-bold text-[var(--text-primary)] mt-6 mb-1">Create Account</h1>
          <p className="text-[var(--text-muted)] text-sm">Join thousands of happy shoppers</p>
        </div>

        <div className="glass-card p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ name, label, type, icon: Icon, placeholder }) => (
              <div key={name}>
                <label className="label">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-subtle)]" />
                  <input type={type} value={form[name]} onChange={(e) => setForm(p => ({ ...p, [name]: e.target.value }))}
                    className="input pl-10" placeholder={placeholder} required={name !== 'phone'} />
                </div>
              </div>
            ))}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-subtle)]" />
                <input type={showPassword ? 'text' : 'password'} value={form.password}
                  onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                  className="input pl-10 pr-10" placeholder="Min 8 characters" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] hover:text-[var(--text-primary)]">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-subtle)]" />
                <input type="password" value={form.password_confirm}
                  onChange={(e) => setForm(p => ({ ...p, password_confirm: e.target.value }))}
                  className="input pl-10" placeholder="Repeat password" required />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center btn-lg mt-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-sm text-[var(--text-muted)] mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-500 hover:text-primary-600 font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
