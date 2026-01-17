export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">

        {/* FOLLOW US */}
        <div className="social-wrap">
          <div className="social-title">Follow us</div>

          <div className="social-icons">
            <a className="social-icon" href="https://facebook.com" target="_blank" rel="noreferrer">
              <img src="/social/facebook.png" alt="Facebook" />
            </a>

            <a className="social-icon" href="https://instagram.com" target="_blank" rel="noreferrer">
              <img src="/social/instagram.png" alt="Instagram" />
            </a>

            <a className="social-icon" href="https://tiktok.com" target="_blank" rel="noreferrer">
              <img src="/social/tiktok.png" alt="TikTok" />
            </a>

            <a className="social-icon" href="https://youtube.com" target="_blank" rel="noreferrer">
              <img src="/social/youtube.png" alt="YouTube" />
            </a>

            <a className="social-icon" href="https://wa.me/447551214149" target="_blank" rel="noreferrer">
              <img src="/social/whatsapp.png" alt="WhatsApp" />
            </a>
          </div>
        </div>

        {/* COPYRIGHT */}
        <div className="footer-copy">
          © {new Date().getFullYear()} IFA Services — Noor e Hadiya. All rights reserved.
        </div>

      </div>
    </footer>
  );
}
