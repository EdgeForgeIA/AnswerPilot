import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "VeriQuill — Security questionnaires, answered in minutes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #062e29 0%, #0b7a6b 100%)",
          color: "#f5f7f6",
          fontSize: 32,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "#2fbba4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#062e29",
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            ✓
          </div>
          <div style={{ fontSize: 34, fontWeight: 700 }}>VeriQuill</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1, maxWidth: 950 }}>
            The 240-row security questionnaire, answered before lunch.
          </div>
          <div style={{ fontSize: 30, opacity: 0.85, maxWidth: 900 }}>
            Cited, confidence-graded drafts from your own approved answer library. Never invented.
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, fontSize: 24, opacity: 0.9 }}>
          <div style={{ border: "2px dashed #2fbba4", borderRadius: 8, padding: "8px 18px" }}>
            SOC 2
          </div>
          <div style={{ border: "2px dashed #2fbba4", borderRadius: 8, padding: "8px 18px" }}>
            SIG Lite
          </div>
          <div style={{ border: "2px dashed #2fbba4", borderRadius: 8, padding: "8px 18px" }}>
            CAIQ
          </div>
          <div style={{ border: "2px dashed #2fbba4", borderRadius: 8, padding: "8px 18px" }}>
            Vendor risk
          </div>
        </div>
      </div>
    ),
    size
  );
}
