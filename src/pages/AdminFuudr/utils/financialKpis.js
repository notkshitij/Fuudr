const amount = value => Number.isFinite(Number(value)) ? Number(value) : 0;

export function calculateFinancialKpis(orders, adjustments = {}) {
  let sales = 0;
  let delivery = 0;
  let discount = 0;
  let missingBills = 0;
  for (const order of orders) {
    if (order.status === 'cancelled') continue;
    const bill = order.bill;
    if (bill?.subtotal == null || bill?.delivery_fee == null) {
      missingBills++;
      continue;
    }
    sales += amount(bill.subtotal) + amount(bill.addons_total);
    delivery += amount(bill.delivery_fee);
    discount += amount(bill.discount);
  }
  const configured = ['fixedExpenses', 'otherExpenses'].every(key =>
    adjustments[key] !== '' && adjustments[key] != null && Number.isFinite(Number(adjustments[key])) && Number(adjustments[key]) >= 0
  );
  const revenue = delivery;
  const expenses = configured ? amount(adjustments.fixedExpenses) + amount(adjustments.otherExpenses) : null;
  const profit = revenue - discount;
  return { sales, grossSales: sales + delivery, revenue, discount, profit, expenses,
    profitAndLoss: configured ? profit - expenses : null, missingBills };
}
