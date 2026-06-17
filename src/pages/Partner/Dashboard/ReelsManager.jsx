import React, { useState, useEffect } from 'react';
import { Plus, Video, Play, X, Upload } from 'lucide-react';
import { supabase } from '../../../supabaseClient';
import { uploadToCloudinary } from '../../../utils/cloudinary';

const ReelsManager = ({ user }) => {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({
    dish_name: '',
    description: '',
    price: ''
  });
  const [videoFile, setVideoFile] = useState(null);

  const fetchReels = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reels')
        .select('*')
        .eq('partner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReels(data || []);
    } catch (err) {
      console.error("Error fetching reels:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReels();
  }, [user.id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Limit to 50MB for videos
      if (file.size > 50 * 1024 * 1024) {
        setErrorMsg("Video size should be less than 50MB");
        return;
      }
      setVideoFile(file);
      setErrorMsg('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile) {
      setErrorMsg("Please select a video file to upload.");
      return;
    }
    
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // 1. Upload Video
      const videoUrl = await uploadToCloudinary(videoFile, 'video');

      // 2. Save Reel details
      const { error } = await supabase
        .from('reels')
        .insert([{
          partner_id: user.id,
          dish_name: formData.dish_name,
          description: formData.description,
          price: parseFloat(formData.price),
          video_url: videoUrl
        }]);

      if (error) throw error;

      // Success
      setIsModalOpen(false);
      setFormData({ dish_name: '', description: '', price: '' });
      setVideoFile(null);
      fetchReels();

    } catch (err) {
      console.error("Error adding reel:", err);
      setErrorMsg(err.message || "Failed to upload reel.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Reels Management</h1>
          <p className="text-slate-500">Upload delicious videos of your food to attract customers.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/30"
        >
          <Plus size={20} />
          Upload Reel
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : reels.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <Video className="text-blue-400" size={40} />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">No Reels Uploaded Yet</h3>
          <p className="text-slate-500 max-w-md mb-6">
            Videos are the best way to show off your food! Upload a short clip of your signature dish to get started.
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors"
          >
            <Plus size={20} />
            Upload Your First Reel
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {reels.map(reel => (
            <div key={reel.id} className="bg-slate-900 rounded-2xl overflow-hidden shadow-sm relative group aspect-[9/16]">
              <video 
                src={reel.video_url} 
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                loop
                muted
                playsInline
                onMouseOver={e => e.target.play()}
                onMouseOut={e => {
                  e.target.pause();
                  e.target.currentTime = 0;
                }}
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none flex flex-col justify-end p-4">
                <div className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded inline-block w-max mb-1">
                  ₹{reel.price}
                </div>
                <h3 className="text-white font-bold text-sm line-clamp-1">{reel.dish_name}</h3>
                <p className="text-white/70 text-xs line-clamp-2 mt-1">{reel.description}</p>
              </div>
              
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <Play className="text-white fill-white" size={24} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Reel Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] w-full max-w-xl my-8 relative animate-slideUp">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="p-8 sm:p-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Upload Reel & Add Dish</h2>
              
              {errorMsg && (
                <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-200">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700">Video File</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      id="reelVideo"
                      accept="video/mp4,video/quicktime"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label 
                      htmlFor="reelVideo" 
                      className={`flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-xl transition-colors cursor-pointer
                        ${videoFile ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:bg-blue-50 hover:border-blue-300'}
                      `}
                    >
                      {videoFile ? (
                        <div className="text-center">
                          <Video className="mx-auto h-12 w-12 text-blue-500 mb-2" />
                          <span className="text-blue-700 font-medium">{videoFile.name}</span>
                          <p className="text-xs text-blue-500 mt-1">Ready to upload</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="mx-auto h-10 w-10 text-slate-400 mb-3" />
                          <span className="font-medium text-slate-700">Click to select video</span>
                          <p className="text-sm text-slate-500 mt-1">MP4 or MOV, up to 50MB</p>
                          <p className="text-xs text-slate-400 mt-2">Vertical format (9:16) recommended</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700">Dish Name</label>
                  <input 
                    type="text" 
                    name="dish_name"
                    required
                    value={formData.dish_name}
                    onChange={handleInputChange}
                    className="w-full py-3 px-4 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="e.g. Sizzling Brownie"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700">Description</label>
                  <textarea 
                    name="description"
                    required
                    rows="2"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full py-3 px-4 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    placeholder="Tell customers what's happening in the video..."
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700">Price (₹)</label>
                  <input 
                    type="number" 
                    name="price"
                    min="0"
                    required
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full py-3 px-4 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="199"
                  />
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-blue-500 hover:bg-blue-600 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Uploading...
                      </>
                    ) : (
                      'Upload Reel'
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReelsManager;
