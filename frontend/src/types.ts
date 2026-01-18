// types.ts

/* =========================
   SERVICES (Fixed-price items)
========================= */
export type Service = {
  id: string;
  name: string;
  countLabel: string; // e.g. "100x", "1x", "1 year"

  // Supported currencies
  priceGBP: number;
  pricePKR: number;
  priceUSD: number;

  category: string; // e.g. "Tasbih & Short Duas", "Qur’an Recitation", "Qaza"
};

/* =========================
   DONATIONS (Custom amount)
========================= */
export type DonationItem = {
  id: string;
  name: string;

  // Base prices (used if needed)
  priceGBP: number;
  pricePKR: number;
  priceUSD: number;

  category: "Sadaqah";
  isDonation: true;

  // Custom entered amounts (optional)
  donationGBP?: number;
  donationPKR?: number;
  donationUSD?: number;
};

/* =========================
   CART ITEM
========================= */
export type CartItem = Service | DonationItem;

/* =========================
   PAYMENT DETAILS RESPONSE
========================= */
export type PaymentDetailsResponse = {
  ok: boolean;
  data?: {
    UK: {
      provider: string;
      accountName: string;
      sortCode?: string;
      accountNumber: string; // masked from backend
      currency: "GBP" | "USD" | string; // ✅ FIX (not only "GBP")
    };
    PK: {
      provider: string;
      accountName: string;
      accountNumber: string; // masked from backend
      currency: "PKR" | string; // ✅ FIX
    };

    // Optional – keep for future if you add US details later
    US?: {
      provider: string;
      accountName: string;
      accountNumber: string; // masked from backend
      routingNumber?: string;
      currency: "USD" | string;
    };
  };
  error?: string;
};
