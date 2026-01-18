import React from "react";

export default function Home() {
  return (
    <div className="home-page">
      <div className="page">
        <div className="page-inner">
          {/* HERO */}
          <div className="home-hero home-hero--single home-hero-bg-photo">
            <div className="home-hero-left">
              <div className="badge">Donation-based Qur’anic & Amal services</div>

              <h1 className="home-title">Noor-e-Hadiya</h1>

              <p className="home-subtitle">
                Noor e Hadiya is a compassionate platform created to help families offer Qur’anic recitations, prayers, and other sacred acts as hadiya (spiritual gifts) for their deceased loved ones. Through this service, families can arrange Qur’an recitation, supplications, and other holy practices on behalf of those who have passed away, with the intention of seeking mercy, forgiveness, and ongoing reward for them. The fidya and ujrah associated with these services are distributed to deserving and poor families who carry out these acts of worship, helping them meet their daily needs with dignity. In this way, Noor e Hadiya connects remembrance of the deceased with charity, compassion, and sustained support for those in need, creating lasting reward (sadaqah jariyah) for both the giver and the departed.
               The fidya for missed fasts and missed obligatory prayers is calculated according to established Shia scholarly rulings, based on a fixed amount equivalent to feeding the poor.
              </p>
            </div>
          </div>

          {/* MISSION */}
          <div className="card section-card">
            <h2 className="section-title">Our Mission</h2>
            <p className="section-text">
              Noor-e-Hadiya exists to make it easy for families to send spiritual gifts for their loved ones through
              trusted, clear, and respectful services. We focus on simplicity, affordability, and dignity in every request.
            </p>
          </div>

          {/* VISION */}
          <div className="card section-card">
            <h2 className="section-title">Our Vision</h2>
            <p className="section-text">
              Our vision is to build a reliable and transparent platform where families can contribute Sadaqah Jariyah and
              Qur’anic recitations with confidence — connecting hearts through faith, dua, and ongoing reward.
            </p>
          </div>

          {/* HOW IT WORKS */}
          <div className="card section-card">
            <h2 className="section-title">How It Works</h2>
            <ol className="section-list">
              <li>Select services from the Services page.</li>
              <li>Add to cart and proceed to Checkout.</li>
              <li>Pay online (GBP)(USD) or manually (PKR).</li>
              <li>Confirm payment via WhatsApp with your Reference ID.</li>
            </ol>
          </div>

          {/* END PARAGRAPH */}
          <div className="card section-card">
            <p className="section-text" style={{ margin: 0 }}>
              We pray Allah (SWT) accepts your intention, grants mercy to your loved ones, and makes this contribution a
              source of continuous reward (Sadaqah Jariyah). Ameen.
            </p>
          </div>        
        </div>
        </div>
      </div>
  );
}
