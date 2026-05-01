// site.jsx — Ugly Burger marketing site. Exposes <UglySite /> on window.
// Expects window.Burger from burger.jsx and the styles.css theme classes.

const { useState, useEffect, useRef, useMemo } = React;

// Runtime open/today detection
const _now = new Date();
const _todayName = _now.toLocaleString('en-US', { weekday: 'long' });
const _hour = _now.getHours();
const IS_OPEN = _hour >= 11 && _hour < 21;

// ===== DATA =====
const MENU = {
  burgers: [
    { name: "Hamburger", desc: "Ugly sauce", price: "9", num: "01" },
    { name: "Cheeseburger", desc: "American cheese, ugly sauce", price: "10.5", num: "02" },
    { name: "Bacon Cheeseburger", desc: "Bacon, American cheese, ugly sauce", price: "13", num: "03" },
    { name: "Ugly Burger", desc: "Avocado, bacon, American cheese, sautéed onion, ugly sauce", price: "12", num: "04", flag: "SIGNATURE" },
    { name: "Jalapeño Burger", desc: "Pepper jack cheese, pickled jalapeño, sriracha sauce", price: "13", num: "05" },
    { name: "Mushroom Burger", desc: "Swiss cheese, sautéed mushroom, sautéed onion, ugly sauce", price: "11", num: "06" },
    { name: "BBQ Bacon Cheeseburger", desc: "Bacon, American cheese, sautéed onion, BBQ sauce", price: "12", num: "07" },
    { name: "Blue Cheeseburger", desc: "Blue cheese, ugly sauce", price: "13", num: "08" },
  ],
  notBurgers: [
    { name: "Chicken Strips & Fries", desc: "", price: "13", num: "09" },
    { name: "Fish & Chips (2 pcs)", desc: "", price: "13", num: "10" },
    { name: "Fish & Chips (3 pcs)", desc: "", price: "16", num: "11" },
  ],
  sides: [
    { name: "French Fries", desc: "Reg / Lg", price: "3.5 / 5", num: "12" },
    { name: "Tater Tots", desc: "Reg / Lg", price: "— / 6", num: "13" },
    { name: "Onion Rings", desc: "", price: "6", num: "14" },
    { name: "Fried Pickle Chips", desc: "", price: "6", num: "15" },
    { name: "Mozzarella Sticks", desc: "", price: "8", num: "16" },
    { name: "Garlic Fries", desc: "Labor of love. Larger size only.", price: "10", num: "17", flag: "FAN FAVE" },
    { name: "Loaded Fries", desc: "", price: "11", num: "18" },
  ],
  shakes: [
    { name: "Vanilla", desc: "Reg / Lg", price: "5.5 / 7", num: "19" },
    { name: "Chocolate", desc: "Reg / Lg", price: "5.5 / 7", num: "20" },
    { name: "Strawberry", desc: "Reg / Lg", price: "5.5 / 7", num: "21" },
  ],
};

const REVIEWS = [
  { quote: "So so ugly… but so so good.", author: "Rashaad F.", source: "Local Guide · 15 reviews", stars: 5 },
  { quote: "I love how fresh everything tastes! The flavors are amazing, and the burgers are always juicy and satisfying.", author: "Carter S.", source: "Local Guide · 11 reviews", stars: 5 },
  { quote: "The 'Ugly Sauce' is incredible — they seriously need to bottle it.", author: "L.R. L.", source: "Local Guide · 235 reviews", stars: 5 },
  { quote: "Best garlic fries I have ever had. A labor of love.", author: "Grant K.", source: "Local Guide · 15 reviews", stars: 5 },
  { quote: "I won the burger lottery. One of the best burgers I've eaten — and probably the very best fries I've had.", author: "Trygve O.", source: "Local Guide · 22 reviews", stars: 5 },
  { quote: "Structural integrity is not what you get a burger like this for.", author: "Peter R.", source: "4 reviews", stars: 5 },
  { quote: "This is what a smash burger is supposed to taste like.", author: "Rusty G.", source: "Local Guide · 11 reviews", stars: 5 },
  { quote: "For a second I lost consciousness mid bite and thought I was the divine incarnate.", author: "jaymilli 4really", source: "Local Guide · 44 reviews", stars: 5 },
];

