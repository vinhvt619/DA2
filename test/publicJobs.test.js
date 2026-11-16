import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import express from "express";
import mongoose from "mongoose";
import Job from "../server/models/Job.js";
import {
  OBJECT_ID_HEX_REGEX,
  validateAndParseJobsQuery,
  buildVietnameseRegexPattern,
  escapeRegex,
  parseComparableVndSalary,
  getSalaryMaximum,
  resolveCanonicalLocation,
  toPublicJobsSearchParams,
  parsePublicJobsSearchParams,
  CATEGORY_KEYWORDS,
  LOCATION_ALIASES,
  WORK_TYPE_KEYWORDS,
} from "../shared/jobQueryPolicy.js";
import {
  PUBLIC_JOB_PROJECT_FIELDS,
  createPublicJobsHandler,
  buildPublicJobsMongoQuery,
  buildPublicJobsAggregationPipeline,
} from "../server/services/publicJobsService.js";

function matchesBsonValue(docValue, expectedValue) {
  if (expectedValue instanceof mongoose.Types.ObjectId) {
    return (
      docValue instanceof mongoose.Types.ObjectId &&
      docValue.equals(expectedValue)
    );
  }
  if (docValue instanceof mongoose.Types.ObjectId) {
    return false;
  }
  return docValue === expectedValue;
}

function matchesMongoPredicate(doc, expr) {
  if (!expr || typeof expr !== "object") return true;

  for (const [field, expected] of Object.entries(expr)) {
    if (field === "$and") {
      if (!expected.every((sub) => matchesMongoPredicate(doc, sub))) return false;
      continue;
    }
    if (field === "$or") {
      if (!expected.some((sub) => matchesMongoPredicate(doc, sub))) return false;
      continue;
    }
    const val = doc[field];

    if (expected === null) {
      if (val !== null && val !== undefined) return false;
      continue;
    }

    if (expected && typeof expected === "object" && !(expected instanceof mongoose.Types.ObjectId) && !(expected instanceof Date)) {
      if (Object.prototype.hasOwnProperty.call(expected, "$ne")) {
        if (matchesBsonValue(val, expected.$ne)) return false;
      }
      if (Object.prototype.hasOwnProperty.call(expected, "$exists")) {
        const exists = val !== undefined;
        if (exists !== expected.$exists) return false;
      }
      if (Object.prototype.hasOwnProperty.call(expected, "$gte")) {
        const threshold = expected.$gte instanceof Date ? expected.$gte.getTime() : expected.$gte;
        const actual = val instanceof Date ? val.getTime() : val;
        if (!(actual >= threshold)) return false;
      }
      if (Object.prototype.hasOwnProperty.call(expected, "$regex")) {
        const regex = new RegExp(expected.$regex, expected.$options || "");
        if (Array.isArray(val)) {
          if (!val.some((entry) => regex.test(String(entry ?? "")))) return false;
        } else if (!regex.test(String(val ?? ""))) {
          return false;
        }
      }
      continue;
    }

    if (!matchesBsonValue(val, expected)) return false;
  }
  return true;
}

