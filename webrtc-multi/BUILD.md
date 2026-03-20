# Building Server from Source

If you need to build or modify the server/client rather than using the [prebuilt binaries](dist/README.md), follow the instructions below.

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
