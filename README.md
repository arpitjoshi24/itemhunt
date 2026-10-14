# Huntio

**Find it. Show it. Win it.**

Huntio is a Skribbl-style party game, but instead of drawing, players hunt for real objects. Friends join a room with a Room ID and turn on their camera. The game shows a prompt such as **Find a bottle**. Everyone searches their own room, shows the object to their camera, and an AI model (YOLO) detects it in the browser. The fastest players earn the most points, and a leaderboard updates after every round.

No login, no database, and camera images never leave the player's device.

---

## Contents

1. [How the game works](#how-the-game-works)
2. [Tech stack](#tech-stack)
3. [Architecture](#architecture)
4. [Project structure](#project-structure)
5. [Getting started](#getting-started)
6. [Environment variables](#environment-variables)
7. [Playing on phones (HTTPS tunnels)](#playing-on-phones-https-tunnels)
8. [API reference](#api-reference)
9. [Detection and tuning](#detection-and-tuning)
10. [Known limitations](#known-limitations)
11. [Roadmap](#roadmap)

---

## How the game works

1. **Home:** enter a name, then create a room or join one with a 6-character Room ID.
2. **Lobby:** everyone turns on their camera and clicks **I'm ready**. The AI model loads here, so rounds start instantly.
3. **Countdown:** when at least 2 players are all ready, a 10-second countdown starts. Un-readying or leaving cancels it.
4. **Rounds:** 5 rounds of 60 seconds each. The item to find is shown at the top of the screen.
5. **Detection:** the AI in your browser decides when you have shown the item. There is no voting.
6. **Results:** after each round a results popup shows who found it, and the leaderboard updates. After round 5 everyone sees the final podium, with **Play again** (host only) and **Leave room**.

### Rules

| Topic | Rule |
|---|---|
| Players | 2 to 8 per room |
| Round length | 60 seconds. The round ends early if every player has found the item |
| Scoring | 1st 100, 2nd 80, 3rd 60, 4th 40, everyone else 20 |
| Speed bonus | 0 to 20 extra points, based on time left in the round |
| Ties | Higher score first, then lower total solve time |
| Host | The room creator. If the host leaves, the next player becomes host |
| Joining | Only while the room is in the lobby. The room locks once the countdown starts |
| Leaving mid-game | The player is removed and their score stays on the leaderboard |
| Item repeats | An item never repeats within one game |

### Item pool (from YOLO's 80 classes)

- **Easy:** bottle, cup, book, remote, keyboard, mouse, clock, backpack, spoon, fork, bowl
- **Medium:** toothbrush, umbrella, vase, potted plant, teddy bear, handbag, tie, scissors, sports ball, laptop

---

## Tech stack

**Frontend (`itemhunt/`)**

| Technology | Purpose |
|---|---|
| Next.js 16 (App Router) + TypeScript | Pages and routing |
| Tailwind CSS | Styling |
| socket.io-client | Realtime connection to the server |
| Zustand | Shared room and game state |
| `getUserMedia` | Camera access |
| onnxruntime-web | Runs the YOLO model in the browser (WASM) |
| YOLO11n (`.onnx`) | Object detection, 80 COCO classes |

**Backend (`huntio-server/`)**

| Technology | Purpose |
|---|---|
| Node.js + Express | HTTP server and REST routes |
| Socket.IO | Rooms and realtime events |
| In-memory `Map` | Rooms, players and scores (lost on restart) |
| TypeScript + tsx | Language and dev runner |

---

## Architecture

```
Player's browser                                   Server
+-----------------------------------+              +-----------------------------------+
| Next.js UI + Zustand store        |              | Express + Socket.IO               |
| Camera -> YOLO (onnxruntime-web)  | -- socket -> | RoomManager -> GameEngine         |
| "found: bottle" ----------------> |  round:found | Scoring, ItemPicker, timers       |
+-----------------------------------+              | In-memory Map<roomId, Room>       |
                                                   +-----------------------------------+
```

**Core principle: the server is the authority, the browser is only a reporter.** The browser says "I saw a bottle". The server decides whether it counts: right item, round still open, first time this player found it, and what rank and points they get. The server also owns the timers and sends `endsAt`; the browser only displays the countdown.

### Server state machine

```
LOBBY --all ready--> COUNTDOWN (10s) --> ROUND (60s) --> RESULTS (5s) --> next round
  ^                       |                                   |
  |                       '--> back to LOBBY (cancel)         '-- after round 5 --> FINISHED
  '----------------------------- Play again -------------------------------------------'
```

---

## Project structure

```
itemhunt/                          Frontend (Next.js)
|-- app/
|   |-- layout.tsx                 Root layout, mounts SocketProvider
|   |-- page.tsx                   Home: create / join room
|   |-- lobby/[roomId]/page.tsx    Lobby: players, camera, Ready, countdown
|   |-- game/[roomId]/page.tsx     Game: item, timer, camera, leaderboard
|   '-- results/[roomId]/page.tsx  Final podium, Play again / Leave
|-- components/
|   |-- SocketProvider.tsx         Mounts the socket hook once for all pages
|   |-- lobby/                     PlayerList, ReadyButton, Countdown
|   |-- game/                      ItemBanner, Timer, CameraView, FoundToast, RoundResultModal
|   '-- leaderboard/               Leaderboard, Podium
|-- hooks/
|   |-- useGameSocket.ts           Listens to all server events, writes to the store
|   |-- useCamera.ts               getUserMedia stream
|   '-- useDetector.ts             Model loading status + detection loop
|-- services/
|   |-- socket.ts                  socket.io client singleton
|   |-- api.ts                     GET /api/rooms/:roomId
|   '-- detector/                  yolo.ts, postprocess.ts, labels.ts, aliases.ts
|-- store/gameStore.ts             Zustand store
|-- types/game.ts                  Shared types
|-- utils/                         constants.ts, time.ts
|-- scripts/copy-ort.mjs           Copies ONNX Runtime WASM files to public/ort
'-- public/
    |-- models/yolo11n.onnx        Detection model
    '-- ort/                       WASM files (generated by the script above)

huntio-server/                     Backend (Node + Express + Socket.IO)
|-- src/
|   |-- index.ts                   Server bootstrap, CORS
|   |-- constants.ts               Timers, player limits, room ID format
|   |-- types.ts                   Player, Room, RoundState
|   |-- socket/                    roomHandlers.ts, gameHandlers.ts
|   |-- game/                      RoomManager, GameEngine, scoring, itemPicker
|   |-- routes/rooms.ts            GET /health, GET /api/rooms/:roomId
|   '-- data/items.ts              Item pool
|-- .env
'-- package.json
```

---

## Getting started

### Prerequisites

- Node.js 20.9 or newer
- A webcam (or a phone)
- Python is only needed once, to export the YOLO model

### 1. Export the YOLO model (one time)

```bash
pip install ultralytics
yolo export model=yolo11n.pt format=onnx imgsz=640
```

Copy the resulting `yolo11n.onnx` (about 10 MB) into `itemhunt/public/models/`.

### 2. Start the server

```bash
cd huntio-server
npm install
```

Create `huntio-server/.env`:

```
PORT=4000
CLIENT_URL=http://localhost:3000
```

```bash
npm run dev
```

Check `http://localhost:4000/health`. It should return `{"ok":true}`.

### 3. Start the frontend

```bash
cd itemhunt
npm install
```

Create `itemhunt/.env.local`:

```
NEXT_PUBLIC_SERVER_URL=http://localhost:4000
```

`npm install` also runs `scripts/copy-ort.mjs` (via `postinstall`), which copies the ONNX Runtime WASM files into `public/ort/`. If that folder is empty, run it manually:

```bash
node scripts/copy-ort.mjs
```

Then:

```bash
npm run dev
```

### 4. Play

Open `http://localhost:3000` in two browser windows (use a normal and an incognito window so each gets a camera). Create a room in one, join it from the other with the Room ID, ready up, and hunt.

---

## Environment variables

**`huntio-server/.env`**

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | Port the server listens on |
| `CLIENT_URL` | `http://localhost:3000` | Allowed frontend origin(s), comma-separated. Any `https://*.trycloudflare.com` origin is also allowed |

**`itemhunt/.env.local`**

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_SERVER_URL` | `http://localhost:4000` | Public URL of the server |

Next.js reads env files at startup, so restart `npm run dev` after changing them.

---

## Playing on phones (HTTPS tunnels)

Phone browsers only allow the camera on HTTPS pages, so `http://<your-ip>:3000` will not work. Use two free Cloudflare quick tunnels, one for the frontend and one for the server.

1. Install cloudflared (Windows): `winget install --id Cloudflare.cloudflared`, then reopen your terminal.
2. In two separate terminals, start the tunnels and leave them running:

   ```bash
   cloudflared tunnel --url http://localhost:4000   # server
   cloudflared tunnel --url http://localhost:3000   # frontend
   ```

3. Put the **server** link in `itemhunt/.env.local`:

   ```
   NEXT_PUBLIC_SERVER_URL=https://<server-link>.trycloudflare.com
   ```

4. Make sure `itemhunt/next.config.ts` allows the tunnel domain:

   ```ts
   const nextConfig: NextConfig = {
     allowedDevOrigins: ["*.trycloudflare.com"],
   };
   ```

5. Restart `npm run dev` in `itemhunt`. The server accepts tunnel origins automatically.
6. Open the **frontend** link on your phone and laptop, then create and join a room.

Notes:

- The links change every time you restart `cloudflared`, so repeat steps 3 and 5 when they do.
- Your computer must stay on and online while people play. Anyone with the links can reach your dev machine, so close the tunnels when you are done.
- For stable links, deploy the frontend (for example Vercel) and the server (for example Render or Railway).

---

## API reference

### REST

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Checks that the server is running |
| GET | `/api/rooms/:roomId` | Returns `{ exists, full, started }`. Used by the Home page before joining |

### Socket events: client to server

| Event | Data | Description |
|---|---|---|
| `room:create` | `{ nickname }` | Creates a room. Replies with an ack `{ ok, roomId, playerId }` |
| `room:join` | `{ roomId, nickname }` | Joins a room. Replies with the same ack, or `{ ok: false, error }` |
| `room:leave` | none | Leaves the room |
| `room:sync` | ack callback | Returns the current room state. Used when the Lobby page mounts |
| `time:sync` | ack callback | Returns server time, used to correct clock differences |
| `player:ready` | `{ ready }` | Marks the player ready or not ready |
| `round:found` | `{ label, confidence }` | Browser reports a detected item. The server validates it |
| `game:playAgain` | none | Host only. Resets scores and returns everyone to the lobby |

### Socket events: server to client

| Event | Data | When it fires |
|---|---|---|
| `room:updated` | `{ roomId, players[], status }` | A player joins, leaves or changes ready state |
| `countdown:start` | `{ startsAt, seconds }` | Everyone is ready |
| `countdown:cancel` | none | Someone un-readies or leaves during the countdown |
| `game:started` | `{ totalRounds }` | The countdown ended; moves everyone to the Game page |
| `round:start` | `{ round, totalRounds, item, endsAt }` | A new round begins |
| `round:playerFound` | `{ playerId, nickname, points, rank }` | A player found the item |
| `round:end` | `{ round, results[], scores[] }` | Timer ended or everyone found it |
| `leaderboard:update` | `{ scores[] }` | After each round |
| `game:over` | `{ finalLeaderboard[] }` | After round 5; moves everyone to Results |
| `room:reset` | `{ players[] }` | After Play again; back to the lobby |
| `error` | `{ message }` | A rejected action |

### Rules the server enforces

- The server owns the timer and sends `endsAt`.
- One find per player per round. Repeats are ignored.
- Submissions after `endsAt` score nothing.
- A label that does not match the current item scores nothing.
- Only the host can use `game:playAgain`.

---

## Detection and tuning

### Pipeline (in the browser)

```
Camera frame -> 640x640 letterboxed canvas -> float32 tensor [1,3,640,640]
  -> onnxruntime-web (WASM) -> output [1,84,8400]
  -> decode boxes + class scores -> NMS
  -> keep target label (or a look-alike) with confidence >= threshold
  -> confirmed in N frames in a row -> emit round:found
```

Detection runs about every 350 ms, only while a round is active and the player has not yet found the item.

### Settings (`itemhunt/utils/constants.ts`)

| Constant | Default | Effect |
|---|---|---|
| `DETECTION_THRESHOLD` | `0.55` | Minimum confidence. Lower is more forgiving but allows false matches |
| `CONFIRM_FRAMES` | `3` | Frames in a row needed. Lower is faster on slow phones |
| `DETECT_INTERVAL_MS` | `350` | Minimum gap between detections |

### Look-alike labels

YOLO sometimes confuses similar objects, for example a black wireless mouse is often labeled "remote". `services/detector/aliases.ts` maps each requested item to the labels that count as a match. Add entries there if an item is regularly mislabeled.

### Tips for players

- Hold the item 30 to 50 cm from the camera so the whole object is visible.
- Keep fingers off the front of the object where possible.
- Use good, even lighting. Strong glare or glowing LEDs confuse the model.
- The **AI sees** line under the camera shows what the model currently detects, which helps with tuning.

---

## Known limitations

- **Cheating is possible.** The server cannot verify a find, so a determined player could fake `round:found` or hold up a photo. Acceptable for a game among friends.
- **A page refresh counts as leaving.** There is no reconnect token yet.
- **State is in memory.** Restarting the server deletes all rooms.
- **Some objects are hard to detect.** The nano model is small and fast, but less accurate on small or unusual items.
- **Phones are slower.** Detection runs on the CPU through WASM, so a find can take a couple of seconds.
- **No rate limiting** on socket events yet.

---

## Roadmap

- WebGPU for faster detection on supported phones
- Server-side checks against cheating (for example a second AI check)
- Reconnect after a refresh
- Redis and the Socket.IO Redis adapter to scale beyond one server
- More items, game modes and power-ups
- Accounts and a global leaderboard
- Deployment: frontend on Vercel, server on Render or Railway

---
