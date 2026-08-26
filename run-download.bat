@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在下载景点经典图（需要联网，且电脑已安装 Node.js）...
echo 下载完成后刷新网页即可看到本地图片。
echo.
node download-images.js
echo.
if errorlevel 1 (
  echo [提示] 如果提示 "node 不是内部或外部命令"，请先安装 Node.js：https://nodejs.org （选 LTS 版）
  pause
) else (
  pause
)
