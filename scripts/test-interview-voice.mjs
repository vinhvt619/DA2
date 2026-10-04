import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, expect } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL || "http://127.0.0.1:4000";
const output = resolve("logs/interview-voice-qa");
const source = "https://huggingface.co/datasets/google/fleurs";
const trackInput = process.env.VOICE_QA_TRACK === "1";
const rowsURL = "https://datasets-server.huggingface.co/rows?dataset=google%2Ffleurs&config=vi_vn&split=validation&offset=1&length=2";
await mkdir(output, { recursive: true });

async function download(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error(`Download failed (${response.status}): ${url.split("?")[0]}`);
  return response;
}

function wordErrorRate(reference, actual) {
  const words = (text) => text.normalize("NFC").toLocaleLowerCase("vi-VN")
    .replace(/[^\p{L}\p{N}\s]/gu, " ").trim().split(/\s+/u).filter(Boolean);
  const expected = words(reference);
  const received = words(actual);
  let row = Array.from({ length: received.length + 1 }, (_, index) => index);
  for (let i = 1; i <= expected.length; i++) {
    const next = [i];
    for (let j = 1; j <= received.length; j++) {
      next[j] = Math.min(next[j - 1] + 1, row[j] + 1, row[j - 1] + Number(expected[i - 1] !== received[j - 1]));
    }
    row = next;
  }
  return row[received.length] / Math.max(1, expected.length);
}

// Decode with the browser, then create PCM16 WAV with silence around the clip.
async function prepareAudio(sourcePath, targetPath) {
  const browser = await chromium.launch({ channel: "chrome" });
  try {
    const page = await browser.newPage();
    const bytes = await readFile(sourcePath);
    const samples = await page.evaluate(async (base64) => {
      const input = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
      const context = new AudioContext();
      try {
        const decoded = await context.decodeAudioData(input.buffer);
        const offline = new OfflineAudioContext(1, Math.ceil((decoded.duration + 6) * 48000), 48000);
        const audio = offline.createBufferSource();
        audio.buffer = decoded;
        audio.connect(offline.destination);
        audio.start(2);
        const rendered = await offline.startRendering();
        return Array.from(rendered.getChannelData(0), (value) => Math.round(Math.max(-1, Math.min(1, value)) * 32767));
      } finally {
        await context.close();
      }
    }, bytes.toString("base64"));
    const wav = Buffer.alloc(44 + samples.length * 2);
    wav.write("RIFF", 0);
    wav.writeUInt32LE(wav.length - 8, 4);
    wav.write("WAVEfmt ", 8);
    wav.writeUInt32LE(16, 16);
    wav.writeUInt16LE(1, 20);
    wav.writeUInt16LE(1, 22);
    wav.writeUInt32LE(48000, 24);
    wav.writeUInt32LE(96000, 28);
    wav.writeUInt16LE(2, 32);
    wav.writeUInt16LE(16, 34);
    wav.write("data", 36);
    wav.writeUInt32LE(samples.length * 2, 40);
    samples.forEach((value, index) => wav.writeInt16LE(value, 44 + index * 2));
    await writeFile(targetPath, wav);
    return samples.length / 48000;
  } finally {
    await browser.close();
  }
}

