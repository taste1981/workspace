@echo off
rem Fetch the onnxruntime-web dist into ort\ (needed for the ORT EP chain;
rem the raw WebNN runner works without it).
cd /d %~dp0
if exist ort\ort.all.min.js (
  echo ORT dist already present in ort\
  exit /b 0
)
npm install onnxruntime-web --no-fund --no-audit
xcopy /E /I /Y node_modules\onnxruntime-web\dist ort >nul
echo ORT runtime copied to ort\