function evalAggExpr(doc, expr, vars = {}) {
  if (typeof expr === "string") {
    if (expr.startsWith("$$")) {
      const path = expr.slice(2).split(".");
      let cur = vars[path[0]];
      for (let i = 1; i < path.length; i += 1) {
        cur = cur?.[path[i]];
      }
      return cur;
    }
    if (expr.startsWith("$")) {
      return doc[expr.slice(1)];
    }
    return expr;
  }
  if (expr === null || typeof expr !== "object") return expr;

  if (expr.$cond) {
    const cond = Array.isArray(expr.$cond) ? expr.$cond[0] : expr.$cond.if;
    const thenBranch = Array.isArray(expr.$cond) ? expr.$cond[1] : expr.$cond.then;
    const elseBranch = Array.isArray(expr.$cond) ? expr.$cond[2] : expr.$cond.else;
    return evalAggExpr(doc, cond, vars)
      ? evalAggExpr(doc, thenBranch, vars)
      : evalAggExpr(doc, elseBranch, vars);
  }
  if (expr.$type) {
    const v = evalAggExpr(doc, expr.$type, vars);
    if (v === undefined) return "missing";
    if (v === null) return "null";
    if (typeof v === "string") return "string";
    if (typeof v === "number") return "double";
    if (Array.isArray(v)) return "array";
    return typeof v;
  }
  if (expr.$eq) {
    return evalAggExpr(doc, expr.$eq[0], vars) === evalAggExpr(doc, expr.$eq[1], vars);
  }
  if (expr.$ne) {
    return evalAggExpr(doc, expr.$ne[0], vars) !== evalAggExpr(doc, expr.$ne[1], vars);
  }
  if (expr.$gt) {
    return evalAggExpr(doc, expr.$gt[0], vars) > evalAggExpr(doc, expr.$gt[1], vars);
  }
  if (expr.$lte) {
    return evalAggExpr(doc, expr.$lte[0], vars) <= evalAggExpr(doc, expr.$lte[1], vars);
  }
  if (expr.$and) {
    return expr.$and.every((item) => Boolean(evalAggExpr(doc, item, vars)));
  }
  if (expr.$isArray) {
    return Array.isArray(evalAggExpr(doc, expr.$isArray, vars));
  }
  if (expr.$size) {
    const arr = evalAggExpr(doc, expr.$size, vars);
    return Array.isArray(arr) ? arr.length : 0;
  }
  if (expr.$regexMatch) {
    const input = evalAggExpr(doc, expr.$regexMatch.input, vars);
    if (typeof input !== "string") {
      throw new Error("$regexMatch needs 'input' to be of type string");
    }
    return new RegExp(expr.$regexMatch.regex, expr.$regexMatch.options || "").test(input);
  }
  if (expr.$arrayElemAt) {
    const arr = evalAggExpr(doc, expr.$arrayElemAt[0], vars);
    const idx = evalAggExpr(doc, expr.$arrayElemAt[1], vars);
    if (!Array.isArray(arr)) {
      throw new Error("$arrayElemAt needs first argument to be an array");
    }
    const resolvedIdx = idx < 0 ? arr.length + idx : idx;
    return resolvedIdx >= 0 && resolvedIdx < arr.length ? arr[resolvedIdx] : null;
  }
  if (expr.$regexFind) {
    const input = evalAggExpr(doc, expr.$regexFind.input, vars);
    if (typeof input !== "string") {
      throw new Error("$regexFind needs 'input' to be of type string");
    }
    const regex = new RegExp(expr.$regexFind.regex, expr.$regexFind.options || "");
    const match = input.match(regex);
    if (!match) return null;
    return {
      match: match[0],
      idx: match.index,
      captures: match.slice(1).map((c) => (c === undefined ? null : c)),
    };
  }
  if (expr.$regexFindAll) {
    const input = evalAggExpr(doc, expr.$regexFindAll.input, vars);
    if (typeof input !== "string") {
      throw new Error("$regexFindAll needs 'input' to be of type string");
    }
    const flags = (expr.$regexFindAll.options || "").replace("g", "") + "g";
    const regex = new RegExp(expr.$regexFindAll.regex, flags);
    return Array.from(input.matchAll(regex)).map((match) => ({ match: match[0] }));
  }
  if (expr.$replaceAll) {
    const rawInput = evalAggExpr(doc, expr.$replaceAll.input, vars);
    if (typeof rawInput !== "string") {
      throw new Error("$replaceAll needs 'input' to be of type string");
    }
    const find = evalAggExpr(doc, expr.$replaceAll.find, vars);
    const replacement = evalAggExpr(doc, expr.$replaceAll.replacement, vars);
    return rawInput.split(find).join(replacement);
  }
  if (expr.$convert) {
    const input = evalAggExpr(doc, expr.$convert.input, vars);
    if (input === null || input === undefined) {
      return expr.$convert.onNull !== undefined ? expr.$convert.onNull : null;
    }
    if (expr.$convert.to === "double") {
      if (typeof input === "number") {
        return Number.isFinite(input)
          ? input
          : expr.$convert.onError !== undefined
            ? expr.$convert.onError
            : null;
      }
      if (typeof input !== "string" || input.trim() === "") {
        return expr.$convert.onError !== undefined ? expr.$convert.onError : null;
      }
      const parsed = Number(input);
      if (!Number.isFinite(parsed)) {
        return expr.$convert.onError !== undefined ? expr.$convert.onError : null;
      }
      return parsed;
    }
    throw new Error(`Unsupported $convert target ${expr.$convert.to}`);
  }
  if (expr.$multiply) {
    return expr.$multiply.reduce((acc, item) => acc * evalAggExpr(doc, item, vars), 1);
  }
  if (expr.$round) {
    const val = evalAggExpr(doc, expr.$round[0], vars);
    const place = expr.$round[1] || 0;
    const factor = 10 ** place;
    return Math.round(val * factor) / factor;
  }
  if (expr.$let) {
    const nextVars = { ...vars };
    for (const [k, v] of Object.entries(expr.$let.vars)) {
      nextVars[k] = evalAggExpr(doc, v, vars);
    }
    return evalAggExpr(doc, expr.$let.in, nextVars);
  }
  if (expr.$map) {
    const arr = evalAggExpr(doc, expr.$map.input, vars) || [];
    const varName = expr.$map.as || "this";
    return arr.map((item) => evalAggExpr(doc, expr.$map.in, { ...vars, [varName]: item }));
  }
  if (expr.$filter) {
    const arr = evalAggExpr(doc, expr.$filter.input, vars) || [];
    const varName = expr.$filter.as || "this";
    return arr.filter((item) => evalAggExpr(doc, expr.$filter.cond, { ...vars, [varName]: item }));
  }
  if (expr.$max) {
    const arr = evalAggExpr(doc, expr.$max, vars) || [];
    return arr.length > 0 ? Math.max(...arr) : null;
  }
  throw new Error(`Unsupported aggregation expression: ${JSON.stringify(expr)}`);
}

