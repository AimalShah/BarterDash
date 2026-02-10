#!/bin/bash

# Express Migration Setup Script
# This script helps set up the Express + Drizzle environment

set -e

echo "╔══════════════════════════════════════════════════════╗"
echo "║   BarterDash Express Migration Setup                ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Installing Express dependencies...${NC}"
npm install --save \
  express \
  drizzle-orm \
  postgres \
  zod \
  jsonwebtoken \
  bcrypt \
  cors \
  helmet \
  morgan \
  express-rate-limit \
  neverthrow \
  dotenv

echo -e "${GREEN}✓ Production dependencies installed${NC}"
echo ""

echo -e "${YELLOW}Step 2: Installing development dependencies...${NC}"
npm install --save-dev \
  drizzle-kit \
  tsx \
  @types/express \
  @types/cors \
  @types/morgan \
  @types/jsonwebtoken \
  @types/bcrypt

echo -e "${GREEN}✓ Development dependencies installed${NC}"
echo ""

echo -e "${YELLOW}Step 3: Setting up Drizzle...${NC}"
if [ ! -d "drizzle" ]; then
  mkdir -p drizzle
  echo -e "${GREEN}✓ Created drizzle directory${NC}"
fi

echo ""
echo -e "${YELLOW}Step 4: Checking environment variables...${NC}"
if [ ! -f ".env" ]; then
  echo -e "${RED}✗ .env file not found!${NC}"
  echo "Please create a .env file with the required variables"
  exit 1
else
  echo -e "${GREEN}✓ .env file found${NC}"
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Setup Complete! 🎉                                 ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. Generate Drizzle migration from existing database:"
echo -e "   ${YELLOW}npx drizzle-kit introspect${NC}"
echo ""
echo "2. Or push Drizzle schema to database:"
echo -e "   ${YELLOW}npx drizzle-kit push${NC}"
echo ""
echo "3. Start the Express development server:"
echo -e "   ${YELLOW}npx tsx watch express-src/main.ts${NC}"
echo ""
echo "4. Test the API:"
echo -e "   ${YELLOW}curl http://localhost:3000/api/v1/health${NC}"
echo ""
echo "For more information, see:"
echo "  - README-EXPRESS.md"
echo "  - MIGRATION_GUIDE.md"
echo ""
