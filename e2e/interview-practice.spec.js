import { expect, test } from "@playwright/test";
import {
  applyPracticeAction, applyPracticeGrade, createPracticeState, normalizePracticeGrade,
  practiceContext, publicPracticeSession,
} from "../server/utils/interviewSession.js";

test("practice from a job, resume after reload, hide grades until finish, and improve the same answer", async ({ page }) => {
  const id = "62a000000000000000000001";
  const job = {
    _id: id, status: "Active", approvalStatus: "Approved", title: "Chăm sóc khách hàng",
    company: "Công ty Mẫu", requirements: ["Xử lý đơn giao trễ", "Cập nhật khách khi chưa có lịch giao"],
  };
  let doc;
  let callCount = 0;
  const send = (route, message) => route.fulfill({ json: { session: doc ? publicPracticeSession(doc) : null, message } });
  await page.route("**/socket.io/**", (route) => route.abort());
  await page.route("**/api/**", (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const root = "/api/ai/interview/sessions";
    if (path === "/api/me") return route.fulfill({ json: { user: { _id: "practice-user", role: "employee", fullName: "Ứng viên thử nghiệm" } } });
    if (path === root + "/current") return send(route);
    if (path === root + "/context") return route.fulfill({ json: { context: practiceContext(request.postDataJSON().source, job), version: "test" } });
    if (path === root) {
      const body = request.postDataJSON();
      doc = { _id: "practice", state: createPracticeState(body.settings, practiceContext(body.source, job), body.competencyIds), revision: 0 };
      return send(route);
    }
    if (path.endsWith("/actions")) {
      const body = request.postDataJSON();
      const next = applyPracticeAction(doc.state, body);
      doc = { ...doc, state: next.state, revision: doc.revision + 1 };
      if (!next.grade) return send(route);
      callCount++;
      if (callCount === 1) return send(route, "Chưa chấm được câu này. Câu trả lời đã lưu.");
      const question = next.state.questions.find(({ id }) => id === next.grade.questionId);
      const attempt = question.attempts[next.grade.attemptIndex];
      const output = callCount === 2 ? { followUp: "Bạn sẽ cập nhật cho khách vào lúc nào?", ratings: [] } : {
        improvement: "Nêu rõ thời điểm cập nhật và cách theo dõi.",
        ratings: question.criteria.map(({ id }) => ({
          criterionId: id, rating: callCount === 3 ? 2 : 4, explanation: "Có nội dung liên quan.", evidence: attempt.answer,
        })),
      };
      doc = { ...doc, state: applyPracticeGrade(next.state, next.grade, normalizePracticeGrade(output, question, attempt, next.grade.allowFollowUp)) };
      return send(route);
    }
    return route.fulfill({ json: { count: 0, notifications: [] } });
  });

  await page.goto("/ai-interview?jobId=" + id);
  await expect(page.getByRole("checkbox", { name: "Xử lý đơn giao trễ" })).toBeChecked();
  await page.getByLabel("Nội dung luyện").selectOption("technical");
  await page.getByLabel("Cách luyện").selectOption("simulation");
  await page.getByRole("button", { name: "Bắt đầu phỏng vấn" }).click();
  await expect(page.getByRole("heading", { name: /Khách báo đơn giao trễ/ })).toBeVisible();
  const answer = page.getByRole("textbox", { name: "Câu trả lời phỏng vấn" });
  const sendAnswer = page.getByRole("button", { name: "Gửi câu trả lời" });
  await answer.fill("Tôi tra cứu đơn và xác nhận tình trạng.");
  await page.reload();
  await expect(answer).toHaveValue("Tôi tra cứu đơn và xác nhận tình trạng.");
  await sendAnswer.click();
  await expect(page.getByRole("alert")).toContainText("Câu trả lời đã lưu");
  await expect(page.getByText("Tôi tra cứu đơn và xác nhận tình trạng.")).toBeVisible();
  await page.getByRole("button", { name: "Chấm lại câu đã lưu" }).click();
  await expect(page.getByText(/Bạn sẽ cập nhật cho khách vào lúc nào/)).toBeVisible();
  await answer.fill("Tôi hẹn cập nhật trước 16 giờ.");
  await sendAnswer.click();
  await expect(page.getByText(/Câu 2\/5/)).toBeVisible();
  await expect(page.getByText("50/100", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Bỏ qua câu này" }).click();
  await expect(page.getByText(/Câu 3\/5/)).toBeVisible();
  await page.getByRole("button", { name: "Kết thúc sớm" }).click();
  await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Kết quả buổi phỏng vấn" })).toBeVisible();
  await expect(page.getByText(/Đã đánh giá 1\/5 câu · Bỏ qua 1/)).toBeVisible();
  await page.getByText("Câu 1 · Chuyên môn · Đã đánh giá", { exact: true }).click();
  await expect(page.getByText("“Tôi tra cứu đơn và xác nhận tình trạng.”").first()).toBeVisible();
  await page.getByRole("button", { name: "Luyện lại câu này" }).click();
  await page.getByLabel("Câu trả lời luyện lại").fill("Tôi xác minh mã đơn, hẹn cập nhật trước 16 giờ và ghi chú bàn giao.");
  await page.getByRole("button", { name: "Gửi lượt luyện lại" }).click();
  await expect(page.getByRole("list", { name: "So sánh điểm với lượt đầu" })).toContainText("2/4 → 4/4");
  await expect(page.getByText("50/100", { exact: true }).first()).toBeVisible();
});
