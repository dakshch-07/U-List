import { Platform, Alert } from 'react-native';
import { api } from '../services/api';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayPaymentOptions {
  type: 'extra_ad' | 'highlight_ad';
  adId?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  onSuccess: (data: any) => void;
  onFailure?: (error: any) => void;
}

// Dynamically load Razorpay Checkout script on Web
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const initiateRazorpayPayment = async (options: RazorpayPaymentOptions): Promise<void> => {
  try {
    // 1. Create order on backend
    const orderRes = await api.post('/payments/create-order', {
      type: options.type,
      adId: options.adId,
    });

    if (!orderRes.data.success) {
      throw new Error(orderRes.data.message || 'Failed to initiate payment');
    }

    const { orderId, amount, currency, keyId, paymentDbId } = orderRes.data.data;

    if (Platform.OS === 'web') {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      // Live Razorpay Checkout Modal
      const rzpOptions = {
        key: keyId,
        amount: amount * 100, // in paise
        currency: currency || 'INR',
        name: 'Ulist Marketplace',
        description:
          options.type === 'extra_ad'
            ? '6th Ad Onwards Fee - ₹29'
            : 'Highlighted Ad Tag (30 Days) - ₹99',
        order_id: orderId,
        image: 'https://www.ulist.in/favicon.ico',
        prefill: {
          name: options.userName || 'Ulist User',
          email: options.userEmail || 'support@ulist.in',
          contact: options.userPhone || '',
        },
        theme: {
          color: '#D9480F',
        },
        handler: async (response: any) => {
          try {
            const verifyRes = await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentDbId,
            });
            if (verifyRes.data.success) {
              options.onSuccess(verifyRes.data);
            } else {
              throw new Error(verifyRes.data.message || 'Verification failed');
            }
          } catch (vErr: any) {
            options.onFailure?.(vErr);
            if (typeof window !== 'undefined' && window.alert) {
              window.alert(vErr.message || 'Payment verification failed');
            } else {
              Alert.alert('Payment Error', vErr.message || 'Payment verification failed');
            }
          }
        },
        modal: {
          ondismiss: () => {
            options.onFailure?.({ message: 'Payment cancelled by user' });
          },
        },
      };

      const razorpayInstance = new window.Razorpay(rzpOptions);
      razorpayInstance.open();
    } else {
      // Mobile native fallback
      Alert.alert(
        'Online Payment',
        `Please complete the payment of ₹${amount} via Ulist web or enter Razorpay mobile credentials.`,
        [
          {
            text: 'OK',
            onPress: () => {
              options.onFailure?.({ message: 'Mobile checkout' });
            },
          },
        ]
      );
    }
  } catch (err: any) {
    const errMsg = err.response?.data?.message || err.message || 'Payment process encountered an error';
    Alert.alert('Payment Failed', errMsg);
    options.onFailure?.(err);
  }
};
