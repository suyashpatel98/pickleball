# Shadcn/UI Migration Guide

## Overview

This document outlines the step-by-step process to migrate the tournament scheduler from plain Tailwind CSS to shadcn/ui components. The migration will:
- ✅ Keep all functionality identical
- ✅ Maintain component order and page structure
- ✅ No backend changes
- ⚠️ Styling/appearance may change (using shadcn defaults)

---

## Current Component Inventory

### Pages
1. **Home (`src/app/page.tsx`)** - Tournament list with cards and create button
2. **Tournament Detail (`src/app/tournaments/[id]/page.tsx`)** - Wrapper for TournamentFixtures
3. **Match Detail (`src/app/matches/[id]/page.tsx`)** - Match scoring interface

### Components
1. **CreateTournamentModal** - Modal with form (name, date, format)
2. **RegisterPlayerModal** - Modal with form (name, email, DUPR)
3. **TournamentFixtures** - Complex component with:
   - Tabs (fixtures, standings, table, stats, details)
   - Button groups (format selection, view modes, pools, rounds)
   - Match cards (green cards with team info, scores, status)
   - Tables (standings, overall table)

### UI Elements Used
- Modals (custom overlays)
- Forms (inputs, labels, buttons)
- Cards (tournament cards, match cards)
- Tables (standings)
- Tabs (navigation between views)
- Buttons (primary, secondary, toggle buttons)
- Status badges

---

## Shadcn/UI Component Mapping

| Current Element | Shadcn Component | Notes |
|----------------|------------------|-------|
| Custom modal overlay | `Dialog` | Dialog, DialogContent, DialogHeader, DialogTitle |
| Form inputs | `Input` + `Label` | Styled input with label |
| Buttons | `Button` | variant: default, outline, ghost, secondary |
| Tournament cards | `Card` | Card, CardHeader, CardTitle, CardContent |
| Match cards | `Card` | Can customize with className |
| Tables | `Table` | Table, TableHeader, TableBody, TableRow, TableCell |
| Tabs | `Tabs` | Tabs, TabsList, TabsTrigger, TabsContent |
| Status badges | `Badge` | variant: default, secondary, destructive, outline |
| Error messages | `Alert` | Alert, AlertDescription |

---

## Migration Steps

### Phase 1: Setup & Installation

#### Step 1.1: Initialize shadcn/ui

```bash
npx shadcn@latest init
```

When prompted, use these settings:
- Style: **Default**
- Base color: **Slate** (or your preference)
- CSS variables: **Yes**
- Import alias: **@/components**

This will:
- Create `components.json` config
- Set up `lib/utils.ts` with `cn()` helper
- Configure Tailwind for shadcn

#### Step 1.2: Install Required Components

```bash
npx shadcn@latest add dialog
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add card
npx shadcn@latest add table
npx shadcn@latest add tabs
npx shadcn@latest add badge
npx shadcn@latest add alert
```

This creates:
- `components/ui/dialog.tsx`
- `components/ui/button.tsx`
- `components/ui/input.tsx`
- `components/ui/label.tsx`
- `components/ui/card.tsx`
- `components/ui/table.tsx`
- `components/ui/tabs.tsx`
- `components/ui/badge.tsx`
- `components/ui/alert.tsx`

---

### Phase 2: Migrate CreateTournamentModal

**File:** `src/components/CreateTournamentModal.tsx`

#### Step 2.1: Update Imports

```typescript
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
```

#### Step 2.2: Replace Modal Structure

**Before:**
```tsx
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
  <div className="bg-white rounded-lg max-w-md w-full p-6">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-2xl font-bold text-gray-900">Create Tournament</h2>
      <button onClick={onClose}>X</button>
    </div>
    {/* form content */}
  </div>
</div>
```

**After:**
```tsx
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>Create Tournament</DialogTitle>
    </DialogHeader>
    {/* form content */}
  </DialogContent>
</Dialog>
```

#### Step 2.3: Replace Form Inputs

**Before:**
```tsx
<input
  type="text"
  id="name"
  value={name}
  onChange={(e) => setName(e.target.value)}
  required
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  placeholder="Summer Championship 2024"
/>
```

