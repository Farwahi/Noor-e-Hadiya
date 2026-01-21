import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Stripe from "stripe";

dotenv.config();

const app = express();

/* ======================================================
   ✅ SAFE FETCH HELPER (supports Node < 18)
   REQUIREMENT (run once): npm i node-fetch
====================================================== */
async function safeFetch(url, options) {
  if (typeof fetch === "function") return fetch(url, options);

  try {
    const mod = await import("node-fetch");
    return mod.default(url, options);
  } catch (e) {
    throw new Error("Fetch not available. Run: npm i node-fetch (then restart backend).");
  }
}

/* ======================================================
   ✅ HEALTH CHECK (to confirm server running)
====================================================== */
app.get("/api/health", (req, res) => {
  res.json({ ok: true, status: "backend running" });
});

/* ======================================================
   1️⃣ STRIPE INIT (needs to exist before webhook verify)
====================================================== */
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("❌ Missing STRIPE_SECRET_KEY in .env");
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* ======================================================
   2️⃣ STRIPE WEBHOOK (MUST BE FIRST – RAW BODY)
====================================================== */
app.post("/api/webhook", express.raw({ type: "application/json" }), (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    if (!webhookSecret) {
      console.warn("⚠️ STRIPE_WEBHOOK_SECRET not set. Webhook not verified.");
      return res.status(200).send("ok");
    }

    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      console.log("✅ checkout.session.completed:", session.id);
    }

    res.status(200).send("ok");
  } catch (err) {
    console.error("❌ Webhook error:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

/* ======================================================
   3️⃣ NORMAL MIDDLEWARE (AFTER WEBHOOK)
====================================================== */
app.use(express.json());

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

/* ======================================================
   ✅ 3.5️⃣ LIVE METALS ROUTE (NO KEY)
   GET /api/metals?currency=GBP|USD|PKR
   - Tries multiple sources (better success rate)
   - Returns REAL error message if all fail
====================================================== */
app.get("/api/metals", async (req, res) => {
  const currency = String(req.query.currency || "GBP").toUpperCase();
  const allowed = new Set(["GBP", "USD", "PKR"]);
  const cur = allowed.has(currency) ? currency : "GBP";

  const OZ_TO_G = 31.1034768;

  // helper: fetch JSON + show real errors
  const getJson = async (url) => {
    const r = await safeFetch(url, {
      headers: {
        accept: "application/json",
        "user-agent": "Mozilla/5.0 Noor-e-Hadiya/1.0",
      },
    });

    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      throw new Error(
        `Fetch failed ${r.status} for ${url}${txt ? ` | ${txt.slice(0, 160)}` : ""}`
      );
    }
    return r.json();
  };

  try {
    // --------------------------------------------------
    // 1) METALS: Try sources in order
    // --------------------------------------------------
    let goldUsdPerOz = NaN;
    let silverUsdPerOz = NaN;
    let sourceUsed = "";

    // Source A: metals.live
    try {
      const spotJson = await getJson("https://api.metals.live/v1/spot");

      const findVal = (key) => {
        const obj = Array.isArray(spotJson) ? spotJson.find((x) => x && x[key] != null) : null;
        const val = obj ? Number(obj[key]) : NaN;
        return Number.isFinite(val) ? val : NaN;
      };

      goldUsdPerOz = findVal("gold");
      silverUsdPerOz = findVal("silver");
      if (Number.isFinite(goldUsdPerOz) && Number.isFinite(silverUsdPerOz)) {
        sourceUsed = "metals.live";
      }
    } catch (e) {
      // ignore and fallback
    }

    // Source B: goldprice.org
    if (!Number.isFinite(goldUsdPerOz) || !Number.isFinite(silverUsdPerOz)) {
      const gp = await getJson("https://data-asg.goldprice.org/dbXRates/USD");
      goldUsdPerOz = Number(gp?.items?.[0]?.xauPrice);
      silverUsdPerOz = Number(gp?.items?.[0]?.xagPrice);

      if (Number.isFinite(goldUsdPerOz) && Number.isFinite(silverUsdPerOz)) {
        sourceUsed = "goldprice.org";
      }
    }

    // If still invalid -> fail with a clear message
    if (!Number.isFinite(goldUsdPerOz) || !Number.isFinite(silverUsdPerOz)) {
      throw new Error("Metals sources failed (metals.live + goldprice.org). Network or block.");
    }

    // USD/oz -> USD/g
    const goldUsdPerGram = goldUsdPerOz / OZ_TO_G;
    const silverUsdPerGram = silverUsdPerOz / OZ_TO_G;

    // --------------------------------------------------
    // 2) FX: USD -> GBP/PKR (no key)
    // --------------------------------------------------
    let rate = 1;
    if (cur !== "USD") {
      const fxJson = await getJson(
        "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json"
      );
      const fx = fxJson?.usd || {};
      if (cur === "GBP") rate = Number(fx.gbp) || 1;
      if (cur === "PKR") rate = Number(fx.pkr) || 1;
    }

    return res.json({
      ok: true,
      data: {
        currency: cur,
        goldPerGram: goldUsdPerGram * rate,
        silverPerGram: silverUsdPerGram * rate,
        updatedAt: new Date().toISOString(),
        sourceUsed,
      },
    });
  } catch (err) {
    console.error("❌ /api/metals error:", err);
    return res.status(500).json({
      ok: false,
      error: err?.message || String(err),
    });
  }
});

/* ======================================================
   4️⃣ MANUAL PAYMENT DETAILS
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
        provider: "Manual",
        accountName: "Syed Iftikhar Hussain Shah Sherazi",
        accountNumber: "**** **** 3312",
        currency: "PKR",

        bank: {
          bankName: "ABL Bank Pakistan",
          accountTitle: "Syeda Ume Farwa",
          iban: "PK21ABPA0020138324340019",
          accountNumber: "58900020138324340019",
        },
      },
    },
  });
});

/* ======================================================
   5️⃣ STRIPE CHECKOUT SESSION (GBP + USD)
====================================================== */
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { amount, currency, description } = req.body;

    const cur = String(currency || "gbp").toLowerCase();
    const allowed = new Set(["gbp", "usd"]);
    if (!allowed.has(cur)) {
      return res.status(400).json({ ok: false, error: "Unsupported currency" });
    }

    const n = Number(amount);
    if (!n || !Number.isFinite(n) || n <= 0) {
      return res.status(400).json({ ok: false, error: "Invalid amount" });
    }

    const unitAmount = Math.round(n * 100);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],

      line_items: [
        {
          price_data: {
            currency: cur,
            product_data: {
              name: description || "Noor-e-Hadiya Order",
            },
            unit_amount: unitAmount,
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
  console.log(`✅ Health: http://localhost:${PORT}/api/health`);
  console.log(`✅ Webhook: http://localhost:${PORT}/api/webhook`);
  console.log(`✅ Metals test: http://localhost:${PORT}/api/metals?currency=GBP`);
  console.log(`✅ Frontend allowed: ${process.env.FRONTEND_ORIGIN}`);
});
