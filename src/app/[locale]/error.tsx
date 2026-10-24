"use client";

export default function LocaleError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container state-page" style={{ paddingBlock: 72 }}>
      <div style={{ width: "100%", maxWidth: 640, marginInline: "auto", textAlign: "center" }}>
        <div
          className="es-icon"
          style={{ marginInline: "auto", marginBlockEnd: 18 }}
          aria-hidden="true"
        >
          ⚠
        </div>
        <h1 style={{ fontSize: "1.6rem", marginBlockEnd: 10 }}>
          حصل خطأ غير متوقع — Something went wrong
        </h1>
        <p style={{ color: "var(--color-muted)", marginBlockEnd: 24 }}>
          جرّب تحديث الصفحة. Try again, and if the problem continues, head back to the homepage.
        </p>
        <button type="button" className="btn btn-primary" onClick={reset}>
          حاول مرة تانية · Try again
        </button>
      </div>
    </div>
  );
}
