import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { fetchCart, updateCartItem, removeCartItem } from '../redux/slices/cartSlice';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:8000';

export default function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, subtotal, total_items, loading } = useSelector((s) => s.cart);
  const { user } = useSelector((s) => s.auth);

  useEffect(() => {
    if (user) dispatch(fetchCart());
    else navigate('/login');
  }, [user]);

  const handleUpdateQty = async (itemId, qty) => {
    try {
      await dispatch(updateCartItem({ item_id: itemId, quantity: qty })).unwrap();
    } catch (err) {
      toast.error(err?.error || 'Could not update quantity');
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await dispatch(removeCartItem(itemId)).unwrap();
      toast.success('Item removed');
    } catch {
      toast.error('Could not remove item');
    }
  };

  const shipping = subtotal >= 500 ? 0 : 49;
  const total = subtotal + shipping;

  if (loading) return (
    <div className="min-h-screen pt-24 max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="skeleton h-28 rounded-xl mb-4" />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-heading font-bold text-white mb-2 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-primary-400" /> Shopping Cart
          {total_items > 0 && <span className="badge badge-primary ml-1">{total_items} items</span>}
        </h1>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <ShoppingBag className="w-20 h-20 text-dark-600 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Your cart is empty</h2>
            <p className="text-dark-400 mb-8">Looks like you haven't added anything yet</p>
            <Link to="/products" className="btn-primary btn-lg">Start Shopping</Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 mt-6">
            {/* Cart Items */}
            <div className="flex-1 space-y-4">
              {items.map((item) => {
                const img = item.product?.primary_image?.image;
                const imgUrl = img ? (img.startsWith('http') ? img : `${API_BASE}${img}`) : null;
                return (
                  <div key={item.id} className="card p-4 flex gap-4 group animate-fade-in">
                    {/* Image */}
                    <Link to={`/products/${item.product?.slug}`} className="flex-shrink-0">
                      {imgUrl ? (
                        <img src={imgUrl} alt={item.product?.name} className="w-24 h-24 object-cover rounded-xl" />
                      ) : (
                        <div className="w-24 h-24 bg-dark-700 rounded-xl flex items-center justify-center">
                          <ShoppingCart className="w-8 h-8 text-dark-500" />
                        </div>
                      )}
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link to={`/products/${item.product?.slug}`}>
                        <h3 className="font-semibold text-white hover:text-primary-400 transition-colors line-clamp-2">{item.product?.name}</h3>
                      </Link>
                      <p className="text-sm text-dark-400 mt-0.5">{item.product?.category_name}</p>
                      <p className="text-lg font-bold text-white mt-2">₹{parseFloat(item.unit_price).toLocaleString('en-IN')}</p>
                    </div>

                    {/* Quantity & Remove */}
                    <div className="flex flex-col items-end justify-between flex-shrink-0">
                      <button onClick={() => handleRemove(item.id)} className="text-dark-500 hover:text-danger transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="flex items-center bg-dark-700 border border-dark-600 rounded-lg overflow-hidden">
                        <button onClick={() => item.quantity > 1 ? handleUpdateQty(item.id, item.quantity - 1) : handleRemove(item.id)}
                          className="px-2.5 py-1.5 text-dark-300 hover:text-white hover:bg-dark-600 transition-colors">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 py-1.5 text-sm font-medium text-white">{item.quantity}</span>
                        <button onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                          className="px-2.5 py-1.5 text-dark-300 hover:text-white hover:bg-dark-600 transition-colors">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-sm font-semibold text-primary-400">₹{parseFloat(item.total_price).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="lg:w-80 flex-shrink-0">
              <div className="card p-6 sticky top-24 space-y-4">
                <h2 className="font-heading font-bold text-white text-lg">Order Summary</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-dark-300">
                    <span>Subtotal ({total_items} items)</span>
                    <span>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-dark-300">
                    <span>Shipping</span>
                    <span className={shipping === 0 ? 'text-green-400' : ''}>
                      {shipping === 0 ? 'FREE' : `₹${shipping}`}
                    </span>
                  </div>
                  {subtotal < 500 && (
                    <p className="text-xs text-amber-400">Add ₹{500 - subtotal} more for free shipping!</p>
                  )}
                  <div className="border-t border-dark-700 pt-2 flex justify-between font-bold text-white text-base">
                    <span>Total</span>
                    <span>₹{total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <Link to="/checkout" className="btn-primary w-full justify-center btn-lg">
                  Proceed to Checkout <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/products" className="btn-secondary w-full justify-center btn-sm text-center block">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
