import { loadGoogleMapsScript } from './utils/loadGoogleMapsScript';
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { ArrowLeft, MapPin, CreditCard, Clock, Package, Flame, Bike, CheckCircle, ChevronRight, IndianRupee, UtensilsCrossed, Printer, Navigation, Phone, GraduationCap, Trash2, X, Loader2, Pencil, Check, BookOpen, Map } from 'lucide-react';
import AdaptiveVideo from '../../components/AdaptiveVideo';

const STEPS = [
  { key: 'placed',     label: 'Placed',     icon: Package,         desc: 'Order placed' },
  { key: 'preparing',  label: 'Preparing',  icon: Flame,           desc: 'Cooking' },
  { key: 'prepared',   label: 'Prepared',   icon: UtensilsCrossed, desc: 'Ready for pickup' },
  { key: 'on_the_way', label: 'On the Way', icon: Bike,            desc: 'Out for delivery' },
  { key: 'delivered',  label: 'Delivered',  icon: CheckCircle,     desc: 'Fulfilled' },
];

const STEP_INDEX = { placed: 0, preparing: 1, prepared: 2, on_the_way: 3, delivered: 4 };

const formatPlacedAt = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const dayMonthYear = date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const time = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return `${dayMonthYear}, ${time}`;
};

const getCustomerInitials = (name) => {
  if (!name) return 'C';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
};

const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const cleaned = String(phone).trim();
  if (!cleaned) return '';
  if (cleaned.startsWith('+')) return cleaned;
  return `+91 ${cleaned}`;
};

const parseBill = (bill) => {
  if (!bill) return {};
  if (typeof bill === 'object') return bill;
  try {
    return JSON.parse(bill);
  } catch (error) {
    console.error('Unable to parse order bill:', error);
    return {};
  }
};

