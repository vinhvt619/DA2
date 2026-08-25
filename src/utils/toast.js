import { toast } from "sonner";

const toastByType = {
  error: toast.error,
  info: toast.info,
  loading: toast.loading,
  success: toast.success,
  warning: toast.warning,
};

export function showToast(message, type = "success", options) {
  const notify = toastByType[type] || toast.info;
  return notify(message, options);
}

export { toast };
