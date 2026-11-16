export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 8;
export const MAX_LIMIT = 50;
export const DEFAULT_SORT = "newest";
export const VALID_SORT_MODES = Object.freeze(["newest", "salary", "match"]);

export const ALLOWED_QUERY_KEYS = Object.freeze([
  "keyword",
  "location",
  "category",
  "workTypes",
  "sort",
  "page",
  "limit",
  "companyId",
  "q",
]);

export const OBJECT_ID_HEX_REGEX = /^[a-fA-F0-9]{24}$/;
export const MAX_COMPARABLE_SALARY_VND = 10_000_000_000;
export const MAX_COMPARABLE_SALARY_MILLIONS = 10_000;

const MILLION_AMOUNT_TOKEN = "[0-9]+(?:[.,][0-9]{1,2})?";
const MILLION_UNIT_TOKEN = "(?:tri[eêệEÊỆ]u|tr|m)";
const VND_UNIT_TOKEN = "(?:vn[dđĐ]|[đĐ])";
const VND_AMOUNT_TOKEN =
  "(?:[0-9]{1,3}(?:\\.[0-9]{3})+|[0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)";
const MONTHLY_SALARY_SUFFIX = "(?:[ \\t]*/[ \\t]*(?:th[aáAÁ]ng|month|th))?";

export const SALARY_MILLION_REGEX_SOURCE =
  `^[ \\t]*(${MILLION_AMOUNT_TOKEN})(?:(?:[ \\t]*${MILLION_UNIT_TOKEN})?[ \\t]*[–-][ \\t]*(${MILLION_AMOUNT_TOKEN}))?[ \\t]*${MILLION_UNIT_TOKEN}(?:[ \\t]+${VND_UNIT_TOKEN})?${MONTHLY_SALARY_SUFFIX}[ \\t]*$`;

export const SALARY_VND_REGEX_SOURCE =
  `^[ \\t]*(${VND_AMOUNT_TOKEN})(?:(?:[ \\t]*${VND_UNIT_TOKEN})?[ \\t]*[–-][ \\t]*(${VND_AMOUNT_TOKEN}))?[ \\t]*${VND_UNIT_TOKEN}${MONTHLY_SALARY_SUFFIX}[ \\t]*$`;

export const CATEGORY_OPTIONS = Object.freeze([
  { value: "", label: "Tất cả ngành nghề" },
  { value: "it", label: "Công nghệ thông tin" },
  { value: "design", label: "Thiết kế" },
  { value: "marketing", label: "Marketing" },
]);

export const VALID_CATEGORIES = Object.freeze(
  CATEGORY_OPTIONS.map((option) => option.value).filter(Boolean),
);

export const LOCATION_OPTIONS = Object.freeze([
  { value: "", label: "Tất cả địa điểm" },
  { value: "ho chi minh", label: "TP. Hồ Chí Minh" },
  { value: "ha noi", label: "Hà Nội" },
  { value: "da nang", label: "Đà Nẵng" },
  { value: "hai phong", label: "Hải Phòng" },
]);

export const VALID_LOCATIONS = Object.freeze(
  LOCATION_OPTIONS.map((option) => option.value).filter(Boolean),
);

export const WORK_TYPE_OPTIONS = Object.freeze([
  { value: "full-time", label: "Toàn thời gian" },
  { value: "intern", label: "Thực tập" },
  { value: "remote", label: "Làm từ xa" },
  { value: "part-time", label: "Bán thời gian" },
]);

export const VALID_WORK_TYPES = Object.freeze(
  WORK_TYPE_OPTIONS.map((option) => option.value).filter(Boolean),
);

export const CATEGORY_KEYWORDS = Object.freeze({
  it: Object.freeze([
    "it",
    "developer",
    "frontend",
    "backend",
    "software",
    "react",
    "node",
    "java",
    "python",
    "devops",
    "data",
    "qa",
    "công nghệ thông tin",
    "lap trinh",
    "lập trình",
  ]),
  design: Object.freeze([
    "design",
    "designer",
    "ui/ux",
    "figma",
    "thiet ke",
    "thiết kế",
    "đồ họa",
    "do hoa",
  ]),
  marketing: Object.freeze([
    "marketing",
    "content",
    "seo",
    "social media",
    "truyền thông",
    "truyen thong",
    "quảng cáo",
    "quang cao",
  ]),
});

