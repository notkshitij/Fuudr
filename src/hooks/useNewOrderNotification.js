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

// NOTE: order emails are sent server-side only (Supabase database webhook -> /api/notify-order).
// No email API keys exist in the browser.

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

          const totalPrice = orderWithRestaurant.bill?.customer_total ?? orderWithRestaurant.bill?.total ?? orderWithRestaurant.total_price ?? 0;

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
