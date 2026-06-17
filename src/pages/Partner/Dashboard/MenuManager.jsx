import React, { useState, useEffect } from 'react';
import { Plus, Image as ImageIcon, X, Upload, UtensilsCrossed, Video, Trash2, Pencil, ToggleLeft, ToggleRight, Play } from 'lucide-react';
import { supabase } from '../../../supabaseClient';
import { uploadToCloudinary } from '../../../utils/cloudinary';

const MenuManager = ({ user }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null); 
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [activeVideoItem, setActiveVideoItem] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_name: '',
    is_veg: true
  });
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*, reels(video_url)')
        .eq('partner_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setMenuItems(data || []);
    } catch (err) {
      console.error("Error fetching menu:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('dish_categories')
        .select('id, name')
        .order('name', { ascending: true });
      if (error) throw error;
      setCategories(data || []);
      if (data && data.length > 0) {
        setFormData(prev => ({ ...prev, category_name: data[0].name }));
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  useEffect(() => {
    fetchMenu();
    fetchCategories();
  }, [user.id]);

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
      if (file.size > 5 * 1024 * 1024) { setErrorMsg("Image size should be less than 5MB"); return; }
      setImageFile(file);
      setErrorMsg('');
      setSuccessMsg('');
    }
  };

  const handleVideoChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 50 * 1024 * 1024) { setErrorMsg("Video size should be less than 50MB"); return; }
      setVideoFile(file);
      setErrorMsg('');
      setSuccessMsg('');
    }
  };

  const openAddModal = () => {
    setEditItem(null);
    setImageFile(null);
    setVideoFile(null);
    setErrorMsg('');
    setSuccessMsg('');
    setFormData({ name: '', description: '', price: '', category_name: categories[0]?.name || '', is_veg: true });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditItem(item);
    setImageFile(null);
    setVideoFile(null);
    setErrorMsg('');
    setSuccessMsg('');
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price,
      category_name: item.category_name,
      is_veg: item.is_veg
    });
    setIsModalOpen(true);
  };

  const resetModal = () => {
    setIsModalOpen(false);
    setEditItem(null);
    setErrorMsg('');
    setSuccessMsg('');
    setImageFile(null);
    setVideoFile(null);
    setFormData({ name: '', description: '', price: '', category_name: categories[0]?.name || '', is_veg: true });
  };

  // Toggle availability
  const handleToggleAvailability = async (item) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: !item.is_available })
        .eq('id', item.id);
      if (error) throw error;
      setMenuItems(prev => prev.map(m => m.id === item.id ? { ...m, is_available: !m.is_available } : m));
    } catch (err) {
      console.error("Toggle error:", err);
    }
  };

  // Delete dish + its reel
  const handleDelete = async (itemId) => {
    try {
      // Delete linked reel first
      await supabase.from('reels').delete().eq('menu_item_id', itemId);
      // Delete menu item
      const { error } = await supabase.from('menu_items').delete().eq('id', itemId);
      if (error) throw error;
      setMenuItems(prev => prev.filter(m => m.id !== itemId));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isAddMore = e.nativeEvent.submitter?.name === 'save_and_add';

    const isAddMode = !editItem;

    // In add mode both are mandatory
    if (isAddMode && !imageFile) { setErrorMsg("Dish photo is required."); return; }
    if (isAddMode && !videoFile) { setErrorMsg("Dish reel is required."); return; }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const selectedCategory = categories.find(c => c.name === formData.category_name);
      const categoryId = selectedCategory ? selectedCategory.id : null;

      let imageUrl = editItem?.image_url || null;
      let videoUrl = null;

      // Upload new image if provided
      if (imageFile) {
        imageUrl = await uploadToCloudinary(imageFile, 'image');
      }

      // Upload new video if provided
      if (videoFile) {
        videoUrl = await uploadToCloudinary(videoFile, 'video');
      }

      if (isAddMode) {
        // INSERT
        const { data: menuItem, error: menuError } = await supabase
          .from('menu_items')
          .insert([{
            partner_id: user.id,
            category_id: categoryId,
            category_name: formData.category_name,
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            is_veg: formData.is_veg,
            image_url: imageUrl,
          }])
          .select()
          .single();
        if (menuError) throw menuError;

        // Insert reel
        await supabase.from('reels').insert([{
          partner_id: user.id,
          menu_item_id: menuItem.id,
          category_id: categoryId,
          category_name: formData.category_name,
          dish_name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          video_url: videoUrl,
        }]);

      } else {
        // UPDATE menu item
        const { error: updateError } = await supabase
          .from('menu_items')
          .update({
            category_id: categoryId,
            category_name: formData.category_name,
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            is_veg: formData.is_veg,
            image_url: imageUrl,
          })
          .eq('id', editItem.id);
        if (updateError) throw updateError;

        // Update linked reel if new video uploaded
        if (videoUrl) {
          await supabase.from('reels')
            .update({
              category_id: categoryId,
              category_name: formData.category_name,
              dish_name: formData.name,
              description: formData.description,
              price: parseFloat(formData.price),
              video_url: videoUrl,
            })
            .eq('menu_item_id', editItem.id);
        } else {
          // Update reel metadata even without new video
          await supabase.from('reels')
            .update({
              category_id: categoryId,
              category_name: formData.category_name,
              dish_name: formData.name,
              description: formData.description,
              price: parseFloat(formData.price),
            })
            .eq('menu_item_id', editItem.id);
        }
      }

      fetchMenu();

      if (isAddMore) {
        // Keep modal open, clear name/desc/price/files, keep category & veg
        setFormData(prev => ({ ...prev, name: '', description: '', price: '' }));
        setImageFile(null);
        setVideoFile(null);
        setSuccessMsg(`Successfully added! You can add another dish in ${formData.category_name}.`);
        
        // Reset file inputs manually
        const imageInput = document.getElementById('dishImage');
        if (imageInput) imageInput.value = '';
        const videoInput = document.getElementById('dishVideo');
        if (videoInput) videoInput.value = '';
      } else {
        resetModal();
      }

    } catch (err) {
      console.error("Error saving dish:", err);
      setErrorMsg(err.message || "Failed to save dish.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Menu Management</h1>
          <p className="text-slate-500">Manage your restaurant's dishes and pricing.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-orange-500/30"
        >
          <Plus size={20} />
          Add New Dish
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      ) : menuItems.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-4">
            <UtensilsCrossed className="text-orange-400" size={40} />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Your menu is empty</h3>
          <p className="text-slate-500 max-w-md mb-6">Start adding your delicious dishes to attract more customers.</p>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors"
          >
            <Plus size={20} />
            Add Your First Dish
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {menuItems.map(item => (
            <div 
              key={item.id} 
              className={`relative group aspect-[9/16] bg-slate-900 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer ${!item.is_available ? 'opacity-60 grayscale-[50%]' : ''}`}
              onClick={() => setActiveVideoItem(item)}
            >
              {/* Background Image or Video */}
              {item.reels && item.reels.length > 0 && item.reels[0].video_url ? (
                <video 
                  src={item.reels[0].video_url} 
                  poster={item.image_url || undefined}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                  loop
                  muted
                  playsInline
                  onMouseOver={e => {
                    const playPromise = e.target.play();
                    if (playPromise !== undefined) {
                      playPromise.catch(error => console.log("Auto-play prevented", error));
                    }
                  }}
                  onMouseOut={e => {
                    e.target.pause();
                    e.target.currentTime = 0;
                  }}
                />
              ) : item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                  <ImageIcon size={48} />
                </div>
              )}
              
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none flex flex-col justify-end p-5">
                
                {/* Top Badges */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-none">
                  <div className="bg-white/90 backdrop-blur-md p-2 rounded-full shadow-lg">
                    <div className={`w-3 h-3 rounded-full ${item.is_veg ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  </div>
                  {!item.is_available && (
                    <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-full shadow-lg flex items-center justify-center">
                       <ToggleLeft size={16} className="text-slate-500" />
                    </div>
                  )}
                </div>

                {/* Details Overlay */}
                <div className="pointer-events-auto">
                  <div className="text-orange-400 font-black text-xs uppercase tracking-widest mb-1">{item.category_name}</div>
                  <h3 className="text-white font-bold text-xl leading-tight mb-2 drop-shadow-md">{item.name}</h3>
                  <div className="bg-orange-500 text-white font-bold px-3 py-1 rounded-lg w-max text-sm mb-4 shadow-lg shadow-orange-500/20">
                    ₹{item.price}
                  </div>

                  {/* Delete Confirmation Inline */}
                  {deleteConfirmId === item.id ? (
                    <div className="flex flex-col gap-2 mb-2 animate-fadeIn bg-black/60 p-3 rounded-xl backdrop-blur-md">
                      <p className="text-white text-xs font-bold text-center">Delete dish?</p>
                      <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="flex-1 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors">
                          Yes
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }} className="flex-1 py-1.5 bg-white/20 text-white text-xs font-bold rounded-lg hover:bg-white/30 transition-colors">
                          No
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Action buttons on hover */
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 duration-300">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditModal(item); }}
                        className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition-colors flex-1 flex justify-center"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleAvailability(item); }}
                        className={`p-2.5 rounded-xl backdrop-blur-md text-white transition-colors flex-1 flex justify-center ${item.is_available ? 'bg-green-500/80 hover:bg-green-500' : 'bg-slate-500/80 hover:bg-slate-500'}`}
                        title={item.is_available ? "Mark Unavailable" : "Mark Available"}
                      >
                        {item.is_available ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(item.id); }}
                        className="p-2.5 rounded-xl bg-red-500/80 hover:bg-red-500 backdrop-blur-md text-white transition-colors flex-1 flex justify-center"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Center Play Icon */}
              {!deleteConfirmId && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 pointer-events-none">
                  <Play className="text-white fill-white ml-1" size={32} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl my-8 relative animate-slideUp">
            <button onClick={resetModal} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full transition-colors">
              <X size={20} />
            </button>

            <div className="p-8 sm:p-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-1">
                {editItem ? 'Edit Dish' : 'Add New Dish'}
              </h2>
              <p className="text-slate-400 text-sm mb-6">
                {editItem ? 'Update dish details. Upload new files to replace existing ones.' : 'All fields are required.'}
              </p>

              {errorMsg && (
                <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-200">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="mb-6 bg-green-50 text-green-600 p-4 rounded-xl text-sm font-medium border border-green-200 flex items-center justify-between">
                  <span>{successMsg}</span>
                  <button type="button" onClick={() => setSuccessMsg('')} className="text-green-500 hover:text-green-700">
                    <X size={16} />
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-2 text-slate-700">Dish Name</label>
                    <input
                      type="text" name="name" required value={formData.name} onChange={handleInputChange}
                      className="w-full py-3 px-4 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                      placeholder="e.g. Paneer Butter Masala"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-2 text-slate-700">Description</label>
                    <textarea
                      name="description" required rows="3" value={formData.description} onChange={handleInputChange}
                      className="w-full py-3 px-4 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors resize-none"
                      placeholder="Briefly describe the dish..."
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-700">Price (₹)</label>
                    <input
                      type="number" name="price" min="1" required value={formData.price} onChange={handleInputChange}
                      className="w-full py-3 px-4 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                      placeholder="299"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-700">Category</label>
                    <select
                      name="category_name" required value={formData.category_name} onChange={handleInputChange}
                      className="w-full py-3 px-4 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors bg-white"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Food Type */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700">Food Type</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={formData.is_veg === true} onChange={() => setFormData(prev => ({ ...prev, is_veg: true }))} className="w-4 h-4 text-orange-500" />
                      <span className="font-medium text-slate-700">Vegetarian</span>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={formData.is_veg === false} onChange={() => setFormData(prev => ({ ...prev, is_veg: false }))} className="w-4 h-4 text-orange-500" />
                      <span className="font-medium text-slate-700">Non-Vegetarian</span>
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    </label>
                  </div>
                </div>

                {/* Photo + Reel */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-700">
                      Dish Photo {!editItem && <span className="text-red-400">*</span>}
                      {editItem && <span className="text-slate-400 font-normal"> (replace)</span>}
                    </label>
                    <input type="file" id="dishImage" accept="image/*" onChange={handleImageChange} className="hidden" />
                    <label
                      htmlFor="dishImage"
                      className={`flex flex-col items-center justify-center w-full p-5 border-2 border-dashed rounded-xl transition-colors cursor-pointer h-32
                        ${imageFile ? 'border-orange-400 bg-orange-50' : editItem?.image_url ? 'border-green-300 bg-green-50' : 'border-slate-300 hover:bg-orange-50 hover:border-orange-400'}`}
                    >
                      {imageFile ? (
                        <div className="text-center">
                          <ImageIcon className="mx-auto text-orange-500 mb-1" size={24} />
                          <span className="text-orange-700 font-medium text-xs line-clamp-1 px-2">{imageFile.name}</span>
                          <p className="text-orange-400 text-xs mt-0.5">Tap to change</p>
                        </div>
                      ) : editItem?.image_url ? (
                        <div className="text-center">
                          <ImageIcon className="mx-auto text-green-500 mb-1" size={24} />
                          <span className="text-green-700 font-medium text-xs">Photo exists</span>
                          <p className="text-green-400 text-xs mt-0.5">Tap to replace</p>
                        </div>
                      ) : (
                        <div className="text-center text-slate-500">
                          <Upload className="mx-auto mb-1" size={22} />
                          <span className="text-sm font-semibold">Upload Photo</span>
                          <p className="text-xs text-slate-400 mt-0.5">JPG / PNG, Max 5MB</p>
                        </div>
                      )}
                    </label>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Dish Reel {!editItem && <span className="text-red-400">*</span>}
                        {editItem && <span className="text-slate-400 font-normal"> (replace)</span>}
                      </label>
                      {!editItem && (
                        <button
                          type="submit" name="save_and_add" disabled={isSubmitting}
                          title="Save & Add Another Dish in this Category"
                          className="bg-orange-100 text-orange-600 p-1.5 rounded-lg hover:bg-orange-200 transition-colors flex items-center gap-1 text-xs font-bold disabled:opacity-50"
                        >
                          <Plus size={14} strokeWidth={3} />
                        </button>
                      )}
                    </div>
                    <input type="file" id="dishVideo" accept="video/mp4,video/quicktime" onChange={handleVideoChange} className="hidden" />
                    <label
                      htmlFor="dishVideo"
                      className={`flex flex-col items-center justify-center w-full p-5 border-2 border-dashed rounded-xl transition-colors cursor-pointer h-32
                        ${videoFile ? 'border-blue-400 bg-blue-50' : editItem ? 'border-green-300 bg-green-50' : 'border-slate-300 hover:bg-blue-50 hover:border-blue-400'}`}
                    >
                      {videoFile ? (
                        <div className="text-center">
                          <Video className="mx-auto text-blue-500 mb-1" size={24} />
                          <span className="text-blue-700 font-medium text-xs line-clamp-1 px-2">{videoFile.name}</span>
                          <p className="text-blue-400 text-xs mt-0.5">Tap to change</p>
                        </div>
                      ) : editItem ? (
                        <div className="text-center">
                          <Video className="mx-auto text-green-500 mb-1" size={24} />
                          <span className="text-green-700 font-medium text-xs">Reel exists</span>
                          <p className="text-green-400 text-xs mt-0.5">Tap to replace</p>
                        </div>
                      ) : (
                        <div className="text-center text-slate-500">
                          <Video className="mx-auto mb-1" size={22} />
                          <span className="text-sm font-semibold">Upload Reel</span>
                          <p className="text-xs text-slate-400 mt-0.5">MP4 / MOV, Max 50MB</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-4">
                  <button type="button" onClick={resetModal} className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                    Cancel
                  </button>

                  <button
                    type="submit" name="save" disabled={isSubmitting}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 transition-colors disabled:opacity-70 flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    {isSubmitting ? (
                      <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Saving...</>
                    ) : editItem ? 'Save Changes' : 'Save Dish'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {activeVideoItem && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4">
          <button 
            onClick={() => setActiveVideoItem(null)} 
            className="absolute top-6 right-6 text-white/50 hover:text-white p-2 z-10 transition-colors bg-white/10 rounded-full hover:bg-white/20"
          >
            <X size={28} />
          </button>
          
          <div className="w-full max-w-[400px] aspect-[9/16] bg-black rounded-[2rem] overflow-hidden relative shadow-2xl ring-1 ring-white/20">
            {activeVideoItem.reels && activeVideoItem.reels.length > 0 && activeVideoItem.reels[0].video_url ? (
              <video
                src={activeVideoItem.reels[0].video_url}
                className="w-full h-full object-cover"
                controls
                autoPlay
                playsInline
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                <Video size={48} className="mb-4 opacity-30" />
                <p className="text-lg font-bold text-slate-300">No Reel Available</p>
                <p className="text-sm mt-2">This dish doesn't have a promotional video reel yet. Edit the dish to upload one.</p>
              </div>
            )}
            
            {/* Dish Info Overlay in Player */}
            <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-none flex justify-between items-start">
               <div>
                  <h3 className="text-white font-bold text-xl drop-shadow-md">{activeVideoItem.name}</h3>
                  <p className="text-orange-400 font-bold">₹{activeVideoItem.price}</p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManager;
