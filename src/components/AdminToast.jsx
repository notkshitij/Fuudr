import React from 'react';
import { X } from 'lucide-react';

export function AdminToast({ order, onClose }) {
  if (!order) return null;

  return (
    <div className="fixed top-6 right-6 z-[9999] animate-slide-in-right font-outfit">
      <div className="bg-[#0f172a] border border-[#FF6B00] rounded-xl shadow-2xl p-4 min-w-[280px] flex items-start gap-4">
        <div className="flex-1">
          <h4 className="text-white font-bold text-base flex items-center gap-2">
            <span>🛎</span> New Order!
          </h4>
          <p className="text-slate-300 text-sm mt-1">
            {order.delivery_name || 'Unknown'} &middot; ₹{order.bill?.total ?? order.total_price}
          </p>
        </div>
        <button 
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
