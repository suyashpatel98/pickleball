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