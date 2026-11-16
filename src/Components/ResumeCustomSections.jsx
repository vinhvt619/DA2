import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowDownIcon, ArrowUpIcon, PencilIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { CUSTOM_SECTION_FIELDS, DEFAULT_CUSTOM_FIELDS } from "../../shared/resumeCustomSections.js";
import { useConfirmDialog } from "../context/ConfirmDialogContext.jsx";
import Editor from "./RichText/Editor";
import RichTextContent from "./RichTextContent.jsx";

const inputClass = "mt-1.5 h-10 w-full rounded-md border border-slate-300 px-3 text-sm font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100";
const iconClass = "grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-slate-100";
const newEntry = () => ({ title: "", organization: "", location: "", startDate: "", endDate: "", link: "", description: "", details: [] });

function CustomDialog({ heading, valid, onSave, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return createPortal(
    <dialog ref={ref} aria-labelledby="custom-dialog-title" onCancel={(event) => { event.preventDefault(); onClose(); }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-lg border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/45">
      <form className="flex max-h-[90dvh] flex-col" onSubmit={(event) => { event.preventDefault(); if (valid) onSave(); }}>
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
          <h2 id="custom-dialog-title" className="min-w-0 break-words text-base font-bold">{heading}</h2>
          <button type="button" aria-label="Đóng mục tùy chỉnh" title="Đóng" onClick={onClose} className={iconClass}><XMarkIcon className="h-5 w-5" /></button>
        </header>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">{children}</div>
        <footer className="flex shrink-0 justify-end gap-2 border-t border-slate-200 bg-white px-5 py-3">
          <button type="button" onClick={onClose} className="h-9 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50">Hủy</button>
          <button type="submit" disabled={!valid} className="h-9 rounded-md bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50">Lưu mục</button>
        </footer>
      </form>
    </dialog>, document.body,
  );
}

function SectionDialog({ section, onSave, onClose }) {
  const [draft, setDraft] = useState(section);
  return <CustomDialog heading={section.id ? "Chỉnh sửa mục tùy chỉnh" : "Thêm mục tùy chỉnh"} valid={Boolean(draft.title.trim())} onClose={onClose}
    onSave={() => onSave({ ...draft, title: draft.title.trim() })}>
    <label className="block text-sm font-semibold" htmlFor="custom-section-name">Tên mục
      <input id="custom-section-name" autoFocus required maxLength={120} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className={inputClass} />
    </label>
    <fieldset>
      <legend className="mb-3 text-sm font-semibold">Trường thông tin</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {Object.entries(CUSTOM_SECTION_FIELDS).map(([key, label]) => <label key={key} className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={draft.fields[key]} onChange={(event) => setDraft({ ...draft, fields: { ...draft.fields, [key]: event.target.checked } })} className="h-4 w-4 accent-violet-600" />{label}
        </label>)}
      </div>
    </fieldset>
  </CustomDialog>;
}

function EntryDialog({ section, entry, onSave, onClose }) {
  const [draft, setDraft] = useState(entry);
  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const field = (key, label, options = {}) => <label htmlFor={`custom-entry-${key}`} className="block min-w-0 text-sm font-semibold">{label}
    <input id={`custom-entry-${key}`} value={draft[key]} onChange={(event) => update(key, event.target.value)} maxLength={200} className={inputClass} {...options} />
  </label>;
  const validDetails = draft.details.every((detail) => !detail.value.trim() || detail.label.trim());
  return <CustomDialog heading={`${entry.id ? "Chỉnh sửa" : "Thêm nội dung"} · ${section.title}`} valid={Boolean(draft.title.trim()) && validDetails} onClose={onClose}
    onSave={() => onSave({ ...draft, title: draft.title.trim(), details: draft.details.filter((detail) => detail.label.trim() || detail.value.trim()) })}>
    {field("title", "Tên nội dung", { autoFocus: true, required: true })}
    <div className="grid gap-4 sm:grid-cols-2">
      {section.fields.organization && field("organization", "Tổ chức / Đơn vị")}
      {section.fields.location && field("location", "Địa điểm")}
      {section.fields.dates && <>
        {field("startDate", "Thời gian bắt đầu", { placeholder: "MM/YYYY", maxLength: 40 })}
        <div className="space-y-2">
          {field("endDate", "Thời gian kết thúc", { placeholder: "MM/YYYY", maxLength: 40, disabled: draft.endDate === "Hiện tại" })}
          <label className="flex items-center gap-2 text-sm font-normal text-slate-600"><input type="checkbox" checked={draft.endDate === "Hiện tại"} onChange={(event) => update("endDate", event.target.checked ? "Hiện tại" : "")} className="h-4 w-4 accent-violet-600" />Đang diễn ra</label>
        </div>
      </>}
    </div>
    {section.fields.link && field("link", "Liên kết", { type: "url", placeholder: "https://", maxLength: 2000 })}
    {section.fields.description && <div><div className="mb-2 text-sm font-semibold">Mô tả</div><Editor className="!my-0 [&_.ProseMirror]:min-h-[8rem]!" content={draft.description} onChange={(content) => update("description", content)} /></div>}
    <fieldset className="space-y-3">
      <legend className="mb-2 text-sm font-semibold">Thông tin bổ sung</legend>
      {draft.details.map((detail, index) => <div key={detail.id} className="flex items-start gap-2">
        <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-[1fr_2fr]">
          <label className="block text-xs font-medium">Tên trường {index + 1}<input aria-label={`Tên trường ${index + 1}`} maxLength={100} value={detail.label} required={Boolean(detail.value.trim())} onChange={(event) => update("details", draft.details.map((item) => item.id === detail.id ? { ...item, label: event.target.value } : item))} className={inputClass} /></label>
          <label className="block text-xs font-medium">Giá trị {index + 1}<textarea aria-label={`Giá trị ${index + 1}`} maxLength={2000} rows={2} value={detail.value} onChange={(event) => update("details", draft.details.map((item) => item.id === detail.id ? { ...item, value: event.target.value } : item))} className={`${inputClass} h-auto min-h-10 py-2`} /></label>
        </div>
        <button type="button" title="Xóa trường" aria-label={`Xóa trường ${index + 1}`} onClick={() => update("details", draft.details.filter((item) => item.id !== detail.id))} className={`${iconClass} mt-5 hover:text-rose-600`}><TrashIcon className="h-4 w-4" /></button>
      </div>)}
      <button type="button" disabled={draft.details.length >= 12} onClick={() => update("details", [...draft.details, { id: crypto.randomUUID(), label: "", value: "" }])} className="flex items-center gap-1.5 text-sm font-semibold text-violet-600 disabled:opacity-50"><PlusIcon className="h-4 w-4" />Thêm trường thông tin</button>
    </fieldset>
  </CustomDialog>;
}

export default function ResumeCustomSections({ sections = [], onChange }) {
  const [draft, setDraft] = useState(null);
  const confirm = useConfirmDialog();
  const saveSection = (section) => {
    onChange((current) => section.id ? current.map((item) => item.id === section.id ? section : item)
      : [...current, { ...section, id: crypto.randomUUID() }]);
    setDraft(null);
  };
  const saveEntry = (entry) => {
    onChange((current) => current.map((section) => section.id !== draft.section.id ? section : { ...section,
      items: entry.id ? section.items.map((item) => item.id === entry.id ? entry : item) : [...section.items, { ...entry, id: crypto.randomUUID() }],
    }));
    setDraft(null);
  };
  const moveEntry = (sectionId, entryId, offset) => {
    onChange((current) => current.map((section) => {
      if (section.id !== sectionId) return section;
      const index = section.items.findIndex((entry) => entry.id === entryId);
      const target = index + offset;
      if (index < 0 || target < 0 || target >= section.items.length) return section;
      const items = [...section.items];
      [items[index], items[target]] = [items[target], items[index]];
      return { ...section, items };
    }));
  };
  return <section className="border-t border-slate-100 pt-5">
    <div className="space-y-5">
      {sections.map((section) => <section key={section.id} className="space-y-3 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-2">
          <h3 className="min-w-0 flex-1 break-words text-base font-semibold text-slate-900">{section.title}</h3>
          <button type="button" aria-label={`Chỉnh sửa ${section.title}`} title="Chỉnh sửa mục" onClick={() => setDraft({ section })} className={iconClass}><PencilIcon className="h-4 w-4" /></button>
          <button type="button" aria-label={`Xóa ${section.title}`} title="Xóa mục" onClick={async () => {
            if (await confirm(`Xóa mục "${section.title}" và tất cả nội dung bên trong khỏi CV?`)) onChange((current) => current.filter((item) => item.id !== section.id));
          }} className={`${iconClass} hover:text-rose-600`}><TrashIcon className="h-4 w-4" /></button>
        </div>
        {section.items.map((entry, index) => <article key={entry.id} className="rounded-lg border border-slate-200 p-3">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1 break-words">
              <h4 className="text-sm font-semibold">{entry.title || section.title}</h4>
              {section.fields.organization && entry.organization && <p className="text-xs text-slate-500">{entry.organization}</p>}
              {section.fields.dates && (entry.startDate || entry.endDate) && <p className="mt-1 text-xs text-slate-500">{[entry.startDate, entry.endDate].filter(Boolean).join(" – ")}</p>}
            </div>
            {section.items.length > 1 && (
              <div className="flex">
                <button type="button" disabled={index === 0} aria-label={"Đưa " + (entry.title || section.title) + " lên"} title="Đưa lên" onClick={() => moveEntry(section.id, entry.id, -1)} className={iconClass + " disabled:opacity-30"}><ArrowUpIcon className="h-4 w-4" /></button>
                <button type="button" disabled={index === section.items.length - 1} aria-label={"Đưa " + (entry.title || section.title) + " xuống"} title="Đưa xuống" onClick={() => moveEntry(section.id, entry.id, 1)} className={iconClass + " disabled:opacity-30"}><ArrowDownIcon className="h-4 w-4" /></button>
              </div>
            )}
            <button type="button" aria-label={`Chỉnh sửa nội dung ${entry.title || section.title}`} title="Chỉnh sửa nội dung" onClick={() => setDraft({ section, entry })} className={iconClass}><PencilIcon className="h-4 w-4" /></button>
            <button type="button" aria-label={`Xóa nội dung ${entry.title || section.title}`} title="Xóa nội dung" onClick={async () => {
              if (await confirm(`Xóa nội dung "${entry.title || section.title}"?`)) onChange((current) => current.map((item) => item.id === section.id ? { ...item, items: item.items.filter((child) => child.id !== entry.id) } : item));
            }} className={`${iconClass} hover:text-rose-600`}><TrashIcon className="h-4 w-4" /></button>
          </div>
          {section.fields.description && <RichTextContent content={entry.description} className="mt-2 break-words text-xs leading-5 text-slate-500" />}
        </article>)}
        <button type="button" disabled={section.items.length >= 50} onClick={() => setDraft({ section, entry: newEntry() })} className="flex h-9 w-full items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 text-xs font-semibold text-slate-500 hover:border-violet-400 hover:text-violet-600 disabled:opacity-50"><PlusIcon className="h-4 w-4" />Thêm nội dung · {section.title}</button>
      </section>)}
      <button type="button" disabled={sections.length >= 30} onClick={() => setDraft({ section: { title: "", fields: { ...DEFAULT_CUSTOM_FIELDS }, items: [] } })} className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 text-sm font-semibold text-slate-500 hover:border-violet-400 hover:text-violet-600 disabled:opacity-50"><PlusIcon className="h-4 w-4" />Thêm mục tùy chỉnh</button>
    </div>
    {draft && (draft.entry ? <EntryDialog section={draft.section} entry={draft.entry} onSave={saveEntry} onClose={() => setDraft(null)} /> : <SectionDialog section={draft.section} onSave={saveSection} onClose={() => setDraft(null)} />)}
  </section>;
}
