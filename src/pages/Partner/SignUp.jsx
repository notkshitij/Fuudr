import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Store, 
  User, 
  Phone, 
  Mail, 
  UtensilsCrossed, 
  Lock,
  ArrowRight,
  ChevronDown,
  Eye,
  EyeOff,
  AlertCircle,
  X
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import AuthLayout from '../../components/Partner/AuthLayout';
import AddressAutocomplete from '../../components/Partner/AddressAutocomplete';
import { supabase } from '../../supabaseClient';

const restaurantTypes = [
  { value: 'bakery', label: 'Bakery' },
  { value: 'cafe', label: 'Cafe' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'cloud_kitchen', label: 'Cloud Kitchen' }
];

const SignUp = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Hardcoded default values for easy testing
  const [formData, setFormData] = useState({
    restaurantName: '',
    ownerName: '',
    mobileNumber: '',
    email: '',
    address: '',
    latitude: null,
    longitude: null,
    googleMapLink: '',
    avgRating: 0.0,
    totalReviews: 0,
    restaurantType: 'restaurant',
    providesDelivery: 'yes',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddressSelect = ({ address, latitude, longitude, googleMapLink, rating, userRatingCount }) => {
    setFormData(prev => ({
      ...prev,
      address,
      latitude,
      longitude,
      googleMapLink,
      avgRating: rating,
      totalReviews: userRatingCount,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      // Basic validation
      if (formData.mobileNumber.length < 10) {
        throw new Error("Please enter a valid mobile number.");
      }
      if (!formData.latitude || !formData.longitude) {
        throw new Error("Please select your restaurant address from the suggestions list.");
      }

      // Register the partner directly (custom email/password auth, hashed server-side via RPC)
      const { data: partnerData, error: partnerError } = await supabase
        .rpc('register_partner', {
          p_restaurant_name: formData.restaurantName,
          p_owner_name: formData.ownerName,
          p_mobile_number: formData.mobileNumber,
          p_email: formData.email,
          p_password: formData.password,
          p_address: formData.address,
          p_latitude: formData.latitude,
          p_longitude: formData.longitude,
          p_google_map_link: formData.googleMapLink || null,
          p_avg_rating: formData.avgRating,
          p_total_reviews: formData.totalReviews,
          p_restaurant_type: formData.restaurantType,
          p_provides_delivery: formData.providesDelivery === 'yes'
        });

      if (partnerError || !partnerData) {
        throw partnerError || new Error('Failed to create partner profile.');
      }

      // Save user session in localStorage (matching existing structure)
      localStorage.setItem('partnerUser', JSON.stringify(partnerData));

      // Success, redirect to Onboarding
      navigate('/partner/setup-profile');
      
    } catch (err) {
      console.error("Error signing up:", err);

      // Translate raw DB/network errors into friendly, user-facing messages
      let friendlyMessage = "Something went wrong. Please try again.";

      if (err?.code === '23505') {
        if (err.message?.includes('mobile_number')) {
          friendlyMessage = "This mobile number is already registered. Please sign in instead, or use a different number.";
        } else if (err.message?.includes('email')) {
          friendlyMessage = "This email is already registered. Please sign in instead, or use a different email.";
        } else {
          friendlyMessage = "An account with these details already exists. Please sign in instead.";
        }
      } else if (err?.message) {
        friendlyMessage = err.message;
      }

      setErrorMsg(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Register Restaurant | Fuudr Partner Program</title>
        <meta name="description" content="Sign up your restaurant on Fuudr. List your dishes, upload food reels, and start receiving orders from local customers today." />
        <link rel="canonical" href="https://fuudr.com/partner/signup" />
      </Helmet>
      {/* Error Popup Modal */}
      {errorMsg && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative animate-[fadeIn_0.2s_ease-out]">
            <button
              onClick={() => setErrorMsg('')}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                <AlertCircle className="text-red-500" size={28} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Couldn't Register</h3>
              <p className="text-sm text-slate-500">{errorMsg}</p>
              <button
                onClick={() => setErrorMsg('')}
                className="mt-3 w-full py-2.5 px-6 rounded-lg font-semibold text-white bg-orange-500 hover:bg-orange-600 transition-colors"
              >
                Okay
              </button>
            </div>
          </div>
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: scale(0.96); }
              to { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      )}

      <AuthLayout 
        title="Partner With Us" 
        subtitle="Join Fuudr and grow your business today"
      >
        <form onSubmit={handleSubmit} className="space-y-5">

        {/* Row 1: Restaurant & Owner Name */}
        <div className="flex flex-col md:flex-row gap-5">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2 text-slate-900">Restaurant Name</label>
            <div className="relative flex items-center">
              <Store className="absolute left-4 text-slate-400 pointer-events-none" size={20} />
              <input 
                type="text" 
                name="restaurantName"
                value={formData.restaurantName}
                onChange={handleChange}
                className="w-full py-3 pl-11 pr-4 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 transition duration-200 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10" 
                placeholder="e.g. The Grand Kitchen" 
                required
              />
            </div>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2 text-slate-900">Owner / Manager Name</label>
            <div className="relative flex items-center">
              <User className="absolute left-4 text-slate-400 pointer-events-none" size={20} />
              <input 
                type="text" 
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                className="w-full py-3 pl-11 pr-4 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 transition duration-200 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10" 
                placeholder="Full Name" 
                required
              />
            </div>
          </div>
        </div>

        {/* Row 2: Mobile & Verification */}
        <div className="flex flex-col md:flex-row gap-5">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2 text-slate-900">Mobile Number</label>
            <div className="relative flex items-center">
              <Phone className="absolute left-4 text-slate-400 pointer-events-none" size={20} />
              <input 
                type="tel" 
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
                className="w-full py-3 pl-11 pr-4 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 transition duration-200 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10" 
                placeholder="+91 XXXXX XXXXX" 
                required
              />
            </div>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2 text-slate-900">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-4 text-slate-400 pointer-events-none" size={20} />
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full py-3 pl-11 pr-4 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 transition duration-200 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10" 
                placeholder="restaurant@example.com" 
                required
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium mb-2 text-slate-900">Restaurant Address</label>
          <AddressAutocomplete
            value={formData.address}
            onSelect={handleAddressSelect}
            placeholder="Search your restaurant address..."
            required
          />
        </div>

        {/* Row 3: Type & Delivery */}
        <div className="flex flex-col md:flex-row gap-5">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2 text-slate-900">Restaurant Type</label>
            <div className="relative">
              <UtensilsCrossed className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={20} />
              
              {/* Custom Dropdown Trigger */}
              <button 
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between py-3 pl-11 pr-4 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 transition duration-200 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 text-left"
              >
                <span>{restaurantTypes.find(t => t.value === formData.restaurantType)?.label}</span>
                <ChevronDown size={20} className={`text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Custom Dropdown Menu */}
              <div 
                className={`absolute left-0 right-0 top-full mt-2 bg-white border border-slate-100 shadow-xl rounded-lg overflow-hidden z-20 transition-all duration-300 origin-top ${isDropdownOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'}`}
              >
                {restaurantTypes.map(type => (
                  <div 
                    key={type.value}
                    className={`px-4 py-3 cursor-pointer hover:bg-orange-50 transition-colors ${formData.restaurantType === type.value ? 'bg-orange-50 text-orange-600 font-semibold' : 'text-slate-700'}`}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, restaurantType: type.value }));
                      setIsDropdownOpen(false);
                    }}
                  >
                    {type.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium mb-2 text-slate-900">Provide Delivery?</label>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <input 
                  type="radio" 
                  id="delivery-yes"
                  name="providesDelivery"
                  value="yes"
                  checked={formData.providesDelivery === 'yes'}
                  onChange={handleChange}
                  className="peer absolute opacity-0"
                />
                <label htmlFor="delivery-yes" className="flex items-center justify-center py-3 px-4 border border-slate-200 rounded-lg bg-white text-slate-500 font-medium cursor-pointer transition-all peer-checked:border-orange-500 peer-checked:bg-orange-500/5 peer-checked:text-orange-500 peer-focus-visible:ring-4 peer-focus-visible:ring-orange-500/20">
                  Yes
                </label>
              </div>
              <div className="flex-1 relative">
                <input 
                  type="radio" 
                  id="delivery-no"
                  name="providesDelivery"
                  value="no"
                  checked={formData.providesDelivery === 'no'}
                  onChange={handleChange}
                  className="peer absolute opacity-0"
                />
                <label htmlFor="delivery-no" className="flex items-center justify-center py-3 px-4 border border-slate-200 rounded-lg bg-white text-slate-500 font-medium cursor-pointer transition-all peer-checked:border-orange-500 peer-checked:bg-orange-500/5 peer-checked:text-orange-500 peer-focus-visible:ring-4 peer-focus-visible:ring-orange-500/20">
                  No
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium mb-2 text-slate-900">Create Password</label>
          <div className="relative flex items-center">
            <Lock className="absolute left-4 text-slate-400 pointer-events-none" size={20} />
            <input 
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full py-3 pl-11 pr-12 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 transition duration-200 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10" 
              placeholder="Create a strong password" 
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 text-slate-400 hover:text-orange-500 transition-colors focus:outline-none"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-semibold text-white bg-orange-500 hover:bg-orange-600 active:translate-y-0 hover:-translate-y-px transition-all shadow-[0_4px_6px_-1px_rgba(249,115,22,0.2)] hover:shadow-[0_6px_8px_-1px_rgba(249,115,22,0.3)] mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? 'Registering...' : 'Register Restaurant'}
          {!loading && <ArrowRight size={20} />}
        </button>

        <div className="mt-8 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/partner" className="text-orange-500 font-medium hover:text-orange-600 transition-colors">Sign In here</Link>
        </div>
      </form>
      </AuthLayout>
    </>
  );
};

export default SignUp;
