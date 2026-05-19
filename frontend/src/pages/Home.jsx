import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFeaturedProducts, fetchCategories, fetchProducts } from '../redux/slices/productSlice';
import ProductCard from '../components/ProductCard';
import { ArrowRight, ShieldCheck, Truck, RefreshCw, Headphones, ChevronLeft, ChevronRight } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:8000';

const SLIDES = [
  {
    id: 1,
    badge: '🚀 FLAGSHIP SMARTPHONE',
    title: <>realme 7 Pro <span className="text-gradient">128 GB</span></>,
    description: 'Power meets elegance. Capture worlds with 64MP Super Quad Camera and recharge in minutes with 65W SuperDart technology.',
    cta: 'Explore Mobiles',
    link: '/products?search=mobile',
    image: '/banners/b_mobile.webp',
    bg: 'from-dark-900 via-blue-950/30 to-dark-950',
    glow1: 'bg-blue-600/20',
    glow2: 'bg-cyan-500/15'
  },
  {
    id: 2,
    badge: '❄️ PREMIUM REFRIGERATORS',
    title: <>Haier 258L <span className="text-emerald-400 font-bold">Convertible 3 Star</span></>,
    description: 'Elevate your kitchen with 5-in-1 Convertible Mode, twin energy-saving inverters, and elegant Xcel Glass finish.',
    cta: 'Shop Refrigerators',
    link: '/products?search=refrigerator',
    image: '/banners/b_refrigerator.webp',
    bg: 'from-dark-900 via-emerald-950/20 to-dark-950',
    glow1: 'bg-emerald-600/15',
    glow2: 'bg-teal-500/15'
  },
  {
    id: 3,
    badge: '⌚ SMART WEARABLES',
    title: <>boAt Cosmos Pro <span className="text-indigo-400">Fitness Tracker</span></>,
    description: 'Keep track of every beat. Bluetooth Calling, 1.78" AMOLED display, 700+ active modes, and premium high-end finish.',
    cta: 'Browse Wearables',
    link: '/products?search=watch',
    image: '/banners/b_watch.webp',
    bg: 'from-dark-900 via-indigo-950/30 to-dark-950',
    glow1: 'bg-indigo-600/20',
    glow2: 'bg-fuchsia-500/15'
  },
  {
    id: 4,
    badge: '📺 SMART TELEVISIONS',
    title: <>acer I Series <span className="text-purple-400">50-Inch 4K Ultra HD</span></>,
    description: 'Bring the cinema home. 30W Dolby Audio, Android 11, and MEMC engine for smooth motion and lifelike vivid display.',
    cta: 'View Smart TVs',
    link: '/products?search=tv',
    image: '/banners/b_tv.webp',
    bg: 'from-dark-900 via-purple-950/30 to-dark-950',
    glow1: 'bg-purple-600/20',
    glow2: 'bg-indigo-500/15'
  },
  {
    id: 5,
    badge: '🎧 WIRELESS AIRPODS',
    title: <>boAt Airdopes 111 <span className="text-orange-400 font-bold">TWS Earbuds</span></>,
    description: 'Immerse in heavy bass. 28-hour playback, ASAP Charge, IWP technology, and ENx environmental noise cancellation.',
    cta: 'Shop Airpods',
    link: '/products?search=airpods',
    image: '/banners/b_airpods.webp',
    bg: 'from-dark-900 via-orange-950/20 to-dark-950',
    glow1: 'bg-orange-600/15',
    glow2: 'bg-amber-500/15'
  },
  {
    id: 6,
    badge: '🔊 PURE SURROUND AUDIO',
    title: <>boAt BLITZ 2000 <span className="text-teal-400">Multimedia Speaker</span></>,
    description: 'Experience thunderous bass with a 100W peak output, dynamic RGB lighting, and multi-channel surround connectivity.',
    cta: 'Shop Speakers',
    link: '/products?search=speaker',
    image: '/banners/b_speaker.webp',
    bg: 'from-dark-900 via-teal-950/20 to-dark-950',
    glow1: 'bg-teal-600/15',
    glow2: 'bg-cyan-500/15'
  },
  {
    id: 7,
    badge: '💈 PRECISION GROOMING',
    title: <>Ambrane AGK-11 <span className="text-amber-500 font-bold">Smart Grooming Kit</span></>,
    description: 'Define your look. 60-min cordless runtime, 18 precision length settings, self-sharpening steel blades, and ergonomic grip.',
    cta: 'View Trimmers',
    link: '/products?search=trimmer',
    image: '/banners/b_trimmer.webp',
    bg: 'from-dark-900 via-amber-950/25 to-dark-950',
    glow1: 'bg-amber-600/20',
    glow2: 'bg-red-500/15'
  },
  {
    id: 8,
    badge: '⚡ PRO DESKTOP CPU',
    title: <>AMD Ryzen 7 <span className="text-rose-400">3800XT 8-Core</span></>,
    description: 'Power to create. 4.7 GHz Max Boost, 16 threads, and advanced 7nm architecture built for unstoppable, high-frame gaming.',
    cta: 'Browse Processors',
    link: '/products?search=processor',
    image: '/banners/b_processor.webp',
    bg: 'from-dark-900 via-rose-950/20 to-dark-950',
    glow1: 'bg-rose-600/15',
    glow2: 'bg-fuchsia-500/15'
  },
  {
    id: 9,
    badge: '🖱️ PRECISION MOUSE',
    title: <>ASUS Marshmallow <span className="text-blue-400">Silent Multi-Mode</span></>,
    description: 'Whisper-quiet productivity. Dual-mode Bluetooth/Wireless 2.4GHz, adjustable DPI, and lightweight solar cover finish.',
    cta: 'Shop Mouse',
    link: '/products?search=mouse',
    image: '/banners/b_mouse.webp',
    bg: 'from-dark-900 via-blue-950/25 to-dark-950',
    glow1: 'bg-blue-600/20',
    glow2: 'bg-cyan-500/15'
  },
  {
    id: 10,
    badge: '🎧 COMFORT EARPHONES',
    title: <>boAt Rockerz 103 Pro <span className="text-pink-500 font-bold">Neckband Earphones</span></>,
    description: 'Premium audio on the go. 20-hour nonstop playback, IPX4 sweat shield, magnetic locking earbuds, and high-fidelity bass.',
    cta: 'View Neckbands',
    link: '/products?search=earphone',
    image: '/banners/b_earphone.webp',
    bg: 'from-dark-900 via-pink-950/25 to-dark-950',
    glow1: 'bg-pink-600/20',
    glow2: 'bg-purple-500/15'
  }
];

