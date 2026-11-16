import mongoose from "mongoose";
import { publicJobsFilter } from "../utils/jobAvailability.js";
import {
  validateAndParseJobsQuery,
  buildVietnameseRegexPattern,
  OBJECT_ID_HEX_REGEX,
  MAX_COMPARABLE_SALARY_VND,
  MAX_COMPARABLE_SALARY_MILLIONS,
  SALARY_MILLION_REGEX_SOURCE,
  SALARY_VND_REGEX_SOURCE,
  CATEGORY_KEYWORDS,
  LOCATION_ALIASES,
  WORK_TYPE_KEYWORDS,
} from "../../shared/jobQueryPolicy.js";

export const PUBLIC_JOB_PROJECT_FIELDS = {
  _id: 1,
  title: 1,
  company: 1,
  companyId: 1,
  location: 1,
  type: 1,
  workModel: 1,
  salary: 1,
  experience: 1,
  education: 1,
  tags: 1,
  status: 1,
  approvalStatus: 1,
  isAdminHidden: 1,
  deletedAt: 1,
  expiryDate: 1,
  createdAt: 1,
  updatedAt: 1,
};

export function sanitizePublicJobCard(job) {
  if (!job || typeof job !== "object") return job;
  const safe = typeof job.toObject === "function" ? job.toObject() : { ...job };
  delete safe.description;
  delete safe.requirements;
  delete safe.benefits;
  delete safe.rejectionReason;
  delete safe.expiryNotifiedAt;
  delete safe.expiredNotifiedAt;
  return safe;
}

export function buildPublicJobsMongoQuery(params = {}, now = new Date()) {
  const baseFilter = publicJobsFilter(now);
  const conditions = [baseFilter];

  if (params.companyId) {
    if (!OBJECT_ID_HEX_REGEX.test(params.companyId)) {
      throw new Error("Invalid companyId ObjectId format.");
    }
    conditions.push({ companyId: new mongoose.Types.ObjectId(params.companyId) });
  }

  if (params.keyword) {
    const pattern = buildVietnameseRegexPattern(params.keyword);
    conditions.push({
      $or: [
        { title: { $regex: pattern, $options: "i" } },
        { company: { $regex: pattern, $options: "i" } },
        { tags: { $regex: pattern, $options: "i" } },
      ],
    });
  }

  if (params.location) {
    const aliases = LOCATION_ALIASES[params.location] || [params.location];
    const locationPattern = aliases
      .map((alias) => buildVietnameseRegexPattern(alias))
      .join("|");
    conditions.push({
      location: { $regex: locationPattern, $options: "i" },
    });
  }

  if (params.category) {
    const keywords = CATEGORY_KEYWORDS[params.category] || [params.category];
    const categoryPattern = keywords
      .map((kw) => buildVietnameseRegexPattern(kw))
      .join("|");
    conditions.push({
      $or: [
        { title: { $regex: categoryPattern, $options: "i" } },
        { tags: { $regex: categoryPattern, $options: "i" } },
        { description: { $regex: categoryPattern, $options: "i" } },
      ],
    });
  }

  if (Array.isArray(params.workTypes) && params.workTypes.length > 0) {
    const workTypeOrs = params.workTypes.map((wt) => {
      const keywords = WORK_TYPE_KEYWORDS[wt] || [wt];
      const pattern = keywords
        .map((kw) => buildVietnameseRegexPattern(kw))
        .join("|");
      return {
        $or: [
          { type: { $regex: pattern, $options: "i" } },
          { workModel: { $regex: pattern, $options: "i" } },
          { tags: { $regex: pattern, $options: "i" } },
        ],
      };
    });
    conditions.push({ $or: workTypeOrs });
  }

  return conditions.length === 1 ? conditions[0] : { $and: conditions };
}

