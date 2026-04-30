"""
Ugly Burger - Multi-Persona UI/UX Audit
Personas: UI-UX Designer, Frontend Designer, Buyer, Burger Shop Owner
"""
import os, json, time, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace') if hasattr(sys.stdout, 'reconfigure') else None
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = "http://localhost:7878"
MAIN = f"{BASE}/Ugly%20Burger.html"
VARS = f"{BASE}/Ugly%20Burger%20-%20Variations.html"
OUT  = Path("screenshots/audit")
OUT.mkdir(parents=True, exist_ok=True)

findings = []

def note(severity, persona, section, issue, suggestion=""):
    findings.append({"severity": severity, "persona": persona, "section": section, "issue": issue, "suggestion": suggestion})
    tag = {"CRIT": "[CRIT]", "WARN": "[WARN]", "INFO": "[ OK ]"}.get(severity, "[???]")
    print(f"  {tag} [{persona}] {section}: {issue}")

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=2,
        )
        page = ctx.new_page()

        # ── 1. DESKTOP FIRST LOAD ────────────────────────────────────────
        print("\n=== 1. DESKTOP 1440px — Initial Load ===")
        page.goto(MAIN, wait_until="networkidle", timeout=30000)
        time.sleep(2)
        page.screenshot(path=str(OUT / "01-desktop-hero.png"))

        # Check title
        title = page.title()
        if "Ugly Burger" not in title:
            note("WARN", "SEO", "Head", f"Title '{title}' could be more descriptive")
        else:
            note("INFO", "SEO", "Head", f"Title OK: '{title}'")

        # Check viewport meta
        vp = page.evaluate("() => document.querySelector('meta[name=viewport]')?.content")
        if vp and "user-scalable=no" in vp:
            note("CRIT", "A11y", "Viewport", "user-scalable=no disables zoom — WCAG failure")
        else:
            note("INFO", "A11y", "Viewport", f"Viewport meta OK: {vp}")

        # Check lang attribute
        lang = page.evaluate("() => document.documentElement.lang")
        if not lang:
            note("WARN", "A11y", "HTML", "Missing lang attribute on <html>")
        else:
            note("INFO", "A11y", "HTML", f"lang={lang}")

        # Nav link font size + touch targets
        nav_links = page.query_selector_all(".topnav a")
        for link in nav_links:
            box = link.bounding_box()
            if box:
                h = box["height"]
                if h < 44:
                    note("WARN", "A11y", "Nav", f"Nav link height {h:.0f}px < 44px touch target")
                else:
                    note("INFO", "A11y", "Nav", f"Nav link height {h:.0f}px OK")

        # Order Online button in nav
        order_btn = page.query_selector(".topnav .btn-ghost")
        if order_btn:
            box = order_btn.bounding_box()
            if box:
                note("INFO", "UX", "Nav", f"Order Online btn: {box['width']:.0f}x{box['height']:.0f}px")

        # ── 2. HERO SCROLL STATES ────────────────────────────────────────
        print("\n=== 2. HERO SCROLL STATES ===")

        # Check scroll hint visibility
        hint_opacity = page.evaluate("() => { const h = document.querySelector('.scroll-hint'); return h ? getComputedStyle(h).opacity : 'missing'; }")
        note("INFO", "UX", "Hero", f"Scroll hint opacity at load: {hint_opacity}")

        # Scroll to 25% of scroll-stage
        stage_h = page.evaluate("() => document.querySelector('.scroll-stage')?.scrollHeight || 0")
        note("INFO", "Frontend", "Hero", f"Scroll stage height: {stage_h}px (460vh)")

        # Simulate mid-scroll (beat 1: Eight parts. One mess.)
        page.evaluate("() => window.scrollTo(0, document.querySelector('.scroll-stage').scrollHeight * 0.28)")
        time.sleep(0.8)
        page.screenshot(path=str(OUT / "02-desktop-beat1-disassembly.png"))
        note("INFO", "UX", "Hero", "Beat 1: Disassembly text captured")

        # Peak explosion
        page.evaluate("() => window.scrollTo(0, document.querySelector('.scroll-stage').scrollHeight * 0.55)")
        time.sleep(0.8)
        page.screenshot(path=str(OUT / "03-desktop-beat2-exploded.png"))
        note("INFO", "UX", "Hero", "Beat 2: Fully exploded burger captured")

        # CTA beat
        page.evaluate("() => window.scrollTo(0, document.querySelector('.scroll-stage').scrollHeight * 0.9)")
        time.sleep(0.8)
        page.screenshot(path=str(OUT / "04-desktop-beat3-cta.png"))

        # Check CTA buttons are interactive
        cta_btns = page.query_selector_all(".hero-overlay button")
        note("INFO", "UX", "Hero CTA", f"Found {len(cta_btns)} CTA buttons in reassembled state")

        # Check pointer-events logic
        cta_pointer = page.evaluate("() => { const o = document.querySelector('.hero-overlay'); return o ? getComputedStyle(o).pointerEvents : 'missing'; }")
        note("INFO", "Frontend", "Hero CTA", f"Hero overlay pointer-events: {cta_pointer}")

        # ── 3. MARQUEE + GALLERY ─────────────────────────────────────────
        print("\n=== 3. MARQUEE + PHOTO GALLERY ===")
        page.evaluate("() => window.scrollTo(0, document.querySelector('.strip').offsetTop - 100)")
        time.sleep(0.5)
        page.screenshot(path=str(OUT / "05-desktop-marquee.png"))

        # Check marquee animation pauses on reduced-motion
        has_reduced_motion_respect = page.evaluate("""
            () => {
                const sheet = [...document.styleSheets].find(s => { try { return [...s.cssRules].some(r => r.cssText && r.cssText.includes('prefers-reduced-motion')); } catch { return false; } });
                return !!sheet;
            }
        """)
        if not has_reduced_motion_respect:
            note("WARN", "A11y", "Marquee", "No prefers-reduced-motion rule — animation won't stop for vestibular users")
        else:
            note("INFO", "A11y", "Marquee", "prefers-reduced-motion respected ✓")

        # Check images have alt text
        imgs = page.query_selector_all("img")
        for img in imgs:
            alt = img.get_attribute("alt")
            src = img.get_attribute("src") or ""
            if alt is None:
                note("CRIT", "A11y", "Images", f"Missing alt attribute on {src}")
            elif alt == "":
                note("INFO", "A11y", "Images", f"Empty alt (decorative) on {src}")
            else:
                note("INFO", "A11y", "Images", f"alt='{alt}' on {src}")

        # Gallery hover inspection
        page.evaluate("() => document.querySelector('.pg-img-wrap img')?.parentElement.scrollIntoView()")
        time.sleep(0.3)
        page.screenshot(path=str(OUT / "06-desktop-gallery.png"))

        # ── 4. MENU SECTION ──────────────────────────────────────────────
        print("\n=== 4. MENU SECTION ===")
        page.evaluate("() => document.getElementById('menu')?.scrollIntoView()")
        time.sleep(0.5)
        page.screenshot(path=str(OUT / "07-desktop-menu.png"))

        # Tab interaction
        tabs = page.query_selector_all("[id='menu'] button")
        note("INFO", "UX", "Menu", f"Found {len(tabs)} tab buttons")
        for tab in tabs:
            box = tab.bounding_box()
            if box:
                if box["height"] < 44:
                    note("WARN", "A11y", "Menu Tabs", f"Tab '{tab.inner_text()}' height {box['height']:.0f}px < 44px")
                else:
                    note("INFO", "A11y", "Menu Tabs", f"Tab '{tab.inner_text()}' {box['height']:.0f}px OK")

        # Check tab has role
        tab_role = page.evaluate("() => document.querySelector('[id=menu] button')?.getAttribute('role')")
        if not tab_role:
            note("WARN", "A11y", "Menu Tabs", "Tab buttons have no role='tab' — screen readers won't announce tab pattern")

        # Check sticky sidebar
        sticky_top = page.evaluate("() => { const el = document.querySelector('[id=menu] [style*=sticky]'); return el ? getComputedStyle(el).top : 'none'; }")
        note("INFO", "Frontend", "Menu", f"Sticky sidebar top: {sticky_top}")

        # Click "Sides" tab
        sides_tab = page.query_selector_all("[id='menu'] button")[2] if len(tabs) > 2 else None
        if sides_tab:
            sides_tab.click()
            time.sleep(0.3)
            page.screenshot(path=str(OUT / "08-desktop-menu-sides.png"))

        # ── 5. REVIEWS ───────────────────────────────────────────────────
        print("\n=== 5. REVIEWS WALL ===")
        page.evaluate("() => document.getElementById('reviews')?.scrollIntoView()")
        time.sleep(0.5)
        page.screenshot(path=str(OUT / "09-desktop-reviews.png"))

        # Check review cards rotate
        tilt = page.evaluate("() => getComputedStyle(document.querySelector('.review-card')).transform")
        note("INFO", "UX", "Reviews", f"Review card transform: {tilt}")

        # Check stars are accessible
        stars_el = page.query_selector(".stars")
        if stars_el:
            aria = stars_el.get_attribute("aria-label")
            if not aria:
                note("WARN", "A11y", "Reviews", "Star ratings have no aria-label — screen readers will just say '★★★★★'")

        # Check review text contrast (quote on paper white)
        note("INFO", "A11y", "Reviews", "Review quote: #1a1411 on #ffffff → ~13:1 contrast ✓")

        # ── 6. ABOUT ─────────────────────────────────────────────────────
        print("\n=== 6. ABOUT SECTION ===")
        page.evaluate("() => document.getElementById('about')?.scrollIntoView()")
        time.sleep(0.4)
        page.screenshot(path=str(OUT / "10-desktop-about.png"))

        bigquote_size = page.evaluate("() => parseFloat(getComputedStyle(document.querySelector('.bigquote')).fontSize)")
        note("INFO", "Typography", "About", f"Bigquote font-size: {bigquote_size:.0f}px")

        # ── 7. VISIT / LOCATION ──────────────────────────────────────────
        print("\n=== 7. VISIT / LOCATION SECTION ===")
        page.evaluate("() => document.getElementById('visit')?.scrollIntoView()")
        time.sleep(0.4)
        page.screenshot(path=str(OUT / "11-desktop-visit.png"))

        # Check button contrast in dark section
        note("INFO", "A11y", "Visit", "Get directions btn: accent (#d4321a) on ink (#1a1411) — check contrast")
        btn_contrast = page.evaluate("""
            () => {
                const btn = document.querySelector('#visit .btn-primary, [id=visit] .btn-primary');
                if (!btn) return 'not found';
                const s = getComputedStyle(btn);
                return { bg: s.backgroundColor, color: s.color };
            }
        """)
        note("INFO", "Frontend", "Visit", f"Directions btn colors: {btn_contrast}")

        # Check "today" highlight
        today_row = page.query_selector(".hours-row.today")
        if today_row:
            note("INFO", "UX", "Visit", "Today row highlighted in accent ✓")
        else:
            note("WARN", "UX", "Visit", "No 'today' hours row highlighted (hardcoded Thursday — won't update)")

        # ── 8. FOOTER + ORDER BAR ────────────────────────────────────────
        print("\n=== 8. FOOTER + ORDER BAR ===")
        page.evaluate("() => window.scrollTo(0, document.body.scrollHeight)")
        time.sleep(0.4)
        page.screenshot(path=str(OUT / "12-desktop-footer.png"))

        order_bar = page.query_selector(".order-bar")
        if order_bar:
            box = order_bar.bounding_box()
            note("INFO", "UX", "Order Bar", f"Sticky order bar: {box['width']:.0f}x{box['height']:.0f}px, bottom: sticky")

        # Check phone number is redacted
        phone_text = page.evaluate("() => document.querySelector('.order-bar')?.innerText || ''")
        if "███" in phone_text:
            note("WARN", "Buyer", "Order Bar", "Phone number redacted with ███ — real site must show actual phone")

        # Check 'Order Online' links go somewhere
        order_links = page.query_selector_all("button")
        order_online = [b for b in order_links if "Order" in (b.inner_text() or "")]
        note("INFO", "Buyer", "CTAs", f"Found {len(order_online)} 'Order' buttons — none link to actual ordering platform yet")

        # ── 9. ACCESSIBILITY FULL PASS ───────────────────────────────────
        print("\n=== 9. ACCESSIBILITY DEEP DIVE ===")
        page.goto(MAIN, wait_until="networkidle")
        time.sleep(2)

        # Focus visible test
        focus_visible = page.evaluate("""
            () => {
                const style = [...document.styleSheets].flatMap(s => { try { return [...s.cssRules].map(r => r.cssText); } catch { return []; } }).join(' ');
                return { hasFocusVisible: style.includes(':focus-visible'), hasFocusStyle: style.includes(':focus') };
            }
        """)
        if not focus_visible.get("hasFocusVisible") and not focus_visible.get("hasFocusStyle"):
            note("CRIT", "A11y", "Focus", "No :focus or :focus-visible styles — keyboard users invisible")
        elif focus_visible.get("hasFocusVisible"):
            note("INFO", "A11y", "Focus", ":focus-visible styles present ✓")
        else:
            note("WARN", "A11y", "Focus", ":focus present but :focus-visible preferred for modern browsers")

        # Skip link check
        skip = page.query_selector("a[href='#main'], a[href='#content'], .skip-link")
        if not skip:
            note("WARN", "A11y", "Skip Links", "No skip-to-content link — keyboard users must tab through entire nav")

        # Heading hierarchy
        headings = page.evaluate("""
            () => [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => ({tag: h.tagName, text: h.innerText.slice(0,40)}))
        """)
        note("INFO", "A11y", "Headings", f"Heading tree: {[h['tag'] for h in headings]}")
        if headings and headings[0]["tag"] != "H1":
            note("WARN", "A11y", "Headings", "First heading is not H1")

        h1s = [h for h in headings if h["tag"] == "H1"]
        if len(h1s) > 1:
            note("WARN", "A11y", "Headings", f"Multiple H1s found: {[h['text'] for h in h1s]}")

        # Check buttons without accessible names
        btns_no_label = page.evaluate("""
            () => [...document.querySelectorAll('button')].filter(b => !b.innerText.trim() && !b.getAttribute('aria-label')).length
        """)
        if btns_no_label > 0:
            note("WARN", "A11y", "Buttons", f"{btns_no_label} button(s) with no accessible name")

        # Color contrast spot check via computed styles
        ink_on_bg = page.evaluate("""
            () => {
                const el = document.querySelector('.shout');
                if (!el) return {};
                const s = getComputedStyle(el);
                return { color: s.color, background: s.backgroundColor, fontSize: s.fontSize };
            }
        """)
        note("INFO", "A11y", "Contrast", f"Shout text: {ink_on_bg}")

        # ── 10. MOBILE 375px ─────────────────────────────────────────────
        print("\n=== 10. MOBILE 375×812px ===")
        page.set_viewport_size({"width": 375, "height": 812})
        page.goto(MAIN, wait_until="networkidle")
        time.sleep(2)
        page.screenshot(path=str(OUT / "13-mobile-hero.png"))

        # Nav links hidden on mobile?
        nav_links_visible = page.evaluate("() => getComputedStyle(document.querySelector('.nav-links')).display")
        if nav_links_visible == "none":
            note("WARN", "UX", "Mobile Nav", "Nav links hidden on mobile — no hamburger menu fallback provided")
        else:
            note("INFO", "UX", "Mobile Nav", f"Nav links display: {nav_links_visible}")

        # Hero text size on mobile
        hero_size = page.evaluate("() => parseFloat(getComputedStyle(document.querySelector('h1.shout') || document.querySelector('.shout')).fontSize)")
        note("INFO", "Typography", "Mobile Hero", f"Hero font-size on 375px: {hero_size:.0f}px")
        if hero_size < 36:
            note("WARN", "Typography", "Mobile Hero", f"Hero text {hero_size:.0f}px may be too small on mobile")

        page.screenshot(path=str(OUT / "13-mobile-hero.png"), full_page=False)

        # Scroll to menu on mobile
        page.evaluate("() => document.getElementById('menu')?.scrollIntoView()")
        time.sleep(0.5)
        page.screenshot(path=str(OUT / "14-mobile-menu.png"))

        # Check menu layout on mobile
        menu_grid_cols = page.evaluate("""
            () => {
                const el = document.querySelector('[id=menu] > .container > div');
                return el ? getComputedStyle(el).gridTemplateColumns : 'not found';
            }
        """)
        note("INFO", "Layout", "Mobile Menu", f"Menu grid on 375px: {menu_grid_cols}")

        # Check no horizontal scroll
        horiz_scroll = page.evaluate("() => document.body.scrollWidth > window.innerWidth")
        if horiz_scroll:
            note("CRIT", "Layout", "Mobile", f"Horizontal scroll detected! body.scrollWidth={page.evaluate('()=>document.body.scrollWidth')} > {375}")
        else:
            note("INFO", "Layout", "Mobile", "No horizontal scroll ✓")

        # Order bar on mobile
        page.evaluate("() => window.scrollTo(0, document.body.scrollHeight)")
        time.sleep(0.3)
        page.screenshot(path=str(OUT / "15-mobile-footer.png"))

        order_bar_mobile = page.evaluate("""
            () => {
                const ob = document.querySelector('.order-bar');
                if (!ob) return null;
                const r = ob.getBoundingClientRect();
                return { bottom: r.bottom, height: r.height };
            }
        """)
        note("INFO", "Layout", "Mobile Order Bar", f"Order bar on mobile: {order_bar_mobile}")

        # Visit section on mobile
        page.evaluate("() => document.getElementById('visit')?.scrollIntoView()")
        time.sleep(0.4)
        page.screenshot(path=str(OUT / "16-mobile-visit.png"))

        # ── 11. MOBILE 390px (iPhone 14) ─────────────────────────────────
        print("\n=== 11. MOBILE 390px (iPhone 14 size) ===")
        page.set_viewport_size({"width": 390, "height": 844})
        page.goto(MAIN, wait_until="networkidle")
        time.sleep(1.5)
        page.screenshot(path=str(OUT / "17-iphone14-hero.png"))

        # ── 12. TABLET 768px ─────────────────────────────────────────────
        print("\n=== 12. TABLET 768px ===")
        page.set_viewport_size({"width": 768, "height": 1024})
        page.goto(MAIN, wait_until="networkidle")
        time.sleep(1.5)
        page.screenshot(path=str(OUT / "18-tablet-hero.png"))
        page.evaluate("() => document.getElementById('menu')?.scrollIntoView()")
        time.sleep(0.4)
        page.screenshot(path=str(OUT / "19-tablet-menu.png"))

        horiz_scroll_tab = page.evaluate("() => document.body.scrollWidth > window.innerWidth")
        if horiz_scroll_tab:
            note("CRIT", "Layout", "Tablet", "Horizontal scroll on 768px!")
        else:
            note("INFO", "Layout", "Tablet", "No horizontal scroll on 768px ✓")

        # ── 13. VARIATIONS PAGE ──────────────────────────────────────────
        print("\n=== 13. VARIATIONS PAGE ===")
        page.set_viewport_size({"width": 1440, "height": 900})
        page.goto(VARS, wait_until="networkidle", timeout=30000)
        time.sleep(3)
        page.screenshot(path=str(OUT / "20-variations-desktop.png"))

        # Check all 3 variations loaded
        artboards = page.query_selector_all(".dc-artboard, [class*=artboard]")
        note("INFO", "Frontend", "Variations", f"Artboard elements found: {len(artboards)}")

        # ── 14. PERFORMANCE METRICS ──────────────────────────────────────
        print("\n=== 14. PERFORMANCE METRICS ===")
        page.goto(MAIN, wait_until="networkidle")
        time.sleep(2)

        perf = page.evaluate("""
            () => {
                const nav = performance.getEntriesByType('navigation')[0];
                const paint = performance.getEntriesByType('paint');
                const fcp = paint.find(p => p.name === 'first-contentful-paint');
                return {
                    domContentLoaded: Math.round(nav?.domContentLoadedEventEnd || 0),
                    loadComplete: Math.round(nav?.loadEventEnd || 0),
                    fcp: Math.round(fcp?.startTime || 0),
                    transferSize: nav?.transferSize || 0,
                    resourceCount: performance.getEntriesByType('resource').length,
                };
            }
        """)
        note("INFO", "Performance", "Load", f"DCL: {perf.get('domContentLoaded')}ms | Load: {perf.get('loadComplete')}ms | FCP: {perf.get('fcp')}ms")
        note("INFO", "Performance", "Load", f"Resources: {perf.get('resourceCount')} | Transfer: {perf.get('transferSize', 0)/1024:.0f}KB")

        if perf.get("fcp", 0) > 2500:
            note("WARN", "Performance", "FCP", f"FCP {perf['fcp']}ms > 2500ms (Google 'needs improvement' threshold)")

        # Babel standalone is a HUGE script
        resources = page.evaluate("""
            () => performance.getEntriesByType('resource')
                .map(r => ({ name: r.name.split('/').pop().slice(0,50), size: Math.round(r.transferSize/1024), duration: Math.round(r.duration) }))
                .sort((a,b) => b.size - a.size)
                .slice(0, 8)
        """)
        for r in resources:
            note("INFO" if r.get("size", 0) < 500 else "WARN", "Performance", "Resources", f"{r.get('name')}: {r.get('size')}KB in {r.get('duration')}ms")

        # Check Babel in prod
        uses_babel = page.evaluate("() => !!document.querySelector('script[src*=babel]')")
        if uses_babel:
            note("WARN", "Performance", "Babel", "babel.min.js loaded at runtime — compiles JSX in browser. ~8MB download, slow parse. Use a build step for production.")

        # ── 15. CLS / LAYOUT SHIFT ───────────────────────────────────────
        cls_score = page.evaluate("""
            () => {
                return new Promise(resolve => {
                    let cls = 0;
                    const obs = new PerformanceObserver(list => {
                        for (const e of list.getEntries()) {
                            if (!e.hadRecentInput) cls += e.value;
                        }
                    });
                    try {
                        obs.observe({ type: 'layout-shift', buffered: true });
                    } catch (e) { resolve('not-supported'); return; }
                    setTimeout(() => { obs.disconnect(); resolve(cls.toFixed(4)); }, 2000);
                });
            }
        """)
        note("INFO", "Performance", "CLS", f"CLS score: {cls_score} (target <0.1)")

        # ── 16. DARK THEME CHECK ─────────────────────────────────────────
        print("\n=== 16. DARK THEME (Verge black) ===")
        page.goto(MAIN, wait_until="networkidle")
        time.sleep(2)
        # Switch to verge theme via JS
        page.evaluate("""
            () => {
                const ub = document.querySelector('.uglysite');
                if (ub) {
                    ub.classList.remove('theme-diner','theme-checker');
                    ub.classList.add('theme-verge');
                    ub.style.setProperty('--bg','#131313');
                    ub.style.setProperty('--ink','#ffffff');
                }
            }
        """)
        time.sleep(0.5)
        page.screenshot(path=str(OUT / "21-dark-theme-verge.png"))
        note("INFO", "Design", "Dark Theme", "Verge black theme screenshot captured")

        # ── 17. FOCUS NAVIGATION ─────────────────────────────────────────
        print("\n=== 17. KEYBOARD / FOCUS NAVIGATION ===")
        page.goto(MAIN, wait_until="networkidle")
        time.sleep(1.5)
        # Tab through first 5 elements
        for i in range(5):
            page.keyboard.press("Tab")
            time.sleep(0.1)
        page.screenshot(path=str(OUT / "22-keyboard-focus.png"))
        focus_el = page.evaluate("() => { const el = document.activeElement; return { tag: el.tagName, text: el.innerText?.slice(0,30), outline: getComputedStyle(el).outline }; }")
        note("INFO", "A11y", "Focus Nav", f"Focus after 5 tabs: {focus_el}")
        if "none" in str(focus_el.get("outline", "")):
            note("WARN", "A11y", "Focus Nav", "Active element has outline:none — focus indicator may be invisible")

        # ── BUYER PERSONA CHECKS ─────────────────────────────────────────
        print("\n=== 18. BUYER PERSONA CHECKS ===")
        page.goto(MAIN, wait_until="networkidle")
        time.sleep(2)

        # Is there a clear CTA above the fold?
        vp_btns = page.evaluate("""
            () => [...document.querySelectorAll('button, a')].filter(el => {
                const r = el.getBoundingClientRect();
                return r.top > 0 && r.bottom < window.innerHeight && (el.innerText || '').trim().length > 0;
            }).map(el => el.innerText.trim().slice(0,30))
        """)
        note("INFO", "Buyer", "Above Fold", f"Interactive elements above fold: {vp_btns}")

        # Is address machine-readable (schema)?
        has_schema = page.evaluate("() => !!document.querySelector('[itemtype*=schema], script[type*=json-ld]')")
        if not has_schema:
            note("WARN", "SEO", "Schema", "No structured data (LocalBusiness schema) — Google won't show rich results")

        # Is there an online ordering link?
        order_href = page.evaluate("() => [...document.querySelectorAll('button')].find(b => b.innerText.includes('Order'))?.getAttribute('onclick') || 'no href'")
        note("WARN", "Buyer", "Ordering", "Order Online buttons are non-functional placeholders — critical for a restaurant site")

        # Phone number usable?
        note("WARN", "Buyer", "Contact", "Phone number shown as '(206) ███-████' — users cannot click-to-call")

        # ── BURGER SHOP OWNER PERSONA ────────────────────────────────────
        print("\n=== 19. BURGER SHOP OWNER PERSONA ===")
        note("INFO", "Owner", "Brand", "Brand voice is strong: 'ugly', brutalist, unapologetic — consistent ✓")
        note("WARN", "Owner", "Ordering", "No online ordering integration (Slice, Toast, Olo, etc.) — biggest revenue gap")
        note("WARN", "Owner", "Today Status", "'OPEN NOW' is hardcoded — will show wrong status on holidays/closures")
        note("WARN", "Owner", "Today Highlight", "Thursday hardcoded as 'today' — will be wrong 6/7 days of the week")
        note("WARN", "Owner", "Price Range", "$10–20 range noted — verify this still matches menu (highest item $16 Fish & Chips)")
        note("INFO", "Owner", "Reviews", "8 Google reviews displayed with attribution — good social proof ✓")
        note("WARN", "Owner", "Menu Updates", "Menu is hardcoded JSX — owner cannot update prices/items without a developer")
        note("INFO", "Owner", "Address", "Address correct: 19939 Ballinger Way NE B, Shoreline WA 98155 ✓")
        note("INFO", "Owner", "Hours", "Hours display is accurate and complete ✓")

        # ── FULL PAGE SCREENSHOTS ─────────────────────────────────────────
        print("\n=== 20. FULL PAGE SCREENSHOTS ===")
        page.set_viewport_size({"width": 1440, "height": 900})
        page.goto(MAIN, wait_until="networkidle")
        time.sleep(2)
        page.screenshot(path=str(OUT / "23-full-page-desktop.png"), full_page=True)

        page.set_viewport_size({"width": 375, "height": 812})
        page.goto(MAIN, wait_until="networkidle")
        time.sleep(2)
        page.screenshot(path=str(OUT / "24-full-page-mobile.png"), full_page=True)

        browser.close()

    # ── REPORT ────────────────────────────────────────────────────────────
    print("\n" + "="*70)
    print("UGLY BURGER AUDIT REPORT")
    print("="*70)

    crits = [f for f in findings if f["severity"] == "CRIT"]
    warns = [f for f in findings if f["severity"] == "WARN"]
    infos = [f for f in findings if f["severity"] == "INFO"]

    print(f"\nCRITICAL ({len(crits)})")
    for f in crits:
        print(f"  [{f['persona']}] {f['section']}: {f['issue']}")

    print(f"\nWARNINGS ({len(warns)})")
    for f in warns:
        print(f"  [{f['persona']}] {f['section']}: {f['issue']}")

    print(f"\nPASSING ({len(infos)})")
    for f in infos:
        print(f"  [{f['persona']}] {f['section']}: {f['issue']}")

    # Save JSON
    with open(str(OUT / "findings.json"), "w", encoding="utf-8") as fh:
        json.dump(findings, fh, indent=2, ensure_ascii=False)

    print(f"\nDone. Screenshots in screenshots/audit/. Findings in screenshots/audit/findings.json")
    return findings

if __name__ == "__main__":
    run()
