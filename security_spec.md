# Security Specification for Lineage 2M Guild Boss Timer

## 1. Data Invariants
1. Boss records must belong to either `main` or `sub` server and have a positive `respawnMinutes`.
2. Boss IDs and User IDs must adhere to safe character constraints (`[a-zA-Z0-9_\-]+`) and max length 128.
3. Users collection stores guild members and admins; role must be either `admin` or `member`.
4. Master Admin user cannot be deleted.
5. All write operations require authorized guild access.
6. Settings documents have bounded field lengths to avoid resource exhaustion.

## 2. The "Dirty Dozen" Payloads
1. Injection into Boss ID: 2KB junk character string.
2. Invariant Breach: Boss with negative respawn minutes (`-500`).
3. Server Tampering: Boss with invalid server type (`"private_hacked"`).
4. Privilege Escalation: Non-admin changing their own role to `"admin"`.
5. Ghost Field Injection: Adding `isOwner: true` to a boss record.
6. User ID Poisoning: Adding a user with path containing `../` or SQL injection string.
7. Settings Exhaustion: 10MB Discord webhook URL payload.
8. Unauthenticated Delete: Unsigned client deleting master settings.
9. Malformed Status: Boss status set to `"instant_kill_all"`.
10. Anonymous Destruction: Wiping the entire `/bosses` collection.
11. PII/Credential Leak: Exposing system keys without security perimeter.
12. Schema Mutation: Overwriting settings document with an array or raw string.

## 3. Test Verification Plan
- Unit tests against rules using Firebase rules testing harness.
- Verification that all 12 dirty payloads are rejected with PERMISSION_DENIED.
