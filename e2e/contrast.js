// Shared by the browser tests: WCAG contrast of rendered colours.

/**
 * Runs in the page: contrast ratio between a colour of `el` and the colour behind it.
 * `what` is "text" (color vs. composited background), "border" (border colour vs. the parent's
 * background) or "outline" (outline colour vs. the parent's background).
 */
export async function contrast(locator, what = "text") {
  return locator.evaluate((el, what) => {
    const parse = (c) => {
      const m = c.match(/rgba?\(([^)]+)\)/);
      if (!m) return [0, 0, 0, 0];
      const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
      return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
    };
    const over = (top, bottom) => {
      const a = top[3];
      return [0, 1, 2].map((i) => top[i] * a + bottom[i] * (1 - a)).concat(1);
    };
    // Composite backgrounds from the element up to the root, top layer first.
    const backdrop = (node) => {
      const layers = [];
      for (let n = node; n && n.nodeType === 1; n = n.parentElement) {
        const c = parse(getComputedStyle(n).backgroundColor);
        if (c[3] > 0) layers.push(c);
        if (c[3] === 1) break;
      }
      let result = [255, 255, 255, 1];
      for (let i = layers.length - 1; i >= 0; i--) result = over(layers[i], result);
      return result;
    };
    const lum = (c) => {
      const [r, g, b] = c.slice(0, 3).map((v) => {
        v /= 255;
        return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const s = getComputedStyle(el);
    let fg, bg;
    if (what === "text") {
      bg = backdrop(el);
      fg = over(parse(s.color), bg);
    } else {
      bg = backdrop(el.parentElement);
      fg = over(parse(what === "border" ? s.borderTopColor : s.outlineColor), bg);
    }
    const [a, b] = [lum(fg), lum(bg)];
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  }, what);
}
