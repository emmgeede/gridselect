// @vitest-environment jsdom
// F20: entries from a server. See docs/features/F20-async-items/spec.md.
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { gridselect } from "@emmgeede/gridselect";
import "@emmgeede/gridselect/element";

const DATA = [["AMS", "Amsterdam"], ["BER", "Berlin"], ["BRN", "Bern"], ["BTS", "Bratislava"], ["BRU", "Brussels"], ["BUD", "Budapest"], ["CPH", "Copenhagen"]]
  .map(([value, label]) => ({ value, label }));
/** A fake server: filters DATA by the query, answers after `ms`. */
const server = (ms = 10) => vi.fn((q, signal) => new Promise((resolve, reject) => {
  const t = setTimeout(() => resolve(DATA.filter((d) => d.label.toLowerCase().startsWith(q.toLowerCase()))), ms);
  signal.addEventListener("abort", () => { clearTimeout(t); reject(new DOMException("aborted", "AbortError")); });
}));
function mount(opts) {
  document.body.innerHTML = `<form id="f"><fieldset id="w"><legend>City</legend></fieldset></form>`;
  const w = document.getElementById("w");
  return [w, gridselect(w, opts)];
}
const field = (w) => w.querySelector("[data-gridselect-field]");
const search = (w) => w.querySelector("[data-gridselect-search]");
const shown = (w) => [...w.querySelectorAll("[data-gridselect-item]")].filter((i) => !i.hidden).map((i) => i.dataset.value);
const status = (w) => w.querySelector('[role="status"]').textContent.trim();
const message = (w) => { const e = w.querySelector("[data-gridselect-empty]"); return e.hidden ? "" : e.textContent; };
function type(w, text) {
  search(w).value = text;
  search(w).dispatchEvent(new Event("input", { bubbles: true }));
}
const flush = () => vi.advanceTimersByTimeAsync(300);

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("load", () => {
  it("always has a panel and loads on open", async () => {
    const load = server();
    const [w] = mount({ load, name: "city" });
    expect(field(w)).not.toBeNull();
    expect(field(w).disabled).toBe(false);
    field(w).click();
    await vi.advanceTimersByTimeAsync(0);
    expect(load).toHaveBeenCalledWith("", expect.any(AbortSignal));
    expect(message(w)).toBe("Loading…");
    await flush();
    expect(shown(w)).toEqual(DATA.map((d) => d.value));
    expect(status(w)).toBe("7 results");
  });

  it("asks once, 250 ms after the last keystroke, keeps panel, query and focus, does not filter itself", async () => {
    const load = vi.fn(async (q) => (q ? [{ value: "X", label: "Not matching at all" }] : DATA));
    const [w] = mount({ load });
    field(w).click();
    await flush();
    type(w, "b");
    type(w, "br");
    await vi.advanceTimersByTimeAsync(200);
    expect(load).toHaveBeenCalledTimes(1);
    await flush();
    expect(load).toHaveBeenLastCalledWith("br", expect.any(AbortSignal));
    expect(load).toHaveBeenCalledTimes(2);
    expect(shown(w)).toEqual(["X"]);
    expect(search(w).value).toBe("br");
    expect(document.activeElement).toBe(search(w));
    expect(w.querySelector("[data-gridselect-panel]").hidden).toBe(false);
    expect(w.querySelector("[data-cursor]").dataset.value).toBe("X");
    expect(status(w)).toBe("1 result");
  });

  it("aborts stale requests; a late answer changes nothing", async () => {
    let calls = 0;
    const load = vi.fn((q, signal) => new Promise((resolve) => {
      const slow = calls++ === 1; // the first typed query answers late and ignores abort
      setTimeout(() => resolve(slow ? [{ value: "OLD", label: "old" }] : [{ value: "NEW", label: q }]), slow ? 2000 : 10);
    }));
    const [w] = mount({ load });
    field(w).click();
    await flush();
    type(w, "a");
    await flush();
    type(w, "ab");
    await flush();
    const signals = load.mock.calls.map((c) => c[1]);
    expect(signals[1].aborted).toBe(true);
    await vi.advanceTimersByTimeAsync(3000);
    expect(shown(w)).toEqual(["NEW"]);
  });

  it("shows the error text and keeps the entries", async () => {
    let fail = false;
    const load = vi.fn(async () => { if (fail) throw new Error("down"); return DATA; });
    const [w] = mount({ load, errorText: "Server down" });
    field(w).click();
    await flush();
    fail = true;
    type(w, "x");
    await flush();
    expect(message(w)).toBe("Server down");
    expect(status(w)).toBe("Server down");
    expect(shown(w).length).toBe(7);
    fail = false;
    type(w, "xy");
    await flush();
    expect(message(w)).toBe("");
  });

  it("keeps a chosen entry that the next answer lacks", async () => {
    const [w, gs] = mount({ load: server(), name: "city" });
    field(w).click();
    await flush();
    w.querySelector('[data-gridselect-item][data-value="BER"]').click();
    expect(gs.value).toBe("BER");
    field(w).click();
    type(w, "bu");
    await flush();
    expect(shown(w)).toEqual(["BUD"]);
    expect(gs.value).toBe("BER");
    expect(field(w).textContent).toBe("Berlin");
    expect(new FormData(document.getElementById("f")).get("city")).toBe("BER");
  });

  it("minQueryLength: nothing loads below it, the panel says why", async () => {
    const load = server();
    const [w] = mount({ load, minQueryLength: 2 });
    field(w).click();
    expect(load).not.toHaveBeenCalled();
    expect(message(w)).toBe("Type 2 characters to search");
    expect(shown(w)).toEqual([]);
    type(w, "b");
    await flush();
    expect(load).not.toHaveBeenCalled();
    type(w, "be");
    await flush();
    expect(load).toHaveBeenCalledWith("be", expect.any(AbortSignal));
    expect(shown(w)).toEqual(["BER", "BRN"]);
  });
});

describe("element", () => {
  it("el.load and the text attributes", async () => {
    document.body.innerHTML = `<grid-select label="City" loading-text="Lädt…" min-query-length="1"></grid-select>`;
    const el = document.querySelector("grid-select");
    const load = server();
    el.load = load;
    field(el).click();
    expect(message(el)).toBe("Type 1 characters to search");
    type(el, "b");
    await vi.advanceTimersByTimeAsync(255); // asked at 250 ms, the fake server answers at 260 ms
    expect(message(el)).toBe("Lädt…");
    await flush();
    expect(shown(el).length).toBe(5);
  });
});

describe("QA F20", () => {
  it("an answer after closing does not reopen the panel; destroy aborts", async () => {
    const load = server(500);
    const [w, gs] = mount({ load });
    field(w).click();
    w.querySelector("[data-gridselect-search]").dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await vi.advanceTimersByTimeAsync(600);
    expect(w.querySelector("[data-gridselect-panel]").hidden).toBe(true);
    expect(w.querySelectorAll("[data-gridselect-item]").length).toBe(7);
    field(w).click();
    gs.destroy();
    await vi.advanceTimersByTimeAsync(0);
    expect(load.mock.calls.at(-1)[1].aborted).toBe(true);
    await vi.advanceTimersByTimeAsync(600);
    expect(w.querySelector("[data-gridselect-field]")).toBeNull();
  });

  it("invalid entries in an answer count as a failed load", async () => {
    const [w] = mount({ load: async () => [true] });
    field(w).click();
    await flush();
    expect(message(w)).toBe("Could not load entries");
  });
});
