import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const SECTION_ORDER = [
  "title",
  "personalInfo",
  "bio",
  "experience",
  "education",
  "skill",
  "project",
  "certificate",
  "award",
  "language",
  "hobby",
];

const ORIGIN_BADGE_CLASSES = {
  profile: "border-emerald-200 bg-emerald-50 text-emerald-700",
  user_role: "border-sky-200 bg-sky-50 text-sky-700",
  ai: "border-violet-200 bg-violet-50 text-violet-700",
};

const groupProposalsBySection = (proposals = []) => {
  const bySection = new Map();
  for (const proposal of proposals) {
    const bucket = bySection.get(proposal.sectionKey) || [];
    bucket.push(proposal);
    bySection.set(proposal.sectionKey, bucket);
  }

  return SECTION_ORDER.filter((key) => bySection.has(key)).map((key) => {
    const items = bySection.get(key);
    return {
      sectionKey: key,
      sectionLabel: items[0]?.sectionLabel || key,
      items,
    };
  });
};

const getProposalAccessibleName = (proposal) =>
  proposal.kind === "item_field"
    ? `${proposal.sectionLabel}: ${proposal.itemLabel} - ${proposal.fieldLabel}`
    : `${proposal.sectionLabel}: ${proposal.itemLabel}`;

export default function ResumeAiFillDialog({
  open = false,
  step = "prompt",
  targetRole = "",
  onTargetRoleChange,
  roleValidationError = "",
  errorMessage = "",
  hasCareerContext = false,
  proposals = [],
  selectedIds = [],
  conflicts = [],
  onToggleProposal,
  onSelectSafeDefaults,
  onSelectAllProposals,
  onDeselectAllProposals,
  onSubmitRole,
  onRetry,
  onEditRole,
  onRefreshPreview,
  onConfirmApply,
  onCancel,
}) {
  const selectedSet =
    selectedIds instanceof Set ? selectedIds : new Set(selectedIds || []);
  const selectedCount = proposals.filter((item) => selectedSet.has(item.id)).length;
  const reviewCount = proposals.filter((item) => item.requiresReview).length;
  const selectedReviewCount = proposals.filter(
    (item) => item.requiresReview && selectedSet.has(item.id),
  ).length;
  const safeDefaultCount = proposals.filter((item) => item.defaultSelected).length;
  const groupedSections = groupProposalsBySection(proposals);
  const isWideStep = step === "preview";

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onCancel?.();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[1000] bg-slate-950/50 backdrop-blur-[1px]" />
        <Dialog.Content
          aria-describedby="ai-fill-dialog-description"
          className={`fixed left-1/2 top-1/2 z-[1001] flex max-h-[90vh] w-[calc(100vw-1.5rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl focus:outline-none ${
            isWideStep ? "max-w-3xl" : "max-w-md"
          }`}
        >
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
            <div>
              <Dialog.Title className="flex items-center gap-2 text-base font-bold text-slate-900 sm:text-lg">
                <SparklesIcon className="h-5 w-5 text-violet-600" />
                {step === "preview" ? "Xem trước đề xuất điền CV" : "AI điền CV"}
              </Dialog.Title>
              <Dialog.Description
                id="ai-fill-dialog-description"
                className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm"
              >
                {step === "prompt" &&
                  "Nhập vị trí bạn muốn ứng tuyển để AI viết các phần CV còn thiếu."}
                {step === "loading" &&
                  "Hệ thống đang tổng hợp đề xuất. Nội dung CV hiện tại chưa bị thay đổi."}
                {step === "error" &&
                  "Không thể hoàn tất tạo đề xuất AI. CV và lịch sử hoàn tác của bạn vẫn được giữ nguyên."}
                {step === "empty" &&
                  "Không có đề xuất mới nào phù hợp để điền vào CV hiện tại."}
                {step === "preview" &&
                  "Kiểm tra kỹ nguồn dữ liệu và tích chọn từng mục bạn muốn áp dụng. Dữ liệu bạn đã nhập sẽ không bị ghi đè."}
              </Dialog.Description>
            </div>
            <Dialog.Close
              type="button"
              aria-label="Đóng"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              <XMarkIcon className="h-5 w-5" />
            </Dialog.Close>
          </header>

          {step === "prompt" && (
            <form
              className="flex flex-1 flex-col overflow-y-auto px-5 py-4"
              onSubmit={(event) => {
                event.preventDefault();
                onSubmitRole?.(targetRole);
              }}
            >
              <label
                htmlFor="ai-target-role"
                className="block text-sm font-semibold text-slate-700"
              >
                Vị trí mong muốn
              </label>
              <input
                id="ai-target-role"
                autoFocus
                value={targetRole}
                onChange={(event) => onTargetRoleChange?.(event.target.value)}
                placeholder="Ví dụ: Frontend Developer"
                className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
              {roleValidationError && (
                <p
                  role="alert"
                  className="mt-2 text-xs font-medium text-red-600"
                >
                  {roleValidationError}
                </p>
              )}
              <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
                Thông tin từ hồ sơ cá nhân và đề xuất của AI sẽ luôn hiển thị trong bản xem trước để bạn chọn trước khi áp dụng.
              </p>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-violet-600 px-4 text-sm font-bold text-white transition hover:bg-violet-700"
                >
                  <SparklesIcon className="h-4 w-4" />
                  Bắt đầu điền
                </button>
              </div>
            </form>
          )}

          {step === "loading" && (
            <div
              role="status"
              aria-live="polite"
              className="flex flex-col items-center justify-center px-6 py-10 text-center"
            >
              <div className="mb-4 h-9 w-9 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
              <p className="text-sm font-semibold text-slate-800">
                Đang tạo đề xuất nội dung cho CV...
              </p>
              <p className="mt-1 text-xs text-slate-500">
                CV hiện tại của bạn không bị thay đổi cho tới khi bạn bấm xác nhận.
              </p>
              <button
                type="button"
                onClick={onCancel}
                className="mt-6 h-9 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Hủy
              </button>
            </div>
          )}

          {step === "error" && (
            <div className="px-5 py-5">
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
              >
                <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">Không thể tạo đề xuất AI</p>
                  <p className="mt-0.5 text-xs leading-5 text-red-600">
                    {errorMessage || "Đã xảy ra lỗi kết nối khi gọi dịch vụ AI."}
                  </p>
                </div>
              </div>
              {targetRole.trim() && (
                <p className="mt-3 text-xs text-slate-600">
                  Vị trí đang nhập:{" "}
                  <span className="font-semibold text-slate-900">{targetRole.trim()}</span>
                </p>
              )}
              <div className="mt-5 flex flex-wrap justify-end gap-2">
                {!hasCareerContext && (
                  <button
                    type="button"
                    onClick={onEditRole}
                    className="h-9 rounded-md border border-slate-300 px-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Sửa vị trí
                  </button>
                )}
                <button
                  type="button"
                  onClick={onCancel}
                  className="h-9 rounded-md border border-slate-300 px-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md bg-violet-600 px-4 text-sm font-bold text-white transition hover:bg-violet-700"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                  Thử lại
                </button>
              </div>
            </div>
          )}

          {step === "empty" && (
            <div className="px-5 py-6 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <CheckCircleIcon className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-800">
                Chưa có đề xuất mới cần áp dụng
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Các mục hiện tại trong CV đã đầy đủ hoặc AI không trả về nội dung mới. CV và lịch sử hoàn tác của bạn không thay đổi.
              </p>
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={onCancel}
                  className="h-9 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}

          {step === "preview" && (
            <>
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/80 px-5 py-2.5 text-xs">
                <div className="flex flex-wrap items-center gap-2 text-slate-700">
                  <span className="font-semibold text-slate-900">
                    Đã chọn {selectedCount}/{proposals.length} mục
                  </span>
                  {reviewCount > 0 && (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 font-medium text-amber-800">
                      {reviewCount} mục AI cần xác nhận
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={onSelectSafeDefaults}
                    className="rounded border border-slate-300 bg-white px-2.5 py-1 font-medium text-slate-700 transition hover:bg-slate-100"
                    title="Chỉ chọn các mục có nguồn sẵn từ hồ sơ hoặc vị trí bạn nhập"
                  >
                    Chọn mục an toàn ({safeDefaultCount})
                  </button>
                  <button
                    type="button"
                    onClick={onSelectAllProposals}
                    className="rounded border border-slate-300 bg-white px-2.5 py-1 font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    {reviewCount > 0
                      ? "Chọn tất cả (gồm mục cần xác nhận)"
                      : "Chọn tất cả"}
                  </button>
                  <button
                    type="button"
                    onClick={onDeselectAllProposals}
                    className="rounded border border-slate-300 bg-white px-2.5 py-1 font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    Bỏ chọn tất cả
                  </button>
                </div>
              </div>

              {selectedReviewCount > 0 && (
                <div className="shrink-0 border-b border-amber-200 bg-amber-50/80 px-5 py-2 text-xs font-medium text-amber-800">
                  Đang chọn {selectedReviewCount} mục do AI tự soạn — vui lòng kiểm tra lại tính xác thực trước khi bấm áp dụng.
                </div>
              )}

              {conflicts.length > 0 && (
                <div
                  role="alert"
                  className="shrink-0 border-b border-amber-200 bg-amber-50 px-5 py-3 text-xs text-amber-900"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                      <div>
                        <p className="font-semibold">
                          Một số mục đã thay đổi trong lúc bạn xem trước nên đã được bỏ qua:
                        </p>
                        <ul className="mt-1 list-disc space-y-0.5 pl-4">
                          {conflicts.map((conflict) => (
                            <li key={conflict.id}>
                              {conflict.sectionLabel} ({conflict.itemLabel}): {conflict.reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onRefreshPreview}
                      className="inline-flex shrink-0 items-center gap-1 rounded-md border border-amber-300 bg-white px-2.5 py-1 font-semibold text-amber-800 transition hover:bg-amber-100"
                    >
                      <ArrowPathIcon className="h-3.5 w-3.5" />
                      Tạo lại đề xuất mới
                    </button>
                  </div>
                </div>
              )}

              <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
                {groupedSections.map((group) => (
                  <section key={group.sectionKey} aria-label={group.sectionLabel}>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {group.sectionLabel}
                      </h3>
                      <span className="text-xs text-slate-400">
                        {group.items.length} đề xuất
                      </span>
                    </div>
                    <div className="space-y-2">
                      {group.items.map((proposal) => {
                        const checked = selectedSet.has(proposal.id);
                        const originBadgeClass =
                          ORIGIN_BADGE_CLASSES[proposal.origin] ||
                          ORIGIN_BADGE_CLASSES.ai;

                        return (
                          <label
                            key={proposal.id}
                            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                              checked
                                ? "border-violet-300 bg-violet-50/40"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => onToggleProposal?.(proposal.id)}
                              aria-label={getProposalAccessibleName(proposal)}
                              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-sm font-semibold text-slate-900">
                                  {proposal.kind === "item_field"
                                    ? `${proposal.itemLabel} — ${proposal.fieldLabel}`
                                    : proposal.itemLabel}
                                </span>
                                <span
                                  className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${originBadgeClass}`}
                                >
                                  {proposal.originLabel}
                                </span>
                                {proposal.requiresReview && (
                                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                                    Cần xác nhận
                                  </span>
                                )}
                              </div>

                              {(proposal.kind === "title" ||
                                proposal.kind === "personal_field" ||
                                proposal.kind === "bio" ||
                                proposal.kind === "item_field") && (
                                <p className="mt-1 text-xs text-slate-400">
                                  Hiện tại: <span>{proposal.beforeText}</span>
                                </p>
                              )}

                              <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-slate-700 sm:text-sm">
                                {proposal.afterText}
                              </p>

                              {proposal.requiresReview && proposal.reviewReason && (
                                <p className="mt-1.5 text-[11px] font-medium text-amber-700">
                                  {proposal.reviewReason}
                                </p>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>

              <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-3.5">
                <p className="text-xs text-slate-500">
                  {selectedCount === 0
                    ? "Chưa có mục nào được chọn."
                    : "Áp dụng trong 1 thao tác, hỗ trợ Hoàn tác (Ctrl+Z)."}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onCancel}
                    className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    disabled={selectedCount === 0}
                    onClick={onConfirmApply}
                    className="inline-flex h-10 items-center gap-2 rounded-md bg-violet-600 px-4 text-sm font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300"
                  >
                    <SparklesIcon className="h-4 w-4" />
                    Áp dụng mục đã chọn
                  </button>
                </div>
              </footer>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
