import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const playDing = () => {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.frequency.setValueAtTime(880, ctx.currentTime);
  oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
  
  gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.4);
};

const sendEmailNotification = async (order) => {
  try {
    let itemsList = [];
    if (order.bill?.items && Array.isArray(order.bill.items)) {
      itemsList = order.bill.items.map(i => `${i.name || i.dishName} x${i.qty || i.quantity || 1}`);
    } else if (Array.isArray(order.items)) {
      itemsList = order.items.map(i => `${i.dishName || i.name} x${i.quantity || i.qty || 1}`);
    }
    const totalPrice = order.bill?.total ?? order.total_price ?? 0;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Fuudr Orders <orders@fuudr.com>',
        to: ['solvers.real@gmail.com'],
        subject: `🛍️ New Order - ${order.restaurant_name || 'Restaurant'}`,
        html: `
          <h2>New Order Received!</h2>
          <p><strong>Order ID:</strong> #${order.id?.slice(-8).toUpperCase()}</p>
          <p><strong>Customer:</strong> ${order.delivery_name || '—'}</p>
          <p><strong>Address:</strong> ${order.delivery_address || '—'}</p>
          <p><strong>Restaurant:</strong> ${order.restaurant_name || '—'}</p>
          <p><strong>Items:</strong> ${itemsList.join(', ')}</p>
          <p><strong>Total:</strong> ₹${totalPrice}</p>
          <p><strong>Payment:</strong> ${order.bill?.payment_method ?? order.payment_method ?? '—'}</p>
          <p><strong>Status:</strong> ${order.status}</p>
          <p><strong>Time:</strong> ${new Date(order.created_at).toLocaleString('en-IN')}</p>
        `
      })
    });
  } catch (err) {
    console.error('Email failed to send:', err);
  }
};

export function useNewOrderNotification() {
  const [newOrder, setNewOrder] = useState(null);

  useEffect(() => {
    let timeoutId;
    
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
    
    const channel = supabase
      .channel('new_orders_notification')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        async (payload) => {
          const newOrderData = payload.new;
          
          let partnerName = 'Restaurant';
          if (newOrderData.partner_id) {
            const { data } = await supabase
              .from('partners')
              .select('restaurant_name')
              .eq('id', newOrderData.partner_id)
              .single();
            if (data) partnerName = data.restaurant_name;
          }

          const orderWithRestaurant = {
            ...newOrderData,
            restaurant_name: partnerName
          };

          setNewOrder(orderWithRestaurant);
          playDing();
          sendEmailNotification(orderWithRestaurant);

          const totalPrice = orderWithRestaurant.bill?.total ?? orderWithRestaurant.total_price ?? 0;

          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🛎 New Order — Fuudr', {
              body: `${orderWithRestaurant.delivery_name || 'Customer'} · ₹${totalPrice}`,
              icon: '/favicon.png',
            });
          }

          if (timeoutId) clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            setNewOrder(null);
          }, 5000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const closeToast = () => setNewOrder(null);

  return { newOrder, closeToast };
}
