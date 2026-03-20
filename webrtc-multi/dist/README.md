# WebRTC Multi-Party Call — Setup Guide


## 1. Start the Media Server


1. Copy the `Server/` directory to the host machine where the service will run. The directory contains:

 ```
Server/
├── WebRTC-Multi-Server.exe    # SFU server (includes Node.js runtime)
├── bin/mediasoup-worker.exe   # mediasoup worker process
└── public/                    # Web UI served to clients
```

2. Open a terminal in the `Server/` directory and run:

```powershell
.\WebRTC-Multi-Server.exe
```

3. The console should display output similar to:

```text
mediasoup Worker created [pid:30264]
Server running on http://localhost:3000
Announced IP: 10.2.3.4
```

**Important:** Keep this window open and note the **Announced IP** — you will need it for the clients.



## 2. Create a Room (on DUT)



1. Copy `WebRTC-Multi-Client.exe` to your **Device Under Test (DUT)**.

2. Open a terminal and run (replace `10.2.3.4` with your **Announced IP**):


```powershell
.\WebRTC-Multi-Client.exe --server-url=http://10.2.3.4:3000
```

3. In the application:


- Click **"Create Room"**.
- Your self-view (720p) will appear as a small overlay.
- A **6-character Room ID** will be displayed at the top of the window — note it down.



## 3. Join the Room (from another host)



1. Copy the same `WebRTC-Multi-Client.exe` to a **different machine**.

2. Run the same command (replace `10.2.3.4` with your **Announced IP**):
  
```powershell
.\WebRTC-Multi-Client.exe --server-url=http://10.2.3.4:3000
```

3. In the application:

- Enter the **Room ID** from Step 2.
- Click **"Join"** to enter the meeting.
- This client will send 9 video streams at 360p.



## UI Controls

| Button | Action |
| :--- | :--- |
| **Mic** | Toggle microphone on/off |
| **Cam** | Toggle camera on/off (affects all streams for the joiner) |
| **Screen** | Share screen (creator only — replaces the 720p feed) |
| **Leave** | Disconnect and return to the landing page |
| **📋** | Copy Room ID to clipboard |



## Troubleshooting

### Server won't start


- **Missing `bin/mediasoup-worker.exe`:** The worker binary must be in the `bin/` folder next to the server exe. Re-copy the entire `Server/` directory.
- **Port already in use:** Another process is using port 3000. Either stop it or set a different port:
```powershell
$env:PORT=8080; .\WebRTC-Multi-Server.exe
```



### Client can't connect to server


- **Network:** Ensure the client machine can reach the server IP. Try `ping 10.2.3.4` from the client.
- **Firewall:** The following ports must be open on the **server host**:
- **TCP 3000** — HTTP + WebSocket signaling
- **UDP 10000–10100** — WebRTC media (RTP/RTCP)
- **Wrong IP:** If the server auto-detects the wrong network interface, override it:
```powershell
$env:ANNOUNCED_IP="10.2.3.4"; .\WebRTC-Multi-Server.exe
```


### No video / black screen


- **Camera in use:** Ensure no other application (Teams, Zoom, etc.) is using the camera.
- **Permissions:** On the first launch, the OS may prompt for camera/microphone access — make sure to allow it.
- **Codec mismatch:** The app requires H.264 support. Some systems may not have hardware H.264 encoding available.


### Room not found / can't join


- **Typo in Room ID:** Room IDs are 6 lowercase hex characters (e.g., `a1b2c3`). Double-check the ID.
- **Room expired:** If the creator leaves, the room is destroyed. Create a new room and rejoin.
- **Both on same machine:** Each `.exe` instance needs its own camera access. Running two clients on the same machine may cause conflicts.


