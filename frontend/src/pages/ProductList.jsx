import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, Search, X, ChevronDown, Loader2 } from 'lucide-react';
import { fetchProducts, fetchCategories } from '../redux/slices/productSlice';
import ProductCard from '../components/ProductCard';
import { debounce } from 'lodash';

const SORT_OPTIONS = [
  { value: '-created_at', label: 'Newest First' },
  { value: 'price', label: 'Price: Low to High' },
  { value: '-price', label: 'Price: High to Low' },
  { value: '-average_rating', label: 'Top Rated' },
];

export default function ProductList() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { list: products, categories, count, loading } = useSelector((s) => s.products);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    min_price: '',
    max_price: '',
    in_stock: false,
    ordering: '-created_at',
  });

  useEffect(() => { dispatch(fetchCategories()); }, []);

  const loadProducts = useCallback(
    debounce((f, p) => {
      const params = { page: p, ordering: f.ordering };
      if (f.search) params.search = f.search;
      if (f.category) params.category = f.category;
      if (f.min_price) params.min_price = f.min_price;
      if (f.max_price) params.max_price = f.max_price;
      if (f.in_stock) params.in_stock = true;
      dispatch(fetchProducts(params));
    }, 400),
    []
  );

  useEffect(() => {
    loadProducts(filters, page);
  }, [filters, page]);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ search: '', category: '', min_price: '', max_price: '', in_stock: false, ordering: '-created_at' });
    setPage(1);
  };

  const totalPages = Math.ceil(count / 12);
  const hasActiveFilters = filters.search || filters.category || filters.min_price || filters.max_price || filters.in_stock;

  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-heading font-bold text-white">All Products</h1>
            <p className="text-sm text-dark-400 mt-1">{count} products found</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input value={filters.search} onChange={(e) => updateFilter('search', e.target.value)}
                placeholder="Search products..." className="input pl-9 w-full sm:w-56" />
            </div>
            {/* Sort */}
            <select value={filters.ordering} onChange={(e) => updateFilter('ordering', e.target.value)}
              className="input text-sm w-40 cursor-pointer">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {/* Mobile filter toggle */}
            <button onClick={() => setFiltersOpen(!filtersOpen)} className="btn-secondary btn-sm lg:hidden flex items-center gap-1">
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Filter Sidebar */}
          <aside className={`${filtersOpen ? 'block' : 'hidden'} lg:block w-full lg:w-60 flex-shrink-0`}>
            <div className="card p-5 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Filters</h3>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                    <X className="w-3 h-3" /> Clear all
                  </button>
                )}
              </div>

              {/* Category */}
              <div className="mb-5">
                <label className="label">Category</label>
                <select value={filters.category} onChange={(e) => updateFilter('category', e.target.value)} className="input text-sm">
                  <option value="">All Categories</option>
                  {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-5">
                <label className="label">Price Range (₹)</label>
                <div className="flex gap-2">
                  <input type="number" placeholder="Min" value={filters.min_price} onChange={(e) => updateFilter('min_price', e.target.value)} className="input text-sm" />
                  <input type="number" placeholder="Max" value={filters.max_price} onChange={(e) => updateFilter('max_price', e.target.value)} className="input text-sm" />
                </div>
              </div>

              {/* In Stock */}
              <div className="flex items-center gap-2">
                <input type="checkbox" id="in-stock" checked={filters.in_stock} onChange={(e) => updateFilter('in_stock', e.target.checked)}
                  className="w-4 h-4 rounded bg-dark-700 border-dark-600 text-primary-500 cursor-pointer" />
                <label htmlFor="in-stock" className="text-sm text-dark-300 cursor-pointer">In Stock Only</label>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-72 rounded-xl" />)}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Search className="w-16 h-16 text-dark-600 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No products found</h3>
                <p className="text-dark-400 mb-6">Try adjusting your filters or search query</p>
                <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {products.map(product => <ProductCard key={product.id} product={product} />)}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary btn-sm disabled:opacity-40">Prev</button>
                    {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                      const p = i + 1;
                      return (
                        <button key={p} onClick={() => setPage(p)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${p === page ? 'bg-primary-600 text-white' : 'bg-dark-800 text-dark-300 hover:bg-dark-700'}`}>
                          {p}
                        </button>
                      );
                    })}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary btn-sm disabled:opacity-40">Next</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
