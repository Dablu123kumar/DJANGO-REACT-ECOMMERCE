import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, ShoppingCart, Eye } from 'lucide-react';
import { addToCart } from '../redux/slices/cartSlice';
import api from '../services/api';
import toast from 'react-hot-toast';
import StarRating from './StarRating';

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:8000';

export default function ProductCard({ product }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [wishlisted, setWishlisted] = useState(false);

  const img = product.primary_image?.image;
  const imageUrl = img ? (img.startsWith('http') ? img : `${API_BASE}${img}`) : null;

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    dispatch(addToCart({ product_id: product.id, quantity: 1 }));
    toast.success('Added to cart!');
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    try {
      if (wishlisted) {
        await api.delete('/wishlist/', { data: { product_id: product.id } });
        setWishlisted(false);
        toast('Removed from wishlist', { icon: '💔' });
      } else {
        await api.post('/wishlist/', { product_id: product.id });
        setWishlisted(true);
        toast.success('Added to wishlist!');
      }
    } catch {
      toast.error('Could not update wishlist');
    }
  };

  return (
    <Link to={`/products/${product.slug}`} className="product-card block group">

      {/* Image */}
      <div className="relative overflow-hidden bg-[var(--bg-surface-hover)] aspect-product">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.primary_image?.alt_text || product.name}
            className="product-card-img group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCart className="w-12 h-12 text-[var(--text-subtle)]" />
          </div>
        )}

        {/* Discount badge */}
        {product.discount_percentage > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
            -{product.discount_percentage}%
          </span>
        )}

        {/* Out of stock overlay */}
        {!product.in_stock && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
            <span className="badge badge-danger text-sm">Out of Stock</span>
          </div>
        )}

        {/* Hover overlays */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
          <button
            onClick={handleWishlist}
            className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-200 ${wishlisted ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-red-500'}`}
          >
            <Heart className="w-4 h-4" fill={wishlisted ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={handleAddToCart}
            disabled={!product.in_stock}
            className="w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center hover:bg-primary-500 transition-all duration-200 disabled:opacity-50"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
          <div className="w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center">
            <Eye className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-2 sm:p-4">
        {product.category_name && (
          <p className="text-[8px] sm:text-xs text-primary-500 font-medium mb-0.5 sm:mb-1 uppercase tracking-wide">{product.category_name}</p>
        )}
        <h3 className="font-medium text-[var(--text-primary)] line-clamp-2 text-xs sm:text-sm leading-snug mb-1 sm:mb-2 group-hover:text-primary-500 transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-1 mb-1 sm:mb-2">
          <StarRating rating={product.average_rating} />
          {product.review_count > 0 && (
            <span className="text-[10px] sm:text-xs text-[var(--text-muted)]">({product.review_count})</span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-bold text-[var(--text-primary)] text-xs sm:text-base">
              ₹{parseFloat(product.effective_price).toLocaleString('en-IN')}
            </span>
            {product.discount_price && (
              <span className="text-[10px] sm:text-xs text-[var(--text-subtle)] line-through">
                ₹{parseFloat(product.price).toLocaleString('en-IN')}
              </span>
            )}
          </div>
          {product.in_stock ? (
            <span className="text-[10px] sm:text-xs text-emerald-500 font-medium">In Stock</span>
          ) : (
            <span className="text-[10px] sm:text-xs text-red-500 font-medium">Out of Stock</span>
          )}
        </div>
      </div>
    </Link>
  );
}
