import React from "react";

const links = ["Giới thiệu", "Liên hệ", "Hỏi đáp", "Chính sách", "Điều khoản"];

export default function Terms() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white/70 p-3.5">
      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
        {links.map((link) => (
          <a
            key={link}
            href="#"
            className="text-[9px] text-slate-400 transition-colors hover:text-violet-600"
          >
            {link}
          </a>
        ))}
      </div>
      <p className="mt-2.5 text-[8px] leading-4 text-slate-400">
        © 2025 RabbitCV. All rights reserved.
      </p>
    </div>
  );
}
