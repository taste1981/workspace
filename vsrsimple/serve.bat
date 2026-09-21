@echo off
rem Serve the WebNN SR webapp. Default: loopback http on port 8123.
rem   serve.bat                          -> http://127.0.0.1:8123
rem   serve.bat --host 0.0.0.0           -> LAN http (WASM EP only remotely)
rem   serve.bat --https --host 0.0.0.0   -> LAN https (WebNN/WebGPU work,
rem                                         accept the cert warning)
cd /d %~dp0
start http://localhost:8123
python serve.py %*
