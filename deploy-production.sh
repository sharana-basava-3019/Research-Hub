#!/bin/bash

# ========================================
# RESEARCH-HUB Production Build Script
# ========================================

set -e  # Exit on error

echo "🚀 Starting RESEARCH-HUB Production Build..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "README.md" ]; then
    echo -e "${RED}❌ Error: Must be run from RESEARCH-HUB root directory${NC}"
    exit 1
fi

# Step 1: Environment Check
echo -e "${YELLOW}📋 Step 1: Checking environment files...${NC}"
if [ ! -f "server/.env" ]; then
    echo -e "${RED}❌ server/.env not found!${NC}"
    echo "   Copy server/.env.production to server/.env and configure it"
    exit 1
fi

if [ ! -f "FRONTEND/.env.production" ]; then
    echo -e "${RED}❌ FRONTEND/.env.production not found!${NC}"
    echo "   Copy FRONTEND/.env.production template and configure it"
    exit 1
fi
echo -e "${GREEN}✅ Environment files found${NC}"
echo ""

# Step 2: Install Dependencies
echo -e "${YELLOW}📦 Step 2: Installing dependencies...${NC}"

echo "Installing backend dependencies..."
cd server
npm install --production
cd ..
echo -e "${GREEN}✅ Backend dependencies installed${NC}"

echo "Installing frontend dependencies..."
cd FRONTEND
npm install
cd ..
echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
echo ""

# Step 3: Run Tests (optional)
echo -e "${YELLOW}🧪 Step 3: Running tests (optional)...${NC}"
read -p "Run tests? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd server
    npm test || echo -e "${YELLOW}⚠️  Some tests failed, continuing anyway...${NC}"
    cd ../FRONTEND
    npm test -- --watchAll=false || echo -e "${YELLOW}⚠️  Some tests failed, continuing anyway...${NC}"
    cd ..
else
    echo "Skipping tests..."
fi
echo ""

# Step 4: Build Frontend
echo -e "${YELLOW}🏗️  Step 4: Building frontend...${NC}"
cd FRONTEND
npm run build
cd ..
echo -e "${GREEN}✅ Frontend built successfully${NC}"
echo ""

# Step 5: Generate Summary
echo -e "${YELLOW}📊 Step 5: Build Summary${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Build completed successfully!${NC}"
echo ""
echo "📁 Build Output:"
echo "   Backend:  ./server"
echo "   Frontend: ./FRONTEND/build"
echo ""
echo "📝 Next Steps:"
echo "   1. Test locally: cd server && npm start"
echo "   2. Deploy backend to your server"
echo "   3. Deploy frontend build folder"
echo "   4. Verify deployment with health checks"
echo ""
echo "📖 Full deployment guide: ./docs/PRODUCTION_DEPLOYMENT.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