**After:**
```tsx
<div className="space-y-2">
  <Label htmlFor="name">Tournament Name *</Label>
  <Input
    id="name"
    value={name}
    onChange={(e) => setName(e.target.value)}
    required
    placeholder="Summer Championship 2024"
  />
</div>
```

#### Step 2.4: Replace Buttons

**Before:**
```tsx
<button
  type="submit"
  disabled={loading || !name}
  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
>
  {loading ? 'Creating...' : 'Create'}
</button>
```

**After:**
```tsx
<Button type="submit" disabled={loading || !name} className="flex-1">
  {loading ? 'Creating...' : 'Create'}
</Button>
```

#### Step 2.5: Replace Error Messages

**Before:**
```tsx
<div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
  {error}
</div>
```

**After:**
```tsx
<Alert variant="destructive">
  <AlertDescription>{error}</AlertDescription>
</Alert>
```

---

### Phase 3: Migrate RegisterPlayerModal

**File:** `src/components/RegisterPlayerModal.tsx`

Follow the same pattern as CreateTournamentModal:
1. Import shadcn components (Dialog, Button, Input, Label, Alert)
2. Replace modal structure with Dialog
3. Replace inputs with Label + Input
4. Replace buttons with Button component
5. Replace error display with Alert

**Key differences:**
- Has 3 form fields instead of 2 (name, email, DUPR)
- DUPR has helper text: use `<p className="text-sm text-muted-foreground mt-1">`

---

### Phase 4: Migrate Home Page

**File:** `src/app/page.tsx`

#### Step 4.1: Import Components
```typescript
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
```

#### Step 4.2: Replace Create Button

**Before:**
```tsx
<button
  onClick={() => setIsModalOpen(true)}
  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
>
  Create Tournament
</button>
```

**After:**
```tsx
<Button onClick={() => setIsModalOpen(true)}>
  Create Tournament
</Button>
```

#### Step 4.3: Replace Tournament Cards

**Before:**
```tsx
<Link
  href={`/tournaments/${tournament.id}`}
  className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all"
>
  <h2 className="text-xl font-semibold text-gray-900 mb-2">
    {tournament.name}
  </h2>
  <div className="space-y-1 text-sm text-gray-600">
    {/* tournament details */}
  </div>
</Link>
```

**After:**
```tsx
<Link href={`/tournaments/${tournament.id}`}>
  <Card className="hover:border-primary hover:shadow-lg transition-all cursor-pointer">
    <CardHeader>
      <CardTitle>{tournament.name}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-1 text-sm text-muted-foreground">
        {/* tournament details */}
      </div>
    </CardContent>
  </Card>
</Link>
```

---

### Phase 5: Migrate Match Detail Page

**File:** `src/app/matches/[id]/page.tsx`

#### Step 5.1: Import Components
```typescript
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
```

#### Step 5.2: Replace Status Badge

**Before:**
```tsx
<span
  className={`px-3 py-1 rounded-full text-sm font-medium ${
    match.status === 'live'
      ? 'bg-yellow-100 text-yellow-800'
      : 'bg-gray-100 text-gray-800'
  }`}
>
  {match.status}
</span>
```

**After:**
```tsx
<Badge variant={match.status === 'live' ? 'default' : 'secondary'}>
  {match.status}
</Badge>
```

#### Step 5.3: Replace Player Cards

**Before:**
```tsx
<div className="p-4 border border-gray-200 rounded-lg">
  <p className="text-lg font-medium text-gray-900">{player_a?.name || 'BYE'}</p>
  {player_a?.dupr && <p className="text-sm text-gray-600">DUPR: {player_a.dupr}</p>}
  {match.seed_a && <p className="text-sm text-gray-500">Seed #{match.seed_a}</p>}
</div>
```

**After:**
```tsx
<Card>
  <CardContent className="pt-6">
    <p className="text-lg font-medium">{player_a?.name || 'BYE'}</p>
    {player_a?.dupr && <p className="text-sm text-muted-foreground">DUPR: {player_a.dupr}</p>}
    {match.seed_a && <p className="text-sm text-muted-foreground">Seed #{match.seed_a}</p>}
  </CardContent>
</Card>
```

