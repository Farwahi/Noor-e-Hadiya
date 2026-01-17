import React from "react";

export default function About() {
  return (
    <div className="container">
      <div
        className="card"
        style={{
          marginTop: 18,
          maxWidth: 1100,          // ⬅️ wider card
          marginLeft: "auto",
          marginRight: "auto",
          padding: "24px 20px",    // ⬅️ less left/right space
          boxSizing: "border-box",
        }}
      >
        <h1 style={{ marginTop: 0 }}>About Noor-e-Hadiya</h1>

        <p className="muted" style={{ lineHeight: 1.65 }}>
          Noor-e-Hadiya was established with the intention of creating meaningful
          and lawful benefit for both those who give and those who serve. The
          platform seeks to support financially vulnerable families by providing
          dignified, permissible opportunities to earn through the performance
          of Qur’anic recitation, prayers, and related religious services,
          enabling them to manage daily financial challenges with independence.
          At the same time, Noor-e-Hadiya offers families a trusted and
          accessible means to arrange spiritual gifts for their deceased or
          unwell loved ones, ensuring that religious obligations and devotional
          intentions are fulfilled with care and responsibility.
        </p>

        <hr style={{ opacity: 0.15, margin: "14px 0" }} />

        <h3 style={{ marginTop: 0 }}>Fund Distribution and Assurance</h3>
        <p className="muted" style={{ lineHeight: 1.65 }}>
          Contributions received through Noor-e-Hadiya are distributed
          transparently and responsibly to eligible service providers and
          deserving families who rely on this work as a source of lawful income.
          Confirmation of completed services is shared directly where
          appropriate.
        </p>

        <h3>Sadaqah Jaariyah and Shared Spiritual Benefit</h3>
        <ul className="muted" style={{ marginTop: 8, lineHeight: 1.65 }}>
          <li>Continuous reward (ṣadaqah jāriyah) through sincere worship.</li>
          <li>Shared spiritual benefit for all involved.</li>
          <li>Seeking Allah’s mercy in this life and the hereafter.</li>
        </ul>
      </div>
    </div>
  );
}
