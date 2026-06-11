import React from "react";
import Terms from "./TermOfUse";

export default function StickySettings() {
  return (
    <aside className="w-[75%] lg:sticky lg:top-4">
      <div className="mt-10">
        <Terms />
      </div>
    </aside>
  );
}
