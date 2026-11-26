import { useParams } from 'react-router-dom';
import { Settings } from 'lucide-react';

export default function RestaurantAdminSettings() {
  const { id } = useParams();
  return (
    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200">
      <Settings size={40} className="text-slate-300 mb-3" />
      <p className="font-bold text-slate-600">Restaurant Settings</p>
      <p className="text-sm text-slate-400 mt-1">Settings for restaurant <span className="font-mono">{id}</span> will appear here.</p>
    </div>
  );
}
