import * as AlertDialog from "@radix-ui/react-alert-dialog";
import React from "react";

export default function ConfirmPopUp({ message, confirm, cancel }) {
  return (
    <AlertDialog.Root open>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-xs data-[state=open]:animate-in data-[state=open]:fade-in" />
        <AlertDialog.Content
          onEscapeKeyDown={cancel}
          className="fixed left-1/2 top-1/2 z-[1000] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white p-5 shadow-xl data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 focus:outline-none"
        >
          <AlertDialog.Title className="text-[13px] font-bold text-slate-800">
            Xác nhận thao tác
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2.5 text-xs leading-relaxed text-slate-500">
            {message || "Bạn có chắc chắn muốn thực hiện hành động này không?"}
          </AlertDialog.Description>
          <div className="mt-5 flex items-center justify-end gap-2.5">
            <AlertDialog.Cancel asChild>
              <button
                type="button"
                onClick={cancel}
                className="cursor-pointer rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                Hủy bỏ
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                type="button"
                onClick={confirm}
                className="cursor-pointer rounded-md bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
              >
                Xác nhận
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
