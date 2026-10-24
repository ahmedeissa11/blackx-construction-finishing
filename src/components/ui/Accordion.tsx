"use client";

import { useId, useState } from "react";

export type AccordionEntry = { question: string; answer: string };

export function Accordion({ items }: { items: AccordionEntry[] }) {
  const baseId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div>
      {items.map((item, index) => {
        const buttonId = `${baseId}-btn-${index}`;
        const panelId = `${baseId}-panel-${index}`;
        const open = openIndex === index;
        return (
          <div className="accordion-item" key={item.question}>
            <h3 style={{ margin: 0 }}>
              <button
                type="button"
                id={buttonId}
                className="accordion-btn"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIndex(open ? null : index)}
              >
                <span>{item.question}</span>
                <span className="acc-icon" aria-hidden="true">
                  +
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className="accordion-panel"
              hidden={!open}
            >
              <p>{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
