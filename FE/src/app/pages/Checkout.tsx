import { useState } from "react";
import { useNavigate } from "react-router";
import { QrCode, DollarSign, Check } from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

interface CheckoutProps {
  cartItems: { productId: string; quantity: number }[];
  onClearCart: () => void;
}

export function Checkout({ cartItems, onClearCart }: CheckoutProps) {
  const [paymentMethod, setPaymentMethod] = useState<"bank" | "cash">("bank");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const { createOrder, logActivity } = useAdmin();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { products } = require("../data/products");

  const orderItems = cartItems.map((item) => {
    const product = products.find((p: any) => p.id === item.productId);
    return {
      productId: item.productId,
      productName: product?.name || "Unknown",
      quantity: item.quantity,
      price: product?.price || 0,
    };
  });

  const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmitOrder = () => {
    if (paymentMethod === "cash" && !email && !phone) {
      toast.error("Please provide email or phone number");
      return;
    }

    const orderId = createOrder({
      userId: user?.email || email || phone,
      userName: user?.name || "Guest",
      userEmail: email || user?.email || "",
      items: orderItems,
      total,
      paymentMethod,
      paymentStatus: "pending",
    });

    logActivity({
      type: "purchase",
      userId: user?.email || email || phone,
      userName: user?.name || "Guest",
      description: `Created order ${orderId} (${paymentMethod} payment)`,
    });

    setShowSuccess(true);
    onClearCart();

    setTimeout(() => {
      if (paymentMethod === "cash") {
        navigate("/");
        toast.success("Order created! Please visit our store to complete payment.");
      } else {
        navigate("/");
        toast.success("Order created! Please complete the bank transfer.");
      }
    }, 3000);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-secondary" />
          </div>
          <h2 className="mb-4">Order Placed Successfully!</h2>
          <p className="text-muted-foreground mb-6">
            {paymentMethod === "bank"
              ? "Please complete the bank transfer to confirm your order."
              : "Please visit our store to complete the cash payment."}
          </p>
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h2 className="mb-4">Order Summary</h2>
              <div className="space-y-3">
                {orderItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="text-muted-foreground">
                      {item.productName} x{item.quantity}
                    </span>
                    <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="pt-3 border-t border-border flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-6 border border-border">
              <h2 className="mb-4">Select Payment Method</h2>
              <div className="space-y-3">
                <button
                  onClick={() => setPaymentMethod("bank")}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === "bank"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <QrCode className="w-6 h-6 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">Bank Transfer</p>
                      <p className="text-sm text-muted-foreground">Pay via QR code</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod("cash")}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === "cash"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-6 h-6 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">Cash at Store</p>
                      <p className="text-sm text-muted-foreground">Pay when you visit</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {paymentMethod === "cash" && !user && (
              <div className="bg-card rounded-2xl p-6 border border-border">
                <h3 className="mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div className="text-center text-sm text-muted-foreground">- OR -</div>
                  <div>
                    <label className="block mb-2 text-sm">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="0123456789"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            {paymentMethod === "bank" && (
              <div className="bg-card rounded-2xl p-6 border border-border sticky top-24">
                <h2 className="mb-4">Bank Transfer Details</h2>
                <div className="bg-primary/5 rounded-xl p-6 mb-6">
                  <div className="w-48 h-48 bg-white rounded-xl mx-auto mb-4 p-4 flex items-center justify-center">
                    <div className="text-center">
                      <QrCode className="w-32 h-32 text-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">QR Code</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Bank</p>
                    <p className="font-medium">Sacombank</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Account Number</p>
                    <p className="font-medium">0703339186</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Account Name</p>
                    <p className="font-medium">NGUYEN TRAN TU</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Transfer Content</p>
                    <p className="font-medium">Thanh toán ngân hàng</p>
                  </div>
                  <div className="pt-3 border-t border-border">
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-bold text-xl text-primary">${total.toFixed(2)}</p>
                  </div>
                </div>

                <button
                  onClick={handleSubmitOrder}
                  className="w-full mt-6 bg-primary text-primary-foreground py-4 rounded-full hover:bg-primary/90 transition-colors"
                >
                  Complete Order
                </button>
              </div>
            )}

            {paymentMethod === "cash" && (
              <div className="bg-card rounded-2xl p-6 border border-border sticky top-24">
                <h2 className="mb-4">Cash Payment</h2>
                <div className="space-y-4 mb-6">
                  <p className="text-muted-foreground">
                    Your order will be reserved. Please visit our store to complete the payment.
                  </p>
                  <div className="bg-secondary/10 rounded-xl p-4">
                    <p className="text-sm font-medium mb-2">Store Location:</p>
                    <p className="text-sm text-muted-foreground">
                      CozyStitch Store<br />
                      123 Craft Street<br />
                      Handmade District
                    </p>
                  </div>
                  <div className="bg-secondary/10 rounded-xl p-4">
                    <p className="text-sm font-medium mb-2">Total to Pay:</p>
                    <p className="text-2xl font-bold text-primary">${total.toFixed(2)}</p>
                  </div>
                </div>

                <button
                  onClick={handleSubmitOrder}
                  className="w-full bg-primary text-primary-foreground py-4 rounded-full hover:bg-primary/90 transition-colors"
                >
                  Reserve Order
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
