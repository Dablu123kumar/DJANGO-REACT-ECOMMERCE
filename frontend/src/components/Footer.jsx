import { Link } from 'react-router-dom';
import { Package, Globe, MessageCircle, Camera, Video, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();
  const socialIcons = [Globe, MessageCircle, Camera, Video];

  return (
    <footer className="bg-dark-950 border-t border-dark-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading font-bold text-white text-lg">ShopElite</span>
            </Link>
            <p className="text-sm text-dark-400 leading-relaxed mb-4">
              Your premium destination for quality products. Fast delivery, secure payments, and exceptional customer service.
            </p>
            <div className="flex items-center gap-3">
              {socialIcons.map((Icon, i) => (
                <a key={i} href="#" className="w-8 h-8 bg-dark-800 hover:bg-primary-600 rounded-lg flex items-center justify-center text-dark-400 hover:text-white transition-all duration-200">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {[['/', 'Home'], ['/products', 'Products'], ['/orders', 'My Orders'], ['/wishlist', 'Wishlist'], ['/profile', 'Profile']].map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-dark-400 hover:text-white flex items-center gap-1.5 group transition-colors">
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-heading font-semibold text-white mb-4">Categories</h4>
            <ul className="space-y-2">
              {['Electronics', 'Fashion', 'Home & Living', 'Sports', 'Books', 'Beauty'].map((cat) => (
                <li key={cat}>
                  <Link to={`/products?category=${cat.toLowerCase()}`} className="text-sm text-dark-400 hover:text-white flex items-center gap-1.5 group transition-colors">
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-semibold text-white mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-dark-400">
                <MapPin className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
                <span>123 Commerce Street, Mumbai, Maharashtra 400001</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-dark-400">
                <Phone className="w-4 h-4 text-primary-400 flex-shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-dark-400">
                <Mail className="w-4 h-4 text-primary-400 flex-shrink-0" />
                <a href="mailto:support@shopelite.com" className="hover:text-white transition-colors">support@shopelite.com</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-dark-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-dark-500">© {year} ShopElite. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-dark-500">
            <a href="#" className="hover:text-dark-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-dark-300 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-dark-300 transition-colors">Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
