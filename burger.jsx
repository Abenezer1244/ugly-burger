// burger.jsx — SVG burger with ingredient layers that explode/reassemble on scroll progress.
// Exposes <Burger progress={0..1} showLabels accent /> on window.

const Ingredient = ({ children, t, restY, explodeY, explodeX = 0, explodeRot = 0, explodeScale = 1, intensity = 1, label, labelSide = "right", labelOffset = 0, depth = 0, showLabels }) => {
  // t goes 0 -> 1; explosion peaks around 0.5
  // bell curve: max at 0.5
  const bell = Math.max(0, 1 - Math.abs(t - 0.5) * 2); // 0..1..0
  const ex = bell * intensity;

  const x = explodeX * ex;
  const y = restY + (explodeY - restY) * ex;
  const rot = explodeRot * ex;
  const scale = 1 + (explodeScale - 1) * ex;

  // label opacity follows bell curve too — only visible mid-explosion
  const labelOpacity = showLabels ? Math.max(0, (bell - 0.35) / 0.65) : 0;

  return (
    <div
      className="ing"
      style={{
        transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${rot}deg) scale(${scale})`,
        zIndex: 10 + depth,
      }}
    >
      <div style={{ position: "relative" }}>
        {children}
        {label && (
          <div
            className="ing-label"
            style={{
              opacity: labelOpacity,
              transition: "opacity 200ms linear",
              [labelSide === "right" ? "left" : "right"]: "calc(100% + 12px)",
              top: `${labelOffset}px`,
              transform: labelSide === "left" ? "scaleX(-1)" : "none",
            }}
          >
            <span style={{ display: "inline-block", transform: labelSide === "left" ? "scaleX(-1)" : "none" }}>
              {label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// SVG ingredient pieces. All centered at 0,0, viewBox roughly -200 to 200.
const BunTop = () => (
  <svg width="380" height="180" viewBox="-200 -90 400 180" style={{ display: "block" }}>
    <defs>
      <radialGradient id="bunHi" cx="40%" cy="35%" r="60%">
        <stop offset="0%" stopColor="#f2c180" />
        <stop offset="60%" stopColor="#d99449" />
        <stop offset="100%" stopColor="#a86a2c" />
      </radialGradient>
    </defs>
    {/* Bun dome */}
    <path d="M -180 60 Q -180 -90 0 -90 Q 180 -90 180 60 Q 180 75 165 78 L -165 78 Q -180 75 -180 60 Z"
      fill="url(#bunHi)" stroke="#5a3413" strokeWidth="2" />
    {/* Sesame seeds */}
    {[
      [-130, -40, 12], [-90, -65, -8], [-50, -50, 20], [-20, -75, 5],
      [30, -68, -15], [60, -45, 8], [100, -55, -10], [140, -30, 18],
      [-120, -10, 35], [-70, -25, -5], [10, -30, 22], [80, -15, -8],
      [125, 0, 12], [-150, 25, -22],
    ].map(([x, y, r], i) => (
      <ellipse key={i} cx={x} cy={y} rx="6" ry="3.5" fill="#fff5dc" stroke="#b88654" strokeWidth="0.8"
        transform={`rotate(${r} ${x} ${y})`} />
    ))}
    {/* underside shadow */}
    <ellipse cx="0" cy="76" rx="172" ry="6" fill="rgba(0,0,0,0.18)" />
  </svg>
);

const Lettuce = () => (
  <svg width="400" height="60" viewBox="-200 -30 400 60" style={{ display: "block" }}>
    <path d="M -195 -8
             Q -180 -22 -160 -10 Q -140 -28 -118 -8 Q -98 -26 -78 -10 Q -58 -28 -38 -8
             Q -18 -26 2 -10 Q 22 -28 42 -8 Q 62 -26 82 -10 Q 102 -28 122 -8 Q 142 -26 162 -10
             Q 182 -22 195 -8
             L 195 18 Q 180 22 0 22 Q -180 22 -195 18 Z"
      fill="#7ab542" stroke="#3f6b1f" strokeWidth="1.5" />
    <path d="M -180 0 Q -160 8 -140 2 Q -100 12 -60 4 Q -20 12 20 2 Q 60 12 100 4 Q 140 12 180 2"
      stroke="#5a8e2c" strokeWidth="1.5" fill="none" opacity="0.7" />
  </svg>
);

const Tomato = () => (
  <svg width="370" height="36" viewBox="-185 -18 370 36" style={{ display: "block" }}>
    <ellipse cx="0" cy="0" rx="180" ry="14" fill="#d63b2a" stroke="#7a1d12" strokeWidth="1.5" />
    <ellipse cx="0" cy="-2" rx="170" ry="10" fill="#e85a4b" />
    {/* seeds */}
    <ellipse cx="-90" cy="-2" rx="6" ry="3" fill="#fbe27a" />
    <ellipse cx="-30" cy="-3" rx="6" ry="3" fill="#fbe27a" />
    <ellipse cx="40" cy="-2" rx="6" ry="3" fill="#fbe27a" />
    <ellipse cx="100" cy="-3" rx="6" ry="3" fill="#fbe27a" />
  </svg>
);

const Cheese = () => (
  <svg width="400" height="50" viewBox="-200 -25 400 50" style={{ display: "block" }}>
    <defs>
      <linearGradient id="ch" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor="#ffd23a" />
        <stop offset="100%" stopColor="#e89a17" />
      </linearGradient>
    </defs>
    {/* Drippy cheese */}
    <path d="M -190 -16 L 190 -16 L 195 4
             L 175 4 L 168 18 L 158 4
             L 120 4 L 110 22 L 98 4
             L 60 4 L 50 16 L 40 4
             L 0 4 L -10 24 L -22 4
             L -60 4 L -70 18 L -82 4
             L -130 4 L -140 20 L -152 4
             L -190 4 Z"
      fill="url(#ch)" stroke="#b07614" strokeWidth="1.5" />
  </svg>
);

const Patty = () => (
  <svg width="400" height="60" viewBox="-200 -30 400 60" style={{ display: "block" }}>
    <defs>
      <radialGradient id="pat" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#7a4128" />
        <stop offset="60%" stopColor="#4a2614" />
        <stop offset="100%" stopColor="#2b160a" />
      </radialGradient>
    </defs>
    <ellipse cx="0" cy="0" rx="195" ry="22" fill="url(#pat)" stroke="#1a0c05" strokeWidth="2" />
    {/* char marks */}
    {[[-140, -8], [-80, -12], [-20, -10], [50, -12], [110, -8], [160, -10],
      [-120, 8], [-50, 10], [20, 8], [90, 10], [150, 8]].map(([x, y], i) => (
      <ellipse key={i} cx={x} cy={y} rx="14" ry="3" fill="#1a0c05" opacity="0.6" />
    ))}
    {/* highlight */}
    <ellipse cx="0" cy="-12" rx="160" ry="6" fill="#9c5a36" opacity="0.5" />
  </svg>
);

const Onion = () => (
  <svg width="380" height="22" viewBox="-190 -11 380 22" style={{ display: "block" }}>
    <ellipse cx="0" cy="0" rx="185" ry="8" fill="#e8d5e8" stroke="#7a4a7a" strokeWidth="1.2" />
    <ellipse cx="0" cy="-1" rx="170" ry="5" fill="#f5e8f5" opacity="0.7" />
    <ellipse cx="0" cy="0" rx="155" ry="3" fill="none" stroke="#a878a8" strokeWidth="0.8" opacity="0.5" />
  </svg>
);

const Pickle = () => (
  <svg width="340" height="20" viewBox="-170 -10 340 20" style={{ display: "block" }}>
    {[-130, -65, 0, 65, 130].map((x, i) => (
      <g key={i} transform={`translate(${x} 0)`}>
        <ellipse cx="0" cy="0" rx="32" ry="7" fill="#7a9b3a" stroke="#3f5510" strokeWidth="1.2" />
        <ellipse cx="-12" cy="-1" rx="3" ry="1.5" fill="#5a7424" />
        <ellipse cx="0" cy="-1" rx="3" ry="1.5" fill="#5a7424" />
        <ellipse cx="12" cy="-1" rx="3" ry="1.5" fill="#5a7424" />
      </g>
    ))}
  </svg>
);

const BunBottom = () => (
  <svg width="380" height="80" viewBox="-200 -10 400 90" style={{ display: "block" }}>
    <defs>
      <linearGradient id="bunBot" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor="#e0a868" />
        <stop offset="100%" stopColor="#9a6028" />
      </linearGradient>
    </defs>
    <path d="M -180 -8 L 180 -8 Q 195 -8 192 8 Q 188 50 165 65 Q 130 78 0 78 Q -130 78 -165 65 Q -188 50 -192 8 Q -195 -8 -180 -8 Z"
      fill="url(#bunBot)" stroke="#5a3413" strokeWidth="2" />
    <ellipse cx="0" cy="-4" rx="180" ry="3" fill="rgba(255,255,255,0.4)" />
  </svg>
);

const SauceDrip = () => (
  // ugly sauce splotch — appears mid-explosion
  <svg width="120" height="120" viewBox="-60 -60 120 120" style={{ display: "block" }}>
    <path d="M -40 -10 Q -55 -30 -30 -45 Q 0 -55 25 -40 Q 50 -25 45 0 Q 55 25 30 35 Q 5 50 -20 38 Q -50 30 -45 5 Q -55 -5 -40 -10 Z"
      fill="#f5b840" stroke="#a87410" strokeWidth="2" opacity="0.92" />
    <circle cx="-20" cy="-20" r="4" fill="#fff" opacity="0.6" />
  </svg>
);

const Burger = ({ progress = 0, showLabels = true, intensity = 1 }) => {
  const t = Math.max(0, Math.min(1, progress));

  // Layer config: order matters for z-index (bottom of stack first)
  // restY = position in assembled stack
  // explodeY = position when fully exploded
  return (
    <div className="burger-svg">
      {/* sauce splotches — only appear mid-explosion, fly out */}
      <Ingredient t={t} restY={0} explodeY={-160} explodeX={-260} explodeRot={-25} explodeScale={1.1} intensity={intensity} depth={0} showLabels={false}>
        <SauceDrip />
      </Ingredient>
      <Ingredient t={t} restY={20} explodeY={180} explodeX={240} explodeRot={30} explodeScale={1} intensity={intensity} depth={0} showLabels={false}>
        <SauceDrip />
      </Ingredient>

      {/* Bottom bun */}
      <Ingredient t={t} restY={130} explodeY={320} explodeX={0} explodeRot={-4} intensity={intensity}
        label="BOTTOM BUN" labelSide="right" labelOffset={20} depth={1} showLabels={showLabels}>
        <BunBottom />
      </Ingredient>

      {/* Pickle (between bottom bun and patty) */}
      <Ingredient t={t} restY={108} explodeY={260} explodeX={-220} explodeRot={-15} intensity={intensity}
        label="PICKLES" labelSide="left" depth={2} showLabels={showLabels}>
        <Pickle />
      </Ingredient>

      {/* Onion */}
      <Ingredient t={t} restY={92} explodeY={210} explodeX={250} explodeRot={12} intensity={intensity}
        label="RED ONION" labelSide="right" depth={3} showLabels={showLabels}>
        <Onion />
      </Ingredient>

      {/* Tomato */}
      <Ingredient t={t} restY={70} explodeY={150} explodeX={-280} explodeRot={-10} intensity={intensity}
        label="TOMATO" labelSide="left" depth={4} showLabels={showLabels}>
        <Tomato />
      </Ingredient>

      {/* Lettuce */}
      <Ingredient t={t} restY={42} explodeY={80} explodeX={300} explodeRot={8} intensity={intensity}
        label="LETTUCE" labelSide="right" depth={5} showLabels={showLabels}>
        <Lettuce />
      </Ingredient>

      {/* Patty */}
      <Ingredient t={t} restY={5} explodeY={-30} explodeX={-310} explodeRot={-6} explodeScale={1.05} intensity={intensity}
        label="¼LB BEEF" labelSide="left" depth={6} showLabels={showLabels}>
        <Patty />
      </Ingredient>

      {/* Cheese */}
      <Ingredient t={t} restY={-22} explodeY={-110} explodeX={290} explodeRot={10} intensity={intensity}
        label="AMERICAN" labelSide="right" depth={7} showLabels={showLabels}>
        <Cheese />
      </Ingredient>

      {/* Top bun */}
      <Ingredient t={t} restY={-95} explodeY={-280} explodeX={0} explodeRot={6} intensity={intensity}
        label="TOP BUN" labelSide="right" labelOffset={-30} depth={9} showLabels={showLabels}>
        <BunTop />
      </Ingredient>
    </div>
  );
};

window.Burger = Burger;
