import { useState } from 'react';
import { X, Loader2, PlusCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function CreateCategoryModal({ isOpen, onClose, onSuccess, isSubcategory = false, parentCategories = [] }) {

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    image: null,
    parent: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Please enter a name.");
      return;
    }
    if (isSubcategory && !form.parent) {
      toast.error("Please select a parent category.");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      if (form.image) {
        formData.append('image', form.image);
      }
      if (isSubcategory && form.parent) {
        formData.append('parent', form.parent);
      }

      const res = await api.post('/categories/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(`${isSubcategory ? 'Subcategory' : 'Category'} created successfully!`);
      
      setForm({ name: '', image: null, parent: '' });
      if (onSuccess) onSuccess(res.data);
      onClose();
    } catch (err) {
      const errMsg = err.response?.data?.name || err.response?.data?.detail || `Failed to create ${isSubcategory ? 'subcategory' : 'category'}`;
      toast.error(Array.isArray(errMsg) ? errMsg[0] : errMsg);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] px-4">
      <div className="card p-0 w-full max-w-md relative animate-slide-up overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-700 bg-dark-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 font-heading">
            <PlusCircle className="w-5 h-5 text-primary-400" />
            {isSubcategory ? 'Create Subcategory' : 'Create Category'}
          </h3>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg text-dark-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {isSubcategory && (
            <div>
              <label className="label">Parent Category *</label>
              <select 
                className="input" 
                required
                value={form.parent} 
                onChange={e => setForm({...form, parent: e.target.value})}
              >
                <option value="">-- Select Main Category --</option>
                {parentCategories
                  .filter(c => !c.parent)
                  .map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="label">{isSubcategory ? 'Subcategory Name *' : 'Category Name *'}</label>
            <input 
              className="input" 
              placeholder={isSubcategory ? "e.g. Smart Watches, Laptops" : "e.g. Electronics, Fashion"} 
              required 
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})}
            />
          </div>

          <div>
            <label className="label">{isSubcategory ? 'Subcategory Image' : 'Category Image'}</label>
            <div className="mt-1 flex items-center gap-4">
              {form.image && (
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-dark-600">
                  <img src={URL.createObjectURL(form.image)} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1">
                <input 
                  type="file" 
                  accept="image/*"
                  id="category-image"
                  className="hidden"
                  onChange={e => setForm({...form, image: e.target.files[0]})}
                />
                <label 
                  htmlFor="category-image"
                  className="btn-secondary w-full justify-center cursor-pointer py-2.5"
                >
                  {form.image ? 'Change Image' : 'Select Image'}
                </label>
              </div>
            </div>
            <p className="text-[10px] text-dark-400 mt-2">Upload a high-quality icon or photo for this {isSubcategory ? 'subcategory' : 'category'}.</p>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center py-2.5">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (isSubcategory ? 'Create Subcategory' : 'Create Category')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