function buildSafeSalaryMaxExpr() {
  const salaryText = {
    $cond: {
      if: { $eq: [{ $type: "$salary" }, "string"] },
      then: "$salary",
      else: "",
    },
  };

  const buildBranchExpr = ({ regex, parseNumberExpr, maxLimit, scaleFactor = 1 }) => {
    const isValidEndpoint = (valVar) => ({
      $and: [
        { $ne: [valVar, null] },
        { $gt: [valVar, 0] },
        { $lte: [valVar, maxLimit] },
      ],
    });

    return {
      $let: {
        vars: {
          found: {
            $regexFind: {
              input: salaryText,
              regex,
              options: "i",
            },
          },
        },
        in: {
          $cond: {
            if: { $eq: ["$$found", null] },
            then: null,
            else: {
              $let: {
                vars: {
                  loStr: { $arrayElemAt: ["$$found.captures", 0] },
                  hiStr: { $arrayElemAt: ["$$found.captures", 1] },
                },
                in: {
                  $let: {
                    vars: {
                      lo: {
                        $cond: {
                          if: { $eq: ["$$loStr", null] },
                          then: null,
                          else: parseNumberExpr("$$loStr"),
                        },
                      },
                      hi: {
                        $cond: {
                          if: { $eq: ["$$hiStr", null] },
                          then: null,
                          else: parseNumberExpr("$$hiStr"),
                        },
                      },
                    },
                    in: {
                      $cond: {
                        if: {
                          $cond: {
                            if: { $eq: ["$$hiStr", null] },
                            then: isValidEndpoint("$$lo"),
                            else: {
                              $and: [
                                isValidEndpoint("$$lo"),
                                isValidEndpoint("$$hi"),
                                { $lte: ["$$lo", "$$hi"] },
                              ],
                            },
                          },
                        },
                        then: {
                          $let: {
                            vars: {
                              target: {
                                $cond: {
                                  if: { $eq: ["$$hiStr", null] },
                                  then: "$$lo",
                                  else: "$$hi",
                                },
                              },
                            },
                            in:
                              scaleFactor === 1
                                ? "$$target"
                                : { $round: [{ $multiply: ["$$target", scaleFactor] }, 0] },
                          },
                        },
                        else: 0,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };
  };

  const millionBranch = buildBranchExpr({
    regex: SALARY_MILLION_REGEX_SOURCE,
    maxLimit: MAX_COMPARABLE_SALARY_MILLIONS,
    scaleFactor: 1_000_000,
    parseNumberExpr: (strExpr) => ({
      $convert: {
        input: { $replaceAll: { input: strExpr, find: ",", replacement: "." } },
        to: "double",
        onError: null,
        onNull: null,
      },
    }),
  });

  const vndBranch = buildBranchExpr({
    regex: SALARY_VND_REGEX_SOURCE,
    maxLimit: MAX_COMPARABLE_SALARY_VND,
    scaleFactor: 1,
    parseNumberExpr: (strExpr) => ({
      $convert: {
        input: {
          $replaceAll: {
            input: { $replaceAll: { input: strExpr, find: ".", replacement: "" } },
            find: ",",
            replacement: "",
          },
        },
        to: "double",
        onError: null,
        onNull: null,
      },
    }),
  });

  return {
    $let: {
      vars: {
        millionValue: millionBranch,
      },
      in: {
        $cond: {
          if: { $ne: ["$$millionValue", null] },
          then: "$$millionValue",
          else: {
            $let: {
              vars: {
                vndValue: vndBranch,
              },
              in: {
                $cond: {
                  if: { $ne: ["$$vndValue", null] },
                  then: "$$vndValue",
                  else: 0,
                },
              },
            },
          },
        },
      },
    },
  };
}

export function buildPublicJobsAggregationPipeline(mongoQuery, params) {
  const pipeline = [{ $match: mongoQuery }];

  if (params.sort === "salary") {
    pipeline.push({
      $addFields: {
        __salaryMax: buildSafeSalaryMaxExpr(),
      },
    });
    pipeline.push({
      $addFields: {
        __salaryBucket: {
          $cond: {
            if: { $gt: ["$__salaryMax", 0] },
            then: 1,
            else: 0,
          },
        },
      },
    });
    pipeline.push({
      $sort: { __salaryBucket: -1, __salaryMax: -1, createdAt: -1, _id: -1 },
    });
  } else if (params.sort === "match") {
    // Public search uses tag count as relevance heuristic (no authenticated user profile context).
    pipeline.push({
      $addFields: {
        __matchScore: {
          $cond: {
            if: { $isArray: "$tags" },
            then: { $size: "$tags" },
            else: 0,
          },
        },
      },
    });
    pipeline.push({
      $sort: { __matchScore: -1, createdAt: -1, _id: -1 },
    });
  } else {
    pipeline.push({
      $sort: { createdAt: -1, _id: -1 },
    });
  }

  const skip = (params.page - 1) * params.limit;
  pipeline.push({
    $facet: {
      data: [
        { $skip: skip },
        { $limit: params.limit },
        { $project: PUBLIC_JOB_PROJECT_FIELDS },
      ],
      totalCount: [{ $count: "count" }],
    },
  });

  return pipeline;
}

export const createPublicJobsHandler = ({
  JobModel,
  nowFn = () => new Date(),
}) => async (req, res) => {
  res.set("Cache-Control", "no-store");

  const validation = validateAndParseJobsQuery(req.query);
  if (!validation.isValid) {
    return res.status(400).json({
      error: validation.error,
      code: validation.code,
    });
  }

  const { params } = validation;
  const now = nowFn();

  try {
    if (typeof JobModel?.aggregate !== "function") {
      throw new Error("JobModel.aggregate is required for public job listings.");
    }

    const mongoQuery = buildPublicJobsMongoQuery(params, now);
    const pipeline = buildPublicJobsAggregationPipeline(mongoQuery, params);
    const [result] = await JobModel.aggregate(pipeline);
    const jobs = (result?.data || []).map(sanitizePublicJobCard);
    const total = result?.totalCount?.[0]?.count || 0;
    const totalPages = Math.max(1, Math.ceil(total / params.limit));

    return res.status(200).json({
      data: jobs,
      meta: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Không thể tải danh sách việc làm.",
      code: "SERVER_ERROR",
    });
  }
};