function executeAggregatePipeline(docs, pipeline) {
  let stream = docs.map((d) => ({ ...d }));

  for (const stage of pipeline) {
    if (stage.$match) {
      stream = stream.filter((doc) => matchesMongoPredicate(doc, stage.$match));
    } else if (stage.$addFields) {
      stream = stream.map((doc) => {
        const next = { ...doc };
        for (const [field, expr] of Object.entries(stage.$addFields)) {
          next[field] = evalAggExpr(next, expr);
        }
        return next;
      });
    } else if (stage.$sort) {
      const sortEntries = Object.entries(stage.$sort);
      stream.sort((a, b) => {
        for (const [field, dir] of sortEntries) {
          const av = a[field] instanceof Date ? a[field].getTime() : a[field];
          const bv = b[field] instanceof Date ? b[field].getTime() : b[field];
          const aStr = a[field] instanceof mongoose.Types.ObjectId ? a[field].toHexString() : av;
          const bStr = b[field] instanceof mongoose.Types.ObjectId ? b[field].toHexString() : bv;
          if (aStr === bStr) continue;
          if (typeof aStr === "string" || typeof bStr === "string") {
            return String(aStr).localeCompare(String(bStr)) * dir;
          }
          return (aStr < bStr ? -1 : 1) * dir;
        }
        return 0;
      });
    } else if (stage.$facet) {
      const out = {};
      for (const [facetName, subPipeline] of Object.entries(stage.$facet)) {
        let branch = stream.map((d) => ({ ...d }));
        for (const sub of subPipeline) {
          if (sub.$skip !== undefined) {
            branch = branch.slice(sub.$skip);
          } else if (sub.$limit !== undefined) {
            branch = branch.slice(0, sub.$limit);
          } else if (sub.$project) {
            branch = branch.map((doc) => {
              const projected = {};
              for (const [field, flag] of Object.entries(sub.$project)) {
                if (flag === 1 && Object.prototype.hasOwnProperty.call(doc, field)) {
                  projected[field] = doc[field];
                }
              }
              return projected;
            });
          } else if (sub.$count) {
            branch = branch.length > 0 ? [{ [sub.$count]: branch.length }] : [];
          }
        }
        out[facetName] = branch;
      }
      return [out];
    }
  }
  return stream;
}

test("BL-05 validateAndParseJobsQuery enforces strict scalar, enum, ObjectId, and literal syntax validation", () => {
  // Valid queries
  assert.equal(validateAndParseJobsQuery({}).isValid, true);
  const fullValid = validateAndParseJobsQuery({
    keyword: "C++",
    location: "TP. HCM",
    category: "IT",
    workTypes: "remote,full-time",
    sort: "salary",
    page: "2",
    limit: "10",
    companyId: "6500000000000000000000AA",
  });
  assert.equal(fullValid.isValid, true);
  assert.equal(fullValid.params.keyword, "C++");
  assert.equal(fullValid.params.location, "ho chi minh");
  assert.equal(fullValid.params.category, "it");
  assert.deepEqual(fullValid.params.workTypes, ["full-time", "remote"]);
  assert.equal(fullValid.params.companyId, "6500000000000000000000aa");

  // Preserves literal + and NFC-normalizes decomposed Vietnamese
  const nfdValid = validateAndParseJobsQuery({ keyword: "Lâ\u0323p tri\u0300nh C++" });
  assert.equal(nfdValid.isValid, true);
  assert.equal(nfdValid.params.keyword, "Lập trình C++");

  // Reject unsupported keys and duplicate keyword/q
  assert.equal(validateAndParseJobsQuery({ status: "Draft" }).isValid, false);
  assert.equal(validateAndParseJobsQuery({ isAdminHidden: "true" }).isValid, false);
  assert.equal(validateAndParseJobsQuery({ $where: "1 == 1" }).isValid, false);
  assert.equal(validateAndParseJobsQuery({ deletedAt: null }).isValid, false);
  assert.equal(validateAndParseJobsQuery(JSON.parse('{"__proto__": {"admin": true}}')).code, "INVALID_QUERY_PARAMS");
  assert.equal(validateAndParseJobsQuery({ keyword: "react", q: "java" }).code, "INVALID_QUERY_PARAMS");

  // Reject non-scalars and unknown enum/filter values
  assert.equal(validateAndParseJobsQuery({ keyword: 123 }).code, "INVALID_KEYWORD");
  assert.equal(validateAndParseJobsQuery({ keyword: ["react"] }).code, "INVALID_KEYWORD");
  assert.equal(validateAndParseJobsQuery({ keyword: "a".repeat(101) }).code, "INVALID_KEYWORD");
  assert.equal(validateAndParseJobsQuery({ location: "unknown" }).code, "INVALID_LOCATION");
  assert.equal(validateAndParseJobsQuery({ location: ["ha noi"] }).code, "INVALID_LOCATION");
  assert.equal(validateAndParseJobsQuery({ category: "unknown" }).code, "INVALID_CATEGORY");
  assert.equal(validateAndParseJobsQuery({ category: ["it"] }).code, "INVALID_CATEGORY");

  // Reject array/object/unknown/oversized workTypes strictly before splitting
  assert.equal(validateAndParseJobsQuery({ workTypes: 123 }).code, "INVALID_WORK_TYPES");
  assert.equal(validateAndParseJobsQuery({ workTypes: ["full-time"] }).code, "INVALID_WORK_TYPES");
  assert.equal(validateAndParseJobsQuery({ workTypes: [{ $gt: "" }] }).code, "INVALID_WORK_TYPES");
  assert.equal(validateAndParseJobsQuery({ workTypes: "unknown" }).code, "INVALID_WORK_TYPES");
  assert.equal(validateAndParseJobsQuery({ workTypes: "full-time,unknown" }).code, "INVALID_WORK_TYPES");
  assert.equal(validateAndParseJobsQuery({ workTypes: "a".repeat(201) }).code, "INVALID_WORK_TYPES");

  // Reject invalid sort / non-scalar sort
  assert.equal(validateAndParseJobsQuery({ sort: "invalid" }).code, "INVALID_SORT");
  assert.equal(validateAndParseJobsQuery({ sort: ["salary"] }).code, "INVALID_SORT");

  // Reject non-scalar and out-of-range page/limit (including page: ["2"])
  assert.equal(validateAndParseJobsQuery({ page: ["2"] }).code, "INVALID_PAGE");
  assert.equal(validateAndParseJobsQuery({ page: { $gt: "1" } }).code, "INVALID_PAGE");
  assert.equal(validateAndParseJobsQuery({ page: "0" }).code, "INVALID_PAGE");
  assert.equal(validateAndParseJobsQuery({ page: "-5" }).code, "INVALID_PAGE");
  assert.equal(validateAndParseJobsQuery({ page: "abc" }).code, "INVALID_PAGE");
  assert.equal(validateAndParseJobsQuery({ page: "1.5" }).code, "INVALID_PAGE");

  assert.equal(validateAndParseJobsQuery({ limit: ["8"] }).code, "INVALID_LIMIT");
  assert.equal(validateAndParseJobsQuery({ limit: "0" }).code, "INVALID_LIMIT");
  assert.equal(validateAndParseJobsQuery({ limit: "51" }).code, "INVALID_LIMIT");
  assert.equal(validateAndParseJobsQuery({ limit: "xyz" }).code, "INVALID_LIMIT");

  // Strict 24-hex ObjectId companyId validation (reject arbitrary strings like "company-alpha" or 12-char strings)
  assert.equal(validateAndParseJobsQuery({ companyId: "company-alpha" }).code, "INVALID_COMPANY_ID");
  assert.equal(validateAndParseJobsQuery({ companyId: "twelvechars!" }).code, "INVALID_COMPANY_ID");
  assert.equal(validateAndParseJobsQuery({ companyId: ["650000000000000000000001"] }).code, "INVALID_COMPANY_ID");
  assert.equal(OBJECT_ID_HEX_REGEX.test("650000000000000000000001"), true);
});

