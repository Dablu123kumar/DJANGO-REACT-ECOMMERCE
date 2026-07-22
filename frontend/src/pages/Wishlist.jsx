import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import api from '../services/api';
import { addToCart } from '../redux/slices/cartSlice';
import toast from 'react-hot-toast';
import ProductCard from '../components/ProductCard';

export default function Wishlist() {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchWishlist();
  }, [user]);

  const fetchWishlist = async () => {
    try {
      const res = await api.get('/wishlist/');
      setWishlist(res.data.products || []);
    } catch {
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId) => {
    try {
      await api.delete('/wishlist/', { data: { product_id: productId } });
      setWishlist((prev) => prev.filter((p) => p.id !== productId));
      toast('Removed from wishlist', { icon: '💔' });
    } catch {
      toast.error('Could not remove item');
    }
  };

  const handleAddToCart = async (product) => {
    try {
      await dispatch(addToCart({ product_id: product.id, quantity: 1 })).unwrap();
      toast.success('Added to cart!');
    } catch (err) {
      toast.error(err?.error || 'Could not add to cart');
    }
  };

  if (loading) return (
    <div className="min-h-screen pt-24 section bg-[var(--bg-page)]">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-72 rounded-xl" />)}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-page)] transition-colors duration-300">
      <div className="section py-8">
        <h1 className="section-title flex items-center gap-2 mb-8">
          <Heart className="w-7 h-7 text-red-500" fill="currentColor" /> My Wishlist
          {wishlist.length > 0 && <span className="badge badge-primary">{wishlist.length}</span>}
        </h1>

        {wishlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center card p-8">
            <Heart className="w-20 h-20 text-[var(--text-subtle)] mb-4" />
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Your wishlist is empty</h2>
            <p className="text-[var(--text-muted)] mb-8">Save your favourite items here</p>
            <Link to="/products" className="btn-primary btn-lg">Explore Products</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map((product) => (
              <div key={product.id} className="relative group">
                <ProductCard product={product} />
                <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    onClick={() => handleRemove(product.id)}
                    className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center hover:bg-primary-500 transition-colors shadow-lg"
                    title="Add to cart"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
