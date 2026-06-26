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
          <p><strong>Customer:</strong> ${order.delivery_name}</p>
          <p><strong>Address:</strong> ${order.delivery_address}</p>
          <p><strong>Restaurant:</strong> ${order.restaurant_name}</p>
          <p><strong>Items:</strong> ${order.items?.map(i => `${i.dishName} x${i.quantity}`).join(', ')}</p>
          <p><strong>Total:</strong> ₹${order.total_price}</p>
          <p><strong>Payment:</strong> ${order.payment_method}</p>
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
        (payload) => {
          setNewOrder(payload.new);
          playDing();
          sendEmailNotification(payload.new);

          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🛎 New Order — Fuudr', {
              body: `${payload.new.delivery_name || 'Customer'} · ₹${payload.new.total_price}`,
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