export default function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { featured, categories, list } = useSelector((s) => s.products);

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    dispatch(fetchFeaturedProducts());
    dispatch(fetchCategories());
    dispatch(fetchProducts({ page_size: 8 })); // Fetch latest products for the home page
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % SLIDES.length);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Premium Hero Slider Banner */}
      <section className="relative min-h-[55vh] sm:min-h-[90vh] flex items-center overflow-hidden pt-4 sm:pt-16 bg-dark-950 border-b border-dark-800/50">
        {SLIDES.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out flex items-center justify-center
                ${isActive ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105 pointer-events-none'}`}
            >
              {/* Dynamic Gradient Background layer */}
              <div className={`absolute inset-0 bg-gradient-to-br ${slide.bg}`} />
              
              {/* Cinematic Ambient Glows */}
              <div className="absolute inset-0">
                <div className={`absolute top-1/4 left-10 w-80 h-80 ${slide.glow1} rounded-full blur-3xl animate-pulse`} />
                <div className={`absolute bottom-1/4 right-10 w-96 h-96 ${slide.glow2} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: '1.5s' }} />
              </div>

              {/* Layout Container - Two columns even on mobile as requested */}
              <div className="relative z-20 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-12 grid grid-cols-2 lg:grid-cols-12 gap-3 lg:gap-10 items-center pt-20 sm:pt-32 lg:pt-16">
                
                {/* LEFT COLUMN: Descriptive text */}
                <div className="col-span-1 lg:col-span-7 text-left order-1 lg:order-1">
                  <span className={`badge badge-primary mb-2 inline-block text-[8px] sm:text-xs transition-all duration-700 delay-300 transform
                    ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
                    {slide.badge}
                  </span>
                  
                  <h1 className={`text-sm sm:text-4xl lg:text-5xl xl:text-6xl font-heading font-bold text-white mb-2 leading-tight transition-all duration-700 delay-500 transform
                    ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                    {slide.title}
                  </h1>
                  
                  <p className={`text-[9px] sm:text-lg text-dark-300 mb-4 leading-snug transition-all duration-700 delay-700 transform
                    ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                    {slide.description.slice(0, 50)}...
                  </p>
                  
                  <div className={`flex flex-col sm:flex-row gap-2 justify-start transition-all duration-700 delay-900 transform
                    ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                    <button onClick={() => navigate(slide.link)} className="btn-primary w-fit py-1.5 px-4 text-[10px] sm:btn-lg group shadow-glow whitespace-nowrap">
                      {slide.cta}
                    </button>
                    <button onClick={() => navigate('/products')} className="btn-secondary w-fit py-1.5 px-4 text-[10px] sm:btn-lg whitespace-nowrap">
                      Browse
                    </button>
                  </div>
                </div>

                {/* RIGHT COLUMN: Floating visual product canvas */}
                <div className="col-span-1 lg:col-span-5 flex justify-center lg:justify-end items-center order-2 lg:order-2">
                  <div className={`relative w-32 h-32 sm:w-72 sm:h-72 lg:w-[440px] lg:h-[440px] rounded-xl lg:rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl bg-dark-900/70 transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1) delay-500 transform
                    ${isActive ? 'opacity-100 scale-100 translate-x-0 translate-y-0 rotate-0' : 'opacity-0 scale-90 lg:translate-x-12 translate-y-4 lg:rotate-6 pointer-events-none'}`}>
                    
                    <img 
                      src={slide.image} 
                      alt="" 
                      className="w-full h-full object-contain p-2 sm:p-12 transition-transform duration-[10000ms] ease-linear scale-100 hover:scale-110" 
                    />
                    
                    {/* Bottom Vignette overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-950/50 to-transparent pointer-events-none" />
                    
                    {/* Subtle inner neon ring glow reflection */}
                    <div className="absolute inset-0 border border-white/5 rounded-[2rem] pointer-events-none" />
                  </div>
                </div>

              </div>
            </div>
          );
        })}

        {/* Progress Navigation Indicators */}
        <div className="absolute bottom-5 left-0 right-0 z-30 flex justify-center gap-3">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-500 hover:bg-white/50 cursor-pointer
                ${idx === currentSlide ? 'w-8 bg-primary-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]' : 'bg-white/20'}`}
              title={`Slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Lateral Arrow Navigation hooks */}
        <button
          onClick={() => setCurrentSlide(prev => (prev - 1 + SLIDES.length) % SLIDES.length)}
          className="absolute left-6 top-1/2 -translate-y-1/2 z-30 hidden lg:flex w-12 h-12 items-center justify-center bg-dark-800/40 backdrop-blur-md border border-dark-700/50 text-white rounded-full hover:bg-primary-600 hover:border-primary-500 transition-all hover:scale-110 cursor-pointer active:scale-95"
          title="Previous Slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={() => setCurrentSlide(prev => (prev + 1) % SLIDES.length)}
          className="absolute right-6 top-1/2 -translate-y-1/2 z-30 hidden lg:flex w-12 h-12 items-center justify-center bg-dark-800/40 backdrop-blur-md border border-dark-700/50 text-white rounded-full hover:bg-primary-600 hover:border-primary-500 transition-all hover:scale-110 cursor-pointer active:scale-95"
          title="Next Slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </section>

      {/* Trust Badges / Features */}
      <section className="section py-8 sm:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {[
            { icon: Truck, title: 'Free Shipping', desc: 'On orders above ₹500' },
            { icon: ShieldCheck, title: 'Secure Payments', desc: 'Razorpay encrypted' },
            { icon: RefreshCw, title: 'Easy Returns', desc: '7-day hassle-free' },
            { icon: Headphones, title: '24/7 Support', desc: 'Dedicated care' },
          ].map((feature, i) => (
            <div key={i} className="flex flex-col items-center text-center p-3 sm:p-5 rounded-2xl bg-dark-900 border border-white/5 hover:border-primary/30 transition-all group max-w-[150px] sm:max-w-none mx-auto w-full">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
              </div>
              <h3 className="text-[10px] sm:text-lg font-bold text-white mb-1">{feature.title}</h3>
              <p className="text-[8px] sm:text-sm text-dark-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="section bg-dark-950 relative overflow-hidden">
          {/* Background ambient orbs */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-900/10 rounded-full blur-3xl pointer-events-none z-0" />

          <div className="relative z-10">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-lg sm:text-4xl font-bold text-white mb-2 sm:mb-4">Shop by Category</h2>
              <p className="text-[10px] sm:text-lg text-dark-400">High-performance technology tailored for you</p>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-5">
              {categories
                .filter(cat => !cat.parent && cat.slug !== 'electronics' && cat.product_count > 0)
                .sort((a, b) => (b.product_count || 0) - (a.product_count || 0))
                .slice(0, 12)
                .map((cat) => {
                  const catImgUrl = cat.image ? (cat.image.startsWith('http') ? cat.image : `${API_BASE}${cat.image}`) : null;
                  return (
                    <Link 
                      key={cat.id} 
                      to={`/products?category=${cat.slug}`}
                      className="glass-card p-2 sm:p-4 text-center hover:-translate-y-1.5 hover:border-primary-500/40 transition-all duration-300 cursor-pointer group flex flex-col items-center relative overflow-hidden max-w-[110px] sm:max-w-none mx-auto w-full"
                    >
                      {/* Dynamic category background glow */}
                      <div className="absolute inset-0 bg-gradient-to-b from-primary-600/0 to-primary-600/0 group-hover:from-primary-600/5 group-hover:to-cyan-500/5 transition-all duration-300 pointer-events-none" />

                      <div className="w-16 h-16 sm:w-16 sm:h-16 bg-dark-850 rounded-2xl flex items-center justify-center mb-2 sm:mb-3 border border-dark-750 shadow-inner group-hover:border-primary-500/30 group-hover:bg-dark-800 transition-all duration-300 overflow-hidden p-2 sm:p-3 relative">
                        {catImgUrl ? (
                          <img 
                            src={catImgUrl} 
                            alt={cat.name} 
                            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-115 group-hover:rotate-2 z-10"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary-500 to-cyan-500 rounded-xl z-10" />
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-white text-[10px] sm:text-base relative z-10">{cat.name}</h3>
                    </Link>
                  );
                })}
            </div>
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
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {featured.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Recent Arrivals */}
      {list.length > 0 && (
        <section className="section">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="section-title">Recent Arrivals</h2>
              <p className="section-subtitle">The latest high-end tech just landed in our store</p>
            </div>
            <Link to="/products" className="btn-outline btn-sm hidden sm:flex items-center gap-1">
              Browse All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {list.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/products" className="btn-primary btn-lg group">
              Explore All Products <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>
      )}

      {/* Promo Banner */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary-900/80 to-cyan-900/50 border border-primary-700/30 p-8 sm:p-12 text-center">
            <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-4xl font-heading font-bold text-white mb-4">Get 20% Off Your First Order</h2>
              <p className="text-dark-300 mb-6">Use code <span className="font-mono font-bold text-primary-400 bg-primary-900/50 px-3 py-1 rounded-lg">WELCOME20</span> at checkout</p>
              <Link to="/products" className="btn-primary btn-lg">Shop Now</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
