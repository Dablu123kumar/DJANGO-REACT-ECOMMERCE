import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ShoppingBag, Loader2, ArrowRight } from 'lucide-react';
import { fetchOrders } from '../redux/slices/orderSlice';

const statusColors = {
  pending: 'status-pending', confirmed: 'status-confirmed', processing: 'status-processing',
  shipped: 'status-shipped', out_for_delivery: 'status-shipped', delivered: 'status-delivered',
  cancelled: 'status-cancelled',
};

export default function Orders() {
  const dispatch = useDispatch();
  const { list: orders, loading } = useSelector((s) => s.orders);

  useEffect(() => {
    dispatch(fetchOrders());
  }, []);

  if (loading) return (
    <div className="min-h-screen pt-24 flex items-center justify-center bg-[var(--bg-page)]">
      <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-page)] transition-colors duration-300">
      <div className="section py-8">
        <h1 className="section-title mb-8 flex items-center gap-2">
          <ShoppingBag className="w-7 h-7 text-primary-500" /> My Orders
        </h1>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center card p-8">
            <ShoppingBag className="w-20 h-20 text-[var(--text-subtle)] mb-4" />
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">No orders yet</h2>
            <p className="text-[var(--text-muted)] mb-8">Start shopping and your orders will appear here</p>
            <Link to="/products" className="btn-primary btn-lg">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="card p-5 hover:border-primary-500/40 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono font-bold text-primary-500">#{order.order_number}</span>
                      <span className={statusColors[order.order_status] || 'badge-gray'}>{order.order_status}</span>
                      <span className={statusColors[order.payment_status] || 'badge-gray'}>{order.payment_status}</span>
                    </div>
                    <p className="text-sm text-[var(--text-muted)]">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">{order.items?.length || 0} item(s)</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-[var(--text-subtle)]">Total</p>
                      <p className="font-bold text-[var(--text-primary)] text-lg">₹{parseFloat(order.total_price).toLocaleString('en-IN')}</p>
                    </div>
                    <Link to={`/orders/${order.id}`} className="btn-outline btn-sm flex items-center gap-1">
                      View <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