#### Step 5.4: Replace Score Inputs

**Before:**
```tsx
<input
  type="number"
  min="0"
  value={game.a}
  onChange={(e) => handleScoreChange(index, 'a', e.target.value)}
  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  placeholder="0"
/>
```

**After:**
```tsx
<Input
  type="number"
  min="0"
  value={game.a}
  onChange={(e) => handleScoreChange(index, 'a', e.target.value)}
  className="w-20"
  placeholder="0"
/>
```

#### Step 5.5: Replace Submit Button

**Before:**
```tsx
<button
  onClick={handleSubmitScore}
  disabled={submitting}
  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
>
  {submitting ? 'Submitting...' : 'Submit Score'}
</button>
```

**After:**
```tsx
<Button
  onClick={handleSubmitScore}
  disabled={submitting}
  className="w-full"
  variant="default"
>
  {submitting ? 'Submitting...' : 'Submit Score'}
</Button>
```

---

### Phase 6: Migrate TournamentFixtures Component

**File:** `src/components/TournamentFixtures.tsx`

This is the most complex component. Break it down by section.

#### Step 6.1: Import Components
```typescript
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
```

#### Step 6.2: Replace Main Tabs Navigation

**Before:**
```tsx
{(['fixtures', 'standings', 'table', 'stats', 'details'] as const).map((tab) => (
  <button
    key={tab}
    onClick={() => setSelectedTab(tab)}
    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
      selectedTab === tab
        ? 'bg-blue-600 text-white'
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    }`}
  >
    {tab.charAt(0).toUpperCase() + tab.slice(1)}
  </button>
))}
```

**After:**
```tsx
<Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as any)}>
  <TabsList className="grid w-full grid-cols-5">
    <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
    <TabsTrigger value="standings">Standings</TabsTrigger>
    <TabsTrigger value="table">Table</TabsTrigger>
    <TabsTrigger value="stats">Stats</TabsTrigger>
    <TabsTrigger value="details">Details</TabsTrigger>
  </TabsList>

  <TabsContent value="fixtures">
    {/* fixtures content */}
  </TabsContent>

  <TabsContent value="standings">
    {/* standings content */}
  </TabsContent>

  {/* ... other tabs */}
</Tabs>
```

#### Step 6.3: Replace Toggle Buttons (Format, View Mode)

**Before:**
```tsx
<button
  onClick={() => setFormatView('round-robin')}
  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
    formatView === 'round-robin'
      ? 'bg-blue-600 text-white'
      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
  }`}
>
  Round Robin
</button>
```

**After:**
```tsx
<Button
  variant={formatView === 'round-robin' ? 'default' : 'outline'}
  onClick={() => setFormatView('round-robin')}
>
  Round Robin
</Button>
```

#### Step 6.4: Replace Match Cards

**Before:**
```tsx
<div className="bg-green-50 border border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow">
  <div className="text-xs text-gray-600 mb-3">Match ID: {match.id.slice(0, 8)}</div>
  {/* match content */}
</div>
```

**After:**
```tsx
<Card className="bg-green-50 border-green-200 hover:shadow-md transition-shadow">
  <CardContent className="pt-4">
    <div className="text-xs text-muted-foreground mb-3">Match ID: {match.id.slice(0, 8)}</div>
    {/* match content */}
  </CardContent>
</Card>
```

#### Step 6.5: Replace Status Badges in Match Cards

**Before:**
```tsx
<div className={`px-2 py-1 rounded ${
  match.status === 'completed'
    ? 'bg-green-200 text-green-800'
    : match.status === 'live'
    ? 'bg-yellow-200 text-yellow-800'
    : 'bg-gray-200 text-gray-800'
}`}>
  {match.status === 'completed' ? 'Completed' : match.status}
</div>
```

**After:**
```tsx
<Badge
  variant={
    match.status === 'completed' ? 'default' :
    match.status === 'live' ? 'destructive' :
    'secondary'
  }
  className={
    match.status === 'completed' ? 'bg-green-600' : ''
  }
>
  {match.status === 'completed' ? 'Completed' : match.status}
</Badge>
```

