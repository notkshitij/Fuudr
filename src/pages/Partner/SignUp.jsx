import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Store, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  UtensilsCrossed, 
  Lock,
  ArrowRight,
  ChevronDown,
  Eye,
  EyeOff,
  MapPinned
} from 'lucide-react';
import AuthLayout from '../../components/Partner/AuthLayout';
import { supabase } from '../../supabaseClient';

// Utility function to hash password securely
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      // Basic validation
      if (formData.mobileNumber.length < 10) {
        throw new Error("Please enter a valid mobile number.");
      }

      // Hash the password before saving
      const hashedPassword = await hashPassword(formData.password);

      const { data, error } = await supabase
        .from('partners')
        .insert([
          {
            restaurant_name: formData.restaurantName,
            owner_name: formData.ownerName,
            mobile_number: formData.mobileNumber,
            email: formData.email,
            address: formData.address,
            restaurant_type: formData.restaurantType,
            provides_delivery: formData.providesDelivery === 'yes',
            password: hashedPassword // Storing the hash
          }
        ])
        .select()
        .single();

      if (error || !data) {
        throw error || new Error('Failed to create account.');
      }

      // Save user session
      localStorage.setItem('partnerUser', JSON.stringify(data));

      // Success, redirect to Onboarding
      navigate('/partner/setup-profile');
      
    } catch (err) {
      console.error("Error signing up:", err.message);
      setErrorMsg(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Partner With Us" 
      subtitle="Join Fuudr and grow your business today"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-200">
            {errorMsg}
          </div>
        )}

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
          <div className="relative flex items-center">
            <MapPin className="absolute left-4 text-slate-400 pointer-events-none" size={20} />
            <input 
              type="text" 
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full py-3 pl-11 pr-12 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 transition duration-200 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10" 
              placeholder="e.g. 123 Main Street, Sector 4..." 
              required
            />
            <button
              type="button"
              onClick={() => {
                if (formData.address.trim()) {
                  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.address)}`, '_blank');
                } else {
                  alert("Please enter an address first to see it on maps.");
                }
              }}
              title="View on Google Maps"
              className="absolute right-4 text-slate-400 hover:text-orange-500 transition-colors focus:outline-none"
            >
              <MapPinned size={20} />
            </button>
          </div>
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
  );
};

export default SignUp;
