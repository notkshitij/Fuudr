import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { ArrowLeft, MapPin, CreditCard, Clock, Package, Flame, Bike, CheckCircle, ChevronRight, IndianRupee, UtensilsCrossed, Printer } from 'lucide-react';

const STEPS = [
  { key: 'confirmed',  label: 'Confirmed',  icon: Package, desc: 'Order placed & confirmed' },
  { key: 'preparing', label: 'Preparing',  icon: Flame,   desc: 'Restaurant is cooking' },
  { key: 'on_the_way',label: 'On the Way', icon: Bike,    desc: 'Out for delivery' },
  { key: 'delivered', label: 'Delivered',  icon: CheckCircle, desc: 'Order delivered' },
];

const STEP_INDEX = { confirmed: 0, preparing: 1, on_the_way: 2, delivered: 3 };

export default function ManageOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => { fetchOrderDetails(); }, [id]);

  const fetchOrderDetails = async () => {
    const { data, error } = await supabase.from('orders').select('*').eq('id', id).single();
    if (!error && data) setOrder(data);
    setLoading(false);
  };

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id);
    if (!error) setOrder(prev => ({ ...prev, status: newStatus }));
    setUpdating(false);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const items = Array.isArray(order.items) ? order.items : [];
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - #${order.id.slice(-8).toUpperCase()}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; padding: 40px; color: #000; position: relative; }
          .watermark {
            position: fixed; top: 50%; left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 100px; font-weight: 900; color: rgba(0,0,0,0.04);
            letter-spacing: 10px; pointer-events: none; z-index: 0; white-space: nowrap;
          }
          .content { position: relative; z-index: 1; max-width: 400px; margin: 0 auto; }
          h1 { font-size: 28px; font-weight: 900; letter-spacing: 4px; text-align: center; margin-bottom: 4px; }
          .subtitle { text-align: center; font-size: 12px; color: #666; margin-bottom: 24px; }
          .divider { border-top: 1px dashed #999; margin: 16px 0; }
          .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
          .label { color: #666; }
          .items-header { font-size: 11px; font-weight: 700; letter-spacing: 2px; color: #666; margin-bottom: 10px; }
          .item-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
          .total-row { display: flex; justify-content: space-between; font-size: 16px; font-weight: 700; margin-top: 4px; }
          .footer { text-align: center; font-size: 11px; color: #999; margin-top: 24px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="watermark">FUUDR</div>
        <div class="content">
          <h1>FUUDR</h1>
          <p class="subtitle">Order Receipt</p>
          <div class="divider"></div>
          <div class="row"><span class="label">Order ID</span><span>#${order.id.slice(-8).toUpperCase()}</span></div>
          <div class="row"><span class="label">Date</span><span>${new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
          <div class="row"><span class="label">Time</span><span>${new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
          ${order.restaurant_name ? `<div class="row"><span class="label">Restaurant</span><span>${order.restaurant_name}</span></div>` : ''}
          <div class="divider"></div>
          <div class="row"><span class="label">Customer</span><span>${order.delivery_name || '—'}</span></div>
          <div class="row"><span class="label">Address</span><span style="max-width:200px;text-align:right">${order.delivery_address || '—'}</span></div>
          <div class="row"><span class="label">Pincode</span><span>${order.delivery_pincode || '—'}</span></div>
          <div class="row"><span class="label">Payment</span><span>${order.payment_method || '—'}</span></div>
          <div class="divider"></div>
          <div class="items-header">ITEMS</div>
          ${items.map(item => `
            <div class="item-row">
              <span>${item.dishName} x${item.quantity}</span>
              <span>₹${item.price * item.quantity}</span>
            </div>
          `).join('')}
          <div class="divider"></div>
          <div class="total-row"><span>TOTAL</span><span>₹${order.total_price}</span></div>
          <div class="footer">Thank you for ordering with Fuudr!<br/>fuudr.com</div>
        </div>
        <script>window.onload = () => { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) return (
    <div className="space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-32 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}
    </div>
  );

  if (!order) return (
    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200">
      <p className="font-bold text-red-500 text-lg">Order not found.</p>
      <button onClick={() => navigate('/adminfuudr/orders')} className="mt-4 text-sm text-slate-500 underline">Back to Orders</button>
    </div>
  );

  const items = Array.isArray(order.items) ? order.items : [];
  const currentStep = STEP_INDEX[order.status] ?? 0;

  return (
    <div className="max-w-5xl mx-auto font-outfit pb-12 space-y-6">

      {/* ── Back + Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/adminfuudr/orders')}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
            <button onClick={() => navigate('/adminfuudr/orders')} className="hover:text-slate-700">Orders</button>
            <ChevronRight size={14} />
            <span className="text-slate-700 font-bold">#{order.id.slice(-8).toUpperCase()}</span>
          </div>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-all"
        >
          <Printer size={15} /> Print Receipt
        </button>
      </div>

      {/* ── Order Title + Quick Status ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Order Details</h2>
          <p className="font-mono text-xs text-slate-400 mt-1 font-medium">{order.id}</p>
          <p className="text-sm text-slate-500 mt-2">
            Placed on {new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Update Status</p>
          <div className="flex gap-2 flex-wrap">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = order.status === step.key;
              const isDone = currentStep > idx;
              return (
                <button
                  key={step.key}
                  disabled={updating || isActive}
                  onClick={() => handleStatusChange(step.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                    isActive
                      ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/25'
                      : isDone
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  <Icon size={13} />
                  {step.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Tracking Timeline ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-6 text-sm uppercase tracking-widest text-slate-400">Order Tracking</h3>
        <div className="relative">
          {/* Progress line */}
          <div className="absolute top-5 left-5 right-5 h-0.5 bg-slate-100" />
          <div
            className="absolute top-5 left-5 h-0.5 bg-orange-500 transition-all duration-700"
            style={{ width: `${(currentStep / (STEPS.length - 1)) * (100 - (100 / STEPS.length))}%` }}
          />
          <div className="relative flex justify-between">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const done = currentStep >= idx;
              return (
                <div key={step.key} className="flex flex-col items-center gap-3 w-1/4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center z-10 border-2 transition-all ${
                    done
                      ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/30'
                      : 'bg-white border-slate-200 text-slate-300'
                  }`}>
                    <Icon size={17} />
                  </div>
                  <div className="text-center">
                    <p className={`text-xs font-bold ${ done ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 hidden md:block">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Customer + Order Summary ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Customer Info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-5 text-base">Order Details & Customer</h3>
          <div className="space-y-4">
            <InfoRow icon={<UtensilsCrossed size={16} />} label="Restaurant" value={order.restaurant_name || '—'} />
            <InfoRow icon={<MapPin size={16} />} label="Delivery Name" value={order.delivery_name || '—'} />
            <InfoRow icon={<MapPin size={16} />} label="Address" value={order.delivery_address || '—'} />
            <InfoRow icon={<MapPin size={16} />} label="Pincode" value={order.delivery_pincode || '—'} />
            <InfoRow icon={<CreditCard size={16} />} label="Payment" value={order.payment_method || '—'} />
            <InfoRow icon={<Clock size={16} />} label="Ordered At" value={
              `${new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} · ${new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            } />
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col">
          <h3 className="font-bold text-slate-900 mb-5 text-base">Order Items</h3>
          <div className="space-y-3 flex-1">
            {items.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200">
                  {item.imageUrl
                    ? <img src={item.imageUrl} alt={item.dishName} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">?</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm truncate">{item.dishName}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${item.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {item.isVeg ? 'Veg' : 'Non-veg'} · Qty: {item.quantity}
                  </p>
                </div>
                <p className="font-black text-slate-900 text-sm flex-shrink-0">₹{item.price * item.quantity}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500 flex items-center gap-1"><IndianRupee size={13} />Total</span>
            <span className="text-xl font-black text-slate-900">₹{order.total_price}</span>
          </div>
        </div>

      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-slate-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
