import { ArrowPathIcon } from "@heroicons/react/24/outline";

export default function AppErrorFallback({ error, resetErrorBoundary }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-lg font-bold text-slate-900">
          Không thể hiển thị trang này
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {error?.message || "Đã xảy ra lỗi ngoài dự kiến. Vui lòng thử lại."}
        </p>
        <button
          type="button"
          onClick={resetErrorBoundary}
          className="mx-auto mt-5 flex h-10 items-center gap-2 rounded-md bg-violet-600 px-4 text-sm font-semibold text-white transition hover:bg-violet-700"
        >
          <ArrowPathIcon className="h-4 w-4" />
          Thử lại
        </button>
      </section>
    </main>
  );
}
