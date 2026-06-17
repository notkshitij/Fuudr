import React, { useState, useEffect } from 'react';
import { Save, Building2, Clock, FileText, Image as ImageIcon, Upload, ShieldCheck, MapPin, Mail, Phone, User, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../../supabaseClient';
import { uploadToCloudinary } from '../../../utils/cloudinary';

const Settings = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState('basic'); // 'basic', 'operating', 'legal'
  
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const [formData, setFormData] = useState({
    restaurant_name: '',
    owner_name: '',
    mobile_number: '',
    email: '',
    address: '',
    restaurant_type: '',
    provides_delivery: true,
    opening_time: '',
    closing_time: '',
    operating_days: [],
    gst_number: ''
  });

  const [files, setFiles] = useState({
    logo: null,
    fssai: null
  });

  useEffect(() => {
    if (user) {
      setFormData({
        restaurant_name: user.restaurant_name || '',
        owner_name: user.owner_name || '',
        mobile_number: user.mobile_number || '',
        email: user.email || '',
        address: user.address || '',
        restaurant_type: user.restaurant_type || '',
        provides_delivery: user.provides_delivery ?? true,
        opening_time: user.opening_time || '',
        closing_time: user.closing_time || '',
        operating_days: user.operating_days || [],
        gst_number: user.gst_number || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files: fileList } = e.target;
    if (fileList.length > 0) {
      const file = fileList[0];
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg(`The file "${file.name}" is too large. Max 5MB.`);
        e.target.value = '';
        return;
      }
      setErrorMsg('');
      setFiles(prev => ({ ...prev, [name]: file }));
    }
  };

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      operating_days: prev.operating_days.includes(day)
        ? prev.operating_days.filter(d => d !== day)
        : [...prev.operating_days, day]
    }));
  };

  const uploadFile = async (file, bucket) => {
    try {
      const url = await uploadToCloudinary(file, 'auto');
      return url;
    } catch (err) {
      console.error(`Upload failed for ${bucket}:`, err);
      throw new Error(`Failed to upload to Cloudinary. Check your API keys.`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const updateData = { ...formData };

      if (files.logo) {
        updateData.logo_url = await uploadFile(files.logo, 'logo');
      }
      if (files.fssai) {
        updateData.fssai_certificate_url = await uploadFile(files.fssai, 'fssai');
      }

      const { data, error } = await supabase
        .from('partners')
        .update(updateData)
        .eq('id', user.id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Update blocked by security policies.");

      setSuccessMsg('Settings updated successfully!');
      localStorage.setItem('partnerUser', JSON.stringify({ ...user, ...updateData }));
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to update settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-200";
  const labelClasses = "block text-sm font-semibold text-slate-700 mb-2";

  return (
    <div className="animate-fadeIn max-w-6xl mx-auto pb-12">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Restaurant Settings</h1>
          <p className="text-slate-500 font-medium">Manage your profile, operating hours, and legal documents.</p>
        </div>
      </div>

      {successMsg && (
        <div className="mb-8 p-4 bg-green-500/10 text-green-700 border border-green-500/20 rounded-2xl font-semibold flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 size={20} className="text-green-600" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="mb-8 p-4 bg-red-500/10 text-red-700 border border-red-500/20 rounded-2xl font-semibold animate-fadeIn">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Settings Navigation Sidebar */}
        <div className="w-full lg:w-64 bg-white rounded-3xl p-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex-shrink-0 sticky top-24">
          <button 
            type="button" onClick={() => setActiveTab('basic')}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all text-left ${activeTab === 'basic' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <Building2 size={20} />
            Basic Profile
          </button>
          <button 
            type="button" onClick={() => setActiveTab('operating')}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all text-left mt-2 ${activeTab === 'operating' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <Clock size={20} />
            Operating Hours
          </button>
          <button 
            type="button" onClick={() => setActiveTab('legal')}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all text-left mt-2 ${activeTab === 'legal' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <ShieldCheck size={20} />
            Legal & Documents
          </button>
          
          <div className="mt-8 pt-6 border-t border-slate-100 px-3">
            <button 
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all shadow-xl shadow-slate-900/20 disabled:opacity-70"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save size={20} />}
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Settings Content Area */}
        <div className="flex-1 w-full bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 md:p-10 min-h-[600px]">
          
          {/* TAB: BASIC */}
          <div className={activeTab === 'basic' ? 'block animate-fadeIn' : 'hidden'}>
            <div className="mb-8 border-b border-slate-100 pb-6">
              <h2 className="text-2xl font-black text-slate-900">Basic Profile</h2>
              <p className="text-slate-500 mt-1">Update your restaurant's public-facing information.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="md:col-span-2">
                <label className={labelClasses}>Restaurant Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Building2 className="text-slate-400" size={18} />
                  </div>
                  <input type="text" name="restaurant_name" required value={formData.restaurant_name} onChange={handleChange} className={`${inputClasses} pl-11`} />
                </div>
              </div>
              
              <div>
                <label className={labelClasses}>Owner Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="text-slate-400" size={18} />
                  </div>
                  <input type="text" name="owner_name" required value={formData.owner_name} onChange={handleChange} className={`${inputClasses} pl-11`} />
                </div>
              </div>

              <div>
                <label className={labelClasses}>Restaurant Type</label>
                <select name="restaurant_type" value={formData.restaurant_type} onChange={handleChange} className={inputClasses}>
                  <option value="Cafe">Cafe</option>
                  <option value="Fine Dining">Fine Dining</option>
                  <option value="Fast Food">Fast Food</option>
                  <option value="Food Truck">Food Truck</option>
                  <option value="Bakery">Bakery</option>
                  <option value="Cloud Kitchen">Cloud Kitchen</option>
                </select>
              </div>

              <div>
                <label className={labelClasses}>Mobile Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="text-slate-400" size={18} />
                  </div>
                  <input type="tel" name="mobile_number" required value={formData.mobile_number} onChange={handleChange} className={`${inputClasses} pl-11`} />
                </div>
              </div>

              <div>
                <label className={labelClasses}>Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="text-slate-400" size={18} />
                  </div>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className={`${inputClasses} pl-11`} />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className={labelClasses}>Physical Address</label>
                <div className="relative">
                  <div className="absolute top-4 left-0 pl-4 pointer-events-none">
                    <MapPin className="text-slate-400" size={18} />
                  </div>
                  <textarea name="address" required rows="3" value={formData.address} onChange={handleChange} className={`${inputClasses} pl-11 resize-none`}></textarea>
                </div>
              </div>
            </div>
          </div>

          {/* TAB: OPERATING */}
          <div className={activeTab === 'operating' ? 'block animate-fadeIn' : 'hidden'}>
            <div className="mb-8 border-b border-slate-100 pb-6">
              <h2 className="text-2xl font-black text-slate-900">Operating Hours</h2>
              <p className="text-slate-500 mt-1">Set when your kitchen is open and accepting orders.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <label className={labelClasses}>Opening Time</label>
                <input 
                  type="time" name="opening_time" value={formData.opening_time} 
                  onChange={(e) => { handleChange(e); if(e.target.value) e.target.blur(); }}
                  onClick={(e) => e.target.showPicker && e.target.showPicker()}
                  className={`${inputClasses} cursor-pointer text-xl font-bold`}
                />
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <label className={labelClasses}>Closing Time</label>
                <input 
                  type="time" name="closing_time" value={formData.closing_time} 
                  onChange={(e) => { handleChange(e); if(e.target.value) e.target.blur(); }}
                  onClick={(e) => e.target.showPicker && e.target.showPicker()}
                  className={`${inputClasses} cursor-pointer text-xl font-bold`}
                />
              </div>

              <div className="md:col-span-2">
                <label className={`${labelClasses} mb-4`}>Operating Days</label>
                <div className="flex flex-wrap gap-3">
                  {daysOfWeek.map(day => (
                    <button
                      key={day} type="button" onClick={() => toggleDay(day)}
                      className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 border ${
                        formData.operating_days.includes(day)
                          ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/25 scale-105'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-orange-500 hover:text-orange-500'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 flex items-center justify-between p-6 bg-slate-900 rounded-2xl text-white shadow-xl shadow-slate-900/10">
                <div>
                  <h4 className="font-bold text-lg">In-House Delivery</h4>
                  <p className="text-slate-400 text-sm mt-1">Do you have your own fleet for delivering orders?</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="provides_delivery" checked={formData.provides_delivery} onChange={handleChange} className="sr-only peer" />
                  <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>
            </div>
          </div>

          {/* TAB: LEGAL & DOCUMENTS */}
          <div className={activeTab === 'legal' ? 'block animate-fadeIn' : 'hidden'}>
            <div className="mb-8 border-b border-slate-100 pb-6">
              <h2 className="text-2xl font-black text-slate-900">Legal & Documents</h2>
              <p className="text-slate-500 mt-1">Manage your brand assets and regulatory documents.</p>
            </div>

            <div className="grid grid-cols-1 gap-8">
              
              <div>
                <label className={labelClasses}>GST Number (Optional)</label>
                <input 
                  type="text" name="gst_number" value={formData.gst_number} onChange={handleChange}
                  className={`${inputClasses} font-mono uppercase tracking-widest text-lg`} placeholder="e.g. 22AAAAA0000A1Z5"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Logo Upload Card */}
                <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50 hover:border-orange-300 transition-colors group">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
                      <ImageIcon size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Brand Logo</h3>
                      <p className="text-xs text-slate-500">Publicly visible icon</p>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <input type="file" id="logo" name="logo" accept="image/*" onChange={handleFileChange} className="hidden" />
                    <label htmlFor="logo" className="flex items-center justify-center w-full py-4 border-2 border-dashed border-slate-300 rounded-xl bg-white cursor-pointer group-hover:border-orange-500 transition-colors">
                      {files.logo ? (
                        <span className="text-orange-600 font-bold truncate px-4">{files.logo.name}</span>
                      ) : (
                        <span className="text-slate-500 font-semibold flex items-center gap-2 group-hover:text-orange-500"><Upload size={18} /> Upload Image</span>
                      )}
                    </label>
                  </div>
                </div>

                {/* FSSAI Upload Card */}
                <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50 hover:border-orange-300 transition-colors group">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">FSSAI Certificate</h3>
                      <p className="text-xs text-slate-500">Regulatory compliance</p>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <input type="file" id="fssai" name="fssai" accept=".pdf,image/*" onChange={handleFileChange} className="hidden" />
                    <label htmlFor="fssai" className="flex items-center justify-center w-full py-4 border-2 border-dashed border-slate-300 rounded-xl bg-white cursor-pointer group-hover:border-orange-500 transition-colors">
                      {files.fssai ? (
                        <span className="text-orange-600 font-bold truncate px-4">{files.fssai.name}</span>
                      ) : (
                        <span className="text-slate-500 font-semibold flex items-center gap-2 group-hover:text-orange-500"><Upload size={18} /> Upload Document</span>
                      )}
                    </label>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
};

export default Settings;