test("BL-05 URL search params serialization and parsing round-trips C++ and detects invalid URLs", () => {
  const params = {
    keyword: "C++",
    location: "ho chi minh",
    category: "it",
    workTypes: ["remote", "full-time"],
    sort: "salary",
    page: 3,
    limit: 12,
    companyId: "650000000000000000000001",
  };
  const sp = toPublicJobsSearchParams(params);
  const result = parsePublicJobsSearchParams(sp);

  assert.equal(result.isValid, true);
  assert.equal(result.params.keyword, "C++");
  assert.equal(result.params.location, "ho chi minh");
  assert.equal(result.params.category, "it");
  assert.deepEqual(result.params.workTypes, ["full-time", "remote"]);
  assert.equal(result.params.sort, "salary");
  assert.equal(result.params.page, 3);
  assert.equal(result.params.limit, 12);
  assert.equal(result.params.companyId, "650000000000000000000001");

  // Rejects unknown filters, duplicate scalar keys, and conflicting keyword/q in shared URLs
  assert.equal(parsePublicJobsSearchParams("location=unknown").isValid, false);
  assert.equal(parsePublicJobsSearchParams("location=unknown").code, "INVALID_LOCATION");
  assert.equal(parsePublicJobsSearchParams("page=1&page=2").code, "INVALID_PAGE");
  assert.equal(parsePublicJobsSearchParams("workTypes=full-time&workTypes=remote").code, "INVALID_WORK_TYPES");
  assert.equal(parsePublicJobsSearchParams("keyword=react&q=java").code, "INVALID_QUERY_PARAMS");
  assert.equal(resolveCanonicalLocation("Sài Gòn"), "ho chi minh");
  assert.equal(resolveCanonicalLocation("mars"), null);
});

