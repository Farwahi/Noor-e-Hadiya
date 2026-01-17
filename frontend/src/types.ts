export type Service = {
  id: string;
  name: string;
  countLabel: string; // e.g. "100x", "1x", "1 year"

  // Existing currencies (keep required)
  priceGBP: number;
  pricePKR: number;

  // ✅ NEW: optional USD support (won’t break anything)
  priceUSD?: number;

  category: string; // e.g. "Tasbih & Short Duas", "Qur’an Recitation", "Qaza"
};

export type DonationItem = {
  id: string;
  name: string;

  // Existing currencies (keep required)
  priceGBP: number;
  pricePKR: number;

  // ✅ NEW: optional USD support
  priceUSD?: number;

  category: "Sadaqah";
  isDonation: true;

  // Optional: store raw custom amount user entered
  donationGBP?: number;
  donationPKR?: number;

  // ✅ NEW: optional USD custom amount
  donationUSD?: number;
};

export type CartItem = Service | DonationItem;

export type PaymentDetailsResponse = {
  ok: boolean;
  data?: {
    UK: {
      provider: string;
      accountName: string;
      sortCode?: string;
      accountNumber: string; // masked from backend
      currency: string;
    };
    PK: {
      provider: string;
      accountName: string;
      accountNumber: string; // masked from backend
      currency: string;
    };

    // ✅ NEW (optional): US payment section if you add it later in backend
    US?: {
      provider: string;
      accountName: string;
      accountNumber: string; // masked from backend
      currency: string; // "USD"
      routingNumber?: string;
    };
  };
  error?: string;
};
