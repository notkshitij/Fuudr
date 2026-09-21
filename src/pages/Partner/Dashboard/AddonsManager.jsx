import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  Layers, 
  Check, 
  X, 
  UtensilsCrossed, 
  Sparkles,
  AlertCircle,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import { supabase } from '../../../supabaseClient';
import { uploadToCloudinary } from '../../../utils/cloudinary';

const AddonsManager = ({ user }) => {
  const [addons, setAddons] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'veg', 'non-veg'
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Image Upload state
  const [imageFile, setImageFile] = useState(null);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    is_veg: true,
    is_available: true
  });

  // Fetch all add-ons and menu items for this partner
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch add-ons
      const { data: addonsData, error: addonsError } = await supabase
        .from('dish_addons')
        .select('*, menu_item_addons(menu_item_id)')
        .eq('partner_id', user.id)
        .order('created_at', { ascending: false });

      if (addonsError && addonsError.code !== '42P01') {
        console.error("Error fetching addons:", addonsError);
      } else if (addonsData) {
        setAddons(addonsData);
      }

      // Fetch menu items for reference
      const { data: menuData } = await supabase
        .from('menu_items')
        .select('id, name, is_veg')
        .eq('partner_id', user.id);
      
      if (menuData) setMenuItems(menuData);
    } catch (err) {
      console.error("Failed to load addons data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.id]);

  const openAddModal = () => {
    setEditingAddon(null);
    setFormData({
      name: '',
      price: '',
      is_veg: true,
      is_available: true
    });
    setImageFile(null);
    setPreviewImageUrl(null);
    setErrorMsg('');
    setSuccessMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (addon) => {
    setEditingAddon(addon);
    setFormData({
      name: addon.name,
      price: addon.price,
      is_veg: addon.is_veg,
      is_available: addon.is_available ?? true
    });
    setImageFile(null);
    setPreviewImageUrl(addon.image_url || null);
    setErrorMsg('');
    setSuccessMsg('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAddon(null);
    setImageFile(null);
    setPreviewImageUrl(null);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg("Image size should be less than 5MB");
        return;
      }
      setImageFile(file);
      setPreviewImageUrl(URL.createObjectURL(file));
      setErrorMsg('');
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setPreviewImageUrl(null);
    const fileInput = document.getElementById('addonImageInput');
    if (fileInput) fileInput.value = '';
  };

  // Toggle availability
  const handleToggleAvailability = async (addon) => {
    const updatedStatus = !addon.is_available;
    try {
      const { error } = await supabase
        .from('dish_addons')
        .update({ is_available: updatedStatus })
        .eq('id', addon.id);

      if (error) throw error;
      setAddons(prev => prev.map(a => a.id === addon.id ? { ...a, is_available: updatedStatus } : a));
    } catch (err) {
      console.error("Error toggling status:", err);
      // Fallback local update for preview
      setAddons(prev => prev.map(a => a.id === addon.id ? { ...a, is_available: updatedStatus } : a));
    }
  };

  // Delete Addon
  const handleDelete = async (addonId) => {
    try {
      const { error } = await supabase
        .from('dish_addons')
        .delete()
        .eq('id', addonId);

      if (error) throw error;
      setAddons(prev => prev.filter(a => a.id !== addonId));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error("Error deleting addon:", err);
      // Fallback local delete for preview
      setAddons(prev => prev.filter(a => a.id !== addonId));
      setDeleteConfirmId(null);
    }
  };

  // Submit Add / Edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.price === '') {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // Upload image to Cloudinary if a new file is selected
      let uploadedImageUrl = editingAddon?.image_url || null;
      if (imageFile) {
        uploadedImageUrl = await uploadToCloudinary(imageFile, 'image');
      } else if (!previewImageUrl) {
        // Image was removed
        uploadedImageUrl = null;
      }

      const payload = {
        partner_id: user.id,
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        is_veg: formData.is_veg,
        is_available: formData.is_available,
        image_url: uploadedImageUrl
      };

      if (editingAddon) {
        // Update
        const { error } = await supabase
          .from('dish_addons')
          .update(payload)
          .eq('id', editingAddon.id);

        if (error) throw error;
        setAddons(prev => prev.map(a => a.id === editingAddon.id ? { ...a, ...payload } : a));
      } else {
        // Insert
        const { data, error } = await supabase
          .from('dish_addons')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setAddons(prev => [data, ...prev]);
        } else {
          // Fallback dummy record for preview
          setAddons(prev => [{ id: Date.now().toString(), ...payload, menu_item_addons: [] }, ...prev]);
        }
      }

      closeModal();
    } catch (err) {
      console.error("Error saving addon:", err);
      setErrorMsg(err.message || "Failed to save accompaniment.");
      if (err.code === '42P01' || err.message?.includes('does not exist')) {
        setErrorMsg("Database table 'dish_addons' not found yet. Schema setup will be required.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered addons
  const filteredAddons = addons.filter(addon => {
    const matchesSearch = addon.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' 
      ? true 
      : filterType === 'veg' 
        ? addon.is_veg 
        : !addon.is_veg;
    return matchesSearch && matchesFilter;
  });

  const totalCount = addons.length;
  const inStockCount = addons.filter(a => a.is_available !== false).length;
  const linkedCount = addons.filter(a => a.menu_item_addons && a.menu_item_addons.length > 0).length;

  return (
    <div className="animate-fadeIn h-full overflow-y-auto overscroll-contain pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold text-slate-900">Accompaniments & Add-ons</h1>
            <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles size={12} /> Add-ons
            </span>
          </div>
          <p className="text-slate-500">
            Create items like Butter Roti, Naan, Rice & Dips with photos to link with your dishes.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-orange-500/30"
        >
          <Plus size={20} />
          Create Add-on
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Total Add-ons</p>
            <h3 className="text-2xl font-black text-slate-900">{totalCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
            <Layers size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">In Stock / Available</p>
            <h3 className="text-2xl font-black text-green-600">{inStockCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-500 flex items-center justify-center">
            <Check size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Linked to Dishes</p>
            <h3 className="text-2xl font-black text-blue-600">{linkedCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
            <UtensilsCrossed size={24} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search accompaniments (e.g. Butter Naan, Rice)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 transition-colors shadow-sm"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Dietary Filters */}
        <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              filterType === 'all' 
                ? 'bg-orange-500 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({addons.length})
          </button>
          <button
            onClick={() => setFilterType('veg')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
              filterType === 'veg' 
                ? 'bg-green-500 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${filterType === 'veg' ? 'bg-white' : 'bg-green-500'}`} />
            Veg
          </button>
          <button
            onClick={() => setFilterType('non-veg')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
              filterType === 'non-veg' 
                ? 'bg-red-500 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${filterType === 'non-veg' ? 'bg-white' : 'bg-red-500'}`} />
            Non-Veg
          </button>
        </div>
      </div>

      {/* Accompaniments List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      ) : filteredAddons.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-4">
            <Layers className="text-orange-400" size={36} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            {searchQuery ? "No matching accompaniments" : "No accompaniments created yet"}
          </h3>
          <p className="text-slate-500 max-w-md mb-6 text-sm">
            {searchQuery 
              ? "Try searching for a different term or clear your filters." 
              : "Create add-ons like Butter Roti, Garlic Naan, Jeera Rice, or Extra Dips with photos so customers can easily select them when adding main dishes to cart."}
          </p>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors text-sm"
          >
            <Plus size={18} />
            Add First Accompaniment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAddons.map((addon) => {
            const linkedDishesCount = addon.menu_item_addons?.length || 0;
            const isAvailable = addon.is_available !== false;

            return (
              <div
                key={addon.id}
                className={`bg-white rounded-2xl border p-4 transition-all relative group flex flex-col justify-between ${
                  isAvailable 
                    ? 'border-slate-200 hover:border-orange-300 hover:shadow-md' 
                    : 'border-slate-200 opacity-60 bg-slate-50/50'
                }`}
              >
                <div>
                  {/* Top Bar with Food Type & Status */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${
                        addon.is_veg ? 'border-green-500' : 'border-red-500'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${addon.is_veg ? 'bg-green-500' : 'bg-red-500'}`} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        {addon.is_veg ? 'Vegetarian' : 'Non-Veg'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleAvailability(addon)}
                      className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg transition-colors bg-slate-100 hover:bg-slate-200"
                      title={isAvailable ? "Click to mark Out of Stock" : "Click to mark In Stock"}
                    >
                      {isAvailable ? (
                        <>
                          <ToggleRight size={16} className="text-green-600" />
                          <span className="text-green-700 text-[11px]">In Stock</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft size={16} className="text-slate-400" />
                          <span className="text-slate-500 text-[11px]">Out of Stock</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Body with Image Thumbnail & Name/Price */}
                  <div className="flex items-center gap-3.5 mb-4">
                    {/* Addon Image */}
                    <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center relative shadow-inner">
                      {addon.image_url ? (
                        <img 
                          src={addon.image_url} 
                          alt={addon.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                      ) : (
                        <div className="text-slate-300 flex flex-col items-center">
                          <ImageIcon size={22} />
                        </div>
                      )}
                    </div>

                    <div className="overflow-hidden flex-1">
                      <h3 className="text-base font-bold text-slate-900 mb-0.5 truncate group-hover:text-orange-600 transition-colors">
                        {addon.name}
                      </h3>
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg font-black text-slate-900">₹{addon.price}</span>
                        <span className="text-[11px] text-slate-400 font-medium">base price</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer with Linked Dishes info & Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium truncate">
                    <UtensilsCrossed size={13} className="text-orange-500 shrink-0" />
                    <span className="truncate">
                      {linkedDishesCount > 0 
                        ? `Linked to ${linkedDishesCount} dish${linkedDishesCount > 1 ? 'es' : ''}` 
                        : 'Not linked to dishes'}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  {deleteConfirmId === addon.id ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleDelete(addon.id)}
                        className="px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditModal(addon)}
                        className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Edit Add-on"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(addon.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Add-on"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] w-full max-w-md relative animate-slideUp shadow-2xl p-6 sm:p-8">
            <button 
              onClick={closeModal} 
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <Layers size={18} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                {editingAddon ? 'Edit Accompaniment' : 'Create Accompaniment'}
              </h2>
            </div>
            <p className="text-slate-400 text-xs mb-5">
              {editingAddon 
                ? 'Update pricing, photo and details for this add-on item.' 
                : 'Set up an accompaniment with photo that can be linked to your dishes.'}
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Photo Upload Section */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Accompaniment Photo <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input 
                  type="file" 
                  id="addonImageInput" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  className="hidden" 
                />

                {previewImageUrl ? (
                  <div className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-orange-200 bg-black shrink-0">
                      <img src={previewImageUrl} alt="preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {imageFile ? imageFile.name : 'Current Photo'}
                      </p>
                      <div className="flex gap-3 mt-1">
                        <label 
                          htmlFor="addonImageInput" 
                          className="text-xs text-orange-500 font-semibold cursor-pointer hover:underline"
                        >
                          Change
                        </label>
                        <button
                          type="button"
                          onClick={removeImage}
                          className="text-xs text-red-500 font-semibold hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="addonImageInput"
                    className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-orange-400 hover:bg-orange-50/50 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-1.5">
                      <Upload size={16} />
                    </div>
                    <span className="text-xs font-bold text-slate-700">Upload Photo</span>
                    <span className="text-[10px] text-slate-400">PNG, JPG up to 5MB</span>
                  </label>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Accompaniment Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Butter Naan, Garlic Roti, Jeera Rice"
                  className="w-full py-2.5 px-3.5 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Base Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  min="0"
                  step="any"
                  required
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="e.g. 40"
                  className="w-full py-2.5 px-3.5 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              {/* Veg / Non-Veg Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Dietary Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label 
                    className={`flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.is_veg 
                        ? 'border-green-500 bg-green-50/40 text-green-800' 
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="is_veg"
                      checked={formData.is_veg === true}
                      onChange={() => setFormData(prev => ({ ...prev, is_veg: true }))}
                      className="hidden"
                    />
                    <div className="w-3.5 h-3.5 rounded-full border border-green-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                    </div>
                    <span className="text-sm font-bold">Vegetarian</span>
                  </label>

                  <label 
                    className={`flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      !formData.is_veg 
                        ? 'border-red-500 bg-red-50/40 text-red-800' 
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="is_veg"
                      checked={formData.is_veg === false}
                      onChange={() => setFormData(prev => ({ ...prev, is_veg: false }))}
                      className="hidden"
                    />
                    <div className="w-3.5 h-3.5 rounded-full border border-red-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                    </div>
                    <span className="text-sm font-bold">Non-Veg</span>
                  </label>
                </div>
              </div>

              {/* In Stock toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 mt-2">
                <span className="text-xs font-bold text-slate-700">Currently in Stock</span>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, is_available: !prev.is_available }))}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  {formData.is_available ? (
                    <ToggleRight size={22} className="text-green-500" />
                  ) : (
                    <ToggleLeft size={22} className="text-slate-400" />
                  )}
                </button>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {isSubmitting ? 'Saving...' : editingAddon ? 'Update Accompaniment' : 'Save Accompaniment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddonsManager;
