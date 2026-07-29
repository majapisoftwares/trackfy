import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner container">
        <Link className="footer-logo" href="/" aria-label="Trackfy — início">
          <Image className="logo-mark" src="/assets/logo-mark.svg" width={24} height={28} alt="" />
          <span className="footer-word">trackfy</span>
        </Link>
        <div className="footer-meta">
          <a
            className="tmdb-credit"
            href="https://www.themoviedb.org/"
            target="_blank"
            rel="noreferrer"
            aria-label="Alimentado por TMDB"
          >
            <Image src="/assets/tmdb-logo.svg" width={56} height={24} alt="TMDB" />
          </a>
          <a className="instagram" href="#" aria-label="Instagram da Trackfy">
            <Image src="/assets/instagram-outer.svg" alt="" fill />
            <Image className="instagram-inner" src="/assets/instagram-inner.svg" alt="" width={12} height={12} />
            <Image className="instagram-dot" src="/assets/instagram-dot.svg" alt="" width={3} height={3} />
          </a>
        </div>
      </div>
    </footer>
  );
}
