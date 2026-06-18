@echo off
setlocal enabledelayedexpansion

echo.
echo 🚀 Content Repurposer - Setup Script
echo ====================================
echo.

:: Check if Node is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed
    echo Please install Node.js 18+ from https://nodejs.org
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✓ Node.js is installed: %NODE_VERSION%
echo.

:: Install server dependencies
echo 📦 Installing server dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install server dependencies
    exit /b 1
)
echo ✓ Server dependencies installed
echo.

:: Install client dependencies
echo 📦 Installing client dependencies...
cd client
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install client dependencies
    cd ..
    exit /b 1
)
cd ..
echo ✓ Client dependencies installed
echo.

:: Check if .env exists
if not exist .env (
    echo 📝 Creating .env file from template...
    copy .env.example .env
    echo ✓ .env file created
    echo.
    echo ⚠️  IMPORTANT: Edit .env with your API keys:
    echo    1. CLAUDE_API_KEY from https://console.anthropic.com
    echo    2. STRIPE_SECRET_KEY from https://dashboard.stripe.com
    echo    3. JWT_SECRET (generate a random string)
    echo.
)

echo ✅ Setup complete!
echo.
echo 🎯 Next steps:
echo    1. Edit .env with your API keys
echo    2. Run: npm run dev
echo    3. Open http://localhost:3000
echo.
echo 📖 Read LAUNCH_CHECKLIST.md for full deployment guide
echo.
pause
