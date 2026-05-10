import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Package, ArrowLeft, Save, Loader2, Image as ImageIcon, X, Trash2 } from 'lucide-react';

export default function AdminProductForm() {
  const { slug } = useParams();
  const isEdit = Boolean(slug);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  
  const [selectedImages, setSelectedImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [productId, setProductId] = useState(null); // needed for image deletion
  
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

  useEffect(() => {
    // Load categories
    api.get('/categories/').then(res => {
      setCategories(res.data.results || res.data);
      if (!isEdit && (res.data.results || res.data).length > 0) {
        setForm(f => ({ ...f, category: (res.data.results || res.data)[0].id }));
      }
    });

    if (isEdit) {
      api.get(`/products/${slug}/`)
        .then(res => {
          const p = res.data;
          setProductId(p.id);
          setExistingImages(p.images || []);
          setForm({
            name: p.name || '',
            category: p.category?.id || p.category || (categories.length > 0 ? categories[0].id : ''),
            description: p.description || '',
            price: p.price || '',
            discount_price: p.discount_price || '',
            stock: p.stock || 0,
            tags: p.tags || '',
            is_active: p.is_active ?? true,
          });
          setLoading(false);
        })
        .catch(() => {
          toast.error('Failed to load product');
          navigate('/admin');
        });
    }
  }, [slug, isEdit, navigate]);

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
    
    // Upload each image sequentially
    for (let i = 0; i < selectedImages.length; i++) {
      const formData = new FormData();
      formData.append('image', selectedImages[i]);
      // Make first new image primary if no existing images
      if (i === 0 && existingImages.length === 0) {
        formData.append('is_primary', 'true');
      }
      
      try {
        await api.post(`/products/${pId}/images/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } catch (err) {
        console.error('Image upload failed', err);
        toast.error(`Failed to upload image ${i+1}`);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.category || !form.price) {
      toast.error('Please fill required fields');
      return;
    }
    
    setSaving(true);
    try {
      let savedProductId = productId;
      
      if (isEdit) {
        await api.put(`/products/${slug}/`, form);
        toast.success('Product updated!');
      } else {
        const res = await api.post('/products/', form);
        savedProductId = res.data.id;
        toast.success('Product created!');
      }
      
      if (savedProductId && selectedImages.length > 0) {
        toast.loading('Uploading images...', { id: 'img-upload' });
        await uploadImages(savedProductId);
        toast.success('Images uploaded!', { id: 'img-upload' });
      }
      
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save product');
      console.error(err.response?.data);
    }
    setSaving(false);
  };

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
            <Link to="/admin" className="btn-ghost p-2 rounded-xl text-dark-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-heading font-bold text-white flex items-center gap-2">
              <Package className="w-6 h-6 text-primary-400" />
              {isEdit ? 'Edit Product (Admin)' : 'Add New Product (Admin)'}
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="label">Product Name *</label>
                <input className="input" placeholder="e.g. Wireless Noise-Cancelling Headphones" required
                  value={form.name} onChange={e => setField('name', e.target.value)} />
              </div>
              
              <div>
                <label className="label">Category *</label>
                <select className="input" required value={form.category} onChange={e => setField('category', e.target.value)}>
                  <option value="">Select a category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
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
                <label className="label">Discount Price (₹) <span className="text-dark-500">(Optional)</span></label>
                <input className="input" type="number" step="0.01" min="0"
                  value={form.discount_price} onChange={e => setField('discount_price', e.target.value)} />
              </div>
            </div>

            <div>
              <label className="label">Description</label>
              <textarea className="input" rows={5} placeholder="Describe your product in detail..."
                value={form.description} onChange={e => setField('description', e.target.value)} />
            </div>

            <div>
              <label className="label">Tags <span className="text-dark-500">(comma separated)</span></label>
              <input className="input" placeholder="e.g. electronics, audio, headphones"
                value={form.tags} onChange={e => setField('tags', e.target.value)} />
            </div>
            
            {/* Images Section */}
            <div className="pt-4 border-t border-dark-700">
              <label className="label flex items-center gap-2 mb-4">
                <ImageIcon className="w-4 h-4" /> Product Images
              </label>
              
              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-dark-400 mb-2 uppercase tracking-wider font-semibold">Current Images</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {existingImages.map(img => (
                      <div key={img.id} className="relative group rounded-xl overflow-hidden bg-dark-800 border border-dark-700 aspect-square">
                        <img src={img.image} alt="Product" className="w-full h-full object-cover" />
                        {img.is_primary && (
                          <span className="absolute top-2 left-2 bg-primary-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
                            Primary
                          </span>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button type="button" onClick={() => handleDeleteExistingImage(img.id)} className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-full transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* New Images to Upload */}
              <div className="mb-4">
                {selectedImages.length > 0 && <p className="text-xs text-dark-400 mb-2 uppercase tracking-wider font-semibold">To be uploaded</p>}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {selectedImages.map((file, index) => (
                    <div key={index} className="relative rounded-xl overflow-hidden bg-dark-800 border border-primary-500/50 aspect-square">
                      <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeSelectedImage(index)} className="absolute top-2 right-2 p-1 bg-black/60 text-white hover:bg-red-500 rounded-full transition-colors z-10">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  
                  {/* Upload Button */}
                  <label className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-dark-600 hover:border-primary-500 hover:bg-primary-500/5 cursor-pointer transition-colors">
                    <ImageIcon className="w-6 h-6 text-dark-400 mb-2" />
                    <span className="text-xs text-dark-400 font-medium text-center px-2">Select Images</span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageSelect} />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-dark-800 rounded-xl border border-dark-700">
              <input type="checkbox" id="isActive" className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary-500 focus:ring-primary-500"
                checked={form.is_active} onChange={e => setField('is_active', e.target.checked)} />
              <label htmlFor="isActive" className="text-sm font-medium text-white cursor-pointer select-none">
                Product is active and visible in store
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Link to="/admin" className="btn-secondary">Cancel</Link>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isEdit ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
