import React, { useState, useEffect } from 'react';
import { Plus, Image as ImageIcon, X, Upload, UtensilsCrossed, Video, Trash2, Pencil, ToggleLeft, ToggleRight, Play } from 'lucide-react';
import { supabase } from '../../../supabaseClient';
import { uploadToCloudinary } from '../../../utils/cloudinary';

const ReelPlayer = ({ item, onClose }) => {
  const reels = (item.reels || []).filter(r => r.video_url);
  const [currentIdx, setCurrentIdx] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [showIcon, setShowIcon] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const videoRef = React.useRef(null);

  const goTo = (idx) => {
    if (idx < 0 || idx >= reels.length) return;
    setCurrentIdx(idx);
    setProgress(0);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setIsPlaying(true); }
    else { v.pause(); setIsPlaying(false); }
    setShowIcon(true);
    setTimeout(() => setShowIcon(false), 700);
  };

  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play().catch(() => {});
    setIsPlaying(true);
    const onTimeUpdate = () => setProgress(v.duration ? v.currentTime / v.duration : 0);
    const onEnded = () => { if (currentIdx < reels.length - 1) goTo(currentIdx + 1); };
    v.addEventListener('timeupdate', onTimeUpdate);
    v.addEventListener('ended', onEnded);
    return () => { v.removeEventListener('timeupdate', onTimeUpdate); v.removeEventListener('ended', onEnded); };
  }, [currentIdx]);

  if (reels.length === 0) return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="text-center text-slate-400 p-8">
        <Video size={48} className="mx-auto mb-4 opacity-30" />
        <p className="text-lg font-bold text-slate-300">No Reel Available</p>
      </div>
    </div>
  );

  const videoUrl = reels[currentIdx].video_url;

  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center" onClick={onClose}>
      <button onClick={onClose} className="absolute top-6 right-6 text-white/60 hover:text-white bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors z-10">
        <X size={24} />
      </button>

      <div
        className="relative bg-black shadow-2xl overflow-hidden"
        style={{ width: 'min(380px, 90vw)', aspectRatio: '9/16', borderRadius: '2rem' }}
        onClick={(e) => { e.stopPropagation(); togglePlay(); }}
      >
        <video
          key={videoUrl}
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
        />

        {/* Story bars */}
        <div className="absolute top-4 left-4 right-4 flex gap-1.5 z-10" onClick={e => e.stopPropagation()}>
          {reels.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden cursor-pointer" onClick={() => goTo(i)}>
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{ width: i < currentIdx ? '100%' : i === currentIdx ? `${progress * 100}%` : '0%' }}
              />
            </div>
          ))}
        </div>



        {/* Left / Right tap zones */}
        <div className="absolute inset-y-0 left-0 w-1/3 z-10" onClick={(e) => { e.stopPropagation(); goTo(currentIdx - 1); }} />
        <div className="absolute inset-y-0 right-0 w-1/3 z-10" onClick={(e) => { e.stopPropagation(); goTo(currentIdx + 1); }} />

        {/* Arrow icons */}
        {currentIdx > 0 && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
            <div className="bg-black/40 backdrop-blur-sm rounded-full p-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
            </div>
          </div>
        )}
        {currentIdx < reels.length - 1 && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
            <div className="bg-black/40 backdrop-blur-sm rounded-full p-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>
        )}

        {/* Bottom overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-none">
          <p className="text-orange-400 font-black text-xs uppercase tracking-widest mb-1">{item.category_name}</p>
          <h3 className="text-white font-bold text-2xl leading-tight mb-1">{item.name}</h3>
          {item.description && <p className="text-white/70 text-sm mb-3 line-clamp-2">{item.description}</p>}
          <div className="bg-orange-500 text-white font-bold px-4 py-1.5 rounded-full w-max text-sm shadow-lg">₹{item.price}</div>
        </div>

        {/* Play/pause flash */}
        {showIcon && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="bg-black/50 rounded-full p-5">
              {isPlaying
                ? <Play className="text-white fill-white" size={32} />
                : <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="white" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MenuManager = ({ user }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null); 
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [activeVideoItem, setActiveVideoItem] = useState(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState(null);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);

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
  const [videoFiles, setVideoFiles] = useState([]);
  const [existingReels, setExistingReels] = useState([]);
  const [deletedReelIds, setDeletedReelIds] = useState([]);

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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (activeVideoItem) {
          setActiveVideoItem(null);
        } else if (isModalOpen) {
          resetModal();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeVideoItem, isModalOpen]);

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
      const newFiles = Array.from(e.target.files).filter(f => {
        if (f.size > 50 * 1024 * 1024) { setErrorMsg(`${f.name} exceeds 50MB limit`); return false; }
        return true;
      });
      setVideoFiles(prev => [...prev, ...newFiles]);
      setErrorMsg('');
      setSuccessMsg('');
      e.target.value = '';
    }
  };

  const removeVideoFile = (index) => {
    setVideoFiles(prev => prev.filter((_, i) => i !== index));
  };

  const openAddModal = () => {
    setEditItem(null);
    setImageFile(null);
    setVideoFiles([]);
    setErrorMsg('');
    setSuccessMsg('');
    setFormData({ name: '', description: '', price: '', category_name: categories[0]?.name || '', is_veg: true });
    setIsModalOpen(true);
  };

  const openEditModal = async (item) => {
    setEditItem(item);
    setImageFile(null);
    setVideoFiles([]);
    setDeletedReelIds([]);
    setErrorMsg('');
    setSuccessMsg('');
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price,
      category_name: item.category_name,
      is_veg: item.is_veg
    });
    // Fetch all saved reels for this item
    const { data } = await supabase.from('reels').select('id, video_url').eq('menu_item_id', item.id);
    setExistingReels(data || []);
    setIsModalOpen(true);
  };

  const resetModal = () => {
    setIsModalOpen(false);
    setEditItem(null);
    setErrorMsg('');
    setSuccessMsg('');
    setImageFile(null);
    setVideoFiles([]);
    setExistingReels([]);
    setDeletedReelIds([]);
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
    if (isAddMode && videoFiles.length === 0) { setErrorMsg("At least one dish reel is required."); return; }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const selectedCategory = categories.find(c => c.name === formData.category_name);
      const categoryId = selectedCategory ? selectedCategory.id : null;

      let imageUrl = editItem?.image_url || null;

      // Upload new image if provided
      if (imageFile) {
        imageUrl = await uploadToCloudinary(imageFile, 'image');
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

        // Upload and insert all reels — dish data lives on menu_items now,
        // so reels only store the link + video.
        const videoUrls = await Promise.all(videoFiles.map(f => uploadToCloudinary(f, 'video')));
        await supabase.from('reels').insert(videoUrls.map(videoUrl => ({
          partner_id: user.id,
          menu_item_id: menuItem.id,
          video_url: videoUrl,
        })));

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

        // Delete removed reels
        if (deletedReelIds.length > 0) {
          await supabase.from('reels').delete().in('id', deletedReelIds);
        }
        // Dish metadata (name, price, description, category) lives on menu_items —
        // already updated above. Reels carry no dish data, so nothing to update here.

        // Upload and insert new reels
        if (videoFiles.length > 0) {
          const newVideoUrls = await Promise.all(videoFiles.map(f => uploadToCloudinary(f, 'video')));
          await supabase.from('reels').insert(newVideoUrls.map(videoUrl => ({
            partner_id: user.id,
            menu_item_id: editItem.id,
            video_url: videoUrl,
          })));
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
    <div className="animate-fadeIn h-full overflow-y-auto overscroll-contain pb-12">
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
                  <h3 className="text-white font-bold text-xl leading-tight mb-1 drop-shadow-md">{item.name}</h3>
                  {item.description && <p className="text-white/70 text-xs leading-snug mb-2 line-clamp-2">{item.description}</p>}
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


            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] w-full max-w-lg my-4 relative animate-slideUp">
            <button onClick={resetModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full transition-colors">
              <X size={18} />
            </button>

            <div className="p-6 sm:p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-1">
                {editItem ? 'Edit Dish' : 'Add New Dish'}
              </h2>
              <p className="text-slate-400 text-sm mb-4">
                {editItem ? 'Update dish details. Upload new files to replace existing ones.' : 'All fields are required.'}
              </p>

              {errorMsg && (
                <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium border border-red-200">
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
                      name="description" required rows="2" value={formData.description} onChange={handleInputChange}
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
                    {imageFile ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="relative w-14 h-14 overflow-hidden border-2 border-orange-300 bg-black flex-shrink-0 cursor-pointer"
                          style={{borderRadius: '10px'}}
                          onClick={() => setPreviewImageUrl(URL.createObjectURL(imageFile))}
                        >
                          <img src={URL.createObjectURL(imageFile)} alt="preview" className="absolute inset-0 w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-700 line-clamp-1">{imageFile.name}</p>
                          <label htmlFor="dishImage" className="text-xs text-orange-500 cursor-pointer hover:underline">Tap to change</label>
                        </div>
                      </div>
                    ) : editItem?.image_url ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="relative w-14 h-14 overflow-hidden border-2 border-green-300 flex-shrink-0 cursor-pointer"
                          style={{borderRadius: '10px'}}
                          onClick={() => setPreviewImageUrl(editItem.image_url)}
                        >
                          <img src={editItem.image_url} alt="existing" className="absolute inset-0 w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-green-700">Photo exists</p>
                          <label htmlFor="dishImage" className="text-xs text-green-500 cursor-pointer hover:underline">Tap to replace</label>
                        </div>
                      </div>
                    ) : (
                      <label htmlFor="dishImage" className="flex flex-col items-center justify-center w-full p-4 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer h-24 hover:bg-orange-50 hover:border-orange-400 transition-colors">
                        <Upload className="text-slate-400 mb-1" size={22} />
                        <span className="text-sm font-semibold text-slate-500">Upload Photo</span>
                        <p className="text-xs text-slate-400 mt-0.5">JPG / PNG, Max 5MB</p>
                      </label>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Dish Reel {!editItem && <span className="text-red-400">*</span>}
                        {editItem && <span className="text-slate-400 font-normal"> (replace)</span>}
                      </label>
                      {(existingReels.length > 0 || videoFiles.length > 0) && (
                        <label htmlFor="dishVideo" className="cursor-pointer p-1 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
                          <Plus size={16} className="text-blue-500" />
                        </label>
                      )}
                    </div>
                    <input type="file" id="dishVideo" accept="video/mp4,video/quicktime" multiple onChange={handleVideoChange} className="hidden" />

                    {/* Video previews */}
                    {(existingReels.length > 0 || videoFiles.length > 0) ? (
                      <div className="flex flex-wrap gap-2">
                        {existingReels.map((reel) => (
                          <div key={reel.id} className="relative w-14 h-14 overflow-hidden border-2 border-green-300 bg-black flex-shrink-0 cursor-pointer" style={{borderRadius: '10px'}} onClick={() => setPreviewVideoUrl(reel.video_url)}>
                            <video src={reel.video_url} className="absolute inset-0 w-full h-full object-cover opacity-80" muted playsInline />
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setDeletedReelIds(prev => [...prev, reel.id]); setExistingReels(prev => prev.filter(r => r.id !== reel.id)); }}
                              className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 hover:bg-red-500 transition-colors z-10"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                        {videoFiles.map((file, idx) => (
                          <div key={idx} className="relative w-14 h-14 overflow-hidden border-2 border-blue-300 bg-black flex-shrink-0 cursor-pointer" style={{borderRadius: '10px'}} onClick={() => setPreviewVideoUrl(URL.createObjectURL(file))}>
                            <video src={URL.createObjectURL(file)} className="absolute inset-0 w-full h-full object-cover opacity-80" muted playsInline />
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); removeVideoFile(idx); }}
                              className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 hover:bg-red-500 transition-colors z-10"
                            >
                              <X size={10} />
                            </button>
                            <p className="absolute bottom-0 left-0 right-0 text-white text-[9px] bg-black/50 text-center truncate px-1 py-0.5">{file.name}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <label htmlFor="dishVideo" className="flex flex-col items-center justify-center w-full p-4 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer h-24 hover:bg-blue-50 hover:border-blue-400 transition-colors">
                        <Video className="text-slate-400 mb-1" size={22} />
                        <span className="text-sm font-semibold text-slate-500">Upload Reel</span>
                        <p className="text-xs text-slate-400 mt-0.5">MP4 / MOV, Max 50MB each</p>
                      </label>
                    )}
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
        <ReelPlayer item={activeVideoItem} onClose={() => setActiveVideoItem(null)} />
      )}
      {/* Image Preview Overlay */}
      {previewImageUrl && (
        <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4" onClick={() => setPreviewImageUrl(null)}>
          <button className="absolute top-6 right-6 text-white/60 hover:text-white bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">
            <X size={24} />
          </button>
          <img
            src={previewImageUrl}
            alt="preview"
            className="max-h-[80vh] max-w-full rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Upload Preview Overlay */}
      {previewVideoUrl && (
        <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4" onClick={() => setPreviewVideoUrl(null)}>
          <button className="absolute top-6 right-6 text-white/60 hover:text-white bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">
            <X size={24} />
          </button>
          <video
            src={previewVideoUrl}
            className="max-h-[80vh] max-w-full rounded-2xl"
            controls
            autoPlay
            playsInline
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default MenuManager;
