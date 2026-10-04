import { expect, test } from "@playwright/test";

for (const width of [1440, 390]) {
  test(`Interview uses browser microphone without a device selector (${width}px)`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => {
      window.speechStarts = [];
      window.SpeechRecognition = class {
        start(...args) {
          window.speechStarts.push(args.length);
          this.onstart();
          window.speechRecognition = this;
          this.onresult({ results: [Object.assign([{ transcript: "Temporary guess" }], { isFinal: false })] });
        }
        stop() { this.onend(); }
        abort() {}
      };
    });
    let turns = 0;
    await page.route("**/api/**", (route) => {
      const path = new URL(route.request().url()).pathname;
      let body;
      if (path === "/api/me") {
        body = { user: { _id: "speech-test", username: "speech-test", fullName: "Speech test", role: "employee", desiredJob: "Developer" } };
      } else if (path === "/api/ai/interview/turn") {
        turns++;
        body = { result: { message: "Interview question", questionNumber: 1 } };
      } else if (path.includes("unread-count")) {
        body = { count: 0 };
      } else {
        body = { notifications: [], jobs: [], resumes: [], items: [] };
      }
      return route.fulfill({ contentType: "application/json", body: JSON.stringify(body) });
    });
    await page.goto("/ai-interview");
    await page.getByRole("textbox", { name: "Vị trí ứng tuyển" }).fill("Developer");
    await page.getByRole("button", { name: "Bắt đầu phỏng vấn", exact: true }).click();
    const mic = page.getByRole("button", { name: "Trả lời bằng mic", exact: true });
    await expect(mic).toBeVisible();
    await expect(page.locator("#interview-microphone")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Tải danh sách mic" })).toHaveCount(0);
    const answer = page.getByRole("textbox", { name: "Câu trả lời phỏng vấn" });
    await answer.fill("Draft");
    await mic.click();
    await expect(answer).toHaveValue("Draft");
    await expect(page.getByText("Temporary guess", { exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`interview-interim-${width}.png`), fullPage: true });
    await page.evaluate(() => window.speechRecognition.onresult({
      results: [Object.assign([{ transcript: "Browser microphone draft" }], { isFinal: true })],
    }));
    await expect(answer).toHaveValue("Draft Browser microphone draft");
    await expect(page.getByText("Temporary guess", { exact: true })).toHaveCount(0);
    expect(await page.evaluate(() => window.speechStarts)).toEqual([0]);
    await page.getByRole("button", { name: "Dừng mic", exact: true }).click();
    await expect(mic).toBeVisible();
    expect(turns).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`interview-${width}.png`), fullPage: true });
  });
}
