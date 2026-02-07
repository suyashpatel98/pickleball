# Tournament Scheduler - Implementation Phases

## Overview

This document outlines the implementation roadmap for the tournament scheduling application. Features are organized into phases based on dependencies, user value, and technical complexity.

---

## ✅ Phase 0: Core MVP (COMPLETED)

**Status:** ✅ Complete

### Implemented Features
- Multi-actor architecture (Director, Referee, Spectator views)
- Court management system (create, delete, list)
- Automatic court assignment (round-robin distribution)
- Tournament creation and player registration
- Bracket and pool generation
- Round advancement workflow with automatic winner pairing
- Court-centric referee view with auto-loading matches
- Game-by-game scoring (best of 3)
- Match detail view (read-only)
- Tournament progress tracking
- Multiple view modes (pool-wise, court-wise, status-wise)

### Key Achievements
- Referees can work entire tournament on single court URL
- Directors can monitor all courts and advance rounds
- Spectators can view fixtures, standings, and tables
- Complete tournament lifecycle from setup to champion

---

## 🚧 Phase 1: Real-time Updates & Live Experience

**Priority:** High - Foundation for better UX across all actors

**Goal:** Eliminate manual refreshing and create live tournament experience

### Features

#### 1.1 WebSocket/Supabase Realtime Integration
- Set up Supabase Realtime subscriptions
- Subscribe to match updates, court status changes
- Handle connection/disconnection gracefully
- Implement reconnection logic

#### 1.2 Live Updates Across Views
- **Spectator View:** Auto-update when scores change
- **Director Dashboard:** Live court status updates
- **Referee View:** See when next match is assigned
- Live match indicators (🔴 LIVE badges)

#### 1.3 Live Scoreboard Mode
- Auto-cycling through active courts
- Dedicated scoreboard display URL
- Large text for projection/TV display
- Configurable cycle speed

#### 1.4 Auto-Refresh Improvements
- Replace 1-second delay with instant updates
- Optimistic UI updates
- Show loading states during sync

### Technical Pointers
- Use Supabase Realtime channels for match and court tables
- Implement React hooks for subscriptions (useEffect cleanup)
- Consider using SWR or React Query for state management
- Handle race conditions with optimistic updates

### Success Criteria
- Score appears on all views within 1 second of submission
- No manual refresh needed
- Graceful degradation if WebSocket fails
- Works with multiple concurrent users

---

## 🚧 Phase 2: Player Personal Experience

**Priority:** High - Major value add for participants

**Goal:** Personalized view for each player to track their tournament journey

### Features

#### 2.1 Player Personal View (`/tournaments/{id}/players/{player-id}`)
- Next match display with countdown and court location
- Match history (completed matches with scores)
- Future bracket path (if they win)
- Highlighted path through bracket
- Tournament status (active, eliminated, champion)

#### 2.2 Player Registration Improvements
- Generate unique player access link on registration
- Include link in registration confirmation
- Bookmark-friendly URL
- Share via email/SMS

#### 2.3 Player Dashboard Features
- Quick stats (wins, losses, games won/lost)
- Opponent information for next match
- Estimated time until next match
- Court directions/location info

#### 2.4 Post-Elimination Experience
- Continue following tournament
- See who eliminated you and their progress
- Switch to full bracket view

### Technical Pointers
- Use player_id in URL for direct access
- No authentication needed initially (obscure URL is sufficient)
- Filter matches where player_id in (slot_a, slot_b) or team_a/team_b
- Calculate "path to finals" by traversing bracket
- Use real-time updates from Phase 1

### Success Criteria
- Players can access their view via unique link
- Next match clearly displayed with court and time
- Match history accurate and complete
- Works for both singles and doubles

---

## 🚧 Phase 3: Notification System

**Priority:** Medium - Engagement and communication

**Goal:** Keep players and directors informed via email/SMS/push

### Features

#### 3.1 Email Notifications
- Registration confirmation with player link
- Bracket published notification
- "Your match in 15 minutes" reminder
- Match result notification
- Next match assignment
- Tournament completion

#### 3.2 Tournament Director Notifications
- All matches in round completed (ready to advance)
- Referee calls for help
- Match disputed/needs attention
- Tournament milestones

#### 3.3 Optional SMS Notifications
- Critical alerts only (match starting soon)
- Opt-in during registration
- Use Twilio or similar service

#### 3.4 Push Notifications (Future)
- PWA implementation
- Browser push for web users
- Mobile app push if built

#### 3.5 Notification Preferences
- Player can enable/disable notification types
- Email vs SMS preference
- Quiet hours

### Technical Pointers
- Use email service (Resend, SendGrid, or Supabase edge functions)
- Create notification queue/job system
- Template engine for email content
- Store notification preferences in players table
- Consider time zones for "15 minutes before" logic
- Rate limiting to prevent spam

### Success Criteria
- Players receive timely match reminders
- Directors alerted to critical events
- < 5% email bounce rate
- Unsubscribe option works

---

## 🚧 Phase 4: Referee Quality of Life Enhancements

**Priority:** Medium - Improve referee experience

**Goal:** Handle errors, offline scenarios, and convenience features

### Features

#### 4.1 Score Error Correction
- "Edit Last Score" button (available for 2 minutes)
- Show warning if changing winner
- Update downstream matches if winner changes
- Audit log of score changes

#### 4.2 Offline Capability
- Service worker for offline access
- Queue score submissions when offline
- Sync when connection returns
- Show offline indicator
- Persist state in IndexedDB

#### 4.3 QR Code Generation
- Generate QR code for each court URL
- Print-friendly court assignment sheets
- Display QR in director dashboard
- Easy scanning for referees