// ===== ROUTER =====
const useRouter = () => {
  const getPage = () => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get('p');
    return ['menu', 'about', 'visit'].includes(p) ? p : 'home';
  };
  const [page, setPage] = useState(getPage);

  const navigate = React.useCallback((to, scrollTarget = null) => {
    const url = to === 'home'
      ? window.location.pathname
      : `${window.location.pathname}?p=${to}`;
    window.history.pushState({ page: to }, '', url);
    setPage(to);
    if (scrollTarget) {
      setTimeout(() => {
        document.getElementById(scrollTarget)?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, []);

  useEffect(() => {
    const handler = (e) => setPage(e.state?.page || getPage());
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  return { page, navigate };
};

// ===== TOP NAV =====
const TopNav = ({ navigate, page, overlay }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const close = () => setMobileOpen(false);

  const links = [
    { label: "Home",    pageKey: "home",  action: () => { navigate('home'); close(); } },
    { label: "Menu",    pageKey: "menu",  action: () => { navigate('menu'); close(); } },
    { label: "Reviews", pageKey: "home",  action: () => {
      if (page === 'home') { document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' }); }
      else { navigate('home', 'reviews'); }
      close();
    }},
    { label: "About",   pageKey: "about", action: () => { navigate('about'); close(); } },
    { label: "Visit",   pageKey: "visit", action: () => { navigate('visit'); close(); } },
  ];

  const navStyle = overlay
    ? { position: "absolute", top: 0, left: 0, right: 0, border: "none", color: "#fff" }
    : { border: "none" };

  return (
    <>
      <div className="topnav" style={navStyle}>
        <a
          href="#main-content"
          style={{ position: "absolute", left: -9999, top: "auto", width: 1, height: 1, overflow: "hidden", zIndex: 999 }}
          onFocus={e => { e.target.style.left = "16px"; e.target.style.width = "auto"; e.target.style.height = "auto"; e.target.style.overflow = "visible"; e.target.style.background = "var(--accent)"; e.target.style.color = "var(--paper)"; e.target.style.padding = "8px 16px"; e.target.style.borderRadius = "4px"; }}
          onBlur={e => { e.target.style.left = "-9999px"; e.target.style.width = "1px"; e.target.style.height = "1px"; e.target.style.overflow = "hidden"; }}
        >
          Skip to content
        </a>
        <div className="brand" onClick={() => navigate('home')} style={{ cursor: "pointer", color: "var(--accent)" }}>
          <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
            <circle cx="14" cy="10" r="9" fill="currentColor" />
            <rect x="3" y="14" width="22" height="6" rx="3" fill="currentColor" />
            <rect x="5" y="20" width="18" height="4" rx="2" fill="currentColor" />
            <circle cx="10" cy="8" r="1" fill="var(--bg)" />
            <circle cx="16" cy="6" r="1" fill="var(--bg)" />
            <circle cx="19" cy="10" r="1" fill="var(--bg)" />
          </svg>
          UGLY BURGER
        </div>

        <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: 64, fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>
          {links.map(({ label, pageKey, action }) => {
            const isActive = page === pageKey;
            return (
              <a key={label} href="#" onClick={e => { e.preventDefault(); action(); }}
                style={{ textDecoration: "none", color: isActive ? "var(--accent)" : "inherit", opacity: isActive ? 1 : 0.8, borderBottom: isActive ? "2px solid var(--accent)" : "2px solid transparent", paddingBottom: 2 }}>
                {label}
              </a>
            );
          })}
        </div>

        <button className="btn-primary nav-order-btn" style={{ background: "var(--accent)", color: "#fff" }}>
          Order Online →
        </button>

        <button
          className="nav-hamburger"
          onClick={() => setMobileOpen(o => !o)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          style={{ color: overlay ? "#fff" : "var(--ink)" }}
        >
          {mobileOpen
            ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><line x1="20" y1="4" x2="4" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
            : <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect y="4" width="24" height="2.5" rx="1.25" fill="currentColor"/><rect y="11" width="24" height="2.5" rx="1.25" fill="currentColor"/><rect y="18" width="24" height="2.5" rx="1.25" fill="currentColor"/></svg>
          }
        </button>
      </div>

      {mobileOpen && (
        <div className="mobile-nav" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <nav className="mobile-nav-links">
            {links.map(({ label, pageKey, action }) => (
              <a key={label} href="#" onClick={e => { e.preventDefault(); action(); }}
                className={page === pageKey ? "active" : ""}>
                {label}
              </a>
            ))}
          </nav>
          <button className="btn-primary" onClick={close} style={{ background: "var(--accent)", color: "#fff", width: "100%", justifyContent: "center", fontSize: 16, padding: "20px 28px" }}>
            Order Online →
          </button>
        </div>
      )}
    </>
  );
};

// ===== HOME HERO (full-bleed image) =====
const HeroSection = ({ headline, navigate }) => (
  <section
    id="main-content"
    style={{
      position: "relative",
      height: "100vh",
      overflow: "hidden",
      display: "flex",
      alignItems: "flex-end",
    }}
  >
    <img
      src="o (5).jpg"
      alt=""
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
    />
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,5,2,0.86) 0%, rgba(10,5,2,0.45) 55%, rgba(10,5,2,0.08) 100%)" }} />

    <div style={{ position: "relative", zIndex: 1, padding: "clamp(40px, 6vw, 80px) clamp(24px, 5vw, 80px)", width: "100%", maxWidth: 920 }}>
      <div className="eyebrow" style={{ marginBottom: 20 }}>
        <span className="kicker-rule" style={{ color: "var(--accent)", borderColor: "var(--accent)" }}>EST. 2025 · SHORELINE WA</span>
      </div>
      <h1 className="shout" style={{ fontSize: "clamp(60px, 10vw, 130px)", color: "#fff", margin: "0 0 24px", lineHeight: 0.88 }}>
        {headline}
      </h1>
      <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 20, lineHeight: 1.4, color: "rgba(255,255,255,0.82)", maxWidth: 480, margin: "0 0 32px" }}>
        Quarter-pound fresh beef, smashed on a flat-top. Potato bun. Ugly Sauce. No pretty burgers.
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <button className="btn-primary" style={{ background: "var(--accent)", color: "#fff" }}>Order Online →</button>
        <button
          className="btn-ghost"
          onClick={() => navigate('menu')}
          style={{ borderColor: "rgba(255,255,255,0.55)", color: "#fff" }}
        >
          See the menu →
        </button>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["Counter service", "Open daily 11–9", "Shoreline WA"].map(t => (
          <span key={t} className="chip" style={{ borderColor: "rgba(255,255,255,0.3)", color: "rgba(255,255,255,0.75)" }}>{t}</span>
        ))}
      </div>
    </div>
  </section>
);

// ===== PAGE HERO (for Menu / About / Visit pages) =====
const PageHero = ({ title, subtitle, image, eyebrow }) => (
  <div
    id="main-content"
    style={{
      position: "relative",
      height: "clamp(320px, 55vh, 540px)",
      overflow: "hidden",
      display: "flex",
      alignItems: "flex-end",
    }}
  >
    <img
      src={image}
      alt=""
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
    />
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,5,2,0.88) 0%, rgba(10,5,2,0.45) 55%, rgba(10,5,2,0.08) 100%)" }} />
    <div style={{ position: "relative", zIndex: 1, padding: "clamp(32px, 5vw, 64px) clamp(24px, 5vw, 80px)" }}>
      {eyebrow && (
        <div className="eyebrow" style={{ marginBottom: 14 }}>
          <span className="kicker-rule" style={{ color: "var(--accent)", borderColor: "var(--accent)" }}>{eyebrow}</span>
        </div>
      )}
      <h1 className="shout" style={{ fontSize: "clamp(54px, 9vw, 110px)", color: "#fff", margin: 0, lineHeight: 0.9 }}>{title}</h1>
      {subtitle && (
        <p style={{ color: "rgba(255,255,255,0.72)", fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 18, marginTop: 14, maxWidth: 480 }}>
          {subtitle}
        </p>
      )}
    </div>
  </div>
);

