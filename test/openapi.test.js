import assert from "node:assert/strict";
import { test } from "node:test";
import openapiSpec from "../server/openapi.js";

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"];

const countOperations = (spec) =>
  Object.values(spec.paths).reduce(
    (total, path) =>
      total + HTTP_METHODS.filter((method) => Boolean(path[method])).length,
    0,
  );

test("OpenAPI documentation covers every RabbitCV HTTP API", () => {
  assert.equal(Object.keys(openapiSpec.paths).length, 52);
  assert.equal(countOperations(openapiSpec), 58);
  assert.ok(openapiSpec.paths["/api/jobs/applications/{id}/resume"].get);
  assert.ok(openapiSpec.paths["/api/ai/interview/turn"].post);
  assert.ok(openapiSpec.paths["/api/admin/stats"].get);
  assert.equal(openapiSpec.paths["/api/ai/resume/score"], undefined);
  assert.equal(openapiSpec.paths["/api/ai/resume/improve"], undefined);
});

test("protected APIs document cookie authentication", () => {
  assert.deepEqual(openapiSpec.paths["/api/resumes"].get.security, [
    { cookieAuth: [] },
  ]);
  assert.deepEqual(openapiSpec.paths["/api/jobs"].get.security, undefined);
  assert.equal(openapiSpec.components.securitySchemes.cookieAuth.in, "cookie");
});
