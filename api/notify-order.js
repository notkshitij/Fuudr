import nodemailer from 'nodemailer';

const GMAIL_USER = 'solvers.real@gmail.com';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Basic security token check
  const authHeader = req.headers['authorization'];
  const expectedToken = process.env.WEBHOOK_SECRET;
  
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    console.warn('Unauthorized webhook access attempt', { authHeader });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = req.body;
    const order = payload.record || payload; 
    
    if (!order || !order.id) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const appPassword = process.env.GMAIL_APP_PASSWORD;
    if (!appPassword) {
      console.error('GMAIL_APP_PASSWORD not set in environment secrets');
      return res.status(500).json({ error: 'SMTP configurations missing' });
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: GMAIL_USER,
        pass: appPassword,
      },
    });

    const info = await transporter.sendMail({
      from: `"Fuudr Orders" <${GMAIL_USER}>`,
      to: GMAIL_USER,
      subject: `🔔 New Order Received: #${order.id}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; background: #fff; color: #333;">
          <h2 style="color: #FF4500; margin-top: 0;">New Order Placed!</h2>
          <p style="color: #666; font-size: 15px;">A new order has been successfully placed in the database.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 6px 0; color: #888;">Order ID:</td><td style="padding: 6px 0; font-weight: bold; text-align: right;">${order.id}</td></tr>
            <tr><td style="padding: 6px 0; color: #888;">Customer:</td><td style="padding: 6px 0; font-weight: bold; text-align: right;">${order.delivery_name || 'N/A'}</td></tr>
            <tr><td style="padding: 6px 0; color: #888;">Address:</td><td style="padding: 6px 0; font-weight: bold; text-align: right;">${order.delivery_address || 'N/A'}</td></tr>
            <tr><td style="padding: 6px 0; color: #888;">Total Amount:</td><td style="padding: 6px 0; font-weight: bold; text-align: right; color: #2e7d32; font-size: 16px;">$${order.total_price || '0.00'}</td></tr>
          </table>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <div style="text-align: center; margin-top: 25px;">
            <a href="https://fuudr-admin.vercel.app/" style="background: #FF4500; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View Live Orders Portal</a>
          </div>
        </div>
      `,
    });

    console.log('Order email notification sent successfully', { orderId: order.id, messageId: info.messageId });
    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Failed to process order notification email', { error: error.message });
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
