import React, { useState, useEffect } from 'react';
import { 
  Power, 
  AlertTriangle, 
  Send, 
  Clock, 
  CloudRain, 
  Wrench, 
  Moon,
  Info,
  X,
  Check
} from 'lucide-react';
import { supabase } from '../../../supabaseClient';

const PRESET_MESSAGES = [
  {
    icon: Moon,
    label: 'Night Closure',
    text: "We are currently closed for the night! Fuudr delivery opens back up tomorrow morning at 9:00 AM."
  },
  {
    icon: CloudRain,
    label: 'Weather Delay',
    text: "Deliveries are temporarily paused due to heavy rain. We'll be back online soon!"
  },
  {
    icon: Wrench,
    label: 'Maintenance',
    text: "Fuudr is undergoing a brief system upgrade. We will be back shortly!"
  },
  {
    icon: Clock,
    label: 'High Demand',
    text: "Ordering is briefly paused due to high order volume. Check back in a few minutes."
  }
];

export function PlatformStatusToggle() {
  const [isOnline, setIsOnline] = useState(true);
  const [offlineMessage, setOfflineMessage] = useState(
    "Fuudr is temporarily offline. We are not accepting new orders right now. Please check back soon!"
  );
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Fetch current platform status from Supabase (with fallback to localStorage)
  const fetchStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('key', 'app_status')
        .single();

      if (!error && data && data.value) {
        setIsOnline(data.value.is_online ?? true);
        if (data.value.offline_message) {
          setOfflineMessage(data.value.offline_message);
        }
      } else {
        const local = localStorage.getItem('fuudr_app_status');
        if (local) {
          const parsed = JSON.parse(local);
          setIsOnline(parsed.is_online ?? true);
          if (parsed.offline_message) setOfflineMessage(parsed.offline_message);
        }
      }
    } catch (err) {
      console.warn("Could not fetch platform_settings from Supabase:", err);
      const local = localStorage.getItem('fuudr_app_status');
      if (local) {
        const parsed = JSON.parse(local);
        setIsOnline(parsed.is_online ?? true);
        if (parsed.offline_message) setOfflineMessage(parsed.offline_message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    const sub = supabase
      .channel('platform_settings_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'platform_settings' },
        (payload) => {
          if (payload.new && payload.new.key === 'app_status' && payload.new.value) {
            setIsOnline(payload.new.value.is_online ?? true);
            if (payload.new.value.offline_message) {
              setOfflineMessage(payload.new.value.offline_message);
            }
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, []);

  const updatePlatformStatus = async (newOnlineState, newMsg = offlineMessage) => {
    setIsSaving(true);
    const payloadValue = {
      is_online: newOnlineState,
      offline_message: newMsg,
      updated_at: new Date().toISOString()
    };

    localStorage.setItem('fuudr_app_status', JSON.stringify(payloadValue));

    try {
      const { error } = await supabase
        .from('platform_settings')
        .upsert({
          key: 'app_status',
          value: payloadValue,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      if (error && error.code !== '42P01') {
        console.error("Error updating platform status in Supabase:", error);
      }
      setIsOnline(newOnlineState);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.warn("Using local persistence for platform status:", err);
      setIsOnline(newOnlineState);
    } finally {
      setIsSaving(false);
      setShowConfirmModal(false);
    }
  };

  const handleToggleClick = () => {
    if (isOnline) {
      setShowConfirmModal(true);
    } else {
      updatePlatformStatus(true);
    }
  };

  const handleSaveMessage = (e) => {
    e.preventDefault();
    updatePlatformStatus(isOnline, offlineMessage);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
      
      {/* Compact Master Toggle Bar */}
      <div className={`p-4 sm:p-5 transition-colors duration-300 ${
        isOnline 
          ? 'bg-emerald-50/40 border-b border-emerald-100/60' 
          : 'bg-rose-50/60 border-b border-rose-100'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Status Header */}
          <div className="flex items-center gap-3.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs transition-colors duration-300 ${
              isOnline 
                ? 'bg-emerald-500 text-white' 
                : 'bg-rose-500 text-white animate-pulse'
            }`}>
              <Power size={20} className={isOnline ? '' : 'rotate-180'} />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  {isOnline ? 'Fuudr is Live' : 'Fuudr is Offline / Paused'}
                </h3>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                  isOnline 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {isOnline 
                  ? 'Accepting customer orders across all restaurants.' 
                  : 'Customer ordering is disabled. Offline message is shown in app.'}
              </p>
            </div>
          </div>

          {/* Compact Switch Button */}
          <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={handleToggleClick}
              disabled={loading || isSaving}
              className={`relative w-20 h-10 rounded-full p-1 transition-all duration-300 focus:outline-none cursor-pointer select-none ${
                isOnline 
                  ? 'bg-emerald-500 hover:bg-emerald-600' 
                  : 'bg-rose-500 hover:bg-rose-600'
              }`}
              title={isOnline ? "Turn Fuudr OFF" : "Turn Fuudr ON"}
            >
              <div className={`w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center transform transition-transform duration-300 font-black text-[10px] ${
                isOnline 
                  ? 'translate-x-10 text-emerald-600' 
                  : 'translate-x-0 text-rose-600'
              }`}>
                {isOnline ? 'ON' : 'OFF'}
              </div>
            </button>
          </div>

        </div>
      </div>

      {/* When Fuudr is OFF: Compact Message Configurator (No Phone Preview) */}
      {!isOnline && (
        <div className="p-4 sm:p-5 bg-slate-50/70 animate-fadeIn space-y-3.5">
          
          {/* Presets Row */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <AlertTriangle className="text-amber-500" size={14} />
              <span>App Offline Notice Message:</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400 font-semibold mr-1">Presets:</span>
              {PRESET_MESSAGES.map((preset, idx) => {
                const Icon = preset.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setOfflineMessage(preset.text)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Icon size={12} className="text-slate-400" />
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form with Textarea & Save */}
          <form onSubmit={handleSaveMessage} className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-end">
            <div className="flex-1">
              <textarea
                rows={2}
                value={offlineMessage}
                onChange={(e) => setOfflineMessage(e.target.value)}
                required
                placeholder="Write a message for mobile app users..."
                className="w-full p-2.5 bg-white border border-slate-200 focus:border-orange-500 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-colors resize-none shadow-xs"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0 self-end sm:self-auto h-10"
            >
              {isSaving ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : saveSuccess ? (
                <Check size={13} className="text-emerald-400" />
              ) : (
                <Send size={13} />
              )}
              <span>{saveSuccess ? 'Saved!' : 'Update Message'}</span>
            </button>
          </form>

        </div>
      )}

      {/* Confirmation Modal when turning Fuudr OFF */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 relative shadow-2xl animate-scaleUp border border-slate-100">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-full transition-colors"
            >
              <X size={14} />
            </button>

            <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3.5">
              <AlertTriangle size={22} />
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1.5">
              Pause Fuudr Service?
            </h3>
            
            <p className="text-slate-500 text-xs mb-5 leading-relaxed">
              Turning Fuudr <strong className="text-rose-600">OFF</strong> will pause checkout in the mobile app and display your offline message to customers.
            </p>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 px-3 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors text-xs"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={() => updatePlatformStatus(false)}
                disabled={isSaving}
                className="flex-1 py-2.5 px-3 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors text-xs flex items-center justify-center gap-1.5"
              >
                {isSaving ? 'Pausing...' : 'Yes, Turn OFF'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
