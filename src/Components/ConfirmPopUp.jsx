import React from "react";

export default function ConfirmPopUp({ message, confirm, cancel }) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl border-[0.5px] border-slate-200 w-full max-w-sm p-5 shadow-xl animate-in zoom-in-95 duration-200">
        <h4 className="text-[13px] font-bold text-slate-800">Xác nhận thao tác</h4>
        <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
          {message || "Bạn có chắc chắn muốn thực hiện hành động này không?"}
        </p>
        <div className="flex items-center justify-end gap-2.5 mt-5">
          <button
            onClick={cancel}
            className="px-3 py-1.5 border-[0.5px] border-slate-200 rounded-[6px] text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            onClick={confirm}
            className="px-3 py-1.5 bg-red-500 text-white rounded-[6px] text-xs font-semibold hover:bg-red-650 transition-colors cursor-pointer"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}
