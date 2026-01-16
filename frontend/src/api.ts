const API_BASE = "http://localhost:4000/api";

export type PaymentDetailsResponse = {
  ok: boolean;
  data: {
    UK: { provider: string; accountName: string; sortCode: string; accountNumber: string; currency: string };
    PK: { provider: string; accountName: string; accountNumber: string; currency: string };
  };
};

export async function getPaymentDetails(): Promise<PaymentDetailsResponse> {
  const res = await fetch(`${API_BASE}/payment-details`);
  if (!res.ok) throw new Error("Failed to load payment details");
  return res.json();
}

export async function createCheckoutSession(body: {
  amount: number;
  currency: string;
  description: string;
}): Promise<{ ok: boolean; url?: string; error?: string }> {
  const res = await fetch(`${API_BASE}/create-checkout-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return res.json();
}
