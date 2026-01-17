export type Service = {
  id: string;
  name: string;
  countLabel: string; // e.g. "100x", "1x", "1 year"
  priceGBP: number;
  pricePKR: number;
  category: string; // e.g. "Tasbih & Short Duas", "Qur’an Recitation", "Qaza"
};

export type DonationItem = {
  id: string;
  name: string;
  priceGBP: number;
  pricePKR: number;
  category: "Sadaqah";
  isDonation: true;
  donationGBP?: number;
  donationPKR?: number;
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
  };
  error?: string;
};
