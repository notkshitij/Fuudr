import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, Building2, Clock, FileText, Image as ImageIcon, Upload, ShieldCheck, 
  MapPin, Mail, Phone, User, CheckCircle2, CalendarDays, ChevronDown, 
  UtensilsCrossed, GraduationCap, ChevronRight
} from 'lucide-react';
import { supabase } from '../../../supabaseClient';
import { uploadToCloudinary } from '../../../utils/cloudinary';
import AddressAutocomplete from '../../../components/Partner/AddressAutocomplete';
import SimpleTimePicker from '../../../components/Partner/SimpleTimePicker';
import ChangePasswordCard from './ChangePasswordCard';

const restaurantTypes = [
  { value: 'Restaurant', label: 'Restaurant' },
  { value: 'Cafe', label: 'Cafe' },
  { value: 'Fine Dining', label: 'Fine Dining' },
  { value: 'Fast Food', label: 'Fast Food' },
  { value: 'Food Truck', label: 'Food Truck' },
  { value: 'Bakery', label: 'Bakery' },
  { value: 'Cloud Kitchen', label: 'Cloud Kitchen' }
];

const Settings = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const [formData, setFormData] = useState({
    restaurant_name: '',
    owner_name: '',
    mobile_number: '',
    email: '',
    address: '',
    latitude: null,
    longitude: null,
    google_map_link: '',
    avg_rating: 0.0,
    total_reviews: 0,
    restaurant_type: '',
    provides_delivery: true,
    is_poornima: false,
    opening_time: '',
    closing_time: '',
    operating_days: [],
    gst_number: ''
  });

  const [files, setFiles] = useState({ logo: null, fssai: null });

  useEffect(() => {
    if (user) {
      setFormData({
        restaurant_name: user.restaurant_name || '',
        owner_name: user.owner_name || '',
        mobile_number: user.mobile_number || '',
        email: user.email || '',
        address: user.address || '',
        latitude: user.latitude || null,
        longitude: user.longitude || null,
        google_map_link: user.google_map_link || '',
        avg_rating: user.avg_rating || 0.0,
        total_reviews: user.total_reviews || 0,
        restaurant_type: user.restaurant_type || '',
        provides_delivery: user.provides_delivery ?? true,
        is_poornima: user.is_poornima ?? false,
        opening_time: user.opening_time || '',
        closing_time: user.closing_time || '',
        operating_days: user.operating_days || [],
        gst_number: user.gst_number || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFileChange = (e) => {
    const { name, files: fileList } = e.target;
    if (fileList.length > 0) {
      const file = fileList[0];
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg(`"${file.name}" is too large. Max 5MB.`);
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

  const toggleAllDays = () => {
    setFormData(prev => ({
      ...prev,
      operating_days: prev.operating_days.length === daysOfWeek.length ? [] : [...daysOfWeek]
    }));
  };

  const allDaysSelected = formData.operating_days.length === daysOfWeek.length;

  const uploadFile = async (file) => {
    try {
      return await uploadToCloudinary(file, 'auto');
    } catch (err) {
      throw new Error(`Failed to upload file. Check your API keys.`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const updateData = { ...formData };
      if (files.logo) updateData.logo_url = await uploadFile(files.logo);
      if (files.fssai) updateData.fssai_certificate_url = await uploadFile(files.fssai);

      const { data, error } = await supabase
        .from('partners')
        .update(updateData)
        .eq('id', user.id)
        .select('id');

      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Update blocked by security policies.");

      setSuccessMsg('Settings saved successfully!');
      localStorage.setItem('partnerUser', JSON.stringify({ ...user, ...updateData }));
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-200 text-sm";
  const labelClasses = "block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide";

  const tabs = [
    { id: 'basic', label: 'Basic Profile', icon: Building2 },
    { id: 'operating', label: 'Operating Hours', icon: Clock },
    { id: 'legal', label: 'Legal & Docs', icon: ShieldCheck },
  ];

  return (
    <div className="animate-fadeIn pb-10">

      {/* Page Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-1">Restaurant Settings</h1>
        <p className="text-slate-500 text-xs sm:text-sm">Manage your profile, operating hours, and legal documents.</p>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="mb-4 p-3.5 sm:p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl font-semibold flex items-center gap-3 text-sm animate-fadeIn">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 p-3.5 sm:p-4 bg-red-50 text-red-700 border border-red-200 rounded-2xl font-semibold text-sm animate-fadeIn">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Tab Navigation — horizontal pill tabs, no sidebar */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 mb-4 sm:mb-5 scrollbar-none">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold whitespace-nowrap text-xs sm:text-sm transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── TAB: BASIC PROFILE ─── */}
        {activeTab === 'basic' && (
          <div className="animate-fadeIn space-y-4">

            {/* Section: Identity */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm p-4 sm:p-6">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Building2 size={15} className="text-orange-500" /> Restaurant Identity
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={labelClasses}>Restaurant Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Building2 className="text-slate-400" size={16} />
                    </div>
                    <input type="text" name="restaurant_name" required value={formData.restaurant_name} onChange={handleChange} className={`${inputClasses} pl-10`} placeholder="e.g. PU Canteen" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClasses}>Owner Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <User className="text-slate-400" size={16} />
                      </div>
                      <input type="text" name="owner_name" required value={formData.owner_name} onChange={handleChange} className={`${inputClasses} pl-10`} placeholder="Full name" />
                    </div>
                  </div>

                  <div>
                    <label className={labelClasses}>Restaurant Type</label>
                    <div className="relative" ref={dropdownRef}>
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                        <UtensilsCrossed className="text-slate-400" size={16} />
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`${inputClasses} pl-10 pr-9 flex items-center justify-between text-left`}
                      >
                        <span className="truncate">{formData.restaurant_type || 'Select Type'}</span>
                        <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isDropdownOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden z-30">
                          {restaurantTypes.map(type => (
                            <button
                              key={type.value}
                              type="button"
                              className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center justify-between ${formData.restaurant_type === type.value ? 'bg-orange-50 text-orange-600 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                              onClick={() => { setFormData(prev => ({ ...prev, restaurant_type: type.value })); setIsDropdownOpen(false); }}
                            >
                              {type.label}
                              {formData.restaurant_type === type.value && <CheckCircle2 size={14} className="text-orange-500" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Contact */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm p-4 sm:p-6">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Phone size={15} className="text-orange-500" /> Contact Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Mobile Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Phone className="text-slate-400" size={16} />
                    </div>
                    <input type="tel" name="mobile_number" required value={formData.mobile_number} onChange={handleChange} className={`${inputClasses} pl-10`} placeholder="10-digit number" />
                  </div>
                </div>
                <div>
                  <label className={labelClasses}>Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="text-slate-400" size={16} />
                    </div>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className={`${inputClasses} pl-10`} placeholder="contact@restaurant.com" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Location */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm p-4 sm:p-6">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <MapPin size={15} className="text-orange-500" /> Location
              </h2>
              <div>
                <label className={labelClasses}>Physical Address</label>
                <AddressAutocomplete
                  value={formData.address}
                  onSelect={({ address, latitude, longitude, googleMapLink, rating, userRatingCount }) => {
                    setFormData(prev => ({ ...prev, address, latitude, longitude, google_map_link: googleMapLink, avg_rating: rating, total_reviews: userRatingCount }));
                  }}
                />
                {formData.latitude && formData.longitude && (
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold">
                    <p className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Location confirmed ({formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)})
                    </p>
                    {formData.google_map_link && (
                      <a href={formData.google_map_link} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-700 underline">
                        View on Google Maps
                      </a>
                    )}
                    {(formData.avg_rating > 0 || formData.total_reviews > 0) && (
                      <p className="text-slate-500">★ {formData.avg_rating} ({formData.total_reviews} reviews)</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Section: Campus Toggle */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50/50 border border-orange-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20">
                    <GraduationCap size={19} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-slate-900">Poornima Campus Cafe</h4>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${formData.is_poornima ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                        {formData.is_poornima ? 'On-Campus' : 'Off-Campus'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">Located inside Poornima campus? Toggle to identify your outlet.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, is_poornima: !prev.is_poornima }))}
                  className={`relative shrink-0 h-7 w-13 rounded-full transition-colors duration-200 focus:outline-none ${formData.is_poornima ? 'bg-orange-500' : 'bg-slate-300'}`}
                  style={{ width: '52px' }}
                >
                  <span className={`absolute top-[3px] left-[3px] h-[22px] w-[22px] rounded-full bg-white shadow-sm transition-transform duration-200 ${formData.is_poornima ? 'translate-x-[26px]' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB: OPERATING HOURS ─── */}
        {activeTab === 'operating' && (
          <div className="animate-fadeIn space-y-4">

            {/* Operating Days */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm p-4 sm:p-6">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <CalendarDays size={15} className="text-orange-500" /> Operating Days
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {daysOfWeek.map(day => {
                  const isSelected = formData.operating_days.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`p-3 rounded-xl border-2 font-semibold text-sm transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-orange-500 bg-orange-500' : 'border-slate-300'}`}>
                        {isSelected && <CheckCircle2 size={11} className="text-white" />}
                      </div>
                      <span className="truncate">{day.slice(0, 3)}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  onClick={toggleAllDays}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 font-bold text-sm transition-all ${
                    allDaysSelected
                      ? 'border-orange-600 bg-orange-500 text-white hover:bg-orange-600'
                      : 'border-orange-400 bg-orange-50 text-orange-700 hover:bg-orange-100'
                  }`}
                >
                  <CalendarDays size={16} />
                  {allDaysSelected ? 'Deselect All' : 'Select All Days'}
                </button>
              </div>
            </div>

            {/* Operating Time */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm p-4 sm:p-6">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Clock size={15} className="text-orange-500" /> Timings
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SimpleTimePicker
                  label="Opening Time"
                  defaultPeriod="AM"
                  value={formData.opening_time}
                  onChange={(time) => setFormData(prev => ({ ...prev, opening_time: time }))}
                />
                <SimpleTimePicker
                  label="Closing Time"
                  defaultPeriod="PM"
                  value={formData.closing_time}
                  onChange={(time) => setFormData(prev => ({ ...prev, closing_time: time }))}
                />
              </div>
            </div>

            {/* Delivery Toggle */}
            <div className="bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-white shadow-xl">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h4 className="font-bold text-base">In-House Delivery</h4>
                  <p className="text-slate-400 text-xs mt-0.5 leading-snug">Do you have your own delivery fleet?</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, provides_delivery: !prev.provides_delivery }))}
                  className={`relative shrink-0 h-7 rounded-full transition-colors duration-200 focus:outline-none ${formData.provides_delivery ? 'bg-orange-500' : 'bg-slate-600'}`}
                  style={{ width: '52px' }}
                >
                  <span className={`absolute top-[3px] left-[3px] h-[22px] w-[22px] rounded-full bg-white shadow-sm transition-transform duration-200 ${formData.provides_delivery ? 'translate-x-[26px]' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB: LEGAL & DOCUMENTS ─── */}
        {activeTab === 'legal' && (
          <div className="animate-fadeIn space-y-4">

            {/* GST */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm p-4 sm:p-6">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <ShieldCheck size={15} className="text-orange-500" /> Tax Information
              </h2>
              <div>
                <label className={labelClasses}>GST Number <span className="font-normal normal-case tracking-normal text-slate-400">(Optional)</span></label>
                <input
                  type="text" name="gst_number" value={formData.gst_number} onChange={handleChange}
                  className={`${inputClasses} font-mono uppercase tracking-wider`}
                  placeholder="e.g. 22AAAAA0000A1Z5"
                />
              </div>
            </div>

            {/* File Uploads */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm p-4 sm:p-6">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <FileText size={15} className="text-orange-500" /> Documents & Assets
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Logo Upload */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 hover:border-orange-300 transition-colors group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500 shrink-0">
                      <ImageIcon size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">Brand Logo</h3>
                      <p className="text-[11px] text-slate-500">Publicly visible icon</p>
                    </div>
                  </div>
                  <input type="file" id="logo" name="logo" accept="image/*" onChange={handleFileChange} className="hidden" />
                  <label htmlFor="logo" className="flex items-center justify-center w-full py-3.5 border-2 border-dashed border-slate-300 rounded-xl bg-white cursor-pointer group-hover:border-orange-500 transition-colors">
                    {files.logo ? (
                      <span className="text-orange-600 font-bold text-xs truncate px-3">{files.logo.name}</span>
                    ) : (
                      <span className="text-slate-500 font-semibold text-xs flex items-center gap-2 group-hover:text-orange-500">
                        <Upload size={15} /> Upload Image
                      </span>
                    )}
                  </label>
                </div>

                {/* FSSAI Upload */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 hover:border-orange-300 transition-colors group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500 shrink-0">
                      <FileText size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">FSSAI Certificate</h3>
                      <p className="text-[11px] text-slate-500">Regulatory compliance</p>
                    </div>
                  </div>
                  <input type="file" id="fssai" name="fssai" accept=".pdf,image/*" onChange={handleFileChange} className="hidden" />
                  <label htmlFor="fssai" className="flex items-center justify-center w-full py-3.5 border-2 border-dashed border-slate-300 rounded-xl bg-white cursor-pointer group-hover:border-orange-500 transition-colors">
                    {files.fssai ? (
                      <span className="text-orange-600 font-bold text-xs truncate px-3">{files.fssai.name}</span>
                    ) : (
                      <span className="text-slate-500 font-semibold text-xs flex items-center gap-2 group-hover:text-orange-500">
                        <Upload size={15} /> Upload Document
                      </span>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button — fixed at bottom, always accessible */}
        <div className="mt-6 sticky bottom-3 sm:bottom-4 z-20">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 sm:py-4 bg-slate-900 hover:bg-slate-800 active:bg-black text-white rounded-2xl font-bold text-sm sm:text-base transition-all shadow-2xl shadow-slate-900/30 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      <ChangePasswordCard />
    </div>
  );
};

export default Settings;
