export const ACTIVE_ORDER_STATUSES = ['placed', 'preparing', 'prepared', 'on_the_way'];

const indiaDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
});

export function orderDateKey(value) {
  const date = new Date(value);
  return value && Number.isFinite(date.getTime()) ? indiaDate.format(date) : '';
}

export const getOrderType = (order) => {
  if (order.order_type === 'pickup' || order.order_type === 'delivery') return order.order_type;

  // Older orders may only store the type in the bill.
  let bill = order.bill;
  if (typeof bill === 'string') {
    try {
      bill = JSON.parse(bill);
    } catch {
      return 'delivery';
    }
  }
  return bill?.fulfillment_mode === 'pickup' ? 'pickup' : 'delivery';
};

