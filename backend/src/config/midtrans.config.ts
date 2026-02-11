import { registerAs } from '@nestjs/config';

export default registerAs('midtrans', () => ({
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
  merchantId: process.env.MIDTRANS_MERCHANT_ID,
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  snapUrl: process.env.MIDTRANS_IS_PRODUCTION === 'true'
    ? 'https://app.midtrans.com/snap/v1'
    : 'https://app.sandbox.midtrans.com/snap/v1',
  apiUrl: process.env.MIDTRANS_IS_PRODUCTION === 'true'
    ? 'https://api.midtrans.com/v2'
    : 'https://api.sandbox.midtrans.com/v2',
}));
