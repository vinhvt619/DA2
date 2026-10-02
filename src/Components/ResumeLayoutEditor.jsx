import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowPathIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowsRightLeftIcon,
  Bars3Icon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  RESUME_SECTION_LABELS,
  getTemplateLayout,
  customSectionKey,
} from "../utils/resumeLayout.js";

const EMPTY_SECTIONS = [];

const findZone = (zones, id) => {
  if (id === "zone-main") return "main";
  if (id === "zone-sidebar") return "sidebar";
  return Object.keys(zones).find((zone) => zones[zone].includes(id));
};

function SortableSection({ id, label, count, onMove, index, total, singleColumn }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 rounded-lg border bg-white px-3 py-2.5 shadow-sm transition ${
        isDragging ? "border-violet-400 opacity-40" : "border-slate-200"
      }`}
    >
      <button
        type="button"
        className="cursor-grab touch-none rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-violet-600 active:cursor-grabbing"
        aria-label={`Kéo ${label}`}
        {...attributes}
        {...listeners}
      >
        <Bars3Icon className="h-5 w-5" />
      </button>
      <span className="min-w-0 flex-1 break-words text-sm font-semibold text-slate-700">
        {label}
      </span>
      <div className="flex shrink-0 gap-0.5">
        <button type="button" onClick={() => onMove(id, "up")} disabled={index === 0} aria-label={`Đưa ${label} lên`} title="Đưa lên" className="grid h-7 w-7 place-items-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowUpIcon className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={() => onMove(id, "down")} disabled={index === total - 1} aria-label={`Đưa ${label} xuống`} title="Đưa xuống" className="grid h-7 w-7 place-items-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowDownIcon className="h-3.5 w-3.5" /></button>
        {!singleColumn && <button type="button" onClick={() => onMove(id, "column")} aria-label={`Chuyển cột ${label}`} title="Chuyển cột" className="grid h-7 w-7 place-items-center rounded text-slate-500 hover:bg-slate-100"><ArrowsRightLeftIcon className="h-3.5 w-3.5" /></button>}
      </div>
      <span className="hidden shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 sm:inline-block">
        {count || 0} mục
      </span>
    </div>
  );
}

function DropZone({ id, title, items, sectionCounts, labels, onMove, singleColumn }) {
  const { setNodeRef, isOver } = useDroppable({ id: `zone-${id}` });
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {title}
        </h3>
        <span className="text-[11px] text-slate-400">{items.length} phần</span>
      </div>
      <div
        ref={setNodeRef}
        data-layout-zone={id}
        className={`min-h-36 space-y-2 rounded-lg border-2 border-dashed p-2.5 transition ${
          isOver
            ? "border-violet-400 bg-violet-50"
            : "border-slate-200 bg-slate-50"
        }`}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          {items.map((item, index) => (
            <SortableSection
              key={item}
              id={item}
              count={sectionCounts[item]}
              label={labels[item]}
              index={index}
              total={items.length}
              singleColumn={singleColumn}
              onMove={onMove}
            />
          ))}
        </SortableContext>
        {items.length === 0 && (
          <p className="px-2 py-8 text-center text-xs text-slate-400">
            Thả một phần CV vào đây
          </p>
        )}
      </div>
    </div>
  );
}

export default function ResumeLayoutEditor({
  open,
  template,
  layout,
  customSections = EMPTY_SECTIONS,
  sectionCounts = {},
  onClose,
  onSave,
  onReset,
}) {
  const initialZones = useMemo(
    () => getTemplateLayout(layout, template, customSections),
    [layout, template, customSections],
  );
  const [zones, setZones] = useState(initialZones);
  const [activeId, setActiveId] = useState(null);
  const dialogRef = useRef(null);
  const dragStartZones = useRef(null);
  const labels = { ...RESUME_SECTION_LABELS, ...Object.fromEntries(customSections.map((item) => [customSectionKey(item.id), item.title])) };
  const isSingleColumn = template === "compact";
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 7 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (open) {
      setZones(initialZones);
      dialogRef.current?.showModal();
    }
  }, [initialZones, open]);

  if (!open) return null;

  const moveSection = (id, direction) => {
    setZones((current) => {
      const zone = findZone(current, id);
      if (!zone) return current;
      const index = current[zone].indexOf(id);
      if (direction === "column") {
        const target = zone === "main" ? "sidebar" : "main";
        return { ...current, [zone]: current[zone].filter((item) => item !== id), [target]: [...current[target], id] };
      }
      const targetIndex = index + (direction === "up" ? -1 : 1);
      if (targetIndex < 0 || targetIndex >= current[zone].length) return current;
      return { ...current, [zone]: arrayMove(current[zone], index, targetIndex) };
    });
  };

  const moveAcrossZones = (active, over) => {
    setZones((current) => {
      const activeZone = findZone(current, active.id);
      const overZone = findZone(current, over?.id);
      if (!activeZone || !overZone || activeZone === overZone) return current;
      const source = [...current[activeZone]];
      const destination = [...current[overZone]];
      const sourceIndex = source.indexOf(active.id);
      if (sourceIndex < 0) return current;
      source.splice(sourceIndex, 1);
      const overIndex = destination.indexOf(over.id);
      destination.splice(overIndex < 0 ? destination.length : overIndex, 0, active.id);
      return { ...current, [activeZone]: source, [overZone]: destination };
    });
  };

  const finishDrag = ({ active, over }) => {
    setActiveId(null);
    if (!over) { setZones(dragStartZones.current); return; }
    const zone = findZone(zones, active.id);
    const overZone = findZone(zones, over.id);
    if (!zone || zone !== overZone) return;
    const oldIndex = zones[zone].indexOf(active.id);
    const newIndex = zones[zone].indexOf(over.id);
    if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
      setZones((current) => ({
        ...current,
        [zone]: arrayMove(current[zone], oldIndex, newIndex),
      }));
    }
  };

  return createPortal(
    <dialog ref={dialogRef} aria-labelledby="resume-layout-title" onCancel={(event) => { event.preventDefault(); onClose(); }} className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-4xl rounded-lg border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/55">
      <div className="flex max-h-[90dvh] w-full flex-col overflow-hidden">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 id="resume-layout-title" className="text-lg font-bold text-slate-900">Sắp xếp bố cục CV</h2>
          </div>
          <button type="button" aria-label="Đóng bố cục CV" title="Đóng" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={({ active }) => { dragStartZones.current = zones; setActiveId(active.id); }}
          onDragOver={({ active, over }) => moveAcrossZones(active, over)}
          onDragCancel={() => { setZones(dragStartZones.current); setActiveId(null); }}
          onDragEnd={finishDrag}
        >
          <div className="flex-1 overflow-y-auto p-5">
            <div className={`grid gap-4 ${isSingleColumn ? "grid-cols-1" : "md:grid-cols-2"}`}>
              <DropZone id="main" title="Cột nội dung chính" items={zones.main} sectionCounts={sectionCounts} labels={labels} onMove={moveSection} singleColumn={isSingleColumn} />
              {!isSingleColumn && (
                <DropZone id="sidebar" title="Cột phụ" items={zones.sidebar} sectionCounts={sectionCounts} labels={labels} onMove={moveSection} />
              )}
            </div>
          </div>
          <DragOverlay>
            {activeId ? (
              <div className="flex w-64 items-center gap-3 rounded-lg border border-violet-400 bg-white px-3 py-2.5 shadow-xl">
                <Bars3Icon className="h-5 w-5 text-violet-600" />
                <span className="text-sm font-semibold text-slate-700">{labels[activeId]}</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            onClick={() => {
              onReset();
              onClose();
            }}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Mặc định
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Hủy
            </button>
            <button
              type="button"
              onClick={() => onSave(zones)}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-bold text-white hover:bg-violet-700"
            >
              <CheckIcon className="h-4 w-4" />
              Áp dụng
            </button>
          </div>
        </div>
      </div>
    </dialog>, document.body,
  );
}
