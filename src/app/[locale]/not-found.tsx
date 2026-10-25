import Link from "next/link";
import { Arrow, EmptyState } from "@/components/ui/Pieces";

export default function LocaleNotFound() {
  return (
    <div className="container state-page" style={{ paddingBlock: 72 }}>
      <div style={{ width: "100%" }}>
        <div style={{ textAlign: "center", marginBlockEnd: 28 }}>
          <img
            src="/brand/blackx-logo.jpg"
            alt="BLACK X"
            width={76}
            height={76}
            style={{ borderRadius: 16, marginInline: "auto" }}
          />
        </div>
        <EmptyState
          icon="٤٠٤"
          titleLevel={1}
          title="الصفحة مش موجودة — Page not found"
          text="الرابط اللي فتحته غير متاح أو تم نقله. The page you requested is unavailable or has moved."
          actionLabel="العودة للرئيسية · Back to home"
          actionHref="/ar"
        />
        <p style={{ textAlign: "center", marginBlockStart: 18 }}>
          <Link className="text-link" href="/en">
            English home <Arrow />
          </Link>
        </p>
      </div>
    </div>
  );
}
