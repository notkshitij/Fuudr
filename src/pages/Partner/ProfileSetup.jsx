import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  Clock, 
  FileText, 
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Image as ImageIcon,
  CalendarDays
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { uploadToCloudinary } from '../../utils/cloudinary';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const ProfileSetup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [user, setUser] = useState(null);

  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    openingTime: '',
    closingTime: '',
    gstNumber: '',
    operatingDays: []
  });

  const [files, setFiles] = useState({
    logo: null,
    fssai: null
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('partnerUser');
    if (!storedUser) {
      navigate('/partner');
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files: fileList } = e.target;
    if (fileList.length > 0) {
      const file = fileList[0];
      const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
      
      if (file.size > MAX_SIZE_BYTES) {
        setErrorMsg(`The file "${file.name}" is too large. Please upload a file smaller than 5MB.`);
        e.target.value = ''; // Reset the input
        return;
      }
      
      setErrorMsg('');
      setFiles(prev => ({ ...prev, [name]: file }));
    }
  };

  const toggleDay = (day) => {
    setFormData(prev => {
      const days = prev.operatingDays.includes(day)
        ? prev.operatingDays.filter(d => d !== day)
        : [...prev.operatingDays, day];
      return { ...prev, operatingDays: days };
    });
  };

  const uploadFile = async (file, path) => {
    try {
      const url = await uploadToCloudinary(file, 'auto');
      return url;
    } catch (err) {
      console.error(`Upload failed for ${path}:`, err);
      throw new Error(`Failed to upload ${path} to Cloudinary. Check your API keys.`);
    }
  };

  const submitProfile = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      let logoUrl = null;
      let fssaiUrl = null;

      if (files.logo) logoUrl = await uploadFile(files.logo, 'logo');
      if (files.fssai) fssaiUrl = await uploadFile(files.fssai, 'fssai');

      const updateData = {
        opening_time: formData.openingTime,
        closing_time: formData.closingTime,
        gst_number: formData.gstNumber || null,
        operating_days: formData.operatingDays,
      };

      if (logoUrl) updateData.logo_url = logoUrl;
      if (fssaiUrl) updateData.fssai_certificate_url = fssaiUrl;

      const { data, error } = await supabase
        .from('partners')
        .update(updateData)
        .eq('id', user.id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Update blocked! You need to add an UPDATE policy in Supabase.");
      }

      setSuccessMsg("Profile setup completed successfully!");
      
      localStorage.setItem('partnerUser', JSON.stringify({
        ...user,
        ...updateData
      }));

      setTimeout(() => {
        navigate('/partner/dashboard');
      }, 1000);

    } catch (err) {
      console.error("Setup Error:", err);
      setErrorMsg(err.message || "Failed to save profile details.");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    // Validation before moving to next step
    if (currentStep === 2 && formData.operatingDays.length === 0) {
      setErrorMsg("Please select at least one operating day.");
      return;
    }
    if (currentStep === 3 && (!formData.openingTime || !formData.closingTime)) {
      setErrorMsg("Please select both opening and closing times.");
      return;
    }
    
    setErrorMsg('');
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    } else {
      submitProfile();
    }
  };

  const skipStep = () => {
    setErrorMsg('');
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    } else {
      submitProfile();
    }
  };

  const prevStep = () => {
    setErrorMsg('');
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!user) return null;

  // Render content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold mb-2 text-slate-900 text-center">Restaurant Logo</h2>
            <p className="text-slate-500 mb-8 text-center">Upload a nice logo for your restaurant. (Optional)</p>
            <div className="relative">
              <input 
                type="file" 
                id="logo"
                name="logo"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <label 
                htmlFor="logo" 
                className="flex items-center justify-center w-full p-10 border-2 border-dashed border-slate-300 rounded-2xl hover:bg-orange-50 hover:border-orange-300 transition-colors cursor-pointer group"
              >
                <div className="text-center">
                  {files.logo ? (
                    <div className="text-orange-600 font-semibold flex flex-col items-center gap-3">
                      <ImageIcon size={48} />
                      <span className="text-lg">{files.logo.name}</span>
                      <span className="text-sm font-normal text-slate-500">Click to change</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto h-12 w-12 text-slate-300 group-hover:text-orange-500 transition-colors mb-4" />
                      <span className="text-lg font-medium text-slate-600">Click to upload your logo</span>
                      <p className="text-sm text-slate-400 mt-2">PNG, JPG up to 5MB</p>
                    </>
                  )}
                </div>
              </label>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold mb-2 text-slate-900 text-center">Operating Days</h2>
            <p className="text-slate-500 mb-8 text-center">Which days are you open for business?</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {DAYS_OF_WEEK.map(day => {
                const isSelected = formData.operatingDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`p-4 rounded-xl border-2 font-medium transition-all flex items-center gap-2 ${
                      isSelected 
                        ? 'border-orange-500 bg-orange-50 text-orange-700' 
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                      isSelected ? 'border-orange-500 bg-orange-500' : 'border-slate-300'
                    }`}>
                      {isSelected && <CheckCircle2 size={14} className="text-white" />}
                    </div>
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold mb-2 text-slate-900 text-center">Operating Hours</h2>
            <p className="text-slate-500 mb-8 text-center">When do you open and close on your working days?</p>
            <div className="flex flex-col gap-6 max-w-md mx-auto">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700">Opening Time</label>
                <div className="relative flex items-center">
                  <Clock className="absolute left-4 text-slate-400 pointer-events-none" size={20} />
                  <input 
                    type="time" 
                    name="openingTime"
                    value={formData.openingTime}
                    onChange={(e) => {
                      handleChange(e);
                      if (e.target.value) e.target.blur(); // Auto close the picker
                    }}
                    onClick={(e) => e.target.showPicker && e.target.showPicker()}
                    onKeyDown={(e) => e.preventDefault()}
                    className="w-full py-4 pl-12 pr-4 border-2 border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-lg transition duration-200 focus:outline-none focus:border-orange-500 focus:bg-white cursor-pointer" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700">Closing Time</label>
                <div className="relative flex items-center">
                  <Clock className="absolute left-4 text-slate-400 pointer-events-none" size={20} />
                  <input 
                    type="time" 
                    name="closingTime"
                    value={formData.closingTime}
                    onChange={(e) => {
                      handleChange(e);
                      if (e.target.value) e.target.blur(); // Auto close the picker
                    }}
                    onClick={(e) => e.target.showPicker && e.target.showPicker()}
                    onKeyDown={(e) => e.preventDefault()}
                    className="w-full py-4 pl-12 pr-4 border-2 border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-lg transition duration-200 focus:outline-none focus:border-orange-500 focus:bg-white cursor-pointer" 
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold mb-2 text-slate-900 text-center">GST Information</h2>
            <p className="text-slate-500 mb-8 text-center">Enter your GST number if you have one. (Optional)</p>
            <div className="max-w-md mx-auto">
              <label className="block text-sm font-medium mb-2 text-slate-700">GST Number</label>
              <div className="relative flex items-center">
                <FileText className="absolute left-4 text-slate-400 pointer-events-none" size={20} />
                <input 
                  type="text" 
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  className="w-full py-4 pl-12 pr-4 border-2 border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-lg transition duration-200 focus:outline-none focus:border-orange-500 focus:bg-white uppercase placeholder-normal" 
                  placeholder="e.g. 22AAAAA0000A1Z5" 
                />
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold mb-2 text-slate-900 text-center">FSSAI Certificate</h2>
            <p className="text-slate-500 mb-8 text-center">Upload your FSSAI registration document. (Optional)</p>
            <div className="relative max-w-lg mx-auto">
              <input 
                type="file" 
                id="fssai"
                name="fssai"
                accept=".pdf,image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <label 
                htmlFor="fssai" 
                className="flex items-center justify-center w-full p-10 border-2 border-dashed border-slate-300 rounded-2xl hover:bg-orange-50 hover:border-orange-300 transition-colors cursor-pointer group"
              >
                <div className="text-center">
                  {files.fssai ? (
                    <div className="text-orange-600 font-semibold flex flex-col items-center gap-3">
                      <FileText size={48} />
                      <span className="text-lg">{files.fssai.name}</span>
                      <span className="text-sm font-normal text-slate-500">Click to change</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto h-12 w-12 text-slate-300 group-hover:text-orange-500 transition-colors mb-4" />
                      <span className="text-lg font-medium text-slate-600">Click to upload FSSAI Document</span>
                      <p className="text-sm text-slate-400 mt-2">PDF, PNG, JPG up to 5MB</p>
                    </>
                  )}
                </div>
              </label>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const isOptional = currentStep === 1 || currentStep === 4 || currentStep === 5;
  const isLastStep = currentStep === 5;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 font-outfit">
      
      {/* Progress Bar */}
      <div className="w-full max-w-2xl mb-8">
        <div className="flex justify-between mb-2 text-sm font-medium text-slate-500">
          <span>Step {currentStep} of 5</span>
          <span>{Math.round((currentStep / 5) * 100)}%</span>
        </div>
        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-orange-500 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-xl p-8 sm:p-12 border border-slate-100 min-h-[400px] flex flex-col relative">
        
        {errorMsg && (
          <div className="absolute top-4 left-8 right-8 bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-200 animate-slideDown">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="absolute top-4 left-8 right-8 bg-green-50 text-green-600 p-3 rounded-lg text-sm font-medium border border-green-200 flex items-center gap-2 animate-slideDown">
            <CheckCircle2 size={20} />
            {successMsg}
          </div>
        )}

        <div className="flex-grow flex flex-col justify-center my-6">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
          <button
            onClick={prevStep}
            disabled={currentStep === 1 || loading}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              currentStep === 1 
                ? 'opacity-0 cursor-default' 
                : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
            }`}
          >
            <ArrowLeft size={20} />
            Back
          </button>

          <div className="flex items-center gap-3">
            {isOptional && !loading && (
              <button
                onClick={skipStep}
                className="px-6 py-3 rounded-xl font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
              >
                Skip
              </button>
            )}
            
            <button
              onClick={nextStep}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 active:scale-95 transition-all shadow-lg hover:shadow-orange-500/30 disabled:opacity-70 disabled:active:scale-100"
            >
              {loading ? 'Saving...' : isLastStep ? 'Complete Setup' : 'Next'}
              {!loading && !isLastStep && <ArrowRight size={20} />}
              {!loading && isLastStep && <CheckCircle2 size={20} />}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfileSetup;
