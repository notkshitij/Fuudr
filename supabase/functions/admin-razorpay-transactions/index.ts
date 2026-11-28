import { createClient } from 'npm:@supabase/supabase-js@2.108.2';

interface RazorpayPayment {
  id: string;
  order_id: string | null;
  amount: number;
  currency: string;
  status: string;
  method: string | null;
  amount_refunded: number;
  created_at: number;
}

const pageSize = 25;
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json',
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return json({ error: 'Sign in to continue.' }, 401);

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authorization } },
    });
    const { data: isAdmin, error: authError } = await supabase.rpc('is_admin');
    if (authError) {
      console.error('Could not check transaction access:', authError.code);
      return json({ error: 'Could not verify admin access.' }, 502);
    }
    if (isAdmin !== true) return json({ error: 'Admin access is required.' }, 403);

    const body = await request.json().catch(() => null);
    const page = body?.page ?? 0;
    const now = Math.floor(Date.now() / 1000);
    const asOf = body?.asOf ?? now;
    if (!body || !Number.isSafeInteger(page) || page < 0 || page > Math.floor(Number.MAX_SAFE_INTEGER / pageSize)
      || !Number.isSafeInteger(asOf) || asOf <= 0 || asOf > now) {
      return json({ error: 'Invalid payment page.' }, 400);
    }

    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!keyId || !keySecret) return json({ error: 'Razorpay credentials are not configured.' }, 503);

    const url = new URL('https://api.razorpay.com/v1/payments');
    url.search = new URLSearchParams({
      count: String(pageSize + 1), skip: String(page * pageSize), to: String(asOf),
    }).toString();
    const response = await fetch(url, {
      headers: { Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}` },
      signal: AbortSignal.timeout(10000),
    });
    const result: { items?: RazorpayPayment[] } = await response.json();
    if (!response.ok || !Array.isArray(result?.items)) {
      console.error('Razorpay payment list failed:', response.status);
      return json({ error: 'Razorpay could not return payments. Try again.' }, 502);
    }

    const payments = result.items.slice(0, pageSize).map(payment => ({
      id: payment.id,
      orderId: payment.order_id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      refunded: payment.amount_refunded,
      createdAt: payment.created_at,
    }));
    return json({
      payments,
      hasNext: result.items.length > pageSize,
      asOf,
      mode: keyId.startsWith('rzp_live_') ? 'live' : keyId.startsWith('rzp_test_') ? 'test' : null,
    });
  } catch {
    return json({ error: 'Could not load Razorpay payments. Try again.' }, 502);
  }
});