test("BL-05 Vietnamese NFC diacritic regex, literal metacharacters, and comparable VND salary policy", () => {
  const pattern = new RegExp(buildVietnameseRegexPattern("la\u0323p tri\u0300nh"), "i");
  assert.equal(pattern.test("Lập trình viên React"), true);
  assert.equal(pattern.test("Tuyển lap trinh vien"), true);
  assert.equal(pattern.test("LẬP TRÌNH"), true);
  assert.equal(pattern.test("Ke toan truong"), false);

  // Literal + and .NET do not degenerate into loose C / any-char matches
  const cppPattern = new RegExp(buildVietnameseRegexPattern("C++"), "i");
  assert.equal(cppPattern.test("C++ Systems Engineer"), true);
  assert.equal(cppPattern.test("C Embedded Engineer"), false);
  const dotnetPattern = new RegExp(buildVietnameseRegexPattern(".NET"), "i");
  assert.equal(dotnetPattern.test(".NET Core Developer"), true);
  assert.equal(dotnetPattern.test("XNET Core Developer"), false);

  const metaChars = "C++ (Visual Studio) [2026] . * + ? ^ $ { } | \\";
  const safeRegex = new RegExp(escapeRegex(metaChars));
  assert.equal(safeRegex.test(metaChars), true);

  // Comparable VND salary normalization policy
  assert.deepEqual(parseComparableVndSalary("35-55 trieu VND"), { isComparable: true, vndMax: 55_000_000 });
  assert.deepEqual(parseComparableVndSalary("30-50 triệu"), { isComparable: true, vndMax: 50_000_000 });
  assert.deepEqual(parseComparableVndSalary("30M"), { isComparable: true, vndMax: 30_000_000 });
  assert.deepEqual(parseComparableVndSalary("30M/tháng"), { isComparable: true, vndMax: 30_000_000 });
  assert.deepEqual(parseComparableVndSalary("20 triệu / month"), { isComparable: true, vndMax: 20_000_000 });
  assert.deepEqual(parseComparableVndSalary("20 triệu/th"), { isComparable: true, vndMax: 20_000_000 });
  assert.deepEqual(parseComparableVndSalary("12.5 triệu"), { isComparable: true, vndMax: 12_500_000 });
  assert.deepEqual(parseComparableVndSalary("12,5 tr"), { isComparable: true, vndMax: 12_500_000 });
  assert.deepEqual(parseComparableVndSalary("15.000.000 - 20.000.000 VND"), { isComparable: true, vndMax: 20_000_000 });
  assert.deepEqual(parseComparableVndSalary("15.000.000 VND"), { isComparable: true, vndMax: 15_000_000 });
  assert.deepEqual(parseComparableVndSalary("20000000 đ"), { isComparable: true, vndMax: 20_000_000 });
  assert.deepEqual(parseComparableVndSalary("20 - 20 triệu"), { isComparable: true, vndMax: 20_000_000 });

  // Non-comparable/unparseable/foreign/ambiguous/malformed/out-of-range salaries drop cleanly to bucket 0
  for (const rejectedSalary of [
    "Thỏa thuận",
    "$2,000 USD",
    "15 - 25",
    "20 triệu/tháng (40 giờ/tuần)",
    "-20 triệu",
    "0-20 triệu",
    "0 triệu",
    "20-999999 triệu",
    "50-30 triệu",
    "10.000,500 VND",
    "12.500 triệu",
    "30 triệu/năm",
    "500.000 đ/tuần",
    "100.000 đ/giờ",
    "99999999999999999999 VND",
    null,
    12345,
  ]) {
    assert.deepEqual(
      parseComparableVndSalary(rejectedSalary),
      { isComparable: false, vndMax: 0 },
      `Expected bucket 0 rejection for salary: ${String(rejectedSalary)}`,
    );
  }
  assert.equal(getSalaryMaximum("30 triệu"), 30_000_000);
  assert.equal(getSalaryMaximum(""), 0);

  assert.equal(LOCATION_ALIASES["ho chi minh"].includes("hcm"), true);
  assert.equal(CATEGORY_KEYWORDS.it.includes("developer"), true);
  assert.equal(WORK_TYPE_KEYWORDS["full-time"].includes("toàn thời gian"), true);
});

test("BL-05 buildPublicJobsMongoQuery produces BSON ObjectId that survives Job.aggregate().pipeline()", () => {
  const now = new Date("2026-06-01T00:00:00.000Z");
  const companyHex = "650000000000000000000001";
  const query = buildPublicJobsMongoQuery(
    {
      keyword: "React",
      location: "ha noi",
      category: "it",
      workTypes: ["remote"],
      companyId: companyHex,
    },
    now,
  );

  // BSON ObjectId must be used in $match (Mongoose does not auto-cast aggregates)
  const companyCond = query.$and.find((cond) => cond.companyId !== undefined);
  assert.ok(companyCond);
  assert.ok(companyCond.companyId instanceof mongoose.Types.ObjectId);
  assert.equal(companyCond.companyId.toHexString(), companyHex);

  const pipeline = buildPublicJobsAggregationPipeline(query, {
    sort: "salary",
    page: 1,
    limit: 12,
  });
  const mongoosePipeline = Job.aggregate(pipeline).pipeline();
  const matchCompanyCond = mongoosePipeline[0].$match.$and.find((cond) => cond.companyId !== undefined);
  assert.ok(matchCompanyCond.companyId instanceof mongoose.Types.ObjectId);
  assert.equal(matchCompanyCond.companyId.toHexString(), companyHex);

  // Verify safe salary pipeline uses anchored $regexFind + $convert (no $regexFindAll/$toInt) and projects only public fields
  const serializedPipeline = JSON.stringify(mongoosePipeline);
  assert.equal(serializedPipeline.includes("$toInt"), false);
  assert.equal(serializedPipeline.includes("$regexFindAll"), false);
  assert.match(serializedPipeline, /"\$regexFind"/);
  assert.match(serializedPipeline, /"\$convert"/);
  assert.match(serializedPipeline, /"__salaryBucket":-1,"__salaryMax":-1/);

  const facet = mongoosePipeline.find((stage) => stage.$facet).$facet;
  assert.deepEqual(facet.data[2].$project, PUBLIC_JOB_PROJECT_FIELDS);
});