async function recognize(row, audioPath, duration) {
  const browser = await chromium.launch({
    channel: "chrome",
    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream", `--use-file-for-fake-audio-capture=${audioPath}%noloop`],
  });
  try {
    const context = await browser.newContext({ permissions: ["microphone"], viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.addInitScript((useTrack) => {
      window.voiceEvents = [];
      const NativeRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!NativeRecognition) return;
      window.SpeechRecognition = class extends NativeRecognition {
        start() {
          if (!useTrack) return super.start();
          navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }).then((stream) => {
            this.addEventListener("end", () => stream.getTracks().forEach((track) => track.stop()), { once: true });
            super.start(stream.getAudioTracks()[0]);
          }).catch((error) => window.voiceEvents.push({ type: "error", error: error.message }));
        }
        constructor() {
          super();
          for (const type of ["start", "audiostart", "soundstart", "speechstart", "speechend", "audioend", "error", "end", "result"]) {
            this.addEventListener(type, (event) => {
              window.voiceEvents.push({
                type, time: performance.now(), error: event.error,
                results: event.results ? Array.from(event.results, (item) => ({ text: item[0]?.transcript, final: item.isFinal, confidence: item[0]?.confidence })) : undefined,
              });
            });
          }
        }
      };
    }, trackInput);
    await page.route("**/api/**", (route) => {
      const path = new URL(route.request().url()).pathname;
      const body = path === "/api/me"
        ? { user: { _id: "voice-qa", username: "voice-qa", fullName: "Voice QA", role: "employee" } }
        : path === "/api/ai/interview/turn"
          ? { result: { message: "Hãy trình bày nội dung đoạn ghi âm.", questionNumber: 1 } }
          : { count: 0, notifications: [], jobs: [], items: [] };
      return route.fulfill({ contentType: "application/json", body: JSON.stringify(body) });
    });
    await page.goto(`${baseURL}/ai-interview`);
    await page.getByRole("textbox", { name: "Vị trí ứng tuyển" }).fill("Voice QA");
    await page.getByRole("button", { name: "Bắt đầu phỏng vấn", exact: true }).click();
    const mic = page.getByRole("button", { name: "Trả lời bằng mic", exact: true });
    await expect(mic).toBeEnabled();
    await mic.click();
    await page.waitForFunction(() => window.voiceEvents.some((event) => event.type === "end"), null, { timeout: Math.max(35000, (duration + 12) * 1000) }).catch(() => {});
    const stop = page.getByRole("button", { name: "Dừng mic", exact: true });
    if (await stop.isVisible() && await stop.isEnabled()) {
      await stop.click();
      await expect(mic).toBeVisible({ timeout: 7000 });
    }
    const actual = await page.getByRole("textbox", { name: "Câu trả lời phỏng vấn" }).inputValue();
    const events = await page.evaluate(() => window.voiceEvents);
    const microphone = await page.evaluate(async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      const audio = new AudioContext();
      try {
        await audio.resume();
        const analyser = audio.createAnalyser();
        audio.createMediaStreamSource(stream).connect(analyser);
        const samples = new Float32Array(analyser.fftSize);
        let peak = 0;
        const deadline = performance.now() + 8000;
        while (performance.now() < deadline) {
          analyser.getFloatTimeDomainData(samples);
          for (const value of samples) peak = Math.max(peak, Math.abs(value));
          await new Promise((done) => setTimeout(done, 50));
        }
        return { peak, track: stream.getAudioTracks()[0].label, settings: stream.getAudioTracks()[0].getSettings() };
      } finally {
        stream.getTracks().forEach((track) => track.stop());
        await audio.close();
      }
    });
    await page.screenshot({ path: resolve(output, `sample-${row.row_idx}.png`), fullPage: true });
    return {
      sample: row.row_idx, reference: row.row.raw_transcription, actual,
      wordErrorRate: actual ? wordErrorRate(row.row.transcription, actual) : null,
      status: events.some((event) => event.type === "error") ? "recognition-error" : actual ? "transcribed" : "no-final-transcript",
      events, microphone,
    };
  } finally {
    await browser.close();
  }
}

const dataset = process.env.VOICE_QA_CACHED === "1"
  ? { rows: JSON.parse(await readFile(resolve(output, "report.json"), "utf8")).results.map((item) => ({ row_idx: item.sample, row: { transcription: item.reference, raw_transcription: item.reference } })) }
  : await (await download(rowsURL)).json();
const report = { source, license: "CC-BY-4.0", language: "vi-VN", browser: "Installed Google Chrome", inputMode: trackInput ? "explicit-default-audio-track (diagnostic only, not app default)" : "app-default-microphone", createdAt: new Date().toISOString(), results: [] };
for (const row of dataset.rows) {
  console.log(`Testing Vietnamese sample ${row.row_idx}...`);
  const sourcePath = resolve(output, `source-${row.row_idx}.wav`);
  const inputPath = resolve(output, `microphone-${row.row_idx}.wav`);
  if (process.env.VOICE_QA_CACHED !== "1") await writeFile(sourcePath, Buffer.from(await (await download(row.row.audio[0].src)).arrayBuffer()));
  const duration = await prepareAudio(sourcePath, inputPath);
  report.results.push(await recognize(row, inputPath, duration));
  await writeFile(resolve(output, trackInput ? "report-track.json" : "report.json"), JSON.stringify(report, null, 2));
  const result = report.results.at(-1);
  console.log(JSON.stringify({ sample: result.sample, status: result.status, actual: result.actual, wordErrorRate: result.wordErrorRate, microphonePeak: result.microphone.peak }, null, 2));
}
console.log(`Report: ${resolve(output, trackInput ? "report-track.json" : "report.json")}`);
