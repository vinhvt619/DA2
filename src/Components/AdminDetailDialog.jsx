import * as Dialog from '@radix-ui/react-dialog';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useRef } from 'react';

export default function AdminDetailDialog({ title, onClose, busy = false, children }) {
  const opener = useRef(document.activeElement);
  return <Dialog.Root open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[200] bg-black/40" />
      <Dialog.Content aria-describedby={undefined} onCloseAutoFocus={(event) => { event.preventDefault(); opener.current?.focus({ preventScroll: true }); }} className="fixed left-1/2 top-1/2 z-[201] flex max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white text-sm text-slate-800 shadow-xl focus:outline-none">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 sm:px-6">
          <Dialog.Title className="min-w-0 break-words text-lg font-bold">{title}</Dialog.Title>
          <Dialog.Close disabled={busy} title="Đóng chi tiết" aria-label="Đóng chi tiết" className="flex size-9 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-50"><XMarkIcon className="size-5" /></Dialog.Close>
        </header>
        <div className="min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6">{children}</div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
