import { useEffect, useState } from 'react';
import { X, Loader2, Package } from 'lucide-react';
import api from '../services/api';
import StarRating from './StarRating';

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:8000';

export default function ProductDetailsModal({ slug, onClose }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/products/${slug}/`);
        setProduct(data);
      } catch (err) {
        console.error("Failed to load product", err);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
        <div className="card p-6 w-full max-w-2xl flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
        <div className="card p-6 w-full max-w-md relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X className="w-5 h-5" /></button>
          <div className="text-center py-8">
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Product Not Found</h3>
            <p className="text-[var(--text-muted)]">The product you are looking for does not exist.</p>
          </div>
        </div>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [];
  const currentImage = images[selectedImage];
  const imageUrl = currentImage?.image
    ? (currentImage.image.startsWith('http') ? currentImage.image : `${API_BASE}${currentImage.image}`)
    : null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="card p-0 w-full max-w-3xl relative animate-slide-up overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)] bg-[var(--bg-surface-hover)] shrink-0">
          <h2 className="text-lg font-bold text-[var(--text-primary)] font-heading">Product Details</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Left: Images */}
            <div>
              <div className="relative bg-[var(--bg-surface-hover)] rounded-xl overflow-hidden aspect-square mb-3 border border-[var(--border-color)]">
                {imageUrl ? (
                  <img src={imageUrl} alt={currentImage?.alt_text || product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-16 h-16 text-[var(--text-subtle)]" />
                  </div>
                )}
                {product.discount_percentage > 0 && (
                  <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">
                    -{product.discount_percentage}% OFF
                  </span>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
                  {images.map((img, i) => {
                    const url = img.image?.startsWith('http') ? img.image : `${API_BASE}${img.image}`;
                    return (
                      <button key={i} onClick={() => setSelectedImage(i)}
                        className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === selectedImage ? 'border-primary-500' : 'border-[var(--border-color)] hover:border-primary-400'}`}>
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Info */}
            <div className="space-y-4">
              <div>
                <p className="text-primary-500 text-xs font-medium uppercase tracking-wider mb-1">{product.category_name}</p>
                <h3 className="text-xl font-bold text-[var(--text-primary)] leading-tight">{product.name}</h3>
              </div>
              
              <div className="flex items-center gap-2">
                <StarRating rating={product.average_rating} size="sm" />
                <span className="text-[var(--text-primary)] text-sm font-medium">{product.average_rating}</span>
                <span className="text-[var(--text-muted)] text-xs">({product.review_count} reviews)</span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[var(--text-primary)]">₹{parseFloat(product.effective_price).toLocaleString('en-IN')}</span>
                {product.discount_price && (
                  <span className="text-sm text-[var(--text-subtle)] line-through">₹{parseFloat(product.price).toLocaleString('en-IN')}</span>
                )}
              </div>

              <div className="py-3 border-y border-[var(--border-color)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--text-muted)]">Status</span>
                  <span className={`text-sm font-semibold ${product.in_stock ? 'text-emerald-500' : 'text-red-500'}`}>
                    {product.in_stock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--text-muted)]">Stock Quantity</span>
                  <span className="text-sm text-[var(--text-primary)]">{product.stock} units</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--text-muted)]">Approval</span>
                  <span className="text-sm text-[var(--text-primary)] capitalize">{product.approval_status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-muted)]">Active</span>
                  <span className="text-sm text-[var(--text-primary)]">{product.is_active ? 'Yes' : 'No'}</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Description</h4>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed line-clamp-4">{product.description || 'No description available.'}</p>
              </div>

              {product.sizes && product.sizes.split(',').map(s => s.trim()).filter(Boolean).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Available Sizes</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {product.sizes.split(',').map(s => s.trim()).filter(Boolean).map(size => (
                      <span key={size} className="py-0.5 px-2.5 bg-[var(--bg-surface-hover)] border border-[var(--border-color)] rounded-lg text-xs font-semibold text-[var(--text-primary)]">
                        {size}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button onClick={onClose} className="btn-secondary flex-1 justify-center">Close Details</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
