declare module "react-native-razorpay" {
  export type RazorpayOpenOptions = {
    key: string;
    amount: number;
    currency?: string;
    name?: string;
    description?: string;
    order_id?: string;
    prefill?: { email?: string; contact?: string; name?: string };
    theme?: { color?: string };
  };

  export type RazorpayOpenResult = {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  };

  const RazorpayCheckout: {
    open(options: RazorpayOpenOptions): Promise<RazorpayOpenResult>;
  };

  export default RazorpayCheckout;
}
