import { useParams } from 'react-router-dom';
import { UtensilsCrossed } from 'lucide-react';

export default function RestaurantMenuItems() {
  const { id } = useParams();
  return (
    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200">
      <UtensilsCrossed size={40} className="text-slate-300 mb-3" />
      <p className="font-bold text-slate-600">Menu Items</p>
      <p className="text-sm text-slate-400 mt-1">Menu items for restaurant <span className="font-mono">{id}</span> will appear here.</p>
    </div>
  );
}
