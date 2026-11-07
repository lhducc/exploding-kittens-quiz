import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
import { NextRequest, NextResponse } from "next/server";
import { isRoomPin, letters } from "../../../lib/game-view.ts";
import type { GameAction, JoinAction, Letter } from "../../../lib/game-view.ts";
import { parseProfiles } from "../../../lib/server/deck.ts";
import { applyAction, completedScore, gameView, newGame } from "../../../lib/server/game.ts";
import { allowPinAttempt, joinGame, newSession, readGame, readRanking, saveGame } from "../../../lib/server/store.ts";
import type { SavedGame } from "../../../lib/server/store.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cookieName = "quiz_session";
const bareActions = ["enterDraw", "draw", "stop", "continue", "fiftyFifty", "toggleDefuse", "peek", "double", "replay"] as const;

type Command = JoinAction | (GameAction & { expectedVersion: number });

function parseCommand(body: unknown): Command | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const { action, expectedVersion, questionId, choice, name, pin } = body as Record<string, unknown>;
  const count = Object.keys(body).length;

  if (action === "join") {
    if (count !== 3 || typeof name !== "string" || !isRoomPin(pin)) return null;
    const cleanName = name.normalize("NFKC").trim().replace(/\s+/gu, " ");
    if (!/^[\p{L}\p{N}][\p{L}\p{M}\p{N} ._'’-]{1,23}$/u.test(cleanName)) return null;
    return { action, name: cleanName, pin };
  }
  if (typeof expectedVersion !== "number" || !Number.isSafeInteger(expectedVersion) || expectedVersion < 1) return null;

  if (action === "select" && count === 3 && typeof questionId === "string" && /^(0[1-9]|10)$/.test(questionId)) {
    return { action, expectedVersion, questionId };
  }
  if (action === "answer" && count === 3 && letters.includes(choice as Letter)) {
    return { action, expectedVersion, choice: choice as Letter };
  }
  const bareAction = bareActions.find(name => name === action);
  return count === 2 && bareAction ? { action: bareAction, expectedVersion } : null;
}

function session(request: NextRequest) {
  const token = request.cookies.get(cookieName)?.value;
  return token && /^[\w-]{43}$/.test(token) ? token : null;
}

function json(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function view(saved: SavedGame | null) {
  return saved?.name
    ? { game: gameView(saved.state, saved.version), player: { name: saved.name, bestScore: saved.bestScore } }
    : { game: null, player: null };
}

function unavailable(error: unknown) {
  const detail = error instanceof Error && /^(QUIZ_DRAW_PROFILES|ROOM_PIN)/.test(error.message)
    ? error.message : "Không thể đọc hoặc lưu phiên chơi.";
  console.error(detail);
  return json({ error: "Game tạm thời chưa kết nối được. Thử lại nhé." }, 503);
}

export async function GET(request: NextRequest) {
  try {
    const token = session(request);
    const saved = token ? await readGame(token) : null;
    const rank = request.nextUrl.searchParams.get("rank");
    if (rank === null) return json(view(saved));
    if (!saved?.name) return json({ error: "Hãy nhập tên và PIN để xem bảng xếp hạng." }, 401);
    if (!/^[1-9]\d{0,3}$/.test(rank)) return json({ error: "Trang xếp hạng không hợp lệ." }, 400);
    const through = request.nextUrl.searchParams.get("through");
    let cutoff: Date | null = null;
    if (through !== null) {
      if (!/^[1-9]\d{3}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(through)) {
        return json({ error: "Mốc giờ Việt Nam không hợp lệ." }, 400);
      }
      const timestamp = through.length === 16 ? through + ":00" : through;
      const clock = new Date(timestamp + "Z");
      if (!Number.isFinite(clock.getTime()) || clock.toISOString().slice(0, 19) !== timestamp) {
        return json({ error: "Mốc giờ Việt Nam không hợp lệ." }, 400);
      }
      cutoff = new Date(clock.getTime() - 7 * 60 * 60 * 1000);
    }
    return json({ ranking: await readRanking(Number(rank), cutoff) });
  } catch (error) {
    return unavailable(error);
  }
}

async function join(request: NextRequest, command: JoinAction, token: string | null, saved: SavedGame | null, secure: boolean) {
  if (saved?.name) return json(view(saved));
  const pin = process.env.ROOM_PIN;
  if (!isRoomPin(pin)) throw new Error("ROOM_PIN cần đúng 6 ký tự A–Z, a–z hoặc 0–9.");
  const valid = timingSafeEqual(Buffer.from(command.pin), Buffer.from(pin));
  const forwarded = process.env.VERCEL === "1" ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim() : null;
  const address = forwarded && isIP(forwarded) ? forwarded : "local-or-unknown";
  const key = createHmac("sha256", pin).update(address).digest("hex");
  if (!await allowPinAttempt(key, !valid)) return json({ error: "Bạn thử PIN quá nhiều lần. Chờ khoảng một phút rồi thử lại nhé." }, 429);
  if (!valid) return json({ error: "PIN phòng chưa đúng. Kiểm tra lại mã nhóm đã gửi nhé." }, 401);

  const freshToken = saved && token ? token : newSession();
  const state = saved?.state ?? newGame(parseProfiles(process.env.QUIZ_DRAW_PROFILES));
  let player: SavedGame | null;
  try {
    player = await joinGame(freshToken, command.name, command.name.toLowerCase(), state, completedScore(state));
  } catch (error) {
    if ((error as { constraint?: string }).constraint === "game_sessions_player_key_unique") {
      return json({ error: "Tên này đã được dùng. Hãy thêm tên đệm hoặc một biệt danh riêng." }, 409);
    }
    throw error;
  }
  const response = json(view(player ?? await readGame(freshToken)));
  response.cookies.set(cookieName, freshToken, {
    httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 7 * 24 * 60 * 60,
  });
  return response;
}

export async function POST(request: NextRequest) {
  const host = request.headers.get("host");
  const scheme = process.env.VERCEL === "1" ? "https:" : request.nextUrl.protocol;
  if (!host || request.headers.get("origin") !== scheme + "//" + host) {
    return json({ error: "Yêu cầu phải đến từ trang game." }, 403);
  }
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
    return json({ error: "Dữ liệu thao tác không hợp lệ." }, 400);
  }

  let command: Command | null;
  try {
    const input = await request.text();
    command = input.length <= 1024 ? parseCommand(JSON.parse(input)) : null;
  } catch {
    command = null;
  }
  if (!command) return json({ error: "Dữ liệu thao tác không hợp lệ." }, 400);

  try {
    const token = session(request);
    const saved = token ? await readGame(token) : null;
    if (command.action === "join") return await join(request, command, token, saved, scheme === "https:");

    if (!token || !saved?.name) return json({ error: "Hãy nhập tên và PIN để vào chơi." }, 401);
    const conflict = (latest: SavedGame | null) => json({
      ...view(latest), error: "Ván đã thay đổi hoặc thao tác chưa khả dụng.",
    }, 409);
    if (saved.version !== command.expectedVersion) return conflict(saved);
    const updated = command.action === "replay"
      ? saved.state.screen === "results" && newGame(parseProfiles(process.env.QUIZ_DRAW_PROFILES))
      : applyAction(saved.state, command);
    if (!updated) return conflict(saved);
    const finishedScore = completedScore(saved.state) === null ? completedScore(updated) : null;
    const committed = await saveGame(token, saved.version, updated, finishedScore);
    return committed ? json(view(committed)) : conflict(await readGame(token));
  } catch (error) {
    return unavailable(error);
  }
}
