import React, { useEffect, useState } from "react";

const WHATSAPP_NUMBER = "447551214149"; // no +, no spaces

type Review = {
  name: string;
  rating: number;
  text: string;
  date: string;
};

function renderStars(rating: number): string {
  const full = Math.max(1, Math.min(5, rating));
  return "★★★★★".slice(0, full) + "☆☆☆☆☆".slice(0, 5 - full);
}

export default function Contact() {
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}`;

  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem("neh_reviews");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [
      {
        name: "Customer",
        rating: 5,
        text: "Very easy process and quick response on WhatsApp. JazakAllah.",
        date: new Date().toISOString(),
      },
      {
        name: "Customer",
        rating: 5,
        text: "Clear pricing and respectful service. Highly recommended.",
        date: new Date().toISOString(),
      },
    ];
  });

  const [name, setName] = useState<string>("");
  const [rating, setRating] = useState<number>(5);
  const [text, setText] = useState<string>("");

  useEffect(() => {
    localStorage.setItem("neh_reviews", JSON.stringify(reviews));
  }, [reviews]);

  function submitReview(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!text.trim()) {
      alert("Please write your review.");
      return;
    }

    const newReview: Review = {
      name: name.trim() || "Customer",
      rating,
      text: text.trim(),
      date: new Date().toISOString(),
    };

    setReviews((prev) => [newReview, ...prev]);
    setName("");
    setRating(5);
    setText("");
  }

  return (
    <div className="page">
      <div className="page-inner">
        {/* ⬇️ THIS IS THE IMPORTANT PART */}
        <div
          className="card"
          style={{
            marginTop: 18,
            maxWidth: 980,          // 🔥 NARROWER CARD
            marginLeft: "auto",     // 🔥 CENTER
            marginRight: "auto",    // 🔥 CENTER
            padding: "28px 48px",   // nice inner spacing
          }}
        >
          <h1 className="page-heading" style={{ marginTop: 0 }}>
            Contact
          </h1>

          <p className="muted">
            For questions, manual payment confirmation, or support — contact us on WhatsApp.
          </p>

          <div style={{ marginTop: 16 }}>
            <p>
              <b>WhatsApp:</b> +44 7551 214149
            </p>

            <a
              className="btn btn-primary"
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              style={{ width: "auto", marginTop: 10 }}
            >
              Chat on WhatsApp
            </a>
          </div>

          <hr style={{ opacity: 0.15, margin: "26px 0" }} />

          <h3>Address</h3>
          <p className="muted">Address will be added soon.</p>

          <hr style={{ opacity: 0.15, margin: "26px 0" }} />

          <h3>Customer Reviews</h3>

          {/* Leave Review */}
          <div className="card" style={{ marginTop: 14 }}>
            <b>Leave a Review</b>

            <form onSubmit={submitReview} style={{ marginTop: 12 }}>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 220px" }}>
                  <label className="muted">Name (optional)</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    style={{
                      width: "100%",
                      padding: 10,
                      borderRadius: 12,
                      border: "1px solid rgba(15,138,95,.25)",
                      marginTop: 6,
                    }}
                  />
                </div>

                <div style={{ width: 220 }}>
                  <label className="muted">Rating</label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: 10,
                      borderRadius: 12,
                      border: "1px solid rgba(15,138,95,.25)",
                      marginTop: 6,
                    }}
                  >
                    <option value={5}>★★★★★ (5)</option>
                    <option value={4}>★★★★☆ (4)</option>
                    <option value={3}>★★★☆☆ (3)</option>
                    <option value={2}>★★☆☆☆ (2)</option>
                    <option value={1}>★☆☆☆☆ (1)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <label className="muted">Your review</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={3}
                  placeholder="Write your experience..."
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 12,
                    border: "1px solid rgba(15,138,95,.25)",
                    marginTop: 6,
                    resize: "vertical",
                  }}
                />
              </div>

              <button
                className="btn btn-primary"
                type="submit"
                style={{ width: "auto", marginTop: 14 }}
              >
                Submit Review
              </button>
            </form>
          </div>

          {/* Reviews List */}
          <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
            {reviews.map((r, idx) => (
              <div key={`${r.date}-${idx}`} className="card">
                <b>{renderStars(r.rating)}</b>
                <p className="muted" style={{ marginTop: 6 }}>
                  “{r.text}”
                </p>
                <p className="muted" style={{ marginTop: 6, fontSize: 12 }}>
                  — {r.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
