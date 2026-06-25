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
