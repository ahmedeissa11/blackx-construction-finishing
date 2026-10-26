"use client";
import { useParams } from "next/navigation";
import { erpText } from "@/content/erp-dictionary";
export default function ErpError({ reset }: { reset: () => void }) {
  const params = useParams();
  const locale = params?.locale === "ar" ? "ar" : "en";
  return (
    <section className="panel erp-tool" role="alert">
      <h2>{erpText("error", locale)}</h2>
      <button className="btn btn-outline" type="button" onClick={reset}>
        {erpText("retry", locale)}
      </button>
    </section>
  );
}
