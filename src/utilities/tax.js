// Canadian sales-tax defaults by province (2026 rates, TaxTips.ca).
// Used only to pre-fill Branch Master; the saved branch values are what invoices use.
// gst = GST or HST %, qst = QST % (Quebec only). BC/MB/SK PST is not charged here.
export const PROVINCES = [
  { code: "QC", name: "Quebec", gst: 5, qst: 9.975, gstLabel: "GST" },
  { code: "ON", name: "Ontario", gst: 13, qst: null, gstLabel: "HST" },
  { code: "AB", name: "Alberta", gst: 5, qst: null, gstLabel: "GST" },
  { code: "BC", name: "British Columbia", gst: 5, qst: null, gstLabel: "GST" },
  { code: "MB", name: "Manitoba", gst: 5, qst: null, gstLabel: "GST" },
  { code: "NB", name: "New Brunswick", gst: 15, qst: null, gstLabel: "HST" },
  { code: "NL", name: "Newfoundland and Labrador", gst: 15, qst: null, gstLabel: "HST" },
  { code: "NS", name: "Nova Scotia", gst: 14, qst: null, gstLabel: "HST" },
  { code: "NT", name: "Northwest Territories", gst: 5, qst: null, gstLabel: "GST" },
  { code: "NU", name: "Nunavut", gst: 5, qst: null, gstLabel: "GST" },
  { code: "PE", name: "Prince Edward Island", gst: 15, qst: null, gstLabel: "HST" },
  { code: "SK", name: "Saskatchewan", gst: 5, qst: null, gstLabel: "GST" },
  { code: "YT", name: "Yukon", gst: 5, qst: null, gstLabel: "GST" },
];

export const provinceByCode = (code) => PROVINCES.find((p) => p.code === code);

export const GST_PATTERN = /^\d{9}RT\d{4}$/i;
export const QST_PATTERN = /^\d{10}TQ\d{4}$/i;
