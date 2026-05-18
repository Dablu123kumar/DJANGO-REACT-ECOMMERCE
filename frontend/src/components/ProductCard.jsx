import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, ShoppingCart, Eye, Star } from 'lucide-react';
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
  const [addingToCart, setAddingToCart] = useState(false);

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
      <div className="relative overflow-hidden bg-dark-700 aspect-product">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.primary_image?.alt_text || product.name}
            className="product-card-img group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCart className="w-12 h-12 text-dark-500" />
          </div>
        )}

        {/* Discount badge */}
        {product.discount_percentage > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            -{product.discount_percentage}%
          </span>
        )}

        {/* Out of stock overlay */}
        {!product.in_stock && (
          <div className="absolute inset-0 bg-dark-900/70 flex items-center justify-center">
            <span className="badge badge-danger text-sm">Out of Stock</span>
          </div>
        )}

        {/* Hover overlays */}
        <div className="absolute inset-0 bg-dark-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
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
          <p className="text-[8px] sm:text-xs text-primary-400 font-medium mb-0.5 sm:mb-1 uppercase tracking-wide">{product.category_name}</p>
        )}
        <h3 className="font-medium text-dark-100 line-clamp-2 text-xs sm:text-sm leading-snug mb-1 sm:mb-2 group-hover:text-white transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-1 mb-1 sm:mb-2">
          <StarRating rating={product.average_rating} />
          {product.review_count > 0 && (
            <span className="text-[10px] sm:text-xs text-dark-400">({product.review_count})</span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-bold text-white text-xs sm:text-base">
              ₹{parseFloat(product.effective_price).toLocaleString('en-IN')}
            </span>
            {product.discount_price && (
              <span className="text-[10px] sm:text-xs text-dark-500 line-through">
                ₹{parseFloat(product.price).toLocaleString('en-IN')}
              </span>
            )}
          </div>
          {product.in_stock ? (
            <span className="text-[10px] sm:text-xs text-green-400">In Stock</span>
          ) : (
            <span className="text-[10px] sm:text-xs text-red-400">Out of Stock</span>
          )}
        </div>
      </div>
    </Link>
  );
}
