import time
from playwright.sync_api import sync_playwright

BASE = "http://localhost:7878/Ugly%20Burger.html"

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_context(viewport={"width": 1440, "height": 900}).new_page()
        page.goto(BASE, wait_until="networkidle", timeout=30000)
        time.sleep(2)

        checks = {}

        checks["focus_visible_css"] = page.evaluate("""
            () => [...document.styleSheets].flatMap(s => { try { return [...s.cssRules].map(r => r.cssText); } catch { return []; } }).join(' ').includes(':focus-visible')
        """)

        checks["reduced_motion_css"] = page.evaluate("""
            () => [...document.styleSheets].flatMap(s => { try { return [...s.cssRules].map(r => r.cssText); } catch { return []; } }).join(' ').includes('prefers-reduced-motion')
        """)

        checks["skip_link"] = page.evaluate("""
            () => !!document.querySelector('a[href="#main-content"]')
        """)

        checks["main_content_id"] = page.evaluate("""
            () => !!document.getElementById('main-content')
        """)

        checks["json_ld"] = page.evaluate("""
            () => !!document.querySelector('script[type="application/ld+json"]')
        """)

        checks["tablist_role"] = page.evaluate("""
            () => !!document.querySelector('[role="tablist"]')
        """)

        checks["tab_role"] = page.evaluate("""
            () => !!document.querySelector('[role="tab"]')
        """)

        checks["aria_selected"] = page.evaluate("""
            () => { const t = document.querySelector('[role="tab"]'); return t ? t.hasAttribute('aria-selected') : false; }
        """)

        checks["stars_aria_label"] = page.evaluate("""
            () => !!document.querySelector('.stars[aria-label]')
        """)

        checks["tel_link"] = page.evaluate("""
            () => { const a = document.querySelector('a[href]'); const links = [...document.querySelectorAll('a')]; return links.some(l => (l.href || '').startsWith('tel:')); }
        """)

        checks["json_ld_has_address"] = page.evaluate("""
            () => { try { const s = document.querySelector('script[type="application/ld+json"]'); return JSON.parse(s.textContent).address !== undefined; } catch { return false; } }
        """)

        checks["no_unofficial_text"] = page.evaluate("""
            () => !document.body.innerText.toUpperCase().includes('UNOFFICIAL')
        """)

        # Mobile: nav links hidden
        page.set_viewport_size({"width": 375, "height": 812})
        page.goto(BASE, wait_until="networkidle", timeout=30000)
        time.sleep(1.5)

        checks["mobile_nav_links_hidden"] = page.evaluate("""
            () => getComputedStyle(document.querySelector('.nav-links')).display === 'none'
        """)

        # Dynamic today row
        checks["dynamic_today_row"] = page.evaluate("""
            () => {
                const today = new Date().toLocaleString('en-US', { weekday: 'long' });
                const rows = [...document.querySelectorAll('.hours-row.today')];
                if (rows.length === 0) return false;
                return rows[0].innerText.toLowerCase().includes(today.toLowerCase().slice(0, 3));
            }
        """)

        browser.close()

    print("\n=== VERIFICATION RESULTS ===")
    all_pass = True
    for k, v in checks.items():
        status = "PASS" if v else "FAIL"
        if not v:
            all_pass = False
        print(f"  [{status}] {k}")

    passed = sum(1 for v in checks.values() if v)
    print(f"\n{'ALL CHECKS PASS' if all_pass else 'SOME FAILED'} ({passed}/{len(checks)})")

if __name__ == "__main__":
    run()
