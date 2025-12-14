# ========================================
# RESEARCH-HUB Production Build Script (Windows)
# ========================================

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting RESEARCH-HUB Production Build..." -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "README.md")) {
    Write-Host "❌ Error: Must be run from RESEARCH-HUB root directory" -ForegroundColor Red
    exit 1
}

# Step 1: Environment Check
Write-Host "📋 Step 1: Checking environment files..." -ForegroundColor Yellow
if (-not (Test-Path "server\.env")) {
    Write-Host "❌ server\.env not found!" -ForegroundColor Red
    Write-Host "   Copy server\.env.production to server\.env and configure it" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path "FRONTEND\.env.production")) {
    Write-Host "❌ FRONTEND\.env.production not found!" -ForegroundColor Red
    Write-Host "   Copy FRONTEND\.env.production template and configure it" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Environment files found" -ForegroundColor Green
Write-Host ""

# Step 2: Install Dependencies
Write-Host "📦 Step 2: Installing dependencies..." -ForegroundColor Yellow

Write-Host "Installing backend dependencies..."
Set-Location server
npm install --production
Set-Location ..
Write-Host "✅ Backend dependencies installed" -ForegroundColor Green

Write-Host "Installing frontend dependencies..."
Set-Location FRONTEND
npm install
Set-Location ..
Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 3: Run Tests (optional)
Write-Host "🧪 Step 3: Running tests (optional)..." -ForegroundColor Yellow
$runTests = Read-Host "Run tests? (y/n)"
if ($runTests -eq "y" -or $runTests -eq "Y") {
    Write-Host "Running backend tests..."
    Set-Location server
    try {
        npm test
    } catch {
        Write-Host "⚠️  Some tests failed, continuing anyway..." -ForegroundColor Yellow
    }
    Set-Location ..
    
    Write-Host "Running frontend tests..."
    Set-Location FRONTEND
    try {
        npm test -- --watchAll=false
    } catch {
        Write-Host "⚠️  Some tests failed, continuing anyway..." -ForegroundColor Yellow
    }
    Set-Location ..
} else {
    Write-Host "Skipping tests..."
}
Write-Host ""

# Step 4: Build Frontend
Write-Host "🏗️  Step 4: Building frontend..." -ForegroundColor Yellow
Set-Location FRONTEND
npm run build
Set-Location ..
Write-Host "✅ Frontend built successfully" -ForegroundColor Green
Write-Host ""

# Step 5: Generate Summary
Write-Host "📊 Step 5: Build Summary" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "✅ Build completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Build Output:"
Write-Host "   Backend:  .\server"
Write-Host "   Frontend: .\FRONTEND\build"
Write-Host ""
Write-Host "📝 Next Steps:"
Write-Host "   1. Test locally: cd server && npm start"
Write-Host "   2. Deploy backend to your server"
Write-Host "   3. Deploy frontend build folder"
Write-Host "   4. Verify deployment with health checks"
Write-Host ""
Write-Host "📖 Full deployment guide: .\docs\PRODUCTION_DEPLOYMENT.md"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
