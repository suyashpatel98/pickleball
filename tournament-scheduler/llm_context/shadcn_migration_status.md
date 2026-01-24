## Migration status

### Phase 1 - done

### Phase 2 - done
- Migrated CreateTournamentModal to use shadcn components:
  - Replaced custom modal overlay with Dialog/DialogContent/DialogHeader/DialogTitle
  - Replaced form inputs with Label + Input components
  - Replaced buttons with Button component (variant: default, outline)
  - Replaced error display with Alert component (variant: destructive)
  - All functionality preserved, only visual styling changed

### Phase 3 - done
- Migrated RegisterPlayerModal to use shadcn components:
  - Replaced custom modal overlay with Dialog/DialogContent/DialogHeader/DialogTitle
  - Replaced form inputs (name, email, DUPR) with Label + Input components
  - Replaced buttons with Button component (variant: default, outline)
  - Replaced error display with Alert component (variant: destructive)
  - DUPR helper text now uses text-muted-foreground class
  - All functionality preserved (player registration, validation, etc.)

### Phase 4 - done
- Migrated Home page (src/app/page.tsx) to use shadcn components:
  - Replaced create tournament button with Button component
  - Replaced tournament cards with Card/CardHeader/CardTitle/CardContent components
  - Updated text colors to use text-muted-foreground for consistency
  - Added hover:border-primary and cursor-pointer to cards for interactivity
  - All functionality preserved (tournament list, modal trigger, navigation)

### Phase 5 - done
- Migrated Match Detail page (src/app/matches/[id]/page.tsx) to use shadcn components:
  - Replaced status badges with Badge component (variant: default for live, secondary for others)
  - Replaced player cards with Card/CardContent components
  - Replaced score input fields with Input component
  - Replaced all buttons with Button component:
    - Submit button with custom green background (bg-green-600)
    - Remove game button with variant="ghost" and size="icon"
    - Add game button with variant="link"
  - Updated link colors to use text-primary
  - Updated text colors to use text-muted-foreground for secondary text
  - Winner badge uses custom green background (bg-green-600)
  - All functionality preserved (score entry, validation, submission, navigation)

### Phase 6 - done
- Migrated TournamentFixtures component (src/components/TournamentFixtures.tsx) to use shadcn components:
  - Replaced main navigation tabs with Tabs/TabsList/TabsTrigger/TabsContent components
  - Replaced all toggle buttons with Button component:
    - Format selection buttons (variant: default/outline)
    - Round navigation buttons (variant: default/outline, size: sm)
    - View mode buttons (variant: default/secondary)
    - Pool selection buttons (variant: default/outline, size: icon)
  - Replaced match cards with Card/CardContent components
  - Replaced match status badges with Badge component (custom bg-green-600 for completed)
  - Replaced all tables with Table/TableHeader/TableBody/TableRow/TableHead/TableCell components:
    - Pool standings tables
    - Overall standings table
  - Replaced pool header cards with Card components (bg-primary for headers)
  - Replaced legend and info cards with Card/CardContent components
  - Updated text colors to use text-muted-foreground and text-primary
  - Pool badge in overall standings uses Badge with variant="secondary"
  - All functionality preserved (tab navigation, filtering, sorting, standings calculations)