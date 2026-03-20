\# WebRTC Multi-Party Call — Setup Guide



\## 1. Start the Media Server



1\. Copy the `Server` directory to the host machine where the service will run. The directory contains:

&#x20;  

&#x20;  ```

&#x20;  Server/

&#x20;  ├── WebRTC-Multi-Server.exe    # SFU server (includes Node.js runtime)

&#x20;  ├── bin/mediasoup-worker.exe   # mediasoup worker process

&#x20;  └── public/                    # Web UI served to clients

&#x20;  ```

2\. Open a terminal in the `Server/` directory and run:

&#x20;  

&#x20;  ```powershell

&#x20;  .\\WebRTC-Multi-Server.exe

&#x20;  ```

3\. The console should display output similar to:

&#x20;  

&#x20;  ```text

&#x20;  mediasoup Worker created \[pid:30264]

&#x20;  Server running on http://localhost:3000

&#x20;  Announced IP: 10.2.3.4

&#x20;  ```



> \*\*Important:\*\* Keep this window open and note the \*\*Announced IP\*\* — you will need it for the clients.



\## 2. Create a Room (on DUT)



1\. Copy `WebRTC-Multi-Client.exe` to your \*\*Device Under Test (DUT)\*\*.

2\. Open a terminal and run (replace `10.2.3.4` with your \*\*Announced IP\*\*):

&#x20;  

&#x20;  ```powershell

&#x20;  .\\WebRTC-Multi-Client.exe --server-url=http://10.2.3.4:3000

&#x20;  ```

3\. In the application:

&#x20;  

&#x20;  - Click \*\*"Create Room"\*\*.

&#x20;  - Your self-view (720p) will appear as a small overlay.

&#x20;  - A \*\*6-character Room ID\*\* will be displayed at the top of the window — note it down.



\## 3. Join the Room (from another host)



1\. Copy the same `WebRTC-Multi-Client.exe` to a \*\*different machine\*\*.

2\. Run the same command:

&#x20;  

&#x20;  ```powershell

&#x20;  .\\WebRTC-Multi-Client.exe --server-url=http://10.2.3.4:3000

&#x20;  ```

3\. In the application:

&#x20;  

&#x20;  - Enter the \*\*Room ID\*\* from Step 2.

&#x20;  - Click \*\*"Join"\*\* to enter the meeting.

&#x20;  - This client will send 9 video streams at 360p.



\## Controls



| Button     | Action                                                    |

| ---------- | --------------------------------------------------------- |

| \*\*Mic\*\*    | Toggle microphone on/off                                  |

| \*\*Cam\*\*    | Toggle camera on/off (affects all streams for the joiner) |

| \*\*Screen\*\* | Share screen (creator only — replaces the 720p feed)     |

| \*\*Leave\*\*  | Disconnect and return to the landing page                 |

| \*\*📋\*\*     | Copy room ID to clipboard                                 |



\## Troubleshooting



\### Server won't start



\- \*\*Missing `bin/mediasoup-worker.exe`:\*\* The worker binary must be in the `bin/` folder next to the server exe. Re-copy the entire `Server/` directory.

\- \*\*Port already in use:\*\* Another process is using port 3000. Either stop it or set a different port:

&#x20; ```powershell

&#x20; $env:PORT=8080; .\\WebRTC-Multi-Server.exe

&#x20; ```



\### Client can't connect to server



\- \*\*Network:\*\* Ensure the client machine can reach the server IP. Try `ping 10.2.3.4` from the client.

\- \*\*Firewall:\*\* The following ports must be open on the \*\*server host\*\*:

&#x20; - \*\*TCP 3000\*\* — HTTP + WebSocket signaling

&#x20; - \*\*UDP 10000–10100\*\* — WebRTC media (RTP/RTCP)

\- \*\*Wrong IP:\*\* If the server auto-detects the wrong network interface, override it:

&#x20; ```powershell

&#x20; $env:ANNOUNCED\_IP="10.2.3.4"; .\\WebRTC-Multi-Server.exe

&#x20; ```



\### No video / black screen



\- \*\*Camera in use:\*\* Ensure no other application (Teams, Zoom, etc.) is using the camera.

\- \*\*Permissions:\*\* On the first launch, the OS may prompt for camera/microphone access — make sure to allow it.

\- \*\*Codec mismatch:\*\* The app requires H.264 support. Some systems may not have hardware H.264 encoding available.



\### Room not found / can't join



\- \*\*Typo in Room ID:\*\* Room IDs are 6 lowercase hex characters (e.g., `a1b2c3`). Double-check the ID.

\- \*\*Room expired:\*\* If the creator leaves, the room is destroyed. Create a new room and rejoin.

\- \*\*Both on same machine:\*\* Each `.exe` instance needs its own camera access. Running two clients on the same machine may cause conflicts.

&#x20;

