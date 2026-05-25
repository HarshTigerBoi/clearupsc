export {};

declare global {
  interface Window {
    Razorpay?: new (options: {
      key: string;
      subscription_id?: string;
      name: string;
      description: string;
      handler: (response: {
        razorpay_payment_id: string;
        razorpay_subscription_id?: string;
        razorpay_signature: string;
      }) => void;
      prefill?: { email?: string; name?: string };
      theme?: { color?: string };
    }) => { open: () => void };
  }
}