test("BL-05 HTTP createPublicJobsHandler runs strictly through aggregate pipeline with BSON ObjectId, literal keywords, and safe VND sorting", async (t) => {
  const now = new Date("2026-06-01T00:00:00.000Z");
  const companyAlphaId = new mongoose.Types.ObjectId("6500000000000000000000aa");
  const otherCompanyId = new mongoose.Types.ObjectId("6500000000000000000000bb");

  // Build 26 public jobs: first 20 newest belong to otherCompanyId, older 5 belong to companyAlphaId
  // so companyAlpha's jobs fall beyond page 1 globally.
  const docs = [];
  for (let i = 1; i <= 25; i += 1) {
    const isAlpha = i <= 5;
    docs.push({
      _id: `job-${String(i).padStart(3, "0")}`,
      title: i % 2 === 0 ? `Lập trình viên React ${i}` : `UI/UX Designer ${i}`,
      company: `Công ty ${i}`,
      companyId: isAlpha ? companyAlphaId : otherCompanyId,
      location: i % 3 === 0 ? "TP. Hồ Chí Minh" : "Hà Nội",
      type: i % 2 === 0 ? "Full-time" : "Part-time",
      workModel: i % 4 === 0 ? "Làm từ xa" : "Tại văn phòng",
      salary: `${10 + (i % 5)}-${16 + (i % 5)} triệu`,
      tags: i % 2 === 0 ? ["React", "Frontend"] : ["Figma"],
      status: "Active",
      approvalStatus: "Approved",
      isAdminHidden: false,
      deletedAt: null,
      expiryDate: new Date("2029-01-01T00:00:00.000Z"),
      createdAt: new Date(Date.parse("2026-01-01T00:00:00.000Z") + i * 3600000),
      description: "Mô tả nội bộ dài không được trả về trong card danh sách...",
    });
  }

  // Diverse real-world salary and literal keyword fixtures
  docs.push(
    {
      _id: "job-sal-01",
      title: "C++ Engine Architect",
      company: "Systems Corp",
      companyId: otherCompanyId,
      location: "Hà Nội",
      type: "Full-time",
      workModel: "Tại văn phòng",
      salary: "35-55 trieu VND",
      tags: ["C++", "Systems"],
      status: "Active",
      approvalStatus: "Approved",
      isAdminHidden: false,
      deletedAt: null,
      expiryDate: new Date("2029-01-01T00:00:00.000Z"),
      createdAt: new Date("2025-12-20T00:00:00.000Z"),
    },
    {
      _id: "job-sal-02",
      title: "C Embedded Developer",
      company: "Embedded Lab",
      companyId: otherCompanyId,
      location: "Hà Nội",
      type: "Full-time",
      workModel: "Tại văn phòng",
      salary: "30M",
      tags: ["C", "Firmware"],
      status: "Active",
      approvalStatus: "Approved",
      isAdminHidden: false,
      deletedAt: null,
      expiryDate: new Date("2029-01-01T00:00:00.000Z"),
      createdAt: new Date("2025-12-19T00:00:00.000Z"),
    },
    {
      _id: "job-sal-03",
      title: "Platform Lead",
      company: "Cloud VN",
      companyId: otherCompanyId,
      location: "TP. Hồ Chí Minh",
      type: "Remote",
      workModel: "Làm từ xa",
      salary: "15.000.000 VND",
      tags: ["Cloud"],
      status: "Active",
      approvalStatus: "Approved",
      isAdminHidden: false,
      deletedAt: null,
      expiryDate: new Date("2029-01-01T00:00:00.000Z"),
      createdAt: new Date("2025-12-18T00:00:00.000Z"),
    },
    {
      _id: "job-sal-04",
      title: "Junior QA Engineer",
      company: "Quality Lab",
      companyId: otherCompanyId,
      location: "Đà Nẵng",
      type: "Full-time",
      workModel: "Tại văn phòng",
      salary: "12,5 tr",
      tags: ["QA"],
      status: "Active",
      approvalStatus: "Approved",
      isAdminHidden: false,
      deletedAt: null,
      expiryDate: new Date("2029-01-01T00:00:00.000Z"),
      createdAt: new Date("2025-12-17T00:00:00.000Z"),
    },
    {
      _id: "job-sal-05",
      title: "International Consultant",
      company: "Global Co",
      companyId: otherCompanyId,
      location: "TP. Hồ Chí Minh",
      type: "Remote",
      workModel: "Làm từ xa",
      salary: "$2,000 USD",
      tags: ["Consulting"],
      status: "Active",
      approvalStatus: "Approved",
      isAdminHidden: false,
      deletedAt: null,
      expiryDate: new Date("2029-01-01T00:00:00.000Z"),
      createdAt: new Date("2025-12-25T00:00:00.000Z"),
    },
    {
      _id: "job-sal-06",
      title: "Negotiable Principal",
      company: "Principal Studio",
      companyId: otherCompanyId,
      location: "Hà Nội",
      type: "Full-time",
      workModel: "Tại văn phòng",
      salary: "Thỏa thuận",
      tags: ["Leadership"],
      status: "Active",
      approvalStatus: "Approved",
      isAdminHidden: false,
      deletedAt: null,
      expiryDate: new Date("2029-01-01T00:00:00.000Z"),
      createdAt: new Date("2025-12-24T00:00:00.000Z"),
    },
    {
      _id: "job-sal-07",
      title: "Malformed Giant Salary Row",
      company: "Edge Corp",
      companyId: otherCompanyId,
      location: "Hà Nội",
      type: "Full-time",
      workModel: "Tại văn phòng",
      salary: "99999999999999999999 VND",
      tags: ["Edge"],
      status: "Active",
      approvalStatus: "Approved",
      isAdminHidden: false,
      deletedAt: null,
      expiryDate: new Date("2029-01-01T00:00:00.000Z"),
      createdAt: new Date("2025-12-23T00:00:00.000Z"),
    },
  );

  // Unavailable jobs that must never appear even for companyAlphaId
  docs.push(
    { _id: "unavail-1", companyId: companyAlphaId, title: "Draft Job", status: "Draft", approvalStatus: "Approved", deletedAt: null, isAdminHidden: false, expiryDate: new Date("2029-01-01") },
    { _id: "unavail-2", companyId: companyAlphaId, title: "Pending Job", status: "Active", approvalStatus: "Pending", deletedAt: null, isAdminHidden: false, expiryDate: new Date("2029-01-01") },
    { _id: "unavail-3", companyId: companyAlphaId, title: "Deleted Job", status: "Active", approvalStatus: "Approved", deletedAt: new Date("2026-01-01"), isAdminHidden: false, expiryDate: new Date("2029-01-01") },
    { _id: "unavail-4", companyId: companyAlphaId, title: "Hidden Job", status: "Active", approvalStatus: "Approved", deletedAt: null, isAdminHidden: true, expiryDate: new Date("2029-01-01") },
    { _id: "unavail-5", companyId: companyAlphaId, title: "Expired Job", status: "Active", approvalStatus: "Approved", deletedAt: null, isAdminHidden: false, expiryDate: new Date("2025-01-01") },
  );

  const observedPipelines = [];
  const aggregateOnlyModel = {
    async aggregate(pipeline) {
      observedPipelines.push(pipeline);
      return executeAggregatePipeline(docs, pipeline);
    },
  };

  const handler = createPublicJobsHandler({ JobModel: aggregateOnlyModel, nowFn: () => now });
  const app = express();
  app.get("/api/jobs", handler);
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  t.after(() => new Promise((resolve) => server.close(resolve)));

  // 1. Company profile listing fetches BSON ObjectId matches even when globally beyond page 1
  const compRes = await fetch(`${baseUrl}/api/jobs?companyId=${companyAlphaId.toHexString()}&limit=12`);
  assert.equal(compRes.status, 200);
  const compJson = await compRes.json();
  assert.equal(compJson.meta.total, 5);
  assert.equal(compJson.data.length, 5);
  assert.equal(compJson.data[0].description, undefined);

  // Verify aggregate $match received a true BSON ObjectId instance
  const compMatchCond = observedPipelines[observedPipelines.length - 1][0].$match.$and.find(
    (c) => c.companyId !== undefined,
  );
  assert.ok(compMatchCond.companyId instanceof mongoose.Types.ObjectId);

  // 2. Literal C++ keyword search matches C++ Engine Architect without matching C Embedded Developer
  const cppRes = await (await fetch(`${baseUrl}/api/jobs?keyword=${encodeURIComponent("C++")}`)).json();
  assert.deepEqual(cppRes.data.map((d) => d._id), ["job-sal-01"]);

  // 3. Decomposed Vietnamese NFD keyword matches NFC titles cleanly
  const nfdRes = await (await fetch(`${baseUrl}/api/jobs?keyword=${encodeURIComponent("Lâ\u0323p tri\u0300nh")}`)).json();
  assert.ok(nfdRes.data.length > 0);
  assert.ok(nfdRes.data.every((item) => /Lập trình/i.test(item.title)));

  // 4. Salary sort across full dataset without crashing on oversized row, USD, or Thỏa thuận
  const salPage1 = await (await fetch(`${baseUrl}/api/jobs?sort=salary&page=1&limit=10`)).json();
  assert.equal(salPage1.meta.total, 32);
  assert.equal(salPage1.data[0]._id, "job-sal-01"); // 55,000,000 VND beats 30M and 20M
  assert.equal(salPage1.data[1]._id, "job-sal-02"); // 30,000,000 VND beats 20M and 15.000.000 VND

  // Last page holds remaining uncomparable bucket-0 rows (Thỏa thuận, malformed oversized)
  const salLastPage = await (await fetch(`${baseUrl}/api/jobs?sort=salary&page=4&limit=10`)).json();
  assert.deepEqual(salLastPage.data.map((d) => d._id), ["job-sal-06", "job-sal-07"]);
  const salPage3 = await (await fetch(`${baseUrl}/api/jobs?sort=salary&page=3&limit=10`)).json();
  const salPage3Ids = salPage3.data.map((d) => d._id);
  assert.ok(salPage3Ids.indexOf("job-sal-03") < salPage3Ids.indexOf("job-sal-04")); // 15M before 12.5M
  assert.ok(salPage3Ids.indexOf("job-sal-04") < salPage3Ids.indexOf("job-sal-05")); // 12.5M before USD bucket-0

  // 5. Strict 400 validation blocks malicious/unsupported parameters before calling aggregate
  const pipelineCountBefore = observedPipelines.length;
  for (const badQuery of [
    "status=Draft",
    "location=unknown",
    "category=unknown",
    "workTypes=unknown",
    "workTypes[]=full-time",
    "page[]=2",
    "page=1&page=2",
    "keyword=react&q=java",
    "companyId=company-alpha",
  ]) {
    const badRes = await fetch(`${baseUrl}/api/jobs?${badQuery}`);
    assert.equal(badRes.status, 400, `Expected 400 for query: ${badQuery}`);
  }
  assert.equal(observedPipelines.length, pipelineCountBefore);

  // 6. Handler fails loudly without find/countDocuments fallback when aggregate is absent
  const brokenHandler = createPublicJobsHandler({ JobModel: { find: () => [] } });
  const brokenApp = express();
  brokenApp.get("/api/jobs", brokenHandler);
  const brokenServer = http.createServer(brokenApp);
  await new Promise((resolve) => brokenServer.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => brokenServer.close(resolve)));
  const brokenRes = await fetch(`http://127.0.0.1:${brokenServer.address().port}/api/jobs`);
  assert.equal(brokenRes.status, 500);
});

