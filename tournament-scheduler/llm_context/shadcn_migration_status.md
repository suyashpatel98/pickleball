## Migration status

### Phase 1 - done

### Phase 2 - done
- Migrated CreateTournamentModal to use shadcn components:
  - Replaced custom modal overlay with Dialog/DialogContent/DialogHeader/DialogTitle
  - Replaced form inputs with Label + Input components
  - Replaced buttons with Button component (variant: default, outline)
  - Replaced error display with Alert component (variant: destructive)
  - All functionality preserved, only visual styling changed