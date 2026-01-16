export type Service = {
  id: string;
  name: string;
  countLabel: string; // e.g. "100x", "1x", "1 year"
  priceGBP: number;
  pricePKR: number;
  category: string; // e.g. "Tasbeeh", "Quran", "Qaza"
};

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