// ===== PHOTO GALLERY =====
const PHOTOS = [
  { src: "o.jpg",      label: "THE BURGER" },
  { src: "o (1).jpg",  label: "THE SAUCE" },
  { src: "o (2).jpg",  label: "THE FRIES" },
  { src: "o (3).jpg",  label: "THE KITCHEN" },
  { src: "o (4).jpg",  label: "THE SETUP" },
  { src: "o (5).jpg",  label: "THE BUN" },
  { src: "o (6).jpg",  label: "THE MELT" },
  { src: "o (11).jpg", label: "THE VERDICT" },
];

const PhotoGallery = () => (
  <section style={{ borderTop: "1.5px solid var(--ink)", padding: "80px 0" }}>
    <style>{`
      .pg-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
      @media (max-width: 900px) { .pg-grid { grid-template-columns: repeat(2, 1fr); } }
      @media (max-width: 540px) { .pg-grid { grid-template-columns: 1fr; } }
      .pg-cell { display: flex; flex-direction: column; gap: 8px; }
      .pg-img-wrap { position: relative; aspect-ratio: 4/3; overflow: hidden; box-shadow: inset 0 0 0 1.5px var(--ink); }
      .pg-img-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 300ms ease; }
      .pg-img-wrap:hover img { transform: scale(1.04) rotate(var(--tilt, 1.5deg)); }
      .pg-label { font-family: var(--font-mono); font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--ink-soft); }
    `}</style>
    <div className="container">
      <div className="eyebrow" style={{ marginBottom: 16 }}>
        <span className="kicker-rule">※ THE FOOD</span>
      </div>
      <h2 className="shout" style={{ fontSize: "clamp(48px, 7vw, 96px)", color: "var(--ink)", margin: "0 0 40px" }}>
        Ugly, in the <br />best way.
      </h2>
      <div className="pg-grid">
        {PHOTOS.map((p, i) => (
          <div key={i} className="pg-cell" style={{ "--tilt": `${(i % 2 === 0 ? 1 : -1) * 1.5}deg` }}>
            <div className="pg-img-wrap">
              <img src={p.src} alt={p.label} loading="lazy" />
            </div>
            <div className="pg-label">{p.label}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ===== MARQUEE STRIP =====
const MarqueeStrip = () => {
  const items = ["NO PRETTY BURGERS", "★", "BEST GARLIC FRIES IN SHORELINE", "★", "UGLY SAUCE BY THE BOTTLE? STILL NO", "★", "OPEN 11–9 EVERY DAY", "★"];
  return (
    <div className="strip">
      <div className="strip-track">
        {[...items, ...items, ...items, ...items].map((it, i) => (
          <span key={i} style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 900, letterSpacing: 0.5, textTransform: "uppercase" }}>
            {it}
          </span>
        ))}
      </div>
    </div>
  );
};

// ===== MENU SECTION =====
const MenuSection = () => {
  const [tab, setTab] = useState("burgers");
  const tabs = [
    { id: "burgers", label: "Burgers" },
    { id: "notBurgers", label: "Not Burgers" },
    { id: "sides", label: "Sides" },
    { id: "shakes", label: "Shakes" },
  ];

  return (
    <section id="menu" className="container" style={{ paddingTop: 80, paddingBottom: 80 }}>
      <div className="menu-section-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.4fr)", gap: 64, alignItems: "start" }}>
        <div className="menu-section-sticky" style={{ position: "sticky", top: 80 }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>
            <span className="kicker-rule">SECTION / 01 — THE LIST</span>
          </div>
          <h2 className="shout" style={{ fontSize: "clamp(60px, 8vw, 110px)", color: "var(--ink)", margin: "0 0 20px" }}>
            Small <br /> menu. <br /> Big deal.
          </h2>
          <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 19, lineHeight: 1.4, color: "var(--ink-soft)", maxWidth: 360 }}>
            Eight burgers. Three shakes. One sauce we're not telling you about. Every burger is ¼ lb fresh beef on a potato bun with lettuce, tomato, onion and pickles.
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 24, flexWrap: "wrap" }}>
            <span className="chip">Counter service</span>
            <span className="chip">Quick bite</span>
            <span className="chip">Comfort food</span>
            <span className="chip">Cash + card</span>
          </div>
        </div>

        <div>
          <div role="tablist" aria-label="Menu categories" className="menu-tabs" style={{ display: "flex", gap: 4, marginBottom: 8, borderBottom: "1.5px solid var(--ink)" }}>
            {tabs.map(t => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: "16px 20px",
                  border: "none",
                  background: tab === t.id ? "var(--ink)" : "transparent",
                  color: tab === t.id ? "var(--bg)" : "var(--ink)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  cursor: "pointer",
                  borderRadius: "4px 4px 0 0",
                  transition: "background 150ms ease, color 150ms ease",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div role="tabpanel" aria-label={tabs.find(t => t.id === tab)?.label}>
            {MENU[tab].map((item, i) => (
              <div key={i} className="menu-row">
                <span className="menu-num">{item.num}</span>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <span className="menu-name">{item.name}</span>
                    {item.flag && (
                      <span style={{
                        background: "var(--accent)", color: "var(--paper)",
                        padding: "3px 8px", borderRadius: 3,
                        fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: 1.5
                      }}>
                        {item.flag}
                      </span>
                    )}
                  </div>
                  {item.desc && <div className="menu-desc" style={{ marginTop: 6 }}>{item.desc}</div>}
                </div>
                <div className="menu-price">${item.price}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 32, padding: 20, border: "1.5px solid var(--ink)", borderRadius: 4, background: "var(--bg-alt)" }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>※ ADD-ONS</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 24px", fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>
              <span>Extra patty <span style={{ color: "var(--accent)" }}>+$2.5</span></span>
              <span>Bacon <span style={{ color: "var(--accent)" }}>+$1.5</span></span>
              <span>Cheese <span style={{ color: "var(--accent)" }}>+$1</span></span>
              <span>Avocado <span style={{ color: "var(--accent)" }}>+$2</span></span>
              <span>Sautéed mushroom <span style={{ color: "var(--accent)" }}>+$2</span></span>
              <span>Sautéed onion <span style={{ color: "var(--accent)" }}>+$1</span></span>
              <span>Fried egg <span style={{ color: "var(--accent)" }}>+$2</span></span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ===== REVIEWS WALL =====
const ReviewsWall = () => {
  return (
    <section id="reviews" style={{ padding: "80px 0", borderTop: "1.5px solid var(--ink)", borderBottom: "1.5px solid var(--ink)", background: "var(--bg-alt)" }}>
      <div className="container">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 40, gap: 24, flexWrap: "wrap" }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 12 }}>
              <span className="kicker-rule">SECTION / 02 — RECEIPTS</span>
            </div>
            <h2 className="shout" style={{ fontSize: "clamp(54px, 7vw, 96px)", color: "var(--ink)", margin: 0 }}>
              4.8★ from <br /> 143 strangers
            </h2>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--ink-soft)", textAlign: "right" }}>
            <div>SOURCE / GOOGLE MAPS</div>
            <div>UPDATED / APR 2026</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
          {REVIEWS.map((r, i) => (
            <div key={i} className="review-card" style={{ "--tilt": `${(i % 2 === 0 ? -1 : 1) * (i % 3 + 0.5)}deg` }}>
              <div className="stars" aria-label="5 out of 5 stars">★★★★★</div>
              <p className="review-quote">"{r.quote}"</p>
              <div className="review-meta">
                <span>{r.author}</span>
                <span>{r.source}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ===== ABOUT =====
const AboutSection = () => (
  <section id="about" className="container" style={{ padding: "100px 0" }}>
    <div className="eyebrow" style={{ marginBottom: 20 }}>
      <span className="kicker-rule">SECTION / 03 — ORIGIN STORY</span>
    </div>
    <div className="bigquote" style={{ color: "var(--ink)", marginBottom: 40 }}>
      "We were going to call it <span style={{ color: "var(--accent)" }}>Pretty Burger</span> but we looked at the burger."
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24, maxWidth: 1000 }}>
      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>※ THE OPERATION</div>
        <p style={{ fontFamily: "var(--font-serif)", fontSize: 17, lineHeight: 1.45, color: "var(--ink)" }}>
          A small, family-run smashburger spot that opened across the street from someone's office and immediately ruined their lunch budget.
        </p>
      </div>
      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>※ THE METHOD</div>
        <p style={{ fontFamily: "var(--font-serif)", fontSize: 17, lineHeight: 1.45, color: "var(--ink)" }}>
          ¼ lb of fresh beef, smashed hard on a flat-top, served on a soft potato bun with whatever you ordered piled on top of it.
        </p>
      </div>
      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>※ THE SAUCE</div>
        <p style={{ fontFamily: "var(--font-serif)", fontSize: 17, lineHeight: 1.45, color: "var(--ink)" }}>
          We're not bottling it. We're not selling it. Yes, people have asked. No, we won't. Stop asking.
        </p>
      </div>
      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>※ THE WAIT</div>
        <p style={{ fontFamily: "var(--font-serif)", fontSize: 17, lineHeight: 1.45, color: "var(--ink)" }}>
          Sometimes 20 minutes on a Friday at 5:30. We're working on it. Bring a friend. Or don't, more burger for you.
        </p>
      </div>
    </div>
  </section>
);

// ===== LOCATION + HOURS =====
const VisitSection = () => {
  const days = [
    { d: "Monday",    h: "11 AM – 9 PM" },
    { d: "Tuesday",   h: "11 AM – 9 PM" },
    { d: "Wednesday", h: "11 AM – 9 PM" },
    { d: "Thursday",  h: "11 AM – 9 PM" },
    { d: "Friday",    h: "11 AM – 9 PM" },
    { d: "Saturday",  h: "11 AM – 9 PM" },
    { d: "Sunday",    h: "11 AM – 9 PM" },
  ].map(d => ({ ...d, today: d.d === _todayName }));
  return (
    <section id="visit" style={{ background: "var(--ink)", color: "var(--bg)", padding: "80px 0", borderTop: "1.5px solid var(--ink)" }}>
      <div className="container">
        <div className="eyebrow" style={{ marginBottom: 20, color: "var(--accent-2)" }}>
          <span className="kicker-rule" style={{ borderColor: "var(--accent-2)" }}>SECTION / 04 — COME GET IT</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 48 }}>
          <div>
            <h3 className="shout" style={{ fontSize: "clamp(40px, 5vw, 64px)", margin: "0 0 24px" }}>The address</h3>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 16, lineHeight: 1.6, letterSpacing: 1, textTransform: "uppercase" }}>
              19939 Ballinger Way NE B<br />
              Shoreline, WA 98155
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
              <button className="btn-primary" style={{ background: "var(--accent)", color: "var(--ink)" }}>Get directions →</button>
              <button className="btn-ghost" style={{ borderColor: "var(--bg)", color: "var(--bg)" }}>Send to phone</button>
            </div>
            <div style={{ marginTop: 32, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["DINE-IN", "TAKEOUT", "DELIVERY", "WHEELCHAIR ACCESS", "FREE PARKING"].map(t => (
                <span key={t} className="chip" style={{ borderColor: "var(--bg)", color: "var(--bg)" }}>{t}</span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="shout" style={{ fontSize: "clamp(40px, 5vw, 64px)", margin: "0 0 24px" }}>The hours</h3>
            <div>
              {days.map((d, i) => (
                <div key={i} className={`hours-row ${d.today ? "today" : ""}`} style={{ borderColor: "rgba(255,255,255,0.18)" }}>
                  <span>{d.d}</span>
                  <span>{d.h}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--accent-2)" }}>
              {IS_OPEN ? "● OPEN NOW · USUALLY A WAIT" : "○ CLOSED · OPENS 11 AM"}
            </div>
          </div>
          <div>
            <h3 className="shout" style={{ fontSize: "clamp(40px, 5vw, 64px)", margin: "0 0 24px" }}>The price</h3>
            <div className="shout visit-price" style={{ fontSize: 96, lineHeight: 1, color: "var(--accent)", margin: 0 }}>$10–20</div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 8 }}>
              Per person · 53 people reported
            </p>
            <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 17, marginTop: 24, lineHeight: 1.4 }}>
              Reasonably priced. Big enough portions. The shake is real ice cream. Bring cash if you're sentimental — they take cards either way.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// ===== STICKY ORDER BAR =====
const OrderBar = () => (
  <div className="order-bar">
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      {IS_OPEN && <div className="pulse" />}
      <div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", opacity: 0.7 }}>
          {IS_OPEN ? "OPEN NOW" : "CLOSED"}
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>
          {IS_OPEN ? "UNTIL 9 PM · USUALLY A WAIT" : "OPENS 11 AM DAILY"}
        </div>
      </div>
    </div>
    <div style={{ display: "flex", gap: 8 }}>
      <a
        href="tel:+12065551234"
        className="btn-ghost"
        style={{ borderColor: "currentColor", color: "inherit", padding: "12px 14px", fontSize: 11, textDecoration: "none" }}
      >
        Call (206) 555-1234
      </a>
      <button className="btn-primary" style={{ background: "var(--accent)", color: "#fff", padding: "14px 20px", fontSize: 12 }}>
        Order Online →
      </button>
    </div>
  </div>
);

// ===== FOOTER =====
const Footer = () => (
  <footer style={{ background: "var(--bg)", color: "var(--ink)", padding: "48px 0 32px", borderTop: "1.5px solid var(--ink)" }}>
    <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 24 }}>
      <div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 64, fontWeight: 900, letterSpacing: 0.5, lineHeight: 0.9 }}>UGLY <br />BURGER</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 12, color: "var(--ink-soft)" }}>
          NO PRETTY BURGERS · EST. 2025
        </div>
      </div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", textAlign: "right", color: "var(--ink-soft)" }}>
        © 2026 UGLY BURGER LLC<br />
        SHORELINE, WA · MADE WITH GREASE
      </div>
    </div>
  </footer>
);

