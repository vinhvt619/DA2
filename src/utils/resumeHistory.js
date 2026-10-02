const HISTORY_LIMIT = 100;
const TYPING_GROUP_MS = 700;

export const createResumeHistory = (present) => ({
  past: [], present, future: [], group: null, timestamp: 0,
});

export function resumeHistoryReducer(state, action) {
  if (action.type === "reset") return createResumeHistory(action.value);
  if (action.type === "undo") {
    if (!state.past.length) return state;
    return {
      ...state,
      past: state.past.slice(0, -1),
      present: state.past.at(-1),
      future: [state.present, ...state.future],
      group: null,
    };
  }
  if (action.type === "redo") {
    if (!state.future.length) return state;
    return {
      ...state,
      past: [...state.past, state.present].slice(-HISTORY_LIMIT),
      present: state.future[0],
      future: state.future.slice(1),
      group: null,
    };
  }
  if (action.type !== "update") return state;
  const next = typeof action.value === "function" ? action.value(state.present) : action.value;
  if (JSON.stringify(next) === JSON.stringify(state.present)) return state;
  const grouped = action.group && action.group === state.group &&
    action.timestamp - state.timestamp < TYPING_GROUP_MS && !state.future.length;
  return {
    past: grouped ? state.past : [...state.past, state.present].slice(-HISTORY_LIMIT),
    present: next,
    future: [],
    group: action.group || null,
    timestamp: action.timestamp,
  };
}