export const LOCATION_ALIASES = Object.freeze({
  "ho chi minh": Object.freeze([
    "hồ chí minh",
    "ho chi minh",
    "hcm",
    "tp. hcm",
    "tp hcm",
    "tp.hcm",
    "tp hồ chí minh",
    "tp ho chi minh",
    "sài gòn",
    "sai gon",
  ]),
  "ha noi": Object.freeze(["hà nội", "ha noi", "hn"]),
  "da nang": Object.freeze(["đà nẵng", "da nang", "đn", "dn"]),
  "hai phong": Object.freeze(["hải phòng", "hai phong", "hp"]),
});

export const WORK_TYPE_KEYWORDS = Object.freeze({
  "full-time": Object.freeze([
    "full-time",
    "fulltime",
    "toàn thời gian",
    "toan thoi gian",
  ]),
  "part-time": Object.freeze([
    "part-time",
    "parttime",
    "bán thời gian",
    "ban thoi gian",
  ]),
  intern: Object.freeze([
    "intern",
    "internship",
    "thực tập",
    "thuc tap",
    "sinh viên",
  ]),
  remote: Object.freeze([
    "remote",
    "làm từ xa",
    "lam tu xa",
    "online",
    "tại nhà",
    "tai nha",
  ]),
});

export function normalizeText(value = "") {
  return String(value ?? "")
    .toLocaleLowerCase("vi-VN")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/g, "d")
    .trim();
}

export function normalizeLocation(value = "") {
  return normalizeText(value).replace(/\btp\.?\s*hcm\b/g, "ho chi minh");
}

export function resolveCanonicalLocation(value = "") {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.normalize("NFC").trim();
  if (!trimmed) {
    return "";
  }
  const normalized = normalizeLocation(trimmed);
  if (VALID_LOCATIONS.includes(normalized)) {
    return normalized;
  }
  for (const [canonical, aliases] of Object.entries(LOCATION_ALIASES)) {
    if (aliases.some((alias) => normalizeLocation(alias) === normalized)) {
      return canonical;
    }
  }
  return null;
}