// ===== PAGE LAYOUTS =====
const HomePage = ({ headline, navigate }) => (
  <>
    <HeroSection headline={headline} navigate={navigate} />
    <MarqueeStrip />
    <PhotoGallery />
    <ReviewsWall />
  </>
);

const MenuPage = () => (
  <>
    <PageHero
      title="The Menu"
      eyebrow="WHAT WE MAKE"
      image="o.jpg"
      subtitle="Eight burgers. Three shakes. One sauce we're not telling you about."
    />
    <MenuSection />
  </>
);

const AboutPage = () => (
  <>
    <PageHero
      title="Our Story"
      eyebrow="WHO WE ARE"
      image="o (3).jpg"
      subtitle="A small family-run smashburger spot that opened in Shoreline and immediately ruined everyone's lunch budget."
    />
    <AboutSection />
  </>
);

const VisitPage = () => (
  <>
    <PageHero
      title="Come Get It"
      eyebrow="FIND US"
      image="o (11).jpg"
      subtitle="19939 Ballinger Way NE B, Shoreline WA 98155 · Open every day 11 AM – 9 PM"
    />
    <VisitSection />
  </>
);

// ===== ROOT SITE =====
const UglySite = ({
  theme = "diner",
  accentOverride,
  bgOverride,
  headline = "So ugly. So good.",
}) => {
  const { page, navigate } = useRouter();
  const style = {};
  if (accentOverride) style["--accent"] = accentOverride;
  if (bgOverride) style["--bg"] = bgOverride;

  return (
    <div className={`uglysite theme-${theme}`} style={style}>
      <TopNav navigate={navigate} page={page} overlay />
      {page === 'home'  && <HomePage  headline={headline} navigate={navigate} />}
      {page === 'menu'  && <MenuPage  />}
      {page === 'about' && <AboutPage />}
      {page === 'visit' && <VisitPage />}
      <Footer />
      <OrderBar />
    </div>
  );
};

window.UglySite = UglySite;
