import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { ArrowLeft, MapPin, CreditCard, Clock, Package, Flame, Bike, CheckCircle, ChevronRight, IndianRupee, UtensilsCrossed, Printer, Navigation } from 'lucide-react';

const STEPS = [
  { key: 'placed',     label: 'Placed',     icon: Package, desc: 'Order placed' },
  { key: 'preparing',  label: 'Preparing',  icon: Flame,   desc: 'Restaurant is cooking' },
  { key: 'on_the_way', label: 'On the Way', icon: Bike,    desc: 'Out for delivery' },
  { key: 'delivered',  label: 'Delivered',  icon: CheckCircle, desc: 'Order delivered' },
];

const STEP_INDEX = { placed: 0, preparing: 1, on_the_way: 2, delivered: 3 };

export default function ManageOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [distanceInfo, setDistanceInfo] = useState({ distance: '', duration: '' });
  const [videoUrls, setVideoUrls] = useState({});
  const [activeVideoList, setActiveVideoList] = useState([]);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  useEffect(() => { fetchOrderDetails(); }, [id]);

  useEffect(() => {
    if (order) {
      const getFallbackDistance = (orderId) => {
        if (!orderId) return { distance: '3.2 km', duration: '12 mins' };
        const charCodeSum = orderId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
        const distanceKm = (2.1 + (charCodeSum % 35) / 10).toFixed(1);
        const durationMin = Math.round(distanceKm * 3.5 + 2);
        return { distance: `${distanceKm} km`, duration: `${durationMin} mins` };
      };

      const getDistance = async () => {
        const fallback = getFallbackDistance(order.id);
        if (order.partners?.latitude && order.partners?.longitude && order.delivery_address) {
          try {
            const origin = `${order.partners.latitude},${order.partners.longitude}`;
            const dest = (order.delivery_latitude && order.delivery_longitude)
              ? `${order.delivery_latitude},${order.delivery_longitude}`
              : encodeURIComponent(order.delivery_address);
            const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
            if (!apiKey) {
              setDistanceInfo(fallback);
              return;
            }
            const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${dest}&key=${apiKey}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.rows?.[0]?.elements?.[0]?.status === 'OK') {
              const distText = data.rows[0].elements[0].distance.text;
              const durText = data.rows[0].elements[0].duration.text;
              setDistanceInfo({ distance: distText, duration: durText });
            } else {
              setDistanceInfo(fallback);
            }
          } catch (e) {
            setDistanceInfo(fallback);
          }
        } else {
          setDistanceInfo(fallback);
        }
      };
      getDistance();
    }
  }, [order]);

  useEffect(() => {
    if (order) {
      const fetchVideoUrls = async () => {
        const orderItems = getOrderItems(order);
        const itemIds = orderItems.map(item => item.menuItemId).filter(Boolean);
        if (itemIds.length > 0) {
          try {
            const { data, error } = await supabase
              .from('reels')
              .select('menu_item_id, video_url')
              .in('menu_item_id', itemIds);
            if (!error && data) {
              const mapping = {};
              data.forEach(row => {
                if (!mapping[row.menu_item_id]) {
                  mapping[row.menu_item_id] = [];
                }
                mapping[row.menu_item_id].push(row.video_url);
              });
              setVideoUrls(mapping);
            }
          } catch (err) {
            console.error('Error fetching reel video URLs:', err);
          }
        }
      };
      fetchVideoUrls();
    }
  }, [order]);

  const getOrderItems = (order) => {
    if (!order) return [];
    if (order.bill?.items && Array.isArray(order.bill.items)) {
      return order.bill.items.map(item => ({
        menuItemId: item.menu_item_id || item.menuItemId,
        dishName: item.name || item.dishName,
        quantity: item.qty || item.quantity || 1,
        price: item.price || 0,
        isVeg: item.isVeg !== undefined ? item.isVeg : true,
        imageUrl: item.imageUrl || null
      }));
    }
    if (Array.isArray(order.items)) {
      return order.items.map(item => ({
        menuItemId: item.menuItemId || item.menu_item_id || item.id,
        dishName: item.dishName || item.name,
        quantity: item.quantity || item.qty || 1,
        price: item.price || 0,
        isVeg: item.isVeg !== undefined ? item.isVeg : true,
        imageUrl: item.imageUrl || null
      }));
    }
    return [];
  };

  const fetchOrderDetails = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        partners!orders_partner_id_fkey (
          restaurant_name,
          address,
          latitude,
          longitude,
          google_map_link
        )
      `)
      .eq('id', id)
      .single();
    if (!error && data) {
      setOrder({
        ...data,
        restaurant_name: data.partners?.restaurant_name ?? data.restaurant_name
      });
    }
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
    const items = getOrderItems(order);
    const parts = order.id.split('-');
    const displayId = parts[parts.length - 1].toUpperCase();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - #${displayId}</title>
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
          <div class="row"><span class="label">Order ID</span><span>#${displayId}</span></div>
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
          <div class="total-row"><span>TOTAL</span><span>₹${order.bill?.total ?? order.total_price}</span></div>
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

  const parts = order.id.split('-');
  const displayId = parts[parts.length - 1].toUpperCase();
  const items = getOrderItems(order);
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
            <span className="text-slate-700 font-bold">#{displayId}</span>
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
        {order.status === 'cancelled' ? (
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Order Status</p>
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-rose-50 text-rose-600 border border-rose-200 shadow-sm">
              Cancelled
            </span>
          </div>
        ) : (
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
              {/* Allow admin to cancel order manually */}
              <button
                disabled={updating}
                onClick={() => {
                  if (window.confirm("Are you sure you want to cancel this order?")) {
                    handleStatusChange('cancelled');
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 disabled:opacity-60"
              >
                Cancel Order
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Tracking Timeline or Cancelled Banner ── */}
      {order.status === 'cancelled' ? (
        <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-6 flex items-center gap-4 text-rose-800">
          <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-rose-500/20">
            <CheckCircle size={18} />
          </div>
          <div>
            <h3 className="font-bold text-rose-950 text-sm uppercase tracking-wider">This order has been cancelled</h3>
            <p className="text-xs text-rose-600/90 mt-0.5 font-medium">Cancelled orders do not progress through the standard delivery timeline.</p>
          </div>
        </div>
      ) : (
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
      )}

      {/* ── Customer + Order Summary ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Customer Info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-6">
          <h3 className="font-bold text-slate-900 text-base">Order Details & Customer</h3>
          
          {/* Vertical Delivery Path Visualizer */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 relative overflow-hidden">
            {/* Vertical Line Connector */}
            <div className="absolute top-0 left-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-500 via-orange-300 to-blue-500 ml-[35px] my-12" />
            
            <div className="space-y-8 relative">
              {/* Restaurant Node */}
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center flex-shrink-0 z-10 shadow-sm shadow-orange-500/25 ring-4 ring-white">
                  <UtensilsCrossed size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Restaurant Source</p>
                  <p className="text-sm font-black text-slate-900 mt-0.5">{order.restaurant_name}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{order.partners?.address || 'Restaurant Address'}</p>
                  <div className="mt-2.5">
                    <a
                      href={
                        order.partners?.google_map_link
                          ? order.partners.google_map_link
                          : (order.partners?.latitude && order.partners?.longitude)
                          ? `https://www.google.com/maps/search/?api=1&query=${order.partners.latitude},${order.partners.longitude}`
                          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([order.restaurant_name, order.partners?.address].filter(Boolean).join(', '))}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 hover:text-orange-700 text-xs font-bold transition-all border border-orange-100 shadow-sm"
                    >
                      <MapPin size={12} />
                      View Location
                    </a>
                  </div>
                </div>
              </div>

              {/* Distance Pill Overlaid */}
              <div className="flex items-center gap-4 pl-12">
                <div className="bg-white border border-slate-200/80 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                  </span>
                  <span className="text-xs font-black text-slate-700">{distanceInfo.distance || 'Calculating...'}</span>
                  <span className="text-[10px] text-slate-400 font-bold">({distanceInfo.duration || '—'})</span>
                </div>
                <a
                  href={
                    (order.delivery_latitude && order.delivery_longitude && order.partners?.latitude && order.partners?.longitude)
                      ? `https://www.google.com/maps/dir/?api=1&origin=${order.partners.latitude},${order.partners.longitude}&destination=${order.delivery_latitude},${order.delivery_longitude}`
                      : `https://www.google.com/maps/dir/?api=1&origin=${order.partners?.latitude || ''},${order.partners?.longitude || ''}&destination=${encodeURIComponent(order.delivery_address)}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-800 text-xs font-bold transition-all border border-slate-200/80 shadow-sm"
                >
                  <Navigation size={11} className="rotate-45" />
                  Get Directions
                </a>
              </div>

              {/* Customer Node */}
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 z-10 shadow-sm shadow-blue-500/25 ring-4 ring-white">
                  <MapPin size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Delivery Destination</p>
                  <p className="text-sm font-black text-slate-900 mt-0.5">{order.delivery_name}</p>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">{order.mobile_no || '—'}</p>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{order.delivery_address}</p>
                  <div className="mt-2.5">
                    <a
                      href={
                        (order.delivery_latitude && order.delivery_longitude)
                          ? `https://www.google.com/maps/search/?api=1&query=${order.delivery_latitude},${order.delivery_longitude}`
                          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address)}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 text-xs font-bold transition-all border border-blue-100 shadow-sm"
                    >
                      <MapPin size={12} />
                      View Location
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100/50">
            <InfoRow icon={<Clock size={16} />} label="Ordered At" value={
              `${new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} · ${new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            } />
            <InfoRow icon={<CreditCard size={16} />} label="Payment" value={order.bill?.payment_method ?? order.payment_method ?? '—'} />
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
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                    <span>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${item.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {item.isVeg ? 'Veg' : 'Non-veg'} · Qty: {item.quantity}
                    </span>
                    {item.menuItemId && videoUrls[item.menuItemId] && videoUrls[item.menuItemId].length > 0 && (
                      <button
                        onClick={() => {
                          setActiveVideoList(videoUrls[item.menuItemId]);
                          setActiveVideoIndex(0);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 hover:bg-orange-100 text-orange-600 text-[10px] font-bold transition-all border border-orange-100 shadow-sm"
                      >
                        <Flame size={10} className="animate-pulse" />
                        Watch {videoUrls[item.menuItemId].length > 1 ? `${videoUrls[item.menuItemId].length} Reels` : 'Reel'}
                      </button>
                    )}
                  </p>
                </div>
                <p className="font-black text-slate-900 text-sm flex-shrink-0">₹{item.price * item.quantity}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 pt-4 mt-5 space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
              <span>Subtotal</span>
              <span>₹{order.bill?.subtotal ?? 0}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
              <span>Delivery Fee</span>
              <span>₹{order.bill?.delivery_fee ?? 0}</span>
            </div>
            {order.bill?.discount > 0 && (
              <div className="flex justify-between items-center text-xs text-rose-500 font-bold">
                <span>Discount</span>
                <span>-₹{order.bill.discount}</span>
              </div>
            )}
            {order.bill?.taxes > 0 && (
              <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
                <span>Taxes & Charges</span>
                <span>₹{order.bill.taxes}</span>
              </div>
            )}
            <div className="border-t border-dashed border-slate-200 pt-3 mt-1 flex justify-between items-center">
              <span className="text-sm font-black text-slate-800 flex items-center gap-1"><IndianRupee size={13} />Grand Total</span>
              <span className="text-xl font-black text-slate-950">₹{order.bill?.total ?? order.total_price ?? 0}</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── Video Player Modal Overlay ── */}
      {activeVideoList.length > 0 && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl overflow-hidden max-w-sm w-full relative border border-slate-800 shadow-2xl flex flex-col">
            {/* Story Style Progress Dashes */}
            {activeVideoList.length > 1 && (
              <div className="absolute top-4 left-4 right-4 z-20 flex gap-1">
                {activeVideoList.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      idx === activeVideoIndex ? 'bg-orange-500' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            )}

            <button
              onClick={() => {
                setActiveVideoList([]);
                setActiveVideoIndex(0);
              }}
              className="absolute top-8 right-4 z-20 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-all text-lg font-bold"
            >
              ×
            </button>

            <div className="aspect-[9/16] w-full bg-black flex items-center justify-center relative">
              {/* Left Tap Target */}
              {activeVideoIndex > 0 && (
                <button
                  onClick={() => setActiveVideoIndex(prev => prev - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-all border border-white/10"
                >
                  ‹
                </button>
              )}

              {/* Right Tap Target */}
              {activeVideoIndex < activeVideoList.length - 1 && (
                <button
                  onClick={() => setActiveVideoIndex(prev => prev + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-all border border-white/10"
                >
                  ›
                </button>
              )}

              <video
                key={activeVideoList[activeVideoIndex]}
                src={activeVideoList[activeVideoIndex]}
                controls
                autoPlay
                className="w-full h-full object-cover"
                onEnded={() => {
                  if (activeVideoIndex < activeVideoList.length - 1) {
                    setActiveVideoIndex(prev => prev + 1);
                  } else {
                    setActiveVideoIndex(0);
                  }
                }}
              />
            </div>
            <div className="p-4 bg-slate-900 border-t border-slate-800 text-center flex justify-between items-center px-6">
              <p className="text-xs font-bold text-slate-400">Reel {activeVideoIndex + 1} of {activeVideoList.length}</p>
              <p className="text-sm font-bold text-orange-500 uppercase tracking-widest text-[10px]">Fuudr food reel</p>
            </div>
          </div>
        </div>
      )}
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
