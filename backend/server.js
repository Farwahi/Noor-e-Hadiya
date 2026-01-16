import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Stripe from "stripe";

dotenv.config();

const app = express();

/* ======================================================
   1️⃣ STRIPE WEBHOOK (MUST BE FIRST – RAW BODY)
====================================================== */
app.post("/api/webhook", express.raw({ type: "application/json" }), (req, res) => {
  const sig = req.headers["stripe-signature"];

  try {
    console.log("✅ Stripe webhook received");
    res.status(200).send("ok");
  } catch (err) {
    console.error("❌ Webhook error:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

/* ======================================================
   2️⃣ NORMAL MIDDLEWARE (AFTER WEBHOOK)
====================================================== */
app.use(express.json());

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

/* ======================================================
   3️⃣ STRIPE INIT
====================================================== */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* ======================================================
   4️⃣ MANUAL PAYMENT DETAILS (UPDATED WITH BANK TRANSFER)
====================================================== */
app.get("/api/payment-details", (req, res) => {
  res.json({
    ok: true,
    data: {
      UK: {
        provider: "Wise",
        accountName: "Ume Farwa Syeda",
        sortCode: "23-08-01",
        accountNumber: "**** **** 1181",
        currency: "GBP",
      },

      PK: {
        // ✅ Wallet receiver (EasyPaisa/JazzCash/etc) - shown for EasyPaisa/JazzCash/UPaisa in frontend
        provider: "Manual",
        accountName: "Syed Iftikhar Hussain Shah Sherazi",
        accountNumber: "**** **** 3312",
        currency: "PKR",

        // ✅ Bank Transfer receiver (shown only when user selects Bank Transfer)
        bank: {
          bankName: "ABL Bank Pakistan",
          accountTitle: "Syeda Ume Farwa",
          iban: "PK21ABPA0020138324340019",
          accountNumber: "58900020138324340019",
          // swift: "", // optional (add if you have)
        },
      },
    },
  });
});

/* ======================================================
   5️⃣ STRIPE CHECKOUT SESSION
====================================================== */
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ ok: false, error: "Invalid amount" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: description || "Noor-e-Hadiya Order",
            },
            unit_amount: Math.round(amount * 100), // GBP → pennies
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_ORIGIN}/checkout?success=1`,
      cancel_url: `${process.env.FRONTEND_ORIGIN}/checkout?canceled=1`,
    });

    res.json({ ok: true, url: session.url });
  } catch (err) {
    console.error("❌ Stripe session error:", err);
    res.status(500).json({ ok: false, error: "Stripe session failed" });
  }
});

/* ======================================================
   6️⃣ START SERVER
====================================================== */
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
  console.log(`✅ Webhook: http://localhost:${PORT}/api/webhook`);
  console.log(`✅ Frontend allowed: ${process.env.FRONTEND_ORIGIN}`);
});
