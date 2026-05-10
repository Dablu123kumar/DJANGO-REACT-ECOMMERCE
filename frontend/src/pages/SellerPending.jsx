import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchSellerStore } from '../redux/slices/sellerSlice';
import { Clock, XCircle, CheckCircle, Store, Mail, Phone, RefreshCw, ArrowRight } from 'lucide-react';

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: 'text-amber-400',
    bg:    'bg-amber-900/20 border-amber-700/40',
    title: 'Application Under Review',
    msg:   'Your store has been submitted and is currently being reviewed by our team. You will be notified once it is approved. This typically takes 24–48 hours.',
  },
  rejected: {
    icon: XCircle,
    color: 'text-red-400',
    bg:    'bg-red-900/20 border-red-700/40',
    title: 'Application Rejected',
    msg:   'Unfortunately, your store application was not approved at this time. Please review the reason below and contact support if you have questions.',
  },
  approved: {
    icon: CheckCircle,
    color: 'text-green-400',
    bg:    'bg-green-900/20 border-green-700/40',
    title: 'Store Approved!',
    msg:   'Congratulations! Your store has been approved. You can now access your seller dashboard to start listing products.',
  },
};

export default function SellerPending() {
  const dispatch = useDispatch();
  const { store, loading } = useSelector((s) => s.seller);

  useEffect(() => { dispatch(fetchSellerStore()); }, [dispatch]);

  if (loading || !store) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-primary-400 animate-spin mx-auto mb-3" />
          <p className="text-dark-400">Loading store status...</p>
        </div>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[store.status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">

        {/* Store icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-cyan-500 mb-4">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-white">{store.store_name}</h1>
          <p className="text-dark-400 text-sm mt-1">Seller Application Status</p>
        </div>

        {/* Status card */}
        <div className={`card p-6 border ${cfg.bg} mb-4`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
              <Icon className={`w-6 h-6 ${cfg.color}`} />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${cfg.color}`}>{cfg.title}</h2>
              <p className="text-dark-300 text-sm mt-1 leading-relaxed">{cfg.msg}</p>
            </div>
          </div>

          {store.status === 'rejected' && store.rejection_reason && (
            <div className="mt-4 p-3 rounded-xl bg-red-900/30 border border-red-700/40">
              <p className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-1">Rejection Reason</p>
              <p className="text-red-300 text-sm">{store.rejection_reason}</p>
            </div>
          )}
        </div>

        {/* Store details */}
        <div className="card p-5 mb-4">
          <h3 className="font-semibold text-white mb-3">Store Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-dark-300">
              <Store className="w-4 h-4 text-dark-500" />
              <span>{store.store_name}</span>
            </div>
            {store.owner_email && (
              <div className="flex items-center gap-2 text-dark-300">
                <Mail className="w-4 h-4 text-dark-500" />
                <span>{store.owner_email}</span>
              </div>
            )}
            {store.phone && (
              <div className="flex items-center gap-2 text-dark-300">
                <Phone className="w-4 h-4 text-dark-500" />
                <span>{store.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-dark-500">Applied:</span>
              <span className="text-dark-300">{new Date(store.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            {store.approved_at && (
              <div className="flex items-center gap-2">
                <span className="text-dark-500">Approved:</span>
                <span className="text-green-400">{new Date(store.approved_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {store.status === 'approved' && (
            <Link to="/seller/dashboard" className="btn-primary flex-1 justify-center">
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          {store.status === 'rejected' && (
            <Link to="/seller/register" className="btn-primary flex-1 justify-center">
              Re-apply
            </Link>
          )}
          <button onClick={() => dispatch(fetchSellerStore())} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <Link to="/" className="btn-outline">Back to Shop</Link>
        </div>

        {/* Support note */}
        <p className="text-center text-dark-500 text-xs mt-6">
          Questions? Email us at{' '}
          <a href="mailto:sellers@shopelite.com" className="text-primary-400 hover:underline">
            sellers@shopelite.com
          </a>
        </p>
      </div>
    </div>
  );
}
