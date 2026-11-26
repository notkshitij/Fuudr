import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Package } from 'lucide-react';
import { getOrderType } from '../utils/orderOverview';

export const STATUS_CONFIG = {
  all:        { label: 'All Orders',  color: 'text-slate-700',   bg: 'bg-slate-100',  dot: 'bg-slate-400' },
  active:     { label: 'Active',      color: 'text-blue-700',    bg: 'bg-blue-50',    dot: 'bg-blue-500' },
  placed:     { label: 'Placed',      color: 'text-slate-700',   bg: 'bg-slate-100',  dot: 'bg-slate-500' },
  preparing:  { label: 'Preparing',   color: 'text-amber-700',   bg: 'bg-amber-50',   dot: 'bg-amber-500' },
  prepared:   { label: 'Prepared',    color: 'text-violet-700',  bg: 'bg-violet-50',  dot: 'bg-violet-500' },
  on_the_way: { label: 'On the Way',  color: 'text-blue-700',    bg: 'bg-blue-50',    dot: 'bg-blue-500' },
  delivered:  { label: 'Delivered',   color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  cancelled:  { label: 'Cancelled',   color: 'text-rose-700',    bg: 'bg-rose-50',    dot: 'bg-rose-500' },
};

export const ORDER_TYPE_CONFIG = {
  delivery: {
    label: 'Delivery',
    row: 'bg-sky-50 hover:bg-sky-100',
    badge: 'bg-sky-100 text-sky-800',
  },
  pickup: {
    label: 'Pickup',
    row: 'bg-amber-50 hover:bg-amber-100',
    badge: 'bg-amber-100 text-amber-900',
  },
};

export function getOrderItems(order) {
  let items = [];
  if (order?.bill?.items && Array.isArray(order.bill.items)) {
    items = order.bill.items.map(i => ({
      dishName: i.name || i.dishName,
      quantity: i.qty || i.quantity || 1,
      price: i.price || 0,
      isVeg: i.isVeg !== undefined ? i.isVeg : true,
    }));
  } else if (Array.isArray(order?.items)) {
    items = order.items.map(i => ({
      dishName: i.dishName || i.name,
      quantity: i.quantity || i.qty || 1,
      price: i.price || 0,
      isVeg: i.isVeg !== undefined ? i.isVeg : true,
    }));
  }
  return items;
}

const getCustomerKey = (order) => {
  const customerId = order.customer_id ?? order.user_id ?? order.profile_id;
  if (customerId) return `id:${customerId}`;
  const mobileNumber = String(order.mobile_no ?? '').replace(/\D/g, '');
  return mobileNumber ? `mobile:${mobileNumber.slice(-10)}` : null;
};

export const markFirstOrders = (orders = []) => {
  const firstOrderByCustomer = new Map();
  [...orders]
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .forEach((order) => {
      const customerKey = getCustomerKey(order);
      if (customerKey && !firstOrderByCustomer.has(customerKey)) {
        firstOrderByCustomer.set(customerKey, order.id);
      }
    });

  return orders.map((order) => {
    const customerKey = getCustomerKey(order);
    return {
      ...order,
      is_first_order: customerKey
        ? firstOrderByCustomer.get(customerKey) === order.id
        : false,
    };
  });
};

export default function OrdersTableView({
  orders = [],
  loading = false,
  emptyMessage = 'No orders found.',
  showRestaurant = true,
  basePath = '/adminfuudr/orders',
}) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="space-y-3 p-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-50 border border-slate-100" />
        ))}
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package size={36} className="mb-2 text-slate-300" />
        <p className="text-sm font-bold text-slate-600">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400">Order</th>
            <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400">Customer</th>
            {showRestaurant && (
              <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400">Restaurant</th>
            )}
            <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400">Items</th>
            <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400">Total</th>
            <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400">Time</th>
            <th className="px-5 py-3.5 text-center text-[11px] font-black uppercase tracking-wider text-slate-400">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {orders.map((order) => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.placed;
            const orderTypeKey = getOrderType(order);
            const orderType = ORDER_TYPE_CONFIG[orderTypeKey] || ORDER_TYPE_CONFIG.delivery;
            const parts = String(order.id).split('-');
            const displayId = parts[parts.length - 1].toUpperCase();

            const items = getOrderItems(order);
            const preview = items.slice(0, 2).map((i) => i.dishName).join(', ');
            const extra = items.length > 2 ? ` +${items.length - 2}` : '';
            const totalPrice =
              order.bill?.customer_total ?? order.bill?.total ?? order.total_price ?? 0;
            const restaurantName =
              order.partners?.restaurant_name || order.restaurant_name || '—';
            const isPoornima =
              order.partners?.is_poornima ?? order.is_poornima ?? false;

            return (
              <tr
                key={order.id}
                onClick={() => navigate(`${basePath}/${order.id}`)}
                className={`cursor-pointer transition-colors ${orderType.row}`}
              >
                {/* Order ID & Type */}
                <td className="whitespace-nowrap px-5 py-4">
                  <div className="flex flex-col items-start gap-1">
                    <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs font-bold text-slate-500">
                      #{displayId}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${orderType.badge}`}>
                      {orderType.label}
                    </span>
                  </div>
                </td>

                {/* Customer */}
                <td className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-900">
                      {order.delivery_name || 'N/A'}
                    </span>
                    {order.is_first_order && (
                      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-700">
                        1st Order
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 max-w-[180px] truncate text-xs text-slate-400">
                    {order.delivery_address || '—'}
                  </div>
                </td>

                {/* Restaurant */}
                {showRestaurant && (
                  <td className="px-5 py-4">
                    <div className="max-w-[160px] truncate text-sm font-bold text-slate-900">
                      {restaurantName}
                    </div>
                    {isPoornima && (
                      <div className="mt-1">
                        <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-extrabold text-purple-700">
                          <GraduationCap size={10} /> Inside Poornima
                        </span>
                      </div>
                    )}
                  </td>
                )}

                {/* Items */}
                <td className="px-5 py-4">
                  <div className="max-w-[180px] truncate text-sm text-slate-600">
                    {preview || '—'}
                    {extra ? <span className="text-slate-400">{extra} more</span> : ''}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-400">
                    {items.length} item{items.length !== 1 ? 's' : ''}
                  </div>
                </td>

                {/* Total */}
                <td className="whitespace-nowrap px-5 py-4">
                  <span className="font-black text-slate-900">₹{totalPrice}</span>
                </td>

                {/* Time */}
                <td className="whitespace-nowrap px-5 py-4">
                  <div className="text-sm font-medium text-slate-700">
                    {new Date(order.created_at).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-400">
                    {new Date(order.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </td>

                {/* Status */}
                <td className="whitespace-nowrap px-5 py-4 text-center">
                  <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${cfg.bg} ${cfg.color}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