const getPayableTotal = (order) =>
  order?.bill?.customer_total ?? order?.bill?.total ?? order?.total_price ?? 0;

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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
  const [partnerMobileInput, setPartnerMobileInput] = useState('');
  const [editingPartnerMobile, setEditingPartnerMobile] = useState(false);
  const [savingPartnerMobile, setSavingPartnerMobile] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [assignableRiders, setAssignableRiders] = useState(null);
  const [assignmentError, setAssignmentError] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [commissionDraft, setCommissionDraft] = useState('');
  const [editingCommission, setEditingCommission] = useState(false);
  const [savingOrderFields, setSavingOrderFields] = useState(false);
  const [orderFieldsError, setOrderFieldsError] = useState('');

  const handleDeleteOrder = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const { data, error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error("Delete blocked by Supabase RLS policy! 0 rows were deleted. Please run the SQL command in your Supabase SQL Editor to allow DELETE operations.");
      }

      navigate('/adminfuudr/orders');
    } catch (err) {
      console.error('Failed to delete order:', err);
      setDeleteError(err.message || 'Failed to delete order. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => { fetchOrderDetails(); }, [id]);

  useEffect(() => {
    let active = true;
    async function loadRiders() {
      const { data, error } = await supabase.rpc('admin_assignable_riders');
      if (!active) return;
      if (error) setAssignmentError(`Could not load riders: ${error.message}`);
      else setAssignableRiders(data ?? []);
    }
    void loadRiders();
    return () => { active = false; };
  }, []);

  const assignedRiderId = order?.assigned_rider_id;
  useEffect(() => {
    if (!assignedRiderId || assigning) return;
    let active = true;
    let timer;
    async function refreshAssignment() {
      const { data, error } = await supabase.from('orders')
        .select('assigned_rider_id, rider_response').eq('id', id).single();
      if (!active) return;
      if (!error && data) setOrder(previous => previous?.id === id
        ? { ...previous, ...data } : previous);
      timer = setTimeout(refreshAssignment, 5000);
    }
    void refreshAssignment();
    return () => { active = false; clearTimeout(timer); };
  }, [id, assignedRiderId, assigning]);

  async function assignRider(riderId) {
    setAssigning(true);
    setAssignmentError('');
    try {
      const { data, error } = await supabase.rpc('admin_assign_order_rider', {
        p_order_id: id, p_rider_id: riderId,
      });
      if (error) throw error;
      setOrder(previous => previous?.id === id ? { ...previous, assigned_rider_id: data, rider_response: 'pending' } : previous);
    } catch (error) {
      setAssignmentError(`Could not update assignment: ${error.message}`);
    } finally {
      setAssigning(false);
    }
  }

  const saveOrderFields = async (updates) => {
    setSavingOrderFields(true);
    setOrderFieldsError('');
    const { error } = await supabase.from('orders').update(updates).eq('id', id);
    if (error) setOrderFieldsError(`Could not save: ${error.message}`);
    else setOrder(previous => ({ ...previous, ...updates }));
    setSavingOrderFields(false);
    return !error;
  };

  useEffect(() => {
    if (order) {
      setPartnerMobileInput(order.delivery_partner_mobile || '');
    }
  }, [order?.id]);

  useEffect(() => {
    if (order) {
      const getFallbackDistance = (orderObj) => {
        if (
          orderObj.partners?.latitude &&
          orderObj.partners?.longitude &&
          orderObj.delivery_latitude &&
          orderObj.delivery_longitude
        ) {
          const distanceKm = calculateHaversineDistance(
            orderObj.partners.latitude,
            orderObj.partners.longitude,
            orderObj.delivery_latitude,
            orderObj.delivery_longitude
          );
          // Standard estimate: driving distance is usually ~1.25x straight-line distance
          const estDistance = (distanceKm * 1.25).toFixed(1);
          const durationMin = Math.round(estDistance * 3.5 + 2);
          return { distance: `${estDistance} km`, duration: `${durationMin} mins` };
        }

        const orderId = orderObj.id;
        if (!orderId) return { distance: '3.2 km', duration: '12 mins' };
        const charCodeSum = orderId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
        const distanceKm = (2.1 + (charCodeSum % 35) / 10).toFixed(1);
        const durationMin = Math.round(distanceKm * 3.5 + 2);
        return { distance: `${distanceKm} km`, duration: `${durationMin} mins` };
      };

      const getDistance = () => {
        const fallback = getFallbackDistance(order);
        setDistanceInfo(fallback);
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
        imageUrl: item.imageUrl || null,
        variantName: item.variantName || item.variant_name || null,
        addons: Array.isArray(item.addons) ? item.addons.map(addon => ({
          id: addon.addon_id || addon.id,
          name: addon.name || addon.addonName || 'Add-on',
          quantity: addon.qty || addon.quantity || 1,
          price: addon.price || 0,
          isVeg: addon.isVeg !== undefined ? addon.isVeg : true
        })) : []
      }));
    }
    if (Array.isArray(order.items)) {
      return order.items.map(item => ({
        menuItemId: item.menuItemId || item.menu_item_id || item.id,
        dishName: item.dishName || item.name,
        quantity: item.quantity || item.qty || 1,
        price: item.price || 0,
        isVeg: item.isVeg !== undefined ? item.isVeg : true,
        imageUrl: item.imageUrl || null,
        variantName: item.variantName || item.variant_name || null,
        addons: Array.isArray(item.addons) ? item.addons.map(addon => ({
          id: addon.addon_id || addon.id,
          name: addon.name || addon.addonName || 'Add-on',
          quantity: addon.qty || addon.quantity || 1,
          price: addon.price || 0,
          isVeg: addon.isVeg !== undefined ? addon.isVeg : true
        })) : []
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
          owner_name,
          mobile_number,
          address,
          latitude,
          longitude,
          google_map_link,
          is_poornima
        )
      `)
      .eq('id', id)
      .single();
    if (!error && data) {
      let partnerData = data.partners;
      if (!partnerData && data.partner_id) {
        const { data: pData } = await supabase
          .from('partners')
          .select('restaurant_name, owner_name, mobile_number, address, latitude, longitude, google_map_link, is_poornima')
          .eq('id', data.partner_id)
          .single();
        if (pData) partnerData = pData;
      }
      setCommissionDraft(data.commission_amount ?? '');
      setEditingCommission(data.commission_amount == null);
      setOrder({
        ...data,
        partners: partnerData,
        bill: parseBill(data.bill),
        restaurant_name: partnerData?.restaurant_name ?? data.restaurant_name,
        is_poornima: partnerData?.is_poornima ?? data.is_poornima ?? false
      });
    }
    setLoading(false);
  };

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    console.log('[handleStatusChange] Updating order status to:', newStatus, 'for ID:', id);
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id);
    if (error) {
      console.error('[handleStatusChange] Supabase Error:', error);
      alert(`Database Error: ${error.message || JSON.stringify(error)}\nCode: ${error.code || 'None'}`);
    } else {
      console.log('[handleStatusChange] Status updated successfully in DB.');
      setOrder(prev => ({ ...prev, status: newStatus }));
    }
    setUpdating(false);
  };

  const handleSaveDeliveryPartnerMobile = async () => {
    const trimmed = partnerMobileInput.trim();
    if (!/^\d{10}$/.test(trimmed)) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }
    setSavingPartnerMobile(true);
    const { error } = await supabase
      .from('orders')
      .update({ delivery_partner_mobile: trimmed })
      .eq('id', id);
    if (error) {
      console.error('[handleSaveDeliveryPartnerMobile] Supabase Error:', error);
      alert(`Database Error: ${error.message || JSON.stringify(error)}\nCode: ${error.code || 'None'}`);
    } else {
      setOrder(prev => ({ ...prev, delivery_partner_mobile: trimmed }));
      setEditingPartnerMobile(false);
    }
    setSavingPartnerMobile(false);
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
          .addon-row { display: flex; justify-content: space-between; padding-left: 16px; font-size: 11px; color: #666; margin: -2px 0 6px; }
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
          <div class="row"><span class="label">Delivery instructions</span><span style="max-width:200px;text-align:right">${order.delivery_instructions || 'None provided'}</span></div>
          <div class="row"><span class="label">Pincode</span><span>${order.delivery_pincode || '—'}</span></div>
          <div class="row"><span class="label">Payment</span><span>${order.payment_method || '—'}</span></div>
          <div class="divider"></div>
          <div class="items-header">ITEMS</div>
          ${items.map(item => `
            <div class="item-row">
              <span>${item.dishName}${item.variantName ? ` (${item.variantName})` : ''} x${item.quantity}</span>
              <span>₹${item.price * item.quantity}</span>
            </div>
            ${item.addons.map(addon => `
              <div class="addon-row">
                <span>+ ${addon.name} x${addon.quantity}</span>
                <span>₹${addon.price * addon.quantity}</span>
              </div>
            `).join('')}
          `).join('')}
          <div class="divider"></div>
          <div class="row"><span class="label">Items subtotal</span><span>₹${order.bill?.subtotal ?? 0}</span></div>
          ${(order.bill?.addons_total ?? 0) > 0 ? `<div class="row"><span class="label">Add-ons</span><span>₹${order.bill.addons_total}</span></div>` : ''}
          <div class="row"><span class="label">Delivery fee</span><span>₹${order.bill?.delivery_fee ?? 0}</span></div>
          ${Number(order.bill?.small_cart_fee ?? order.bill?.small_cart ?? order.bill?.small_cart_charge ?? order.bill?.small_order_fee ?? 0) > 0 ? `<div class="row"><span class="label">Small cart fee</span><span>₹${order.bill?.small_cart_fee ?? order.bill?.small_cart ?? order.bill?.small_cart_charge ?? order.bill?.small_order_fee}</span></div>` : ''}
          ${Number(order.bill?.packaging_fee ?? order.bill?.packaging_charge ?? order.bill?.restaurant_packaging_fee ?? order.bill?.packaging ?? 0) > 0 ? `<div class="row"><span class="label">Packaging fee</span><span>₹${order.bill?.packaging_fee ?? order.bill?.packaging_charge ?? order.bill?.restaurant_packaging_fee ?? order.bill?.packaging}</span></div>` : ''}
          ${Number(order.bill?.platform_fee ?? order.bill?.handling_fee ?? 0) > 0 ? `<div class="row"><span class="label">Platform fee</span><span>₹${order.bill?.platform_fee ?? order.bill?.handling_fee}</span></div>` : ''}
          ${Number(order.bill?.tip ?? order.bill?.rider_tip ?? 0) > 0 ? `<div class="row"><span class="label">Delivery tip</span><span>₹${order.bill?.tip ?? order.bill?.rider_tip}</span></div>` : ''}
          ${(order.bill?.taxes ?? 0) > 0 ? `<div class="row"><span class="label">Taxes & charges</span><span>₹${order.bill.taxes}</span></div>` : ''}
          ${(order.bill?.discount ?? 0) > 0 ? `<div class="row"><span class="label">Coupon discount${order.bill?.coupon_code ? ` (${order.bill.coupon_code})` : ''}</span><span>-₹${order.bill.discount}</span></div>` : ''}
          ${order.bill?.coupon_code && !(order.bill?.discount > 0) ? `<div class="row"><span class="label">Coupon applied</span><span>${order.bill.coupon_code}</span></div>` : ''}
          <div class="divider"></div>
          <div class="total-row"><span>TOTAL</span><span>₹${getPayableTotal(order)}</span></div>
          <div class="footer">Thank you for ordering with Fuudr!<br/>fuudr.com</div>
        </div>
        <script>window.onload = () => { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  useEffect(() => {
    const onPrint = () => {
      if (order) handlePrint();
    };
    const onDelete = () => {
      if (order) {
        setDeleteError(null);
        setShowDeleteModal(true);
      }
    };
    window.addEventListener('admin:print-receipt', onPrint);
    window.addEventListener('admin:delete-order', onDelete);
    return () => {
      window.removeEventListener('admin:print-receipt', onPrint);
      window.removeEventListener('admin:delete-order', onDelete);
    };
  }, [order]);

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

      {/* ── Order Route & Party Details: Restaurant, Transit Distance, Customer ── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-center gap-4">
          
          {/* Left: Restaurant / Partner Box */}
          <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-4 flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-orange-500/20">
              <BookOpen size={18} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                    {order.restaurant_name || order.partners?.restaurant_name || 'Restaurant'}
                  </h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
                    Partner
                  </span>
                </div>
                {(order.partners?.mobile_number || order.delivery_partner_mobile) && (
                  <a
                    href={`tel:${order.partners?.mobile_number || order.delivery_partner_mobile}`}
                    className="text-orange-600 hover:text-orange-700 font-bold text-xs sm:text-sm shrink-0 transition-colors"
                  >
                    {formatPhoneNumber(order.partners?.mobile_number || order.delivery_partner_mobile)}
                  </a>
                )}
              </div>

              <p className="text-xs text-slate-500 mt-1 font-medium truncate">
                Owner: {order.partners?.owner_name || '—'}
              </p>

              <p className="text-xs text-slate-500 mt-1 leading-relaxed break-words">
                {order.partners?.address || 'Restaurant Address'}
              </p>

              <div className="mt-3">
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
                >
                  <MapPin size={13} className="text-orange-500 shrink-0" />
                  <span>View Location</span>
                </a>
              </div>
            </div>
          </div>

          {/* Center: Transit Distance */}
          <div className="flex flex-col items-center justify-center py-2 px-1 shrink-0">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-orange-200 bg-orange-50/70 text-slate-800 text-xs font-bold shadow-xs whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
              <span>{distanceInfo.distance || '1.8 km'} • {distanceInfo.duration || '8 min'}</span>
            </div>

            <span className="text-[10px] text-slate-400 font-medium tracking-tight mt-1 text-center whitespace-nowrap">
              Transit Distance
            </span>

            <a
              href={
                (order.delivery_latitude && order.delivery_longitude && order.partners?.latitude && order.partners?.longitude)
                  ? `https://www.google.com/maps/dir/?api=1&origin=${order.partners.latitude},${order.partners.longitude}&destination=${order.delivery_latitude},${order.delivery_longitude}`
                  : `https://www.google.com/maps/dir/?api=1&origin=${order.partners?.latitude || ''},${order.partners?.longitude || ''}&destination=${encodeURIComponent(order.delivery_address)}`
              }
              target="_blank"
              rel="noopener noreferrer"
              title="View Route & Directions"
              className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-orange-500 hover:bg-orange-50 hover:border-orange-200 shadow-xs transition-colors mt-2"
            >
              <Map size={15} className="text-orange-500 shrink-0" />
            </a>
          </div>

          {/* Right: Customer Box */}
          <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-4 flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold text-xs sm:text-sm shadow-sm shadow-blue-600/20">
              {getCustomerInitials(order.delivery_name)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                    {order.delivery_name || 'Customer'}
                  </h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100 shrink-0">
                    Customer
                  </span>
                </div>
                {order.mobile_no && (
                  <a
                    href={`tel:${order.mobile_no}`}
                    className="text-blue-600 hover:text-blue-700 font-bold text-xs sm:text-sm shrink-0 transition-colors"
                  >
                    {formatPhoneNumber(order.mobile_no)}
                  </a>
                )}
              </div>

              <p className="text-xs text-slate-500 mt-1 leading-relaxed break-words">
                {order.delivery_address || 'Delivery Address'}
              </p>

              <div className="mt-3">
                <a
                  href={
                    (order.delivery_latitude && order.delivery_longitude)
                      ? `https://www.google.com/maps/search/?api=1&query=${order.delivery_latitude},${order.delivery_longitude}`
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address)}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
                >
                  <MapPin size={13} className="text-orange-500 shrink-0" />
                  <span>View Location</span>
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Order Status Card ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        {/* Top Row: Date Pill & Status Switcher */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Placed Date Badge */}
          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200/60 bg-slate-100/80 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 self-start">
            <Clock size={15} className="text-slate-500 shrink-0" />
            <span>Placed: {formatPlacedAt(order.created_at)}</span>
          </div>

          {/* Status Switcher Buttons */}
          <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50/80 p-1 flex-wrap self-start sm:self-auto">
            {STEPS.map((step) => {
              const isActive = order.status === step.key;
              return (
                <button
                  key={step.key}
                  type="button"
                  disabled={updating}
                  onClick={() => handleStatusChange(step.key)}
                  className={`rounded-xl px-3 sm:px-3.5 py-1.5 text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {step.label}
                </button>
              );
            })}

            {/* Cancel Button */}
            <button
              type="button"
              disabled={updating}
              onClick={() => {
                if (order.status === 'cancelled') {
                  setShowRestoreConfirm(true);
                } else if (window.confirm('Are you sure you want to cancel this order?')) {
                  handleStatusChange('cancelled');
                }
              }}
              className={`rounded-xl px-3 sm:px-3.5 py-1.5 text-xs font-bold transition-all ${
                order.status === 'cancelled'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'border border-rose-200 bg-white text-rose-500 hover:bg-rose-50'
              } disabled:opacity-60`}
            >
              {order.status === 'cancelled' ? 'Cancelled (Restore)' : 'Cancel'}
            </button>
          </div>
        </div>

        {/* Bottom Row: Step Progress Tracker */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="relative">
            {/* Background Track Line */}
            <div className="absolute top-4 sm:top-5 left-[10%] right-[10%] -translate-y-1/2 h-0.5 bg-slate-200" />
            {/* Active Progress Line */}
            {order.status !== 'cancelled' && currentStep > 0 && (
              <div
                className="absolute top-4 sm:top-5 left-[10%] -translate-y-1/2 h-0.5 bg-orange-500 transition-all duration-500"
                style={{ width: `${(currentStep / 4) * 80}%` }}
              />
            )}

            {/* Step Nodes */}
            <div className="relative z-10 grid grid-cols-5 text-center">
              {STEPS.map((step, idx) => {
                const isDone = currentStep > idx;
                const isCurrent = currentStep === idx && order.status !== 'cancelled';
                const isCompletedOrActive = isDone || isCurrent;

                return (
                  <div key={step.key} className="flex flex-col items-center">
                    {/* Step Circle */}
                    <div
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all ${
                        isCompletedOrActive
                          ? 'bg-orange-500 text-white ring-4 sm:ring-8 ring-orange-100 shadow-sm'
                          : 'bg-white border-2 border-slate-200 text-slate-400'
                      }`}
                    >
                      {isCompletedOrActive ? (
                        <Check size={16} className="stroke-[3] text-white" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>

                    {/* Step Title */}
                    <p
                      className={`mt-2.5 text-xs sm:text-sm font-bold ${
                        isCurrent
                          ? 'text-orange-600'
                          : isDone
                          ? 'text-slate-900'
                          : 'text-slate-600'
                      }`}
                    >
                      {step.label}
                    </p>

                    {/* Step Subtext */}
                    <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                      {step.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Right: Rider Mobile Number (No box) */}
        <div className="mt-4 pt-3 border-t border-slate-100/70 flex items-center justify-end text-xs">
          {!editingPartnerMobile ? (
            <div className="flex items-center gap-1.5 text-slate-500">
              <Bike size={14} className="text-slate-400 shrink-0" />
              <span className="text-slate-400 font-medium">Rider:</span>
              <span className="font-bold text-slate-800 font-mono text-xs sm:text-sm">
                {order.delivery_partner_mobile || <span className="text-slate-400 font-sans italic font-normal text-xs">Not assigned</span>}
              </span>
              <button
                type="button"
                onClick={() => {
                  setPartnerMobileInput(order.delivery_partner_mobile || '');
                  setEditingPartnerMobile(true);
                }}
                className="text-slate-400 hover:text-orange-600 transition-colors p-1"
                title="Edit rider phone number"
              >
                <Pencil size={12} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Bike size={14} className="text-orange-500 shrink-0" />
              <span className="text-slate-400 font-medium text-xs">Rider:</span>
              <input
                type="tel"
                maxLength={10}
                value={partnerMobileInput}
                onChange={e => setPartnerMobileInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit mobile"
                className="w-28 px-1.5 py-0.5 text-xs font-semibold border-b border-orange-400 outline-none bg-transparent font-mono"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSaveDeliveryPartnerMobile}
                disabled={savingPartnerMobile || partnerMobileInput.length !== 10}
                className="px-2 py-0.5 rounded bg-orange-500 text-white font-bold text-xs hover:bg-orange-600 disabled:opacity-50"
              >
                {savingPartnerMobile ? '...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setEditingPartnerMobile(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
                title="Cancel"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Cancelled Banner ── */}
      {order.status === 'cancelled' && (
        <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-6 flex items-center gap-4 text-rose-800">
          <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-rose-500/20">
            <CheckCircle size={18} />
          </div>
          <div>
            <h3 className="font-bold text-rose-950 text-sm uppercase tracking-wider">This order has been cancelled</h3>
            <p className="text-xs text-rose-600/90 mt-0.5 font-medium">Cancelled orders do not progress through the standard delivery timeline.</p>
          </div>
        </div>
      )}

      {/* ── Order Items Details & Order Bill ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Order Items Details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-900 text-base">Order Items Details</h3>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[620px] pr-0.5">
            {items.map((item, index) => (
              <div key={index} className="rounded-xl border border-slate-100 bg-slate-50/40 p-3.5 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-xl overflow-hidden flex-shrink-0 border border-slate-200">
                    {item.imageUrl
                      ? <img src={item.imageUrl} alt={item.dishName} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">?</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate">{item.dishName}</p>
                    {item.variantName && <p className="text-xs font-semibold text-orange-600 mt-0.5">Variant: {item.variantName}</p>}
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
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 hover:bg-orange-100 text-orange-600 text-[10px] font-bold transition-all border border-orange-100 shadow-xs"
                        >
                          <Flame size={10} className="animate-pulse" />
                          Watch {videoUrls[item.menuItemId].length > 1 ? `${videoUrls[item.menuItemId].length} Reels` : 'Reel'}
                        </button>
                      )}
                    </p>
                  </div>
                  <p className="font-black text-slate-900 text-sm flex-shrink-0">₹{item.price * item.quantity}</p>
                </div>
                {item.addons.length > 0 && (
                  <div className="mt-3 ml-[60px] space-y-2 border-l-2 border-orange-100 pl-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Add-ons</p>
                    {item.addons.map((addon, addonIndex) => (
                      <div key={addon.id || addonIndex} className="flex items-center justify-between gap-3 text-xs">
                        <span className="font-semibold text-slate-600">+ {addon.name} × {addon.quantity}</span>
                        <span className="font-bold text-slate-700">₹{addon.price * addon.quantity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {order.delivery_instructions && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-wider text-orange-600">Delivery Instructions</p>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-800 bg-orange-50/60 border border-orange-100/80 rounded-xl p-3">
                {order.delivery_instructions}
              </p>
            </div>
          )}
        </div>

        {/* Order Bill */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-900 text-base">Order Bill</h3>
              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                #{displayId}
              </span>
            </div>

            {/* Breakdown Rows */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-xs text-slate-600 font-medium">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-800">₹{order.bill?.subtotal ?? 0}</span>
              </div>
              {(order.bill?.addons_total ?? 0) > 0 && (
                <div className="flex justify-between items-center text-xs text-slate-600 font-medium">
                  <span>Add-ons Total</span>
                  <span className="font-bold text-slate-800">₹{order.bill.addons_total}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs text-slate-600 font-medium">
                <span>Delivery Fee</span>
                <span className="font-bold text-slate-800">₹{order.bill?.delivery_fee ?? 0}</span>
              </div>
              {Number(order.bill?.small_cart_fee ?? order.bill?.small_cart ?? order.bill?.small_cart_charge ?? order.bill?.small_order_fee ?? 0) > 0 && (
                <div className="flex justify-between items-center text-xs text-slate-600 font-medium">
                  <span>Small Cart Fee</span>
                  <span className="font-bold text-slate-800">₹{order.bill?.small_cart_fee ?? order.bill?.small_cart ?? order.bill?.small_cart_charge ?? order.bill?.small_order_fee}</span>
                </div>
              )}
              {Number(order.bill?.packaging_fee ?? order.bill?.packaging_charge ?? order.bill?.restaurant_packaging_fee ?? order.bill?.packaging ?? 0) > 0 && (
                <div className="flex justify-between items-center text-xs text-slate-600 font-medium">
                  <span>Packaging Fee</span>
                  <span className="font-bold text-slate-800">₹{order.bill?.packaging_fee ?? order.bill?.packaging_charge ?? order.bill?.restaurant_packaging_fee ?? order.bill?.packaging}</span>
                </div>
              )}
              {Number(order.bill?.platform_fee ?? order.bill?.handling_fee ?? 0) > 0 && (
                <div className="flex justify-between items-center text-xs text-slate-600 font-medium">
                  <span>Platform Fee</span>
                  <span className="font-bold text-slate-800">₹{order.bill?.platform_fee ?? order.bill?.handling_fee}</span>
                </div>
              )}
              {Number(order.bill?.surge_fee ?? order.bill?.surge_charge ?? order.bill?.rain_fee ?? 0) > 0 && (
                <div className="flex justify-between items-center text-xs text-slate-600 font-medium">
                  <span>Surge Fee</span>
                  <span className="font-bold text-slate-800">₹{order.bill?.surge_fee ?? order.bill?.surge_charge ?? order.bill?.rain_fee}</span>
                </div>
              )}
              {Number(order.bill?.tip ?? order.bill?.rider_tip ?? order.bill?.delivery_tip ?? 0) > 0 && (
                <div className="flex justify-between items-center text-xs text-slate-600 font-medium">
                  <span>Delivery Tip</span>
                  <span className="font-bold text-slate-800">₹{order.bill?.tip ?? order.bill?.rider_tip ?? order.bill?.delivery_tip}</span>
                </div>
              )}
              {order.bill?.discount > 0 && (
                <div className="flex justify-between items-center text-xs text-rose-500 font-bold">
                  <span className="flex items-center gap-1.5">
                    Coupon Discount
                    {order.bill?.coupon_code && (
                      <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-black text-emerald-700 border border-emerald-100">
                        {order.bill.coupon_code}
                      </span>
                    )}
                  </span>
                  <span>-₹{order.bill.discount}</span>
                </div>
              )}
              {order.bill?.coupon_code && !(order.bill?.discount > 0) && (
                <div className="flex justify-between items-center text-xs text-emerald-700 font-bold">
                  <span>Coupon Applied</span>
                  <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-black border border-emerald-100">{order.bill.coupon_code}</span>
                </div>
              )}
              {order.bill?.taxes > 0 && (
                <div className="flex justify-between items-center text-xs text-slate-600 font-medium">
                  <span>Taxes & Charges</span>
                  <span className="font-bold text-slate-800">₹{order.bill.taxes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Grand Total */}
          <div className="border-t border-dashed border-slate-200 pt-4 mt-6 flex justify-between items-center">
            <div>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total Amount</span>
              <span className="text-sm font-black text-slate-800 flex items-center gap-1"><IndianRupee size={13} />Grand Total</span>
            </div>
            <span className="text-2xl font-black text-slate-950 font-mono">₹{getPayableTotal(order)}</span>
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

              <AdaptiveVideo
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

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 relative shadow-2xl border border-slate-100 animate-scaleUp">
            <button
              onClick={() => {
                if (!isDeleting) {
                  setShowDeleteModal(false);
                  setDeleteError(null);
                }
              }}
              disabled={isDeleting}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-full transition-colors disabled:opacity-50"
            >
              <X size={14} />
            </button>

            <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3.5">
              <Trash2 size={22} />
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1.5">
              Delete Order #{displayId}?
            </h3>

            <p className="text-slate-500 text-xs mb-4 leading-relaxed">
              Are you sure you want to permanently delete this order for{' '}
              <strong className="text-slate-700">{order.delivery_name || 'Customer'}</strong>
              {order.restaurant_name ? ` from ${order.restaurant_name}` : ''}? This action cannot be undone.
            </p>

            {deleteError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {deleteError}
              </div>
            )}

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError(null);
                }}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-3 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors text-xs disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteOrder}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-3 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRestoreConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="restore-order-title"
            className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100"
          >
            <div className="w-11 h-11 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-3.5">
              <Package size={22} />
            </div>
            <h3 id="restore-order-title" className="text-base font-bold text-slate-900 mb-1.5">
              Move order back to Placed?
            </h3>
            <p className="text-slate-500 text-xs mb-5 leading-relaxed">
              This will reopen the cancelled order and set its status to Placed.
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowRestoreConfirm(false)}
                className="flex-1 py-2.5 px-3 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors text-xs"
              >
                Keep Cancelled
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={() => {
                  setShowRestoreConfirm(false);
                  handleStatusChange('placed');
                }}
                className="flex-1 py-2.5 px-3 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 transition-colors text-xs disabled:opacity-50"
              >
                Confirm
              </button>
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
