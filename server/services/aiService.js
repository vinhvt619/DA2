import { createHash } from "node:crypto";
import OpenAI from "openai";
import AiUsage from "../models/AiUsage.js";
import { AI_RESPONSE_SCHEMAS } from "./aiSchemas.js";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_MODEL = "openai/gpt-oss-120b";
const DEFAULT_DAILY_LIMIT = 100;
const DEFAULT_TIMEOUT_MS = 20000;

export class AiRequestError extends Error {
  constructor(message, status = 500, code = "AI_REQUEST_FAILED") {
    super(message);
    this.name = "AiRequestError";
    this.status = status;
    this.code = code;
  }
}

const readPositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getAiConfig = () => ({
  apiKey: process.env.GROQ_API_KEY || "",
  model: process.env.GROQ_MODEL || DEFAULT_MODEL,
  dailyLimit: readPositiveInteger(
    process.env.AI_DAILY_LIMIT,
    DEFAULT_DAILY_LIMIT,
  ),
  timeout: readPositiveInteger(
    process.env.AI_REQUEST_TIMEOUT_MS,
    DEFAULT_TIMEOUT_MS,
  ),
  enabled: process.env.AI_ENABLED !== "false",
});

const startOfToday = () => {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  return value;
};

const hashValue = (value) =>
  createHash("sha256").update(value).digest("hex");

export const getAiStatus = async (userId) => {
  const config = getAiConfig();
  const used = await AiUsage.countDocuments({
    userId,
    createdAt: { $gte: startOfToday() },
  });

  return {
    enabled: config.enabled && Boolean(config.apiKey),
    model: config.model,
    dailyLimit: config.dailyLimit,
    remaining: Math.max(config.dailyLimit - used, 0),
  };
};

export const runStructuredAiRequest = async ({
  userId,
  feature,
  instructions,
  input,
  validateResult,
  retryInstructions,
}) => {
  const config = getAiConfig();
  if (!config.enabled) {
    throw new AiRequestError(
      "Tinh nang AI dang tam tat",
      503,
      "AI_DISABLED",
    );
  }
  if (!config.apiKey) {
    throw new AiRequestError(
      "Server chua cau hinh GROQ_API_KEY",
      503,
      "AI_NOT_CONFIGURED",
    );
  }

  const used = await AiUsage.countDocuments({
    userId,
    createdAt: { $gte: startOfToday() },
  });
  if (used >= config.dailyLimit) {
    throw new AiRequestError(
      "Ban da su dung het luot AI hom nay",
      429,
      "AI_DAILY_LIMIT_REACHED",
    );
  }

  const responseSchema = AI_RESPONSE_SCHEMAS[feature];
  if (!responseSchema) {
    throw new AiRequestError(
      "Chuc nang AI khong hop le",
      400,
      "AI_FEATURE_INVALID",
    );
  }

  const serializedInput = JSON.stringify(input);
  const usage = await AiUsage.create({
    userId,
    feature,
    model: config.model,
    inputHash: hashValue(serializedInput),
  });
  const startedAt = Date.now();

  try {
    const client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: GROQ_BASE_URL,
      timeout: config.timeout,
      maxRetries: 1,
    });
    let result;
    let inputTokens = 0;
    let outputTokens = 0;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const effectiveInstructions =
        attempt === 0 || !retryInstructions
          ? instructions
          : `${instructions} ${retryInstructions}`;
      const response = await client.chat.completions.create({
        model: config.model,
        messages: [
          { role: "system", content: effectiveInstructions },
          { role: "user", content: serializedInput },
        ],
        reasoning_effort: "low",
        response_format: {
          type: "json_schema",
          json_schema: {
            name: responseSchema.name,
            strict: true,
            schema: responseSchema.schema,
          },
        },
      });

      inputTokens += response.usage?.prompt_tokens || 0;
      outputTokens += response.usage?.completion_tokens || 0;

      const outputText = response.choices?.[0]?.message?.content;
      if (!outputText) {
        throw new AiRequestError(
          "AI khong tra ve noi dung",
          502,
          "AI_EMPTY_RESPONSE",
        );
      }

      result = JSON.parse(outputText);
      if (!validateResult || validateResult(result)) {
        break;
      }
      if (attempt === 1) {
        throw new AiRequestError(
          "AI chua tao duoc ban tieu su hoan chinh. Vui long thu lai",
          502,
          "AI_INVALID_CONTENT",
        );
      }
    }

    await AiUsage.findByIdAndUpdate(usage._id, {
      status: "success",
      latencyMs: Date.now() - startedAt,
      inputTokens,
      outputTokens,
    });

    return {
      result,
      meta: {
        model: config.model,
        remaining: Math.max(config.dailyLimit - used - 1, 0),
      },
    };
  } catch (error) {
    const errorCode =
      error instanceof AiRequestError
        ? error.code
        : error?.status === 401 || error?.status === 403
          ? "GROQ_AUTH_FAILED"
        : error?.status === 429
          ? "GROQ_RATE_LIMIT"
          : "GROQ_REQUEST_FAILED";

    await AiUsage.findByIdAndUpdate(usage._id, {
      status: "failed",
      latencyMs: Date.now() - startedAt,
      errorCode,
    }).catch(() => {});

    if (error instanceof AiRequestError) {
      throw error;
    }
    if (error?.status === 401 || error?.status === 403) {
      throw new AiRequestError(
        "Groq API key khong hop le hoac khong co quyen truy cap",
        503,
        errorCode,
      );
    }
    if (error?.status === 429) {
      throw new AiRequestError(
        "Groq Free dang gioi han yeu cau. Vui long thu lai sau",
        429,
        errorCode,
      );
    }

    throw new AiRequestError(
      "Khong the xu ly yeu cau AI luc nay",
      502,
      errorCode,
    );
  }
};
