#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting tournament seeding...${NC}"

BASE_URL="http://localhost:3000"

# Step 1: Create a tournament
echo -e "${BLUE}1. Creating tournament...${NC}"
TOURNAMENT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/tournaments" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Battle Under Lights - S2",
    "date": "2025-01-20",
    "location": "South Delhi",
    "format": "round-robin",
    "tournament_type": "doubles"
  }')

TOURNAMENT_ID=$(echo $TOURNAMENT_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"\(.*\)"/\1/')
echo -e "${GREEN}Tournament created with ID: $TOURNAMENT_ID${NC}"

# Step 2: Get some players (assuming 50 exist)
echo -e "${BLUE}2. Fetching players from database...${NC}"

# Player names for teams (using real names from the screenshot)
declare -a PLAYER_NAMES=(
  "Sandipan Sandipan"
  "Anirudh Anirudh"
  "Harsh Sethi"
  "Akshay Akshay"
  "Anuj Sharma"
  "Krish Vohra"
  "Prachi Prachi"
  "Nikhil Nikhil"
  "Rahul Kumar"
  "Priya Singh"
  "Amit Verma"
  "Sneha Patel"
  "Vikram Reddy"
  "Pooja Gupta"
  "Rohan Das"
  "Kavya Iyer"
  "Arjun Mehta"
  "Divya Nair"
  "Karan Joshi"
  "Simran Kaur"
  "Aditya Sharma"
  "Meera Rao"
  "Sanjay Pillai"
  "Anjali Desai"
  "Manish Agarwal"
  "Ritu Bansal"
  "Varun Malhotra"
  "Neha Kapoor"
  "Rajesh Mishra"
  "Swati Chopra"
  "Deepak Saxena"
  "Tanvi Bhatia"
)

# Create players if they don't exist (first 32 for 16 teams)
echo -e "${BLUE}3. Creating/registering 32 players...${NC}"
declare -a PLAYER_IDS=()

for i in {0..31}; do
  PLAYER_NAME="${PLAYER_NAMES[$i]}"
  DUPR=$(echo "scale=1; 3.0 + ($i % 5) * 0.5" | bc)

  # Register player
  PLAYER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/tournaments/$TOURNAMENT_ID/register" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"$PLAYER_NAME\",
      \"email\": \"player$i@example.com\",
      \"dupr\": $DUPR
    }")

  PLAYER_ID=$(echo $PLAYER_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"\(.*\)"/\1/')
  PLAYER_IDS+=("$PLAYER_ID")
  echo "Player $((i+1))/32: $PLAYER_NAME (ID: ${PLAYER_ID:0:8}...)"
done

echo -e "${GREEN}All players registered${NC}"

# Step 4: Create teams (pairs of players)
echo -e "${BLUE}4. Creating 16 teams...${NC}"
declare -a TEAM_IDS=()

for i in {0..15}; do
  PLAYER1_IDX=$((i * 2))
  PLAYER2_IDX=$((i * 2 + 1))
  TEAM_NAME="BLS_$((i + 1))_15"

  TEAM_RESPONSE=$(curl -s -X POST "$BASE_URL/api/teams" \
    -H "Content-Type: application/json" \
    -d "{
      \"tournament_id\": \"$TOURNAMENT_ID\",
      \"team_name\": \"$TEAM_NAME\",
      \"player1_id\": \"${PLAYER_IDS[$PLAYER1_IDX]}\",
      \"player2_id\": \"${PLAYER_IDS[$PLAYER2_IDX]}\"
    }")

  TEAM_ID=$(echo $TEAM_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"\(.*\)"/\1/')
  TEAM_IDS+=("$TEAM_ID")
  echo "Team $((i+1))/16: $TEAM_NAME (ID: ${TEAM_ID:0:8}...)"
done

echo -e "${GREEN}All teams created${NC}"

# Step 5: Generate pool matches
echo -e "${BLUE}5. Generating pool matches (4 pools of 4 teams each)...${NC}"
MATCHES_RESPONSE=$(curl -s -X POST "$BASE_URL/api/tournaments/$TOURNAMENT_ID/generate-pools" \
  -H "Content-Type: application/json" \
  -d '{
    "pools": ["A", "B", "C", "D"],
    "teams_per_pool": 4
  }')

echo -e "${GREEN}Pool matches generated${NC}"

# Step 6: Submit scores for some matches to make them completed
echo -e "${BLUE}6. Submitting scores for Pool A matches...${NC}"

# Get all matches for this tournament
MATCHES=$(curl -s "$BASE_URL/api/tournaments/$TOURNAMENT_ID" | grep -o '"id":"[^"]*"' | sed 's/"id":"\(.*\)"/\1/' | tail -n +2)

# Submit scores for first 5 matches
MATCH_COUNT=0
for MATCH_ID in $MATCHES; do
  if [ $MATCH_COUNT -ge 5 ]; then
    break
  fi

  SCORE_A=$((10 + RANDOM % 5))
  SCORE_B=$((10 + RANDOM % 5))

  # Ensure there's a winner
  if [ $SCORE_A -eq $SCORE_B ]; then
    SCORE_A=$((SCORE_A + 2))
  fi

  echo "Submitting score for match ${MATCH_ID:0:8}... Score: $SCORE_A - $SCORE_B"

  curl -s -X PATCH "$BASE_URL/api/matches/$MATCH_ID" \
    -H "Content-Type: application/json" \
    -d "{
      \"score_a\": $SCORE_A,
      \"score_b\": $SCORE_B,
      \"status\": \"completed\"
    }" > /dev/null

  MATCH_COUNT=$((MATCH_COUNT + 1))
done

echo -e "${GREEN}Scores submitted for 5 matches${NC}"

echo ""
echo -e "${GREEN}=== SEEDING COMPLETE ===${NC}"
echo -e "Tournament ID: ${BLUE}$TOURNAMENT_ID${NC}"
echo -e "View at: ${BLUE}http://localhost:3000/tournaments/$TOURNAMENT_ID${NC}"
echo ""
