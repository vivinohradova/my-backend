const express = require("express");
const Stripe = require("stripe");
const cors = require("cors");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 5000; // Render даст порт автоматически


// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend работает 🎉");
});

app.post("/create-checkout-session", async (req, res) => {
  try {
    const rawAmount = req.body?.amount; // может прийти строкой
    const currency = (req.body?.currency || "usd").toLowerCase();

    // Разрешённые валюты
    const allowed = ["usd", "eur", "jpy"];
    if (!allowed.includes(currency)) {
      return res.status(400).json({ error: "Unsupported currency" });
    }

    // Проверка суммы
    const numericAmount = Number(rawAmount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // JPY — без центов, USD/EUR — в центах
    let unitAmount;
    if (currency === "jpy") {
      if (!Number.isInteger(numericAmount)) {
        return res.status(400).json({ error: "JPY amount must be an integer" });
      }
      unitAmount = numericAmount; // целое число
    } else {
      unitAmount = Math.round(numericAmount * 100);
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"], // можно и не указывать, но так нагляднее
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency,
            product_data: { name: "Custom payment" },
            unit_amount: unitAmount, // целое число
          },
          quantity: 1,
        },
      ],
      success_url: "https://vivinohradova.github.io/ira/success",
      cancel_url: "https://vivinohradova.github.io/ira/cancel",
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// app.listen(4242, () => console.log("Backend running on http://localhost:4242"));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
