import { expect, test } from "@playwright/test";

const candidate = {
  _id: "interview-candidate", username: "candidate", fullName: "Ứng viên kiểm thử",
  role: "employee", experiences: [{ position: "Thực tập" }],
};

for (const cached of [false, true]) {
  test(`interview role prefills once and stays empty after clearing (${cached ? "cached profile" : "loaded profile"})`, async ({ page }) => {
    let interviewPayload;
    if (cached) {
      await page.addInitScript((user) => {
        sessionStorage.setItem("rabbitcv_current_user", JSON.stringify(user));
      }, candidate);
    }
    await page.route("**/socket.io/**", (route) => route.abort());
    await page.route("**/api/**", async (route) => {
      const { pathname } = new URL(route.request().url());
      let body = {};
      if (pathname === "/api/me") body = { user: candidate };
      else if (pathname.endsWith("/unread-count")) body = { count: 0 };
      else if (pathname === "/api/ai/interview/turn") {
        interviewPayload = route.request().postDataJSON();
        body = { result: { message: "Bạn có thể giới thiệu về bản thân?", questionNumber: 1, isComplete: false } };
      }
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
    });
    await page.goto("/ai-interview");
    const role = page.getByRole("textbox", { name: "Vị trí ứng tuyển" });
    await expect(role).toHaveValue("Thực tập");
    await role.fill("");
    await expect(role).toHaveValue("");
    await page.getByText("Middle", { exact: true }).click();
    await expect(page.getByRole("radio", { name: "Middle", exact: true })).toBeChecked();
    await page.getByRole("button", { name: "Bắt đầu phỏng vấn", exact: true }).click();
    await expect(page.getByText("Hãy nhập vị trí muốn luyện phỏng vấn.", { exact: true })).toBeVisible();
    expect(interviewPayload).toBeUndefined();
    await expect(role).toHaveValue("");
    await role.fill("Frontend Developer");
    await role.press("ControlOrMeta+a");
    await role.press("Backspace");
    await expect(role).toHaveValue("");
    await role.fill("Backend Developer");
    await page.getByRole("button", { name: "Bắt đầu phỏng vấn", exact: true }).click();
    await expect(page.getByText("Bạn có thể giới thiệu về bản thân?", { exact: true })).toBeVisible();
    expect(interviewPayload.settings.role).toBe("Backend Developer");
  });
}
