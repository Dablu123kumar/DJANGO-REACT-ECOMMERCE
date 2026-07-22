import { useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrderDetail, cancelOrder } from '../redux/slices/orderSlice';
import { Loader2, Package, MapPin, CreditCard, CheckCircle, Clock, X } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:8000';

export default function OrderDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const location = useLocation();
  const { currentOrder: order, detailLoading } = useSelector((s) => s.orders);

  useEffect(() => {
    dispatch(fetchOrderDetail(id));
    if (location.search.includes('success=true')) {
      toast.success('Order placed successfully! 🎉', { duration: 5000 });
    }
  }, [id]);

  const handleCancel = async () => {
    if (!confirm('Cancel this order?')) return;
    try {
      await dispatch(cancelOrder(id)).unwrap();
      toast.success('Order cancelled');
    } catch (err) {
      toast.error(err?.error || 'Could not cancel order');
    }
  };

  if (detailLoading) return (
    <div className="min-h-screen pt-24 flex items-center justify-center bg-[var(--bg-page)]">
      <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
    </div>
  );

  if (!order) return (
    <div className="min-h-screen pt-24 flex items-center justify-center bg-[var(--bg-page)]">
      <p className="text-[var(--text-muted)]">Order not found</p>
    </div>
  );

  const currentStep = STATUS_STEPS.indexOf(order.order_status);

  return (
    <div className="min-h-screen bg-[var(--bg-page)] transition-colors duration-300">
      <div className="section max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-[var(--text-primary)]">Order #{order.order_number}</h1>
            <p className="text-[var(--text-muted)] text-sm">{new Date(order.created_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {order.payment_method === 'cod' && (
              <span className="badge badge-warning flex items-center gap-1">
                <CreditCard className="w-3 h-3" /> COD
              </span>
            )}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <span className="text-[10px] text-[var(--text-subtle)] uppercase font-bold tracking-wider">Order Status:</span>
              <span className={`status-${order.order_status}`}>{order.order_status}</span>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <span className="text-[10px] text-[var(--text-subtle)] uppercase font-bold tracking-wider">Payment:</span>
              <span className={`status-${order.payment_status}`}>{order.payment_status}</span>
            </div>
          </div>
        </div>

        {/* Status Timeline (only if not cancelled) */}
        {order.order_status !== 'cancelled' && (
          <div className="card p-6 mb-6">
            <h2 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-primary-500" /> Order Timeline</h2>
            <div className="flex items-center gap-0">
              {STATUS_STEPS.map((step, i) => {
                const done = i <= currentStep;
                const current = i === currentStep;
                return (
                  <div key={step} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${done ? 'bg-primary-600 border-primary-500 text-white shadow-glow' : 'bg-[var(--bg-surface-hover)] border-[var(--border-color)]'} ${current ? 'scale-110' : ''}`}>
                        {done ? <CheckCircle className="w-4 h-4 text-white" /> : <div className="w-2 h-2 rounded-full bg-[var(--text-subtle)]" />}
                      </div>
                      <p className={`text-xs mt-1 capitalize text-center max-w-[60px] ${done ? 'text-primary-500 font-semibold' : 'text-[var(--text-subtle)]'}`}>
                        {step.replace('_', ' ')}
                      </p>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 -mt-4 ${i < currentStep ? 'bg-primary-600' : 'bg-[var(--border-color)]'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Shipping Address */}
          <div className="card p-5">
            <h2 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-primary-500" /> Shipping Address</h2>
            {order.shipping_address ? (
              <div className="text-sm text-[var(--text-muted)] space-y-0.5">
                <p className="font-medium text-[var(--text-primary)]">{order.shipping_address.full_name}</p>
                <p>{order.shipping_address.phone}</p>
                <p>{order.shipping_address.address_line1}</p>
                {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
                <p>{order.shipping_address.city}, {order.shipping_address.state} — {order.shipping_address.pincode}</p>
                <p>{order.shipping_address.country}</p>
              </div>
            ) : <p className="text-[var(--text-muted)] text-sm">No address on file</p>}
          </div>

          {/* Payment Summary */}
          <div className="card p-5">
            <h2 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary-500" /> Payment Summary</h2>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-[var(--text-muted)]"><span>Subtotal</span><span>₹{parseFloat(order.subtotal).toLocaleString('en-IN')}</span></div>
              {parseFloat(order.discount_amount) > 0 && (
                <div className="flex justify-between text-emerald-500 font-medium"><span>Discount</span><span>-₹{parseFloat(order.discount_amount).toLocaleString('en-IN')}</span></div>
              )}
              <div className="flex justify-between text-[var(--text-muted)]"><span>Shipping</span><span className={parseFloat(order.shipping_charge) === 0 ? 'text-emerald-500 font-medium' : ''}>{parseFloat(order.shipping_charge) === 0 ? 'FREE' : `₹${order.shipping_charge}`}</span></div>
              <div className="border-t border-[var(--border-color)] pt-2 flex justify-between font-bold text-[var(--text-primary)] text-base"><span>Total</span><span>₹{parseFloat(order.total_price).toLocaleString('en-IN')}</span></div>
            </div>
            {order.razorpay_payment_id && <p className="text-xs text-[var(--text-subtle)] mt-3">Payment ID: {order.razorpay_payment_id}</p>}
          </div>
        </div>

        {/* Order Items */}
        <div className="card p-5 mb-6">
          <h2 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2"><Package className="w-4 h-4 text-primary-500" /> Order Items</h2>
          <div className="space-y-3">
            {order.items?.map((item) => {
              const img = item.product_image ? (item.product_image.startsWith('http') ? item.product_image : `${API_BASE}${item.product_image}`) : null;
              return (
                <div key={item.id} className="flex items-center gap-4 py-2 border-b border-[var(--border-color)] last:border-0">
                  {img ? (
                    <img src={img} alt={item.product_name} className="w-14 h-14 object-cover rounded-lg flex-shrink-0 border border-[var(--border-color)]" />
                  ) : (
                    <div className="w-14 h-14 bg-[var(--bg-surface-hover)] rounded-lg flex-shrink-0 flex items-center justify-center border border-[var(--border-color)]">
                      <Package className="w-6 h-6 text-[var(--text-subtle)]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--text-primary)] text-sm">{item.product_name}</p>
                    <p className="text-xs text-[var(--text-muted)]">Qty: {item.quantity} × ₹{parseFloat(item.unit_price).toLocaleString('en-IN')}</p>
                  </div>
                  <p className="font-semibold text-[var(--text-primary)] text-sm">₹{parseFloat(item.total_price).toLocaleString('en-IN')}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link to="/orders" className="btn-secondary">← Back to Orders</Link>
          {!['delivered', 'cancelled'].includes(order.order_status) && (
            <button onClick={handleCancel} className="btn-danger flex items-center gap-2">
              <X className="w-4 h-4" /> Cancel Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
