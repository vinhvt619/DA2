import test from "node:test";
import assert from "node:assert/strict";
import { createInterviewSpeech, speechErrorMessage, speechSupport } from "../src/utils/interviewSpeech.js";

function setup(t) {
  const instances = [];
  class Recognition {
    constructor() { instances.push(this); }
    start(...args) { this.startArgs = args; this.onstart(); }
    stop() { this.stopped = true; this.onend(); }
    abort() { this.aborted = true; }
  }
  const texts = [];
  const statuses = [];
  const errors = [];
  const interim = [];
  const speech = createInterviewSpeech({
    Recognition,
    onText: (text) => texts.push(text),
    onStatus: (status) => statuses.push(status),
    onError: (error) => errors.push(error),
    onInterim: (text) => interim.push(text),
  });
  t.after(() => speech.destroy());
  return { speech, instances, texts, statuses, errors, interim };
}

const result = (transcript, isFinal = true) => Object.assign([{ transcript }], { isFinal });

test("interview speech starts with the browser microphone and preserves draft text", (t) => {
  const { speech, instances, texts, statuses } = setup(t);
  assert.equal(speech.start("Existing draft"), true);
  const recognition = instances[0];
  assert.deepEqual(recognition.startArgs, []);
  assert.equal(recognition.lang, "vi-VN");
  assert.equal(speech.start(), false);
  recognition.onresult({ results: [result("first", false)] });
  assert.deepEqual(texts, []);
  recognition.onresult({ results: [result("first revision")] });
  assert.deepEqual(texts, ["Existing draft first revision"]);
  speech.stop();
  assert.equal(recognition.stopped, true);
  assert.deepEqual(statuses, ["starting", "listening", "stopping", "idle"]);
  assert.equal(speech.start(texts.at(-1)), true);
});

test("interview speech keeps the draft when microphone permission is denied", (t) => {
  const { speech, instances, texts, errors, statuses } = setup(t);
  speech.start("Existing draft");
  instances[0].onerror({ error: "not-allowed" });
  assert.deepEqual(texts, []);
  assert.deepEqual(errors, [speechErrorMessage("not-allowed")]);
  assert.equal(instances[0].aborted, true);
  assert.equal(statuses.at(-1), "idle");
});

test("interview speech stops at the answer limit and releases on destroy", (t) => {
  const { speech, instances, texts, errors } = setup(t);
  assert.equal(speech.start("a".repeat(1200)), false);
  assert.equal(instances.length, 0);
  speech.start("a".repeat(1197));
  instances[0].onresult({ results: [result("hello")] });
  assert.equal(texts.at(-1).length, 1200);
  assert.equal(instances[0].stopped, true);
  assert.equal(errors.length, 2);
  speech.start();
  speech.destroy();
  assert.equal(instances[1].aborted, true);
  assert.equal(instances[1].onresult, null);
  assert.equal(speech.start(), false);
});

test("interview speech falls back to typing on unsupported browsers", () => {
  const Recognition = function () {};
  assert.equal(speechSupport({ isSecureContext: true, webkitSpeechRecognition: Recognition }).Recognition, Recognition);
  assert.equal(speechSupport({ isSecureContext: false, SpeechRecognition: Recognition }).Recognition, undefined);
  assert.equal(speechSupport({ isSecureContext: true }).Recognition, undefined);
});

test("interim revisions and disappearing guesses never overwrite final answer text", (t) => {
  const { speech, instances, texts, interim, errors } = setup(t);
  speech.start("Draft");
  const recognition = instances[0];
  recognition.onresult({ results: [result("first sentence"), result("wrong guess", false)] });
  assert.equal(texts.at(-1), "Draft first sentence");
  assert.equal(interim.at(-1), "wrong guess");
  recognition.onresult({ results: [result("first sentence"), result("revised guess", false)] });
  assert.equal(texts.length, 1);
  recognition.onresult({ results: [result("first sentence")] });
  assert.equal(interim.at(-1), "");
  recognition.onresult({ results: [result("first sentence"), result("second sentence")] });
  assert.deepEqual(texts, ["Draft first sentence", "Draft first sentence second sentence"]);
  speech.stop();
  assert.deepEqual(errors, []);
});

test("a long interim guess does not prematurely stop the microphone", (t) => {
  const { speech, instances, texts, errors } = setup(t);
  speech.start();
  const recognition = instances[0];
  recognition.onresult({ results: [result("a".repeat(1300), false)] });
  assert.equal(recognition.stopped, undefined);
  assert.deepEqual(texts, []);
  recognition.onresult({ results: [result("short final sentence")] });
  speech.stop();
  assert.deepEqual(texts, ["short final sentence"]);
  assert.deepEqual(errors, []);
});

test("unfinished speech is not saved as a final answer and prompts the user to repeat", (t) => {
  const { speech, instances, texts, interim, errors } = setup(t);
  speech.start("Draft");
  instances[0].onresult({ results: [result("unconfirmed guess", false)] });
  speech.stop();
  assert.deepEqual(texts, []);
  assert.equal(interim.at(-1), "");
  assert.equal(errors.length, 1);
  assert.match(errors[0], /chưa được nhận dạng hoàn tất/);
});

test("stopping still accepts the browser's last finalized result", (t) => {
  const { speech, instances, texts, errors } = setup(t);
  speech.start("Draft");
  const recognition = instances[0];
  recognition.onresult({ results: [result("partial", false)] });
  recognition.stop = () => {
    recognition.onresult({ results: [result("completed sentence")] });
    recognition.onend();
  };
  speech.stop();
  assert.deepEqual(texts, ["Draft completed sentence"]);
  assert.deepEqual(errors, []);
});