#### Step 6.6: Replace Standings Tables

**Before:**
```tsx
<table className="w-full">
  <thead className="bg-gray-50 border-b border-gray-200">
    <tr>
      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
      {/* ... */}
    </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    {/* rows */}
  </tbody>
</table>
```

**After:**
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Rank</TableHead>
      <TableHead>Team</TableHead>
      {/* ... */}
    </TableRow>
  </TableHeader>
  <TableBody>
    {standingsByPool[pool]?.length > 0 ? (
      standingsByPool[pool].map((standing, index) => (
        <TableRow key={standing.teamId} className={index === 0 ? 'bg-green-50' : ''}>
          <TableCell>{index + 1}</TableCell>
          {/* ... */}
        </TableRow>
      ))
    ) : (
      <TableRow>
        <TableCell colSpan={9} className="text-center text-muted-foreground">
          No completed matches in this pool yet
        </TableCell>
      </TableRow>
    )}
  </TableBody>
</Table>
```

---

## Testing Checklist

After each phase, verify:

### Visual Testing
- [ ] Modals open/close correctly
- [ ] Forms are readable and properly spaced
- [ ] Buttons have proper hover states
- [ ] Cards have appropriate shadows/borders
- [ ] Tables are properly aligned
- [ ] Tabs switch correctly
- [ ] Badges display with correct colors

### Functional Testing
- [ ] Tournament creation works
- [ ] Player registration works
- [ ] Match scoring works
- [ ] All buttons trigger correct actions
- [ ] Form validation still works
- [ ] Error messages display correctly
- [ ] Navigation between pages works

### Responsive Testing
- [ ] Test on mobile viewport (375px)
- [ ] Test on tablet viewport (768px)
- [ ] Test on desktop viewport (1280px)
- [ ] Ensure tables scroll horizontally on mobile
- [ ] Verify modals fit on small screens

---

## Common Pitfalls & Solutions

### Issue 1: Dialog closes when clicking inside
**Solution:** The DialogContent automatically handles outside clicks. Don't add `onOpenChange` to individual form elements.

### Issue 2: Button variants don't match old colors
**Solution:** Use custom className to override:
```tsx
<Button className="bg-green-600 hover:bg-green-700">Submit</Button>
```

### Issue 3: Card padding looks different
**Solution:** CardContent has default padding. Adjust with `className="pt-6"` or remove padding with `className="p-0"`.

### Issue 4: Table columns not aligned
**Solution:** Use consistent width classes on TableHead and TableCell:
```tsx
<TableHead className="w-24">Rank</TableHead>
<TableCell className="w-24">{index + 1}</TableCell>
```

### Issue 5: Tabs content disappears
**Solution:** Ensure TabsContent wraps the entire section, not just part of it.

---

## Migration Order Recommendation

1. **Start small:** CreateTournamentModal (simplest component)
2. **Next:** RegisterPlayerModal (similar pattern)
3. **Then:** Home page (cards and buttons)
4. **Next:** Match detail page (forms, badges, cards)
5. **Finally:** TournamentFixtures (most complex - tabs, tables, cards)

---

## Rollback Plan

If issues arise, shadcn components are just regular React components. You can:
1. Keep old component files as `.backup.tsx`
2. Git stash changes and revert
3. Gradually migrate one component at a time
4. Use old and new components side-by-side during transition

---

## Final Notes

- **No Backend Changes:** All API endpoints remain unchanged
- **Functionality Preserved:** All state management, event handlers, and business logic stays the same
- **Styling Updates:** Expect slightly different visual appearance (cleaner, more consistent)
- **Performance:** shadcn components are just styled components, no performance impact
- **Accessibility:** shadcn components have better ARIA labels and keyboard navigation

**Estimated Migration Time:**
- Phase 1 (Setup): 15 minutes
- Phase 2-3 (Modals): 30 minutes each
- Phase 4 (Home): 20 minutes
- Phase 5 (Match Detail): 30 minutes
- Phase 6 (TournamentFixtures): 1-2 hours
- **Total: 3-4 hours**