export function escapeRegex(string = "") {
  return String(string ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildVietnameseRegexPattern(raw = "") {
  const text = String(raw ?? "").normalize("NFC");
  let pattern = "";
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const lower = char.toLowerCase();
    if ("aàáảãạăằắẳẵặâầấẩẫậ".includes(lower)) {
      pattern += "[aàáảãạăằắẳẵặâầấẩẫậ]";
    } else if ("eèéẻẽẹêềếểễệ".includes(lower)) {
      pattern += "[eèéẻẽẹêềếểễệ]";
    } else if ("iìíỉĩị".includes(lower)) {
      pattern += "[iìíỉĩị]";
    } else if ("oòóỏõọôồốổỗộơờớởỡợ".includes(lower)) {
      pattern += "[oòóỏõọôồốổỗộơờớởỡợ]";
    } else if ("uùúủũụưừứửữự".includes(lower)) {
      pattern += "[uùúủũụưừứửữự]";
    } else if ("yỳýỷỹỵ".includes(lower)) {
      pattern += "[yỳýỷỹỵ]";
    } else if (lower === "d" || lower === "đ") {
      pattern += "[dđ]";
    } else {
      pattern += escapeRegex(char);
    }
  }
  return pattern;
}

const SALARY_MILLION_REGEX = new RegExp(SALARY_MILLION_REGEX_SOURCE, "i");
const SALARY_VND_REGEX = new RegExp(SALARY_VND_REGEX_SOURCE, "i");

function validateComparableEndpointRange(lo, hi, maxLimit, scaleFactor) {
  if (!Number.isFinite(lo) || lo <= 0 || lo > maxLimit) {
    return null;
  }
  if (hi === null) {
    return Math.round(lo * scaleFactor);
  }
  if (!Number.isFinite(hi) || hi <= 0 || hi > maxLimit || lo > hi) {
    return null;
  }
  return Math.round(hi * scaleFactor);
}

/**
 * Narrow comparable monthly VND salary grammar & policy:
 * - Admits ONLY whole anchored strings matching single values or ascending ranges (`lo <= hi`, both > 0)
 *   bound to explicit VND or Vietnamese million units (`triệu`, `trieu`, `tr`, `m`, `vnd`, `vnđ`, `đ`),
 *   with optional monthly suffix (`/tháng`, `/month`, `/th`) and capped at `MAX_COMPARABLE_SALARY_VND` (10 billion VND).
 * - Rejects negative/zero values, descending or partially out-of-range ranges, mixed thousand separators
 *   (e.g. `10.000,500 VND`), commentary/parenthetical notes (e.g. `(40 giờ/tuần)`), non-monthly periods
 *   (`/năm`, `/tuần`, `/giờ`), foreign currencies (`USD`, `EUR`, ...), negotiable (`Thỏa thuận`), and unitless values.
 */
export function parseComparableVndSalary(salary = "") {
  if (typeof salary !== "string") {
    return { isComparable: false, vndMax: 0 };
  }
  const text = salary.normalize("NFC").trim();
  if (!text) {
    return { isComparable: false, vndMax: 0 };
  }

  const millionMatch = SALARY_MILLION_REGEX.exec(text);
  if (millionMatch) {
    const lo = Number(millionMatch[1].replace(",", "."));
    const hi = millionMatch[2] !== undefined ? Number(millionMatch[2].replace(",", ".")) : null;
    const vndMax = validateComparableEndpointRange(
      lo,
      hi,
      MAX_COMPARABLE_SALARY_MILLIONS,
      1_000_000,
    );
    return vndMax !== null ? { isComparable: true, vndMax } : { isComparable: false, vndMax: 0 };
  }

  const vndMatch = SALARY_VND_REGEX.exec(text);
  if (vndMatch) {
    const lo = Number(vndMatch[1].replace(/[.,]/g, ""));
    const hi = vndMatch[2] !== undefined ? Number(vndMatch[2].replace(/[.,]/g, "")) : null;
    const vndMax = validateComparableEndpointRange(
      lo,
      hi,
      MAX_COMPARABLE_SALARY_VND,
      1,
    );
    return vndMax !== null ? { isComparable: true, vndMax } : { isComparable: false, vndMax: 0 };
  }

  return { isComparable: false, vndMax: 0 };
}

export function getSalaryMaximum(salary = "") {
  return parseComparableVndSalary(salary).vndMax;
}

function readOptionalStringParam(rawValue, maxLength, typeError, lengthError, code) {
  if (rawValue === undefined) {
    return { isValid: true, value: "" };
  }
  if (typeof rawValue !== "string") {
    return { isValid: false, error: typeError, code };
  }
  if (rawValue.length > maxLength) {
    return { isValid: false, error: lengthError, code };
  }
  return { isValid: true, value: rawValue.normalize("NFC").trim() };
}

function parsePositiveIntParam(rawValue, defaultValue, maxValue, typeError, rangeError, code) {
  if (rawValue === undefined) {
    return { isValid: true, value: defaultValue };
  }
  if (typeof rawValue !== "string" || rawValue.length > 20) {
    return { isValid: false, error: typeError, code };
  }
  const trimmed = rawValue.trim();
  if (!/^\d+$/.test(trimmed)) {
    return { isValid: false, error: typeError, code };
  }
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maxValue) {
    return { isValid: false, error: rangeError, code };
  }
  return { isValid: true, value: parsed };
}

