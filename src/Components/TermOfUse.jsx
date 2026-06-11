import React from "react";

const links = ["Giới thiệu", "Liên hệ", "Hỏi đáp", "Chính sách", "Điều khoản"];

export default function Terms() {
  return (
    <div className="rounded-xl border-2 border-gray-200 bg-white/75 p-4">
      <div className="flex flex-wrap gap-x-3 gap-y-2">
        {links.map((link) => (
          <a key={link} href="#" className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors">
            {link}
          </a>
        ))}
      </div>
      <p className="mt-3 text-[10px] text-gray-400">© 2025 RabbitCV. All rights reserved.</p>
    </div>
  );
}
