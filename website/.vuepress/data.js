// Sample data for the live examples.
export const currencies = ["Euro (EUR)", "Swiss franc (CHF)", "US dollar (USD)", "Pound sterling (GBP)", "Japanese yen (JPY)",
  "Danish krone (DKK)", "Norwegian krone (NOK)", "Swedish krona (SEK)", "Polish złoty (PLN)", "Czech koruna (CZK)",
  "Hungarian forint (HUF)", "Turkish lira (TRY)", "Brazilian real (BRL)", "South African rand (ZAR)", "Canadian dollar (CAD)",
  "Australian dollar (AUD)", "New Zealand dollar (NZD)", "Mexican peso (MXN)", "Chilean peso (CLP)", "Indian rupee (INR)",
  "Chinese yuan (CNY)", "Hong Kong dollar (HKD)", "Singapore dollar (SGD)", "Thai baht (THB)", "South Korean won (KRW)"]
  .map((label) => ({ value: label.slice(-4, -1), label }));

const code = (c) => currencies.find((x) => x.value === c);
export const regions = [
  { label: "Europe", items: ["EUR", "CHF", "GBP", "DKK", "NOK", "SEK", "PLN", "CZK", "HUF", "TRY"].map(code) },
  { label: "Americas", items: ["USD", "CAD", "BRL", "MXN", "CLP"].map(code) },
  { label: "Asia-Pacific", items: ["JPY", "AUD", "NZD", "INR", "CNY", "HKD", "SGD", "THB", "KRW"].map(code) },
];

export const countries = [["Austria", "Vienna"], ["Belgium", "Brussels"], ["Croatia", "Zagreb"], ["Denmark", "Copenhagen"],
  ["Estonia", "Tallinn"], ["Finland", "Helsinki"], ["France", "Paris"], ["Germany", "Berlin"], ["Greece", "Athens"],
  ["Ireland", "Dublin"], ["Italy", "Rome"], ["Portugal", "Lisbon"], ["Spain", "Madrid"]]
  .map(([label, capital]) => ({ value: label.slice(0, 2).toUpperCase(), label, description: `Capital: ${capital}` }));

export const airports = ["Berlin (BER)", "Frankfurt (FRA)", "Munich (MUC)", "Zurich (ZRH)", "Vienna (VIE)", "Amsterdam (AMS)",
  "Paris (CDG)", "London (LHR)", "Madrid (MAD)", "Rome (FCO)", "Copenhagen (CPH)", "Oslo (OSL)"]
  .map((label) => ({ value: label.slice(-4, -1), label }));

/** A fake server: filters the currencies, answers after 400 ms, honours the abort signal. */
export const fakeLoad = (query, signal) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => resolve(currencies.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))), 400);
  signal.addEventListener("abort", () => { clearTimeout(timer); reject(signal.reason); });
});