test("BL-05 HTTP salary sort enforces anchored monthly VND grammar and deterministic bucket-0 tie-breaks", async (t) => {
  const now = new Date("2026-06-01T00:00:00.000Z");
  const companyId = new mongoose.Types.ObjectId("6500000000000000000000cc");
  const baseDoc = {
    company: "Salary Matrix Co",
    companyId,
    location: "Hà Nội",
    type: "Full-time",
    workModel: "Tại văn phòng",
    tags: ["Node.js"],
    status: "Active",
    approvalStatus: "Approved",
    isAdminHidden: false,
    deletedAt: null,
    expiryDate: new Date("2029-01-01T00:00:00.000Z"),
  };

  // Intentionally give bucket-0 traps newer createdAt timestamps than comparable VND jobs
  // so only strict grammar + bucket separation keeps them after valid VND listings.
  const docs = [
    { ...baseDoc, _id: "v-55m", title: "Architect", salary: "35-55 trieu VND", createdAt: new Date("2026-01-01T00:00:00.000Z") },
    { ...baseDoc, _id: "v-30m-th", title: "Staff Dev", salary: "30M/tháng", createdAt: new Date("2026-01-02T00:00:00.000Z") },
    { ...baseDoc, _id: "v-20m-range", title: "Senior Dev", salary: "15.000.000 - 20.000.000 VND", createdAt: new Date("2026-01-03T00:00:00.000Z") },
    { ...baseDoc, _id: "v-15m", title: "Backend Dev", salary: "15.000.000 VND", createdAt: new Date("2026-01-04T00:00:00.000Z") },
    { ...baseDoc, _id: "v-12-5m", title: "Junior Dev", salary: "12.5 triệu", createdAt: new Date("2026-01-05T00:00:00.000Z") },
    { ...baseDoc, _id: "b0-hours", title: "Hours Commentary", salary: "20 triệu/tháng (40 giờ/tuần)", createdAt: new Date("2026-05-12T00:00:00.000Z") },
    { ...baseDoc, _id: "b0-neg", title: "Negative Salary", salary: "-20 triệu", createdAt: new Date("2026-05-11T00:00:00.000Z") },
    { ...baseDoc, _id: "b0-outrange", title: "Out Of Range End", salary: "20-999999 triệu", createdAt: new Date("2026-05-10T00:00:00.000Z") },
    { ...baseDoc, _id: "b0-desc", title: "Descending Range", salary: "50-30 triệu", createdAt: new Date("2026-05-09T00:00:00.000Z") },
    { ...baseDoc, _id: "b0-zero", title: "Zero Start Range", salary: "0-20 triệu", createdAt: new Date("2026-05-08T00:00:00.000Z") },
    { ...baseDoc, _id: "b0-mixed-sep", title: "Mixed Separators", salary: "10.000,500 VND", createdAt: new Date("2026-05-07T00:00:00.000Z") },
    { ...baseDoc, _id: "b0-3dec", title: "Three Decimal Million", salary: "12.500 triệu", createdAt: new Date("2026-05-06T00:00:00.000Z") },
    { ...baseDoc, _id: "b0-annual", title: "Annual Period", salary: "30 triệu/năm", createdAt: new Date("2026-05-05T00:00:00.000Z") },
    { ...baseDoc, _id: "b0-weekly", title: "Weekly Period", salary: "500.000 đ/tuần", createdAt: new Date("2026-05-04T00:00:00.000Z") },
    { ...baseDoc, _id: "b0-usd", title: "USD Role", salary: "$2,000 USD", createdAt: new Date("2026-05-03T00:00:00.000Z") },
    { ...baseDoc, _id: "b0-unitless", title: "Unitless Range", salary: "15 - 25", createdAt: new Date("2026-05-02T00:00:00.000Z") },
    { ...baseDoc, _id: "b0-nonstring", title: "Non-string Salary", salary: 12345, createdAt: new Date("2026-05-01T00:00:00.000Z") },
  ];

  const handler = createPublicJobsHandler({
    JobModel: { aggregate: async (pipeline) => executeAggregatePipeline(docs, pipeline) },
    nowFn: () => now,
  });
  const app = express();
  app.get("/api/jobs", handler);
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const page1 = await (await fetch(`${baseUrl}/api/jobs?sort=salary&page=1&limit=10`)).json();
  const page2 = await (await fetch(`${baseUrl}/api/jobs?sort=salary&page=2&limit=10`)).json();
  assert.equal(page1.meta.total, docs.length);

  const actualIds = [...page1.data, ...page2.data].map((item) => item._id);
  const expectedIds = [...docs]
    .sort((a, b) => {
      const sa = parseComparableVndSalary(a.salary);
      const sb = parseComparableVndSalary(b.salary);
      if (sa.isComparable !== sb.isComparable) {
        return sb.isComparable ? 1 : -1;
      }
      if (sb.vndMax !== sa.vndMax) {
        return sb.vndMax - sa.vndMax;
      }
      const timeDiff = b.createdAt.getTime() - a.createdAt.getTime();
      if (timeDiff !== 0) {
        return timeDiff;
      }
      return b._id.localeCompare(a._id);
    })
    .map((item) => item._id);

  assert.deepEqual(actualIds, expectedIds);
  assert.deepEqual(actualIds.slice(0, 5), [
    "v-55m",
    "v-30m-th",
    "v-20m-range",
    "v-15m",
    "v-12-5m",
  ]);
  assert.deepEqual(actualIds.slice(5), [
    "b0-hours",
    "b0-neg",
    "b0-outrange",
    "b0-desc",
    "b0-zero",
    "b0-mixed-sep",
    "b0-3dec",
    "b0-annual",
    "b0-weekly",
    "b0-usd",
    "b0-unitless",
    "b0-nonstring",
  ]);
});
