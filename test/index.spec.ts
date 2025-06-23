import { describe, it, expect, vi } from "vitest";
import worker from "../src/index";

const env = {
  X_API_KEY: "dummy-key",
  BASE_URL: "https://dummy-url.com",
};

describe("/event endpoint", () => {
  it("should return 400 for invalid JSON", async () => {
    const req = new Request("http://localhost/event", { method: "POST", body: "not-json" });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(400);
    expect(await res.text()).toBe("Invalid JSON");
  });

  it("should return 200 and status 'received' if data is incomplete", async () => {
    const req = new Request("http://localhost/event", {
      method: "POST",
      body: JSON.stringify({ payload: {} }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("received");
  });

  it("should call external API and return status 'sent' if data is complete", async () => {
    // Mock fetch
    globalThis.fetch = vi.fn().mockResolvedValue({
      text: async () => "ok",
      ok: true,
    });
    const req = new Request("http://localhost/event", {
      method: "POST",
      body: JSON.stringify({
        payload: {
          from: "12345",
          body: "hello",
          participant: "anyone",
          id: "msgid",
        },
        session: "mysession",
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("sent");
    expect(json.sent).toMatchObject({
      chatId: "12345",
      text: "hello",
      reply_to: "msgid",
      session: "mysession",
    });
    expect(json.apiResult).toBe("ok");
  });
});
