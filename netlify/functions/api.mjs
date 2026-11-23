import { getStore } from "@netlify/blobs";

const MAX_ITEMS = 200;
const MAX_NAME = 80;
const MAX_HISTORY = 20;

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const safeEqual = (a, b) => {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

const newList = () => ({ id: crypto.randomUUID(), createdAt: Date.now(), items: [] });
const newState = () => ({ current: newList(), history: [] });

function apply(state, body) {
  const { current } = state;
  switch (body.type) {
    case "add": {
      const name = String(body.name ?? "").trim().slice(0, MAX_NAME);
      if (!name || current.items.length >= MAX_ITEMS) break;
      const dup = current.items.some((i) => !i.done && i.name.toLowerCase() === name.toLowerCase());
      if (!dup) current.items.push({ id: crypto.randomUUID(), name, done: false });
      break;
    }
    case "toggle": {
      const item = current.items.find((i) => i.id === body.id);
      if (item) item.done = !item.done;
      break;
    }
    case "remove":
      current.items = current.items.filter((i) => i.id !== body.id);
      break;
    case "finish": {
      if (current.items.length === 0) break;
      state.history.unshift({ ...current, finishedAt: Date.now() });
      state.history = state.history.slice(0, MAX_HISTORY);
      state.current = newList();
      break;
    }
    case "reopen": {
      // Undo an accidental "finish": only possible while the new list is still empty.
      if (current.items.length === 0 && state.history.length > 0) {
        const { finishedAt, ...last } = state.history.shift();
        state.current = last;
      }
      break;
    }
    default:
      return false;
  }
  return true;
}

export default async (req) => {
  const password = Netlify.env.get("APP_PASSWORD");
  if (!password) return json({ error: "APP_PASSWORD is not configured on the server" }, 500);

  if (!safeEqual(req.headers.get("x-password") ?? "", password)) {
    await new Promise((r) => setTimeout(r, 600)); // slow down brute force
    return json({ error: "unauthorized" }, 401);
  }

  const store = getStore("grocery");
  const state = (await store.get("state", { type: "json" })) ?? newState();

  if (req.method === "GET") return json(state);

  if (req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch {
      return json({ error: "invalid JSON" }, 400);
    }
    if (!apply(state, body ?? {})) return json({ error: "unknown action" }, 400);
    await store.setJSON("state", state);
    return json(state);
  }

  return json({ error: "method not allowed" }, 405);
};

export const config = { path: "/api/state" };
