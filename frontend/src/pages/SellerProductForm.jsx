import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { fetchSellerProducts } from '../redux/slices/sellerSlice';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Package, ArrowLeft, Save, Loader2, Image as ImageIcon, X, Trash2, Plus } from 'lucide-react';
import CreateCategoryModal from '../components/CreateCategoryModal';

export default function SellerProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  
  const [categories, setCategories] = useState([]);
  const [mainCat, setMainCat] = useState('');
  const [subCat, setSubCat] = useState('');
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  
  const [selectedImages, setSelectedImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [productId, setProductId] = useState(null);
  
  const [form, setForm] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    discount_price: '',
    stock: 0,
    tags: '',
    is_active: true,
  });

  const loadCategories = async () => {
    try {
      const res = await api.get('/categories/');
      const all = res.data.results || res.data;
      setCategories(all);
      return all;
    } catch {
      return [];
    }
  };

  useEffect(() => {
    const init = async () => {
      const allCats = await loadCategories();

      if (isEdit) {
        try {
          const res = await api.get(`/seller/products/${id}/`);
          const p = res.data;
          setProductId(p.id);
          setExistingImages(p.images || []);
          
          const catId = p.category?.id || p.category;
          const currentCat = allCats.find(c => c.id === catId);
          
          if (currentCat) {
            if (currentCat.parent) {
              setMainCat(currentCat.parent);
              setSubCat(currentCat.id);
            } else {
              setMainCat(currentCat.id);
            }
          }

          setForm({
            name: p.name || '',
            category: catId || '',
            description: p.description || '',
            price: p.price || '',
            discount_price: p.discount_price || '',
            stock: p.stock || 0,
            tags: p.tags || '',
            is_active: p.is_active ?? true,
          });
        } catch {
          toast.error('Failed to load product');
          navigate('/seller/dashboard');
        }
        setLoading(false);
      }
    };
    
    init();
  }, [id, isEdit, navigate]);

  // Update derived backend flat payload dynamically
  useEffect(() => {
    setField('category', subCat || mainCat);
  }, [mainCat, subCat]);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleImageSelect = (e) => {
    if (e.target.files) {
      setSelectedImages([...selectedImages, ...Array.from(e.target.files)]);
    }
  };

  const removeSelectedImage = (index) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const handleDeleteExistingImage = async (imageId) => {
    if (!confirm('Delete this image?')) return;
    try {
      await api.delete(`/products/${productId}/images/${imageId}/`);
      setExistingImages(existingImages.filter(img => img.id !== imageId));
      toast.success('Image deleted');
    } catch { toast.error('Failed to delete image'); }
  };

  const uploadImages = async (pId) => {
    if (selectedImages.length === 0) return;
    const promises = selectedImages.map((file, i) => {
      const formData = new FormData();
      formData.append('image', file);
      if (i === 0 && existingImages.length === 0) formData.append('is_primary', 'true');
      return api.post(`/products/${pId}/images/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    });
    try {
      await Promise.all(promises);
    } catch (err) {
      console.error('Image fail', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.category || !form.price) {
      toast.error('Please fill all required fields including Category.');
      return;
    }
    
    setSaving(true);
    try {
      let savedProductId = productId;
      const payload = {
        ...form,
        discount_price: form.discount_price === '' ? null : form.discount_price,
        price: form.price === '' ? 0 : form.price,
        stock: form.stock === '' ? 0 : form.stock,
      };

      if (isEdit) {
        await api.put(`/seller/products/${id}/`, payload);
      } else {
        const res = await api.post('/seller/products/', payload);
        savedProductId = res.data.id;
      }

      if (savedProductId && selectedImages.length > 0) {
        toast.loading('Processing images...', { id: 'upload' });
        await uploadImages(savedProductId);
        toast.dismiss('upload');
      }
      
      toast.success(isEdit ? 'Product updated completely!' : 'Product created completely!');
      dispatch(fetchSellerProducts());
      navigate('/seller/dashboard', { state: { activeTab: 'products' } });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save product');
    }
    setSaving(false);
  };

  const topCats = categories.filter(c => !c.parent);
  const currentSubs = categories.filter(c => c.parent === parseInt(mainCat));

  if (loading) return (
    <div className="min-h-screen pt-24 flex items-center justify-center bg-dark-900">
      <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen pt-24 pb-16 bg-dark-900 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/seller/dashboard" className="btn-ghost p-2 rounded-xl text-dark-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-heading font-bold text-white flex items-center gap-2">
              <Package className="w-6 h-6 text-primary-400" />
              {isEdit ? 'Edit Product' : 'Add New Product'}
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="label">Product Name *</label>
                <input className="input" placeholder="e.g. Product Title" required
                  value={form.name} onChange={e => setField('name', e.target.value)} />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label mb-0">Main Category *</label>
                  <button type="button" onClick={() => setIsCatModalOpen(true)} className="text-xs flex items-center gap-1 text-primary-400 hover:text-white transition-colors">
                    <Plus className="w-3 h-3" /> Create New
                  </button>
                </div>
                <select className="input" required value={mainCat} onChange={e => { setMainCat(e.target.value); setSubCat(''); }}>
                  <option value="">-- Select --</option>
                  {topCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Subcategory</label>
                <select className="input" value={subCat} onChange={e => setSubCat(e.target.value)} disabled={!mainCat || currentSubs.length === 0}>
                   <option value="">{currentSubs.length > 0 ? "Select Subcategory (Optional)" : "No subcategories available"}</option>
                   {currentSubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Stock Quantity *</label>
                <input className="input" type="number" min="0" required
                  value={form.stock} onChange={e => setField('stock', parseInt(e.target.value))} />
              </div>

              <div>
                <label className="label">Regular Price (₹) *</label>
                <input className="input" type="number" step="0.01" min="0" required
                  value={form.price} onChange={e => setField('price', e.target.value)} />
              </div>

              <div>
                <label className="label">Discount Price (₹)</label>
                <input className="input" type="number" step="0.01" min="0"
                  value={form.discount_price} onChange={e => setField('discount_price', e.target.value)} />
              </div>
            </div>

            <div>
              <label className="label">Description</label>
              <textarea className="input" rows={5} placeholder="Explain product specifics..."
                value={form.description} onChange={e => setField('description', e.target.value)} />
            </div>

            <div>
              <label className="label">Tags <span className="text-dark-500">(comma split)</span></label>
              <input className="input" placeholder="tag1, tag2"
                value={form.tags} onChange={e => setField('tags', e.target.value)} />
            </div>
            
            <div className="pt-4 border-t border-dark-700">
              <label className="label flex items-center gap-2 mb-4">
                <ImageIcon className="w-3 h-3" /> Product Images
              </label>
              
              {existingImages.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-dark-400 mb-2 uppercase tracking-wider font-semibold">Current</p>
                  <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
                    {existingImages.map(img => (
                      <div key={img.id} className="relative group rounded-xl overflow-hidden bg-dark-800 border border-dark-700 aspect-square">
                        <img src={img.image} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button type="button" title="Delete Existing Image" onClick={() => handleDeleteExistingImage(img.id)} className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-full">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mb-4">
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
                  {selectedImages.map((file, index) => (
                    <div key={index} className="relative rounded-xl overflow-hidden bg-dark-800 border aspect-square">
                      <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                      <button type="button" title="Remove Selected Image" onClick={() => removeSelectedImage(index)} className="absolute top-2 right-2 p-1 bg-black/60 rounded-full"><X className="w-3 h-3 text-white"/></button>
                    </div>
                  ))}
                  <label className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-dark-600 cursor-pointer">
                    <ImageIcon className="w-6 h-6 text-dark-400 mb-2" />
                    <span className="text-xs text-dark-400">Select</span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageSelect} />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-dark-800 rounded-xl border border-dark-700">
              <input type="checkbox" id="isActive" checked={form.is_active} onChange={e => setField('is_active', e.target.checked)} />
              <label htmlFor="isActive" className="text-sm text-white cursor-pointer">Active in store</label>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Link to="/seller/dashboard" className="btn-secondary">Cancel</Link>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Product
            </button>
          </div>
        </form>
      </div>
      
      <CreateCategoryModal 
        isOpen={isCatModalOpen} 
        onClose={() => setIsCatModalOpen(false)}
        isSubcategory={true}
        parentCategories={categories}
        onSuccess={(c) => {
          loadCategories();
          if (c.parent) {
            setMainCat(c.parent); setSubCat(c.id);
          } else {
            setMainCat(c.id); setSubCat('');
          }
        }}
      />
    </div>
  );
}
