# Court Validation & Auto-Assignment Implementation

## ✅ What Was Implemented

### 1. **Court Validation Before Bracket Generation**

Both bracket generation endpoints now **require courts to exist** before generating matches.

#### Single Elimination (`POST /api/tournaments/{id}/generate`)
**Validation Added:**
```typescript
// Fetch courts - REQUIRED
const { data: courts, error: courtsError } = await supabase
  .from('courts')
  .select('id')
  .eq('tournament_id', tournament_id)

if (courtsError) {
  return NextResponse.json({ error: courtsError.message }, { status: 500 })
}

if (!courts || courts.length === 0) {
  return NextResponse.json({
    error: 'No courts found. Please create courts before generating bracket.',
    hint: 'Visit the tournament management page to create courts.'
  }, { status: 400 })
}
```

**Error Response:**
```json
{
  "error": "No courts found. Please create courts before generating bracket.",
  "hint": "Visit the tournament management page to create courts."
}
```

#### Pool Play (`POST /api/tournaments/{id}/generate-pools`)
**Same Validation Applied**

---

### 2. **Updated Seed Script to Create 2 Courts**

The development seed script now creates courts **before** registering players.

**File:** `/src/app/api/dev/seed/route.ts`

**Seed Flow:**
1. ✅ Create tournament
2. ✅ **Create 2 courts** (NEW)
   - Court 1 (Main Court)
   - Court 2 (Side Court)
3. ✅ Register 4 players
4. ✅ Generate bracket with auto court assignment

**Court Creation Code:**
```typescript
// 2. Create 2 courts
console.log('Creating 2 courts...')

for (let i = 1; i <= 2; i++) {
  const courtResponse = await fetch(
    `${baseUrl}/api/tournaments/${tournament.id}/courts`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Court ${i}`,
        location_notes: i === 1 ? 'Main Court' : 'Side Court',
      }),
    }
  )

  if (!courtResponse.ok) {
    const error = await courtResponse.json()
    throw new Error(`Failed to create court ${i}: ${error.error}`)
  }
}
```

**Updated Response:**
```json
{
  "success": true,
  "tournament_id": "...",
  "courts_created": 2,
  "players_created": 4,
  "matches_created": 2,
  "format": "knockout (single-elimination)",
  "view_url": "/tournaments/{id}",
  "manage_url": "/tournaments/{id}/manage"
}
```

---

### 3. **Automatic Court Assignment (Already Implemented, Now Guaranteed)**

Matches are automatically assigned to courts using **round-robin distribution**.

**Algorithm:**
```typescript
// Round-robin distribution
const insertMatches = matches.map((m, index) => ({
  ...matchData,
  court_id: courtIds[index % courtIds.length], // Match 1→Court 1, Match 2→Court 2, Match 3→Court 1...
}))
```

**Benefits:**
- Even distribution across all courts
- No manual assignment needed
- Works with any number of courts
- Simple modulo ensures cycling

**Example with 2 courts, 4 matches:**
- Match 1 → Court 1
- Match 2 → Court 2
- Match 3 → Court 1
- Match 4 → Court 2

---

## 🧪 Testing

### Test 1: Seed Script Creates Courts
```bash
curl -X POST http://localhost:3000/api/dev/seed
```

**Result:** ✅
```json
{
  "success": true,
  "courts_created": 2,
  "players_created": 4,
  "matches_created": 2
}
```

### Test 2: Courts Are Created
```bash
curl http://localhost:3000/api/tournaments/{id}/courts
```

**Result:** ✅
```json
[
  {
    "id": "1fc023ef-1993-492f-9fc9-20344583a996",
    "name": "Court 1",
    "location_notes": "Main Court"
  },
  {
    "id": "561667b2-e5bf-4a0a-acad-b786dad6a38e",
    "name": "Court 2",
    "location_notes": "Side Court"
  }
]
```

### Test 3: Matches Have Court Assignments
```bash
curl http://localhost:3000/api/tournaments/{id}
```

**Result:** ✅
```json
{
  "matches": [
    {
      "round": 1,
      "court_id": "1fc023ef-1993-492f-9fc9-20344583a996",
      "status": "scheduled"
    },
    {
      "round": 1,
      "court_id": "561667b2-e5bf-4a0a-acad-b786dad6a38e",
      "status": "scheduled"
    }
  ]
}
```

### Test 4: Validation Blocks Generation Without Courts
```bash
# Create tournament without courts
curl -X POST http://localhost:3000/api/tournaments \
  -d '{"name":"Test","format":"single-elim"}'

