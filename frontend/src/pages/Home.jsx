import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFeaturedProducts, fetchCategories } from '../redux/slices/productSlice';
import ProductCard from '../components/ProductCard';
import { ArrowRight, ShieldCheck, Truck, RefreshCw, Headphones } from 'lucide-react';

const FEATURES = [
  { icon: Truck, title: 'Free Shipping', desc: 'On orders above ₹500' },
  { icon: ShieldCheck, title: 'Secure Payments', desc: 'Razorpay encrypted checkout' },
  { icon: RefreshCw, title: 'Easy Returns', desc: '7-day hassle-free returns' },
  { icon: Headphones, title: '24/7 Support', desc: 'Dedicated customer care' },
];

export default function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { featured, categories } = useSelector((s) => s.products);

  useEffect(() => {
    dispatch(fetchFeaturedProducts());
    dispatch(fetchCategories());
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-dark-900 via-primary-950/20 to-dark-900" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-600/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <span className="badge badge-primary mb-4 inline-block text-sm">🛍️ Premium Shopping Experience</span>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-heading font-bold text-white mb-6 leading-tight">
            Discover <span className="text-gradient">Premium</span><br />Products for You
          </h1>
          <p className="text-lg sm:text-xl text-dark-300 mb-8 max-w-2xl mx-auto">
            Shop the latest trends across electronics, fashion, home & more. Fast delivery, secure payments, and exceptional quality.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate('/products')} className="btn-primary btn-lg">
              Shop Now <ArrowRight className="w-5 h-5" />
            </button>
            <button onClick={() => navigate('/products?is_featured=true')} className="btn-secondary btn-lg">
              View Featured
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-dark-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="glass-card p-5 text-center hover:-translate-y-1 transition-transform duration-300">
                <div className="w-12 h-12 bg-primary-900/50 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-6 h-6 text-primary-400" />
                </div>
                <h3 className="font-semibold text-white text-sm mb-1">{title}</h3>
                <p className="text-xs text-dark-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="section">
          <div className="text-center mb-10">
            <h2 className="section-title">Shop by Category</h2>
            <p className="section-subtitle">Find exactly what you're looking for</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.slice(0, 6).map((cat) => (
              <Link key={cat.id} to={`/products?category=${cat.slug}`}
                className="glass-card p-4 text-center hover:-translate-y-1 hover:border-primary-600/50 transition-all duration-300 cursor-pointer group">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-cyan-500 rounded-xl mx-auto mb-3 group-hover:shadow-glow transition-all" />
                <p className="text-sm font-medium text-white">{cat.name}</p>
                <p className="text-xs text-dark-500 mt-1">{cat.product_count} items</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="section">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="section-title">Featured Products</h2>
              <p className="section-subtitle">Handpicked best sellers just for you</p>
            </div>
            <Link to="/products?is_featured=true" className="btn-outline btn-sm hidden sm:flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featured.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/products" className="btn-primary btn-lg">
              Explore All Products <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      )}

      {/* Promo Banner */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary-900/80 to-cyan-900/50 border border-primary-700/30 p-8 sm:p-12 text-center">
            <div className="absolute inset-0 bg-grid-pattern opacity-5" />
            <h2 className="text-2xl sm:text-4xl font-heading font-bold text-white mb-4">Get 20% Off Your First Order</h2>
            <p className="text-dark-300 mb-6">Use code <span className="font-mono font-bold text-primary-400 bg-primary-900/50 px-3 py-1 rounded-lg">WELCOME20</span> at checkout</p>
            <Link to="/products" className="btn-primary btn-lg">Shop Now</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
