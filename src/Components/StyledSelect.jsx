import * as Select from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

const EMPTY_VALUE = "__rabbitcv_empty__";
const toSelectValue = (value) => value === "" ? EMPTY_VALUE : String(value);

export default function StyledSelect({
  value,
  onChange,
  options,
  label,
  className = "sm:w-[164px]",
}) {
  const selected = options.find((option) => option.value === value) || options[0];

  return (
    <div className={`w-full ${className}`}>
      <Select.Root
        value={selected ? toSelectValue(selected.value) : undefined}
        onValueChange={(nextValue) => {
          const option = options.find(
            (item) => toSelectValue(item.value) === nextValue,
          );
          if (option) onChange(option.value);
        }}
      >
        <Select.Trigger
          aria-label={label}
          className="group flex h-10 w-full min-w-[154px] items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 text-left text-xs font-semibold text-slate-700 transition hover:border-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200 data-[state=open]:border-violet-500 data-[state=open]:text-violet-700 data-[state=open]:shadow-[0_0_0_3px_rgba(124,58,237,0.08)]"
        >
          <Select.Value>{selected?.label}</Select.Value>
          <Select.Icon asChild>
            <ChevronDownIcon className="h-4 w-4 shrink-0 text-violet-600 transition-transform group-data-[state=open]:rotate-180" />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content
            position="popper"
            align="end"
            sideOffset={8}
            className="z-[1000] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-violet-100 bg-white p-1.5 shadow-lg shadow-violet-200/30"
          >
            <Select.Viewport>
              {options.map((option) => (
                <Select.Item
                  key={toSelectValue(option.value)}
                  value={toSelectValue(option.value)}
                  className="relative flex cursor-pointer select-none items-center justify-between gap-4 rounded-lg px-3 py-2 pr-8 text-xs text-slate-600 outline-none transition data-[highlighted]:bg-slate-50 data-[highlighted]:text-violet-700 data-[state=checked]:bg-violet-50 data-[state=checked]:font-semibold data-[state=checked]:text-violet-700"
                >
                  <Select.ItemText>{option.label}</Select.ItemText>
                  <Select.ItemIndicator className="absolute right-2.5">
                    <CheckIcon className="h-4 w-4 text-violet-600" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
