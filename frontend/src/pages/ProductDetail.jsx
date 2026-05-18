import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ShoppingCart, Heart, Star, Share2, ArrowLeft, Check, Loader2, Minus, Plus } from 'lucide-react';
import { fetchProductDetail } from '../redux/slices/productSlice';
import { addToCart } from '../redux/slices/cartSlice';
import api from '../services/api';
import toast from 'react-hot-toast';
import StarRating from '../components/StarRating';

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:8000';

export default function ProductDetail() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { currentProduct: product, detailLoading } = useSelector((s) => s.products);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    dispatch(fetchProductDetail(slug));
    window.scrollTo(0, 0);
  }, [slug]);

  if (detailLoading) return (
    <div className="min-h-screen pt-24 section">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="skeleton aspect-square rounded-xl" />
        <div className="space-y-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-8 rounded" />)}
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen pt-24 flex flex-col items-center justify-center text-center">
      <h2 className="text-2xl font-bold text-white mb-4">Product not found</h2>
      <Link to="/products" className="btn-primary">Browse Products</Link>
    </div>
  );

  const images = product.images?.length ? product.images : [];
  const currentImage = images[selectedImage];
  const imageUrl = currentImage?.image
    ? (currentImage.image.startsWith('http') ? currentImage.image : `${API_BASE}${currentImage.image}`)
    : null;

  const handleAddToCart = () => {
    if (!user) { navigate('/login'); return; }
    dispatch(addToCart({ product_id: product.id, quantity }));
    toast.success(`${quantity} item(s) added to cart!`);
  };

  const handleWishlist = async () => {
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
    } catch { toast.error('Could not update wishlist'); }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    setSubmittingReview(true);
    try {
      await api.post(`/products/${slug}/reviews/`, { rating: reviewRating, comment: reviewText });
      toast.success('Review submitted!');
      setReviewText('');
      dispatch(fetchProductDetail(slug));
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Could not submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen pt-20">
      <div className="section">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-dark-400 mb-6">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-white transition-colors">Products</Link>
          <span>/</span>
          <span className="text-dark-200">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Image Gallery */}
          <div>
            <div className="relative bg-dark-800 rounded-2xl overflow-hidden aspect-square mb-3">
              {imageUrl ? (
                <img src={imageUrl} alt={currentImage?.alt_text || product.name} className="w-full h-full object-contain p-4" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingCart className="w-24 h-24 text-dark-600" />
                </div>
              )}
              {product.discount_percentage > 0 && (
                <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                  -{product.discount_percentage}% OFF
                </span>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {images.map((img, i) => {
                  const url = img.image?.startsWith('http') ? img.image : `${API_BASE}${img.image}`;
                  return (
                    <button key={i} onClick={() => setSelectedImage(i)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${i === selectedImage ? 'border-primary-500' : 'border-dark-700 hover:border-dark-500'}`}>
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <p className="text-primary-400 text-sm font-medium uppercase tracking-wide mb-2">{product.category_name}</p>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-white mb-3">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-4">
              <StarRating rating={product.average_rating} size="lg" />
              <span className="text-white font-semibold">{product.average_rating}</span>
              <span className="text-dark-400 text-sm">({product.review_count} reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-white">₹{parseFloat(product.effective_price).toLocaleString('en-IN')}</span>
              {product.discount_price && (
                <>
                  <span className="text-lg text-dark-500 line-through">₹{parseFloat(product.price).toLocaleString('en-IN')}</span>
                  <span className="text-green-400 font-semibold text-sm">Save {product.discount_percentage}%</span>
                </>
              )}
            </div>

            <p className="text-dark-300 leading-relaxed mb-6">{product.description}</p>

            {/* Stock */}
            <div className="flex items-center gap-2 mb-6">
              <span className={`w-2 h-2 rounded-full ${product.in_stock ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className={`text-sm font-medium ${product.in_stock ? 'text-green-400' : 'text-red-400'}`}>
                {product.in_stock ? `In Stock (${product.stock} units)` : 'Out of Stock'}
              </span>
            </div>

            {/* Quantity */}
            {product.in_stock && (
              <div className="flex items-center gap-4 mb-6">
                <span className="text-sm text-dark-400">Quantity:</span>
                <div className="flex items-center bg-dark-700 border border-dark-600 rounded-lg overflow-hidden">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-3 py-2 text-dark-300 hover:text-white hover:bg-dark-600 transition-colors">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 text-white font-medium">{quantity}</span>
                  <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} className="px-3 py-2 text-dark-300 hover:text-white hover:bg-dark-600 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mb-6">
              <button onClick={handleAddToCart} disabled={!product.in_stock} className="btn-primary btn-lg flex-1 justify-center">
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </button>
              <button onClick={handleWishlist} className={`btn-icon w-12 h-12 rounded-xl border ${wishlisted ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'border-dark-600 text-dark-400 hover:text-red-400 hover:border-red-500/50'} transition-all`}>
                <Heart className="w-5 h-5" fill={wishlisted ? 'currentColor' : 'none'} />
              </button>
              <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }}
                className="btn-icon w-12 h-12 rounded-xl border border-dark-600 text-dark-400 hover:text-white transition-all">
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* Checkout shortcut */}
            {product.in_stock && (
              <button onClick={async () => { await handleAddToCart(); navigate('/checkout'); }}
                className="btn-secondary w-full justify-center">
                Buy Now
              </button>
            )}
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-16">
          <h2 className="text-xl font-heading font-bold text-white mb-6">Customer Reviews</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Reviews list */}
            <div className="lg:col-span-2 space-y-4">
              {product.reviews?.length === 0 && (
                <div className="card p-8 text-center">
                  <Star className="w-10 h-10 text-dark-600 mx-auto mb-3" />
                  <p className="text-dark-400">No reviews yet. Be the first to review!</p>
                </div>
              )}
              {product.reviews?.map((review) => (
                <div key={review.id} className="card p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-white">{review.user_name}</p>
                      <StarRating rating={review.rating} />
                    </div>
                    <span className="text-xs text-dark-500">{new Date(review.created_at).toLocaleDateString('en-IN')}</span>
                  </div>
                  {review.title && <p className="font-medium text-dark-200 mb-1">{review.title}</p>}
                  <p className="text-sm text-dark-300">{review.comment}</p>
                </div>
              ))}
            </div>

            {/* Add review form */}
            {user && (
              <div className="card p-6">
                <h3 className="font-semibold text-white mb-4">Write a Review</h3>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="label">Your Rating</label>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(n => (
                        <button key={n} type="button" onClick={() => setReviewRating(n)}>
                          <Star className={`w-6 h-6 ${n <= reviewRating ? 'text-amber-400 fill-current' : 'text-dark-600'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label">Comment</label>
                    <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={4}
                      className="input resize-none" placeholder="Share your experience..." required />
                  </div>
                  <button type="submit" disabled={submittingReview} className="btn-primary w-full justify-center">
                    {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Submit Review
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
