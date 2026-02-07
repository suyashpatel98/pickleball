  Separate the concerns:

  For Viewing (Spectators/Players):
  - /matches/{id} → Read-only match detail
    - Shows game-by-game scores
    - Shows winner
    - No submission form
    - Beautiful presentation for spectators

  For Submitting (Referees):
  - /courts/{court-id} → Court-centric referee interface
    - Auto-loads current match for this court
    - Game-by-game entry
    - "Match Complete" button
    - Next match auto-appears
    - Stays on this URL all day

  For Tournament Overview (Spectators):
  - /tournaments/{id} → Live scoreboard
    - Court grid showing all active matches
    - Real-time updates
    - Links to match details (/matches/{id})
    - NO submit buttons

  For Director:
  - /tournaments/{id}/manage → Dashboard
    - Court overview
    - Queue management
    - Can override scores if needed