# Try to generate bracket
curl -X POST http://localhost:3000/api/tournaments/{id}/generate
```

**Result:** ✅
```json
{
  "error": "No courts found. Please create courts before generating bracket.",
  "hint": "Visit the tournament management page to create courts."
}
```

---

## 📂 Files Modified

1. `/src/app/api/tournaments/[id]/generate/route.ts`
   - Added court validation
   - Removed null fallback in court assignment
   - Returns helpful error message

2. `/src/app/api/tournaments/[id]/generate-pools/route.ts`
   - Added court validation
   - Removed null fallback in court assignment
   - Returns helpful error message

3. `/src/app/api/dev/seed/route.ts`
   - Added court creation step (2 courts)
   - Updated response to include `courts_created`
   - Updated URLs to include `manage_url`

---

## 🎯 Workflow Impact

### Before
1. Create tournament
2. Register players
3. Generate bracket
4. ⚠️ Matches created with `court_id: null`
5. ❌ Referees can't use court view
6. Manual court assignment needed

### After
1. Create tournament
2. **Create courts** (enforced)
3. Register players
4. Generate bracket
5. ✅ Matches automatically assigned to courts
6. ✅ Referees can use court view immediately
7. ✅ No manual assignment needed

---

## 🚦 Error Handling

### User-Friendly Error Messages

**Before Generation:**
```
Error: No courts found. Please create courts before generating bracket.
Hint: Visit the tournament management page to create courts.
```

**Clear Next Steps:**
- User knows what went wrong
- User knows how to fix it
- Link to management page provided

---

## 🎓 Design Decisions

### Why Require Courts Before Generation?

1. **Data Integrity**
   - Every match should have a court assigned
   - No orphaned matches

2. **User Experience**
   - Referee views work immediately
   - No manual assignment step

3. **Workflow Clarity**
   - Director sets up courts first
   - Then generates matches
   - Clear sequential process

### Why Round-Robin Distribution?

1. **Simplicity**
   - Easy to understand
   - Easy to implement
   - Predictable results

2. **Fairness**
   - Even load across courts
   - No court sits idle

3. **Flexibility**
   - Works with any number of courts
   - Scales automatically

---

## 🎉 Success Metrics

- ✅ Courts are created by seed script
- ✅ Validation prevents bracket generation without courts
- ✅ All matches get court assignments (no nulls)
- ✅ Round-robin distribution works correctly
- ✅ Error messages are helpful and actionable
- ✅ Referee views work immediately after generation

---

## 📝 API Changes Summary

### Modified Endpoints

**POST /api/tournaments/{id}/generate**
- **New Validation:** Requires courts to exist
- **Error Response (400):** Court validation error
- **Behavior:** Now guarantees all matches have court_id

**POST /api/tournaments/{id}/generate-pools**
- **New Validation:** Requires courts to exist
- **Error Response (400):** Court validation error
- **Behavior:** Now guarantees all matches have court_id

**POST /api/dev/seed**
- **New Step:** Creates 2 courts
- **Response Change:** Added `courts_created: 2`
- **Response Change:** Added `manage_url`

---

## 🏁 Conclusion

The three requirements are fully implemented:

1. ✅ **Validation**: Courts must exist before bracket generation
2. ✅ **Seeding**: Script creates 2 courts automatically
3. ✅ **Auto-assignment**: Matches distributed round-robin across courts

The tournament workflow now enforces proper setup order and guarantees that all matches can be played on designated courts with functional referee views.

**Implementation complete!** ✨
