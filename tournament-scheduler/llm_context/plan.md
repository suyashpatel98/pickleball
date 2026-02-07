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

## 🚧 Phase 0.5: Authentication & Multi-Tenant SaaS

**Priority:** CRITICAL - Business Foundation

**Goal:** Transform single-use tool into monetizable multi-tenant SaaS platform

### Features

#### 0.5.1 Authentication System
- NextAuth.js integration for directors
- Email/password authentication
- OAuth providers (Google, GitHub)
- Email verification
- Password reset flow
- Session management

#### 0.5.2 Multi-Tenancy Foundation
- Add `created_by` (user_id) to tournaments table
- Add `user_id` to track ownership
- Supabase Row-Level Security (RLS) policies:
  - Directors can only see/edit their tournaments
  - Public can view published tournaments
  - Players can access via token
- Isolate data per organization/director

#### 0.5.3 Director Dashboard
- `/dashboard` route showing "My Tournaments"
- List all tournaments created by logged-in user
- Quick actions (Manage, View Public, Share Links)
- Tournament status indicators (Live, Scheduled, Archived)
- "Create New Tournament" button
- Plan/subscription display

#### 0.5.4 Public Discovery
- `/discover` page for browsing public tournaments
- Search by name, location, date
- Filter by status (Live, Upcoming, Completed)
- Click to view public tournament page
- SEO-friendly for Google discovery

#### 0.5.5 Token-Based Access
- **Player tokens:**
  - Generate UUID token on registration
  - Store in registrations table
  - URL format: `/tournaments/{id}/players/{token}`
  - No expiration (can access historical data)
- **Court URLs:**
  - Already public (no change needed)
  - Optional: Add 4-digit PIN protection

#### 0.5.6 Access Control Updates
- Protect `/tournaments/{id}/manage` route (auth required)
- Check user owns tournament before allowing access
- Keep public routes open (no auth)
- Graceful handling of unauthorized access
- Login redirect with return URL

#### 0.5.7 Onboarding Flow
- Welcome page after signup
- Quick tutorial (create tournament → add courts → register players)
- Sample tournament template (optional)
- Help documentation links

### Technical Pointers
- Use NextAuth.js with Supabase adapter
- Store sessions in database
- RLS policies in Supabase:
  ```sql
  CREATE POLICY "users_own_tournaments" ON tournaments
    FOR ALL USING (auth.uid() = created_by);

  CREATE POLICY "public_can_view" ON tournaments
    FOR SELECT USING (is_published = true);
  ```
- Middleware to protect routes
- Token validation for player URLs
- Add `is_published` boolean to tournaments table

### Success Criteria
- Directors can sign up and create tournaments
- Each director only sees their tournaments
- Public can discover and view tournaments
- Players can access personalized views via token
- No data leakage between directors
- Smooth login/logout experience

### Database Changes
```sql
-- Add to tournaments table
ALTER TABLE tournaments
  ADD COLUMN created_by UUID REFERENCES auth.users(id),
  ADD COLUMN is_published BOOLEAN DEFAULT true;

-- Add to registrations table (for player tokens)
ALTER TABLE registrations
  ADD COLUMN player_token UUID DEFAULT gen_random_uuid();

-- Create indexes
CREATE INDEX idx_tournaments_created_by ON tournaments(created_by);
CREATE INDEX idx_registrations_player_token ON registrations(player_token);
```

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

### Business Features
- Team/organization accounts (multiple directors per org)
- Payment integration (Stripe) for subscriptions
- Custom domain support for Enterprise
- White-label branding options
- API access for integrations

### Advanced Tournament Features
- Multi-day tournament support with pause/resume
- Player profiles and tournament history
- Ranking system integration (DUPR)
- Match scheduling optimization algorithms

### Technical Improvements
- Horizontal scaling for large tournaments (100+ courts)
- Database optimization and query caching
- CDN for static assets
- Enhanced monitoring and alerting
- Automated backups and disaster recovery

---

## 📊 Implementation Status

### Overall Progress

| Phase | Name | Status | Completion |
|-------|------|--------|------------|
| Phase 0 | Core MVP | ✅ Complete | 100% |
| **Phase 0.5** | **Auth & Multi-Tenancy** | 🔲 Not Started | 0% |
| Phase 1 | Real-time Updates | 🔲 Not Started | 0% |
| Phase 2 | Player Experience | 🔲 Not Started | 0% |
| Phase 3 | Notifications | 🔲 Not Started | 0% |
| Phase 4 | Referee Enhancements | 🔲 Not Started | 0% |
| Phase 5 | Director Tools | 🔲 Not Started | 0% |
| Phase 6 | Reporting | 🔲 Not Started | 0% |

### Current Phase: Phase 0 Complete ✅

**Next Critical Phase:** Phase 0.5 (Authentication & Multi-Tenancy)

**Why This Must Come First:**
- **Business Requirement:** Can't sell SaaS without user accounts
- **Data Isolation:** Must separate director data before scaling
- **Monetization:** Need to track who owns what to bill correctly
- **Foundation:** All future phases depend on multi-tenant architecture
- **Security:** Protect tournament management from unauthorized access

**After Phase 0.5:**
Then proceed to Phase 1 (Real-time Updates) for UX improvements.

---

## 🎯 Priority Recommendations

### Immediate (Before Launch)
**Phase 0.5:** Authentication & Multi-Tenancy
- **Timeline:** 1-2 weeks
- **Blocker:** Can't launch SaaS without this
- **Impact:** Enables business model

### High Priority (First 3 months after launch)
1. **Phase 1:** Real-time Updates - Foundation for live experience
2. **Phase 2:** Player Experience - High value for participants

### Medium Priority (Months 4-9)
3. **Phase 3:** Notifications - Keep users engaged
4. **Phase 4:** Referee Enhancements - Quality of life improvements

### Lower Priority (Months 10-18)
5. **Phase 5:** Advanced Director Tools - Power user features
6. **Phase 6:** Reporting & Export - Post-tournament value

### Long-term (18+ months)
7. Future Considerations - Enterprise features, scaling, advanced analytics

---

## 📝 Notes

### Implementation Guidelines
- **Phase 0.5 is MANDATORY** before any other phases
- Phases 1-6 can be implemented in order or reprioritized based on user feedback
- Some features within phases can be parallelized
- Each phase should include tests and documentation
- Technical debt should be addressed between phases
- Security and performance are continuous concerns, not phase-specific

### Launch Strategy
1. Complete Phase 0 (✅ Done)
2. Complete Phase 0.5 (Auth & Multi-Tenancy)
3. Soft launch to beta users (free tier)
4. Gather feedback while building Phase 1
5. Add paid tiers when real-time is ready
6. Scale marketing after Phase 2 (player experience)

### Success Metrics by Phase
- **Phase 0.5:** Directors can create accounts and tournaments are isolated
- **Phase 1:** 90% of users don't manually refresh during tournament
- **Phase 2:** 50%+ of players visit their personal view during tournament
- **Phase 3:** 70%+ email open rate for match notifications
- **Phase 4:** <5% score correction requests (good enough without edit)
- **Phase 5:** Directors use manual reassignment <10% of the time (automation works)
- **Phase 6:** 30%+ of directors export tournament data post-event

---

**Last Updated:** 2026-02-07
**Version:** 2.0 (Added Phase 0.5 - Multi-Tenant SaaS Foundation)