#### 4.4 Mark Match as "In Progress"
- Button to mark match started
- Shows "🔴 LIVE" indicator
- Alerts players match has started
- Director sees active courts

#### 4.5 Better Validation & UX
- Confirm before completing match
- Show winner calculation preview
- Warn if score seems unusual (e.g., 3-11)
- Add notes/comments to match

### Technical Pointers
- Use service workers for offline (Next.js PWA)
- IndexedDB for offline score queue
- QR code library (qrcode.react)
- Time-based edit window (check created_at)
- Optimistic UI with rollback on error
- Background sync API for queued scores

### Success Criteria
- Referees can correct scores within window
- Works offline with graceful sync
- QR codes easy to scan and use
- Live indicator visible to all

---

## 🚧 Phase 5: Advanced Director Tools

**Priority:** Low-Medium - Power user features

**Goal:** Give directors full control and flexibility

### Features

#### 5.1 Manual Court Reassignment
- Drag-and-drop matches between courts
- Reassign if court unavailable
- Bulk reassignment
- Preserve match schedule

#### 5.2 Score Override
- Director can edit any score
- Requires confirmation
- Audit trail of changes
- Handle winner changes

#### 5.3 Advanced Match States
- Expand states: `scheduled → checked_in → players_ready → live → completed → confirmed`
- Player check-in system
- Track when both players present
- Delay match start until ready

#### 5.4 Match Timing & Projections
- Record actual match start/end times
- Calculate average match duration
- Project tournament completion time
- Show estimated start time for upcoming matches

#### 5.5 Court Availability Management
- Mark court as unavailable/maintenance
- Automatically reassign matches from unavailable courts
- Set court capacity (simultaneous matches)
- Court-specific rules/settings

### Technical Pointers
- Use drag-and-drop library (react-beautiful-dnd or dnd-kit)
- Add state machine for match states
- Timestamps for state transitions
- Calculate projections based on historical data
- Cache calculations for performance

### Success Criteria
- Directors can handle edge cases
- Reassignment is intuitive
- Projections accurate within 20%
- Audit trail complete

---

## 🚧 Phase 6: Reporting & Post-Tournament Features

**Priority:** Low - Nice to have

**Goal:** Export data and analyze results

### Features

#### 6.1 PDF Bracket Export
- Generate printable bracket
- Multiple formats (tree view, table view)
- Include all scores
- Branding/customization

#### 6.2 Tournament Archive
- Mark tournament as archived
- Read-only historical view
- Search archived tournaments
- Restore if needed

#### 6.3 Statistics & Reports
- Player performance across tournaments
- Win/loss records
- DUPR tracking over time
- Tournament summaries

#### 6.4 Data Export
- Export to CSV/Excel
- Match history
- Player roster
- Score sheets

#### 6.5 Tournament Templates
- Save tournament settings as template
- Quick create from template
- Share templates

### Technical Pointers
- Use PDF generation library (jsPDF, react-pdf, or Puppeteer)
- Archive flag in tournaments table
- Analytics queries for statistics
- CSV export with proper formatting
- Consider data retention policies

### Success Criteria
- PDF bracket readable and accurate
- Archive preserves all data
- Statistics provide insights
- Export works for large tournaments

---

## 🔮 Future Considerations (Beyond Phase 6)

### Advanced Features
- Multi-day tournament support with pause/resume
- Concurrent tournament management
- Team/organization accounts
- Payment integration for entry fees
- Live streaming integration
- Mobile native apps (iOS/Android)
- Tournament discovery/listing page
- Public tournament calendar
- Social sharing features
- Player profiles and history
- Ranking system integration
- Match scheduling AI (optimize for fairness/efficiency)

### Technical Improvements
- Horizontal scaling for large tournaments
- Database optimization for 100+ concurrent matches
- CDN for static assets
- Rate limiting and DDoS protection
- Automated backups
- Monitoring and alerting
- A/B testing framework

---

## 📊 Implementation Status

### Overall Progress

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 0: Core MVP | ✅ Complete | 100% |
| Phase 1: Real-time Updates | 🔲 Not Started | 0% |
| Phase 2: Player Experience | 🔲 Not Started | 0% |
| Phase 3: Notifications | 🔲 Not Started | 0% |
| Phase 4: Referee Enhancements | 🔲 Not Started | 0% |
| Phase 5: Director Tools | 🔲 Not Started | 0% |
| Phase 6: Reporting | 🔲 Not Started | 0% |

### Current Phase: Phase 0 Complete ✅

**Next Recommended Phase:** Phase 1 (Real-time Updates)

**Reasoning:**
- Real-time updates provide foundation for better UX
- Benefits all actors (players, directors, referees, spectators)
- Enables richer features in subsequent phases
- Relatively straightforward with Supabase Realtime
- High user impact with moderate technical complexity

---

## 🎯 Priority Recommendations

### High Priority (Next 3-6 months)
1. **Phase 1:** Real-time Updates - Foundation for live experience
2. **Phase 2:** Player Experience - High value for participants
3. **Phase 3:** Notifications - Keep users engaged

### Medium Priority (6-12 months)
4. **Phase 4:** Referee Enhancements - Quality of life improvements
5. **Phase 5:** Advanced Director Tools - Power user features

### Low Priority (12+ months)
6. **Phase 6:** Reporting & Export - Post-tournament value
7. Future Considerations - Long-term vision

---

## 📝 Notes

- Each phase can be implemented independently
- Some features within phases can be parallelized
- User feedback should guide priority adjustments
- Technical debt should be addressed between phases
- Security and performance should be continuous concerns
- Documentation should be updated with each phase

---

**Last Updated:** 2026-02-07
**Version:** 1.0