export function validateAndParseJobsQuery(rawQuery = {}) {
  if (!rawQuery || typeof rawQuery !== "object" || Array.isArray(rawQuery)) {
    return {
      isValid: false,
      error: "Tham số truy vấn không hợp lệ.",
      code: "INVALID_QUERY_PARAMS",
    };
  }

  if (Object.prototype.hasOwnProperty.call(rawQuery, "__proto__")) {
    return {
      isValid: false,
      error: "Tham số truy vấn không hợp lệ.",
      code: "INVALID_QUERY_PARAMS",
    };
  }

  // Reject unsupported query keys (prevents operator injection, status override, etc.)
  const queryKeys = Object.getOwnPropertyNames(rawQuery);
  for (const key of queryKeys) {
    if (!ALLOWED_QUERY_KEYS.includes(key)) {
      return {
        isValid: false,
        error: `Tham số truy vấn '${key}' không được hỗ trợ.`,
        code: "INVALID_QUERY_PARAMS",
      };
    }
  }

  if (rawQuery.keyword !== undefined && rawQuery.q !== undefined) {
    return {
      isValid: false,
      error: "Chỉ được sử dụng một tham số tìm kiếm 'keyword' hoặc 'q'.",
      code: "INVALID_QUERY_PARAMS",
    };
  }

  // Parse keyword / q (preserve literal '+' and regex punctuation cleanly)
  const rawKeyword = rawQuery.keyword !== undefined ? rawQuery.keyword : rawQuery.q;
  const keywordResult = readOptionalStringParam(
    rawKeyword,
    100,
    "Từ khóa tìm kiếm phải là chuỗi ký tự.",
    "Từ khóa tìm kiếm tối đa 100 ký tự.",
    "INVALID_KEYWORD",
  );
  if (!keywordResult.isValid) {
    return keywordResult;
  }
  const keyword = keywordResult.value;

  // Parse location against canonical options and known aliases
  const locationResult = readOptionalStringParam(
    rawQuery.location,
    100,
    "Địa điểm tìm kiếm phải là chuỗi ký tự.",
    "Địa điểm tìm kiếm tối đa 100 ký tự.",
    "INVALID_LOCATION",
  );
  if (!locationResult.isValid) {
    return locationResult;
  }
  const location = resolveCanonicalLocation(locationResult.value);
  if (location === null) {
    return {
      isValid: false,
      error: `Địa điểm '${locationResult.value}' không được hỗ trợ.`,
      code: "INVALID_LOCATION",
    };
  }

  // Parse category against canonical CATEGORY_OPTIONS
  const categoryResult = readOptionalStringParam(
    rawQuery.category,
    50,
    "Ngành nghề tìm kiếm phải là chuỗi ký tự.",
    "Ngành nghề tìm kiếm tối đa 50 ký tự.",
    "INVALID_CATEGORY",
  );
  if (!categoryResult.isValid) {
    return categoryResult;
  }
  const category = categoryResult.value.toLowerCase();
  if (category && !VALID_CATEGORIES.includes(category)) {
    return {
      isValid: false,
      error: `Ngành nghề '${categoryResult.value}' không được hỗ trợ.`,
      code: "INVALID_CATEGORY",
    };
  }

  // Parse workTypes strictly using documented comma-separated string serialization
  let workTypes = [];
  if (rawQuery.workTypes !== undefined) {
    if (typeof rawQuery.workTypes !== "string") {
      return {
        isValid: false,
        error: "Hình thức làm việc phải là chuỗi phân tách bằng dấu phẩy.",
        code: "INVALID_WORK_TYPES",
      };
    }
    if (rawQuery.workTypes.length > 200) {
      return {
        isValid: false,
        error: "Chuỗi hình thức làm việc vượt quá 200 ký tự.",
        code: "INVALID_WORK_TYPES",
      };
    }
    const rawTokens = rawQuery.workTypes
      .normalize("NFC")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    for (const token of rawTokens) {
      if (!VALID_WORK_TYPES.includes(token)) {
        return {
          isValid: false,
          error: `Hình thức làm việc '${token}' không được hỗ trợ.`,
          code: "INVALID_WORK_TYPES",
        };
      }
    }
    workTypes = [...new Set(rawTokens)].sort();
  }

  // Parse sort
  let sort = DEFAULT_SORT;
  if (rawQuery.sort !== undefined) {
    if (typeof rawQuery.sort !== "string" || rawQuery.sort.length > 30) {
      return {
        isValid: false,
        error: `Chế độ sắp xếp không hợp lệ. Hỗ trợ: ${VALID_SORT_MODES.join(", ")}.`,
        code: "INVALID_SORT",
      };
    }
    const normalizedSort = rawQuery.sort.trim();
    if (!VALID_SORT_MODES.includes(normalizedSort)) {
      return {
        isValid: false,
        error: `Chế độ sắp xếp '${normalizedSort}' không hợp lệ. Hỗ trợ: ${VALID_SORT_MODES.join(", ")}.`,
        code: "INVALID_SORT",
      };
    }
    sort = normalizedSort;
  }

  // Parse page
  const pageResult = parsePositiveIntParam(
    rawQuery.page,
    DEFAULT_PAGE,
    100_000,
    "Số trang phải là số nguyên dương.",
    "Số trang nằm ngoài phạm vi cho phép (1 - 100.000).",
    "INVALID_PAGE",
  );
  if (!pageResult.isValid) {
    return pageResult;
  }
  const page = pageResult.value;

  // Parse limit
  const limitResult = parsePositiveIntParam(
    rawQuery.limit,
    DEFAULT_LIMIT,
    MAX_LIMIT,
    "Giới hạn số lượng phải là số nguyên dương.",
    `Giới hạn số lượng tối đa ${MAX_LIMIT} bản ghi mỗi trang.`,
    "INVALID_LIMIT",
  );
  if (!limitResult.isValid) {
    return limitResult;
  }
  const limit = limitResult.value;

  // Parse companyId (strict 24-hex ObjectId when non-empty)
  const companyIdResult = readOptionalStringParam(
    rawQuery.companyId,
    50,
    "Mã công ty phải là chuỗi ký tự.",
    "Mã công ty không hợp lệ.",
    "INVALID_COMPANY_ID",
  );
  if (!companyIdResult.isValid) {
    return companyIdResult;
  }
  let companyId = "";
  if (companyIdResult.value) {
    if (!OBJECT_ID_HEX_REGEX.test(companyIdResult.value)) {
      return {
        isValid: false,
        error: "Mã công ty không đúng định dạng ObjectId 24 ký tự hex.",
        code: "INVALID_COMPANY_ID",
      };
    }
    companyId = companyIdResult.value.toLowerCase();
  }

  return {
    isValid: true,
    params: {
      keyword,
      location,
      category,
      workTypes,
      sort,
      page,
      limit,
      companyId,
    },
  };
}

