// types.ts

/* =========================
   SERVICE CATEGORIES
   (Refined + Backward-compatible aliases)
========================= */
export type ServiceCategory =
  // ✅ New refined categories (recommended)
  | "Tasbih & Duas"
  | "Qur’an & Surah Recitation"
  | "Qaza Namaz"
  | "Qaza Roza"
  | "Additional Ziyārah & Special Services"

  // ✅ Old categories still used in some files (aliases to avoid errors)
  | "Tasbih & Short Duas"
  | "Quran Recitation"
  | "Qur’an Recitation"
  | "Qaza"
  | "Roza (Qaza)";

/* =========================
   SERVICES (Fixed-price items)
========================= */
export type Service = {
  id: string;
  name: string;

  // Optional display helpers
  countLabel?: string; // e.g. "100x", "11x", "1 Prayer", "1 Fast", "1x"
  category?: ServiceCategory;
  icon?: string; // emoji / icon path / icon name

  // Supported currencies
  priceGBP: number;
  pricePKR: number;
  priceUSD: number;
};

/* =========================
   DONATIONS (Custom amount)
========================= */
export type DonationCategory = "Sadaqah" | "Additional Custom";

export type DonationItem = {
  id: string;
  name: string;

  // Base prices (used if needed)
  priceGBP: number;
  pricePKR: number;
  priceUSD: number;

  category: DonationCategory;
  isDonation: true;

  // Custom entered amounts (optional)
  donationGBP?: number;
  donationPKR?: number;
  donationUSD?: number;

  // ✅ Manual request details (for Additional custom services)
  notes?: string;
  location?: string;
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
      currency: "GBP" | "USD" | string;
    };
    PK: {
      provider: string;
      accountName: string;
      accountNumber: string; // masked from backend
      currency: "PKR" | string;
    };

    // Optional – future ready
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
