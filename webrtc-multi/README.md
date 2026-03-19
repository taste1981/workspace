# WebRTC Multi-Party Call (SFU)

A 2-page WebRTC video call application using an SFU (Selective Forwarding Unit) architecture powered by [mediasoup](https://mediasoup.org/). Each participant sends their media **once** to the server, which forwards it to all other participants — no mesh overhead.

## How It Works


| Page            | Role    | Sends              | Resolution | Codec              |
| --------------- | ------- | ------------------ | ---------- | ------------------ |
| **Create Room** | Creator | 1 video + 1 audio  | 1280×720  | H.264 Main Profile |
| **Join Room**   | Joiner  | 9 videos + 1 audio | 640×360   | H.264 Main Profile |

The creator sees 1 local 720p tile + 9 remote 360p tiles (10 total). The joiner sees 9 local 360p tiles + 1 remote 720p tile (10 total).

> **Deployment note:** The SFU server can run on a separate host — it should not be run on the DUT (Device Under Test). Running the server on a different machine keeps the DUT dedicated to the browser workload being tested.

## Prerequisites

- **Node.js** v22 LTS (includes npm)
- **Python** 3.x (required by mediasoup native build, if the prebuilt binary download fails)

### Installing Node.js v22

**Windows:**

Download the installer from https://nodejs.org/ (LTS v22.x recommended), or use winget:

```powershell
winget install OpenJS.NodeJS.LTS
```

**Linux (Ubuntu/Debian):**

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Linux (RHEL/CentOS/Fedora):**

```bash
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo dnf install -y nodejs
```

**macOS:**

```bash
brew install node@22
```

**Verify installation:**

```bash
node --version   # should print v22.x.x
npm --version    # should print 10.x.x or later
```

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/taste1981/workspace.git
cd workspace/webrtc-multi
```

### 2. Configure npm proxy (corporate network)

If you are behind a corporate proxy, configure npm before installing:

```bash
npm config set proxy http://<proxy-host>:<proxy-port>
npm config set https-proxy http://<proxy-host>:<proxy-port>
```

To remove the proxy settings later:

```bash
npm config delete proxy
npm config delete https-proxy
```

### 3. Install dependencies (one-time)

```bash
npm install
```

This only needs to be done once. After the initial install, you can start the server directly with `npm start` or `npm run dev`.

> **Note:** mediasoup includes a native C++ worker binary. During `npm install`, it attempts to download a prebuilt binary from GitHub. If this fails (e.g., due to network restrictions), it falls back to building locally, which requires Python 3 and a C++ toolchain. If the automated download times out, you can manually download the prebuilt worker:
>
> **Windows:** (execute under the root dir of `webrtc-multi`)
>
> ```powershell
> $url = "https://github.com/versatica/mediasoup/releases/download/3.19.18/mediasoup-worker-3.19.18-win32-x64.tgz"
> $outDir = "node_modules/mediasoup/worker/prebuild"
> New-Item -ItemType Directory -Force -Path $outDir | Out-Null
> Invoke-WebRequest -Uri $url -OutFile "$outDir/mediasoup-worker-3.19.18-win32-x64.tgz"
> cd $outDir
> tar -xzf mediasoup-worker-3.19.18-win32-x64.tgz
> cd ../../../..
> ```
>
> **Linux:**
>
> ```bash
> mkdir -p node_modules/mediasoup/worker/prebuild
> curl -L -o node_modules/mediasoup/worker/prebuild/mediasoup-worker-3.19.18-linux-x64.tgz \
>   https://github.com/versatica/mediasoup/releases/download/3.19.18/mediasoup-worker-3.19.18-linux-x64.tgz
> tar -xzf node_modules/mediasoup/worker/prebuild/mediasoup-worker-3.19.18-linux-x64.tgz \
>   -C node_modules/mediasoup/worker/prebuild/
> ```

### 4. Build & start the server

```bash
npm start
```

This runs `esbuild` to bundle the client JS, then starts the server. You should see:

```
mediasoup Worker created [pid:XXXXX]
Server running on http://localhost:3000
Announced IP: x.x.x.x
```

For development (skip rebuild, use existing bundle):

```bash
npm run dev
```

## Launching Chrome

Since the server runs on **plain HTTP** (not HTTPS), Chrome blocks `getUserMedia()` on non-localhost origins. You need to launch Chrome with special flags. It is expected that DUT creates the room, and you use another device to join the room.

### Windows

Chrome may be installed in either `Program Files` or `Program Files (x86)`. Try both if one fails.

```powershell
# 64-bit installation (most common)
"C:\Program Files\Google\Chrome\Application\chrome.exe" --unsafely-treat-insecure-origin-as-secure="http://<server-ip>:3000" --use-fake-ui-for-media-stream --user-data-dir="C:\tmp\chrome-webrtc" "http://<server-ip>:3000"

# 32-bit installation
"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --unsafely-treat-insecure-origin-as-secure="http://<server-ip>:3000" --use-fake-ui-for-media-stream --user-data-dir="C:\tmp\chrome-webrtc" "http://<server-ip>:3000"
```

### Linux / macOS

```bash
google-chrome \
  --unsafely-treat-insecure-origin-as-secure="http://<server-ip>:3000" \
  --use-fake-ui-for-media-stream \
  --user-data-dir="/tmp/chrome-webrtc" \
  "http://<server-ip>:3000"
```


| Flag                                         | Purpose                                                                                       |
| -------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `--unsafely-treat-insecure-origin-as-secure` | Allows`getUserMedia()` and other secure-context APIs over plain HTTP for the specified origin |
| `--use-fake-ui-for-media-stream`             | Auto-grants camera/microphone permissions without showing the permission prompt               |
| `--user-data-dir`                            | Uses a separate Chrome profile so these flags don't affect your normal browsing               |

> **Replace `<server-ip>`** with the actual IP address of the machine running the server (shown in the "Announced IP" line at startup).

## Usage

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

## Configuration


| Environment Variable   | Default                              | Description                                                                                   |
| ---------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------- |
| `PORT`                 | `3000`                               | HTTP server port                                                                              |
| `ANNOUNCED_IP`         | Auto-detected LAN IP                 | IP address announced in ICE candidates (set this if auto-detection picks the wrong interface) |
| `MEDIASOUP_WORKER_BIN` | Auto-detected from`worker/prebuild/` | Path to the mediasoup worker binary (normally auto-detected)                                  |

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