export function toPublicJobsSearchParams(params = {}) {
  const searchParams = new URLSearchParams();

  if (params.keyword && String(params.keyword).trim()) {
    searchParams.set("keyword", String(params.keyword).normalize("NFC").trim());
  }
  if (params.location && String(params.location).trim()) {
    const resolved = resolveCanonicalLocation(String(params.location));
    searchParams.set("location", resolved !== null ? resolved : String(params.location).trim());
  }
  if (params.category && String(params.category).trim()) {
    searchParams.set("category", String(params.category).trim().toLowerCase());
  }
  if (Array.isArray(params.workTypes) && params.workTypes.length > 0) {
    const cleaned = [...new Set(params.workTypes.map((wt) => String(wt).trim().toLowerCase()).filter(Boolean))].sort();
    if (cleaned.length > 0) {
      searchParams.set("workTypes", cleaned.join(","));
    }
  } else if (typeof params.workTypes === "string" && params.workTypes.trim()) {
    searchParams.set("workTypes", params.workTypes.trim());
  }
  if (params.sort && params.sort !== DEFAULT_SORT && VALID_SORT_MODES.includes(params.sort)) {
    searchParams.set("sort", params.sort);
  }
  if (params.page && Number(params.page) > 1) {
    searchParams.set("page", String(Number(params.page)));
  }
  if (params.limit && Number(params.limit) !== DEFAULT_LIMIT) {
    searchParams.set("limit", String(Number(params.limit)));
  }
  if (params.companyId && String(params.companyId).trim()) {
    searchParams.set("companyId", String(params.companyId).trim().toLowerCase());
  }

  return searchParams;
}

export function parsePublicJobsSearchParams(searchParams) {
  const sp = searchParams instanceof URLSearchParams ? searchParams : new URLSearchParams(searchParams || "");
  const rawQuery = {};
  const uniqueKeys = Array.from(new Set(sp.keys()));

  for (const key of uniqueKeys) {
    const values = sp.getAll(key);
    Object.defineProperty(rawQuery, key, {
      value: values.length > 1 ? values : values[0],
      enumerable: true,
      configurable: true,
      writable: true,
    });
  }

  const validation = validateAndParseJobsQuery(rawQuery);
  if (!validation.isValid) {
    return {
      isValid: false,
      error: validation.error,
      code: validation.code,
      params: {
        keyword: "",
        location: "",
        category: "",
        workTypes: [],
        sort: DEFAULT_SORT,
        page: DEFAULT_PAGE,
        limit: DEFAULT_LIMIT,
        companyId: "",
      },
    };
  }

  return {
    isValid: true,
    error: null,
    code: null,
    params: validation.params,
  };
}
