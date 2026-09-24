import { Alert } from "react-native";
import RazorpayCheckout from "react-native-razorpay";

export type RazorpaySuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type RazorpayCheckoutOptions = {
  keyId: string;
  orderId: string;
  amountMinor: number;
  name?: string;
  description?: string;
  prefill?: { email?: string; contact?: string; name?: string };
};

export async function openRazorpayCheckout(opts: RazorpayCheckoutOptions): Promise<RazorpaySuccess> {
  try {
    const result = await RazorpayCheckout.open({
      key: opts.keyId,
      amount: opts.amountMinor,
      currency: "INR",
      name: opts.name ?? "Trade Fair Wala",
      description: opts.description ?? "Complete payment",
      order_id: opts.orderId,
      prefill: opts.prefill,
      theme: { color: "#10b981" },
    });
    return {
      razorpay_order_id: result.razorpay_order_id,
      razorpay_payment_id: result.razorpay_payment_id,
      razorpay_signature: result.razorpay_signature,
    };
  } catch (e: unknown) {
    const err = e as { code?: number; description?: string; message?: string };
    const msg = err.description ?? err.message ?? String(e);
    if (err.code === 0 || /cancel/i.test(msg)) {
      throw new Error("cancelled");
    }
    if (/native module|cannot find module|razorpay/i.test(msg)) {
      Alert.alert(
        "Payments need a native build",
        "Install the dev app with: npx expo run:android (or run:ios). Expo Go does not include Razorpay SDK."
      );
    }
    throw new Error(msg || "Payment failed");
  }
}
