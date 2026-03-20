# WebRTC Multi-Party Call (SFU)

A 2-page WebRTC video call application using an SFU (Selective Forwarding Unit) architecture powered by [mediasoup](https://mediasoup.org/). Each participant sends their media **once** to the server, which forwards it to all other participants — no mesh overhead.

## How It Works


| Page            | Role    | Sends              | Resolution | Codec              |
| --------------- | ------- | ------------------ | ---------- | ------------------ |
| **Create Room** | Creator | 1 video + 1 audio  | 1280×720  | H.264 Main Profile |
| **Join Room**   | Joiner  | 9 videos + 1 audio | 640×360   | H.264 Main Profile |

The creator sees 1 local 720p tile + 9 remote 360p tiles (10 total). The joiner sees 9 local 360p tiles + 1 remote 720p tile (10 total).

> **Deployment note:** The SFU server can run on a separate host — it should not be run on the DUT (Device Under Test). Running the server on a different machine keeps the DUT dedicated to the browser workload being tested.

## Prebuilt Binaries

Prebuilt `.exe` files for the server and client are available under the [`dist/`](dist/) directory — no build step required. See [`dist/README.md`](dist/README.md) for setup and usage instructions.

## Building from Source

If you need to build the server/client from source or modify the code, see [`BUILD.md`](BUILD.md) for full instructions (prerequisites, npm install, proxy configuration, launching Chrome, etc.).

## Alternative Client

Besdies the native client shared in `dist` directory, you can also use Chrome browser to connect to server:

1. On DUT, open Chrome (with the flags above) and go to `http://<server-ip>:3000`
2. Click **Create Room** — your camera activates and a 6-character room ID appears
3. On another device, Open a second Chrome window/tab (with the flags above) and go to the same URL
4. Enter the room ID and click **Join**
5. The creator's page shows 1 local 720p tile + 9 remote 360p tiles
6. The joiner's page shows 9 local 360p tiles + 1 remote 720p tile

### Controls


| Button     | Action                                                       |
| ---------- | ------------------------------------------------------------ |
| **Mic**    | Toggle microphone on/off                                     |
| **Cam**    | Toggle camera on/off (affects all streams for the joiner)    |
| **Screen** | Share screen (creator only — replaces the 720p camera feed) |
| **Leave**  | Disconnect and return to the landing page                    |
| **📋**     | Copy room ID to clipboard                                    |

## Architecture

```
Creator Browser                    mediasoup SFU                    Joiner Browser
┌─────────────┐                  ┌──────────────┐                 ┌─────────────────┐
│ 1× H.264    │── send ────────►│              │── forward ────►│ receives 1×720p  │
│   720p      │                  │   Router     │                 │                  │
│             │◄── forward ─────│              │◄── send ───────│ 9× H.264 360p    │
│ receives    │                  │              │                 │                  │
│ 9×360p      │                  └──────────────┘                 └─────────────────┘
└─────────────┘                                
```

Each side maintains only **2 WebRTC transports** (1 send + 1 receive) regardless of stream count.
