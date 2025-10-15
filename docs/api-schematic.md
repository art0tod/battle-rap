# Battle Rap API – Endpoint Map

This reference groups every Express route exposed under `src/routes` and summarizes inputs, auth, and responses as implemented today. Use it to wire up the frontend and cross-check the Bruno collection.

## Meta
| Method | Path | Auth | Description | Body / Params | Response Highlights |
| --- | --- | --- | --- | --- | --- |
| GET | `/` | none | Health/info probe | – | `{ name, version }` |

## Auth
| Method | Path | Auth | Description | Body / Params | Response Highlights |
| --- | --- | --- | --- | --- | --- |
| POST | `/auth/register` | none | Register user, optional preset roles | JSON: `email`, `password` (>=8), `displayName` (>=2), optional `roles[]` | `201 { user, token }` |
| POST | `/auth/login` | none | Issue token for credentials | JSON: `email`, `password` | `{ user, token }` |

## Users & Profiles
| Method | Path | Auth | Description | Body / Params | Response Highlights |
| --- | --- | --- | --- | --- | --- |
| GET | `/users/me` | bearer (any role) | Current user snapshot | Header: `Authorization` | `{ user }` |
| GET | `/users/:userId` | bearer; self or `admin`/`moderator` | Inspect user by id | – | `{ user }` |
| POST | `/users/:userId/roles` | bearer `admin` | Add roles without removal | JSON: `roles[]` (`admin`, `moderator`, `judge`, `artist`) | `{ user }` |
| PUT | `/users/:userId/roles` | bearer `admin` | Replace roles | JSON: `roles[]` | `{ user }` |
| GET | `/users/:userId/artist-profile` | bearer; self or staff | Fetch artist profile | – | `{ profile }` |
| PUT | `/users/:userId/artist-profile` | bearer; self or staff | Upsert artist profile | JSON optional: `avatarKey`, `bio` (<=2000), `socials` map of URLs | `{ profile }` |

## Admin
| Method | Path | Auth | Description | Body / Params | Response Highlights |
| --- | --- | --- | --- | --- | --- |
| GET | `/admin/dashboard` | bearer `admin` | Platform stats | – | `{ stats }` |
| GET | `/admin/users` | bearer `admin` | List all users | – | `{ users[] }` |
| PATCH | `/admin/submissions/:submissionId/moderation` | bearer `admin` | Lock/unlock submission, adjust status | JSON: `locked` (bool), optional `status` (`submitted`, `locked`, `disqualified`, `draft`) | `{ submission }` |
| POST | `/admin/media-assets` | bearer `admin` | Register uploaded media | JSON: `kind` (`audio` \| `video` \| ... per `MEDIA_KINDS`), `storageKey`, `mime`, `sizeBytes`, optional `durationSec` (required for audio) | `201 { media }` |
| GET | `/admin/media-assets` | bearer `admin` | Filter media assets | Query: optional `kind` | `{ mediaAssets[] }` |

## Tournaments
| Method | Path | Auth | Description | Body / Params | Response Highlights |
| --- | --- | --- | --- | --- | --- |
| GET | `/tournaments` | optional bearer for staff view | List tournaments (drafts visible only to staff) | – | `{ tournaments[] }` |
| POST | `/tournaments` | bearer `admin`/`moderator` | Create tournament | JSON: `title` (>=3), `maxBracketSize` (128 \| 256) | `201 { tournament }` |
| GET | `/tournaments/:tournamentId` | optional bearer for staff view | Fetch tournament with participants/judges; drafts require staff | Path: `tournamentId` | `{ tournament, participants[], judges[] }` (limited fields for public) |
| PATCH | `/tournaments/:tournamentId/status` | bearer `admin`/`moderator` | Set status | JSON: `status` (`draft`, `active`, `finished`) | `{ tournament }` |
| POST | `/tournaments/:tournamentId/participants` | bearer; user matching `userId` or staff | Register participant | JSON: `userId` (UUID) | `201 { participant }` |
| GET | `/tournaments/:tournamentId/participants` | bearer (any role) | List participants | – | `{ participants[] }` |
| POST | `/tournaments/:tournamentId/judges` | bearer `admin`/`moderator` | Assign judge | JSON: `userId` (UUID) | `201 { judge }` |
| GET | `/tournaments/:tournamentId/judges` | bearer (any role) | List judges | – | `{ judges[] }` |
| POST | `/tournaments/:tournamentId/rounds` | bearer `admin`/`moderator` | Create round under tournament | JSON: `kind` (`qualifier1`, `qualifier2`, `bracket`), `number` (int>0), `scoring` (`pass_fail`, `points`, `rubric`), optional `rubricKeys[]` | `201 { round }` |
| GET | `/tournaments/:tournamentId/rounds` | none (drafts hidden unless staff via bearer) | List rounds for tournament | – | `{ rounds[] }` |

## Rounds
| Method | Path | Auth | Description | Body / Params | Response Highlights |
| --- | --- | --- | --- | --- | --- |
| GET | `/rounds/:roundId` | none (staff-only drafts via bearer) | Round details | – | `{ round }` |
| GET | `/rounds/:roundId/criteria` | none (staff-only drafts via bearer) | Evaluation criteria for round | – | `{ criteria[] }` |

## Matches & Battles
| Method | Path | Auth | Description | Body / Params | Response Highlights |
| --- | --- | --- | --- | --- | --- |
| POST | `/rounds/:roundId/matches` | bearer `admin`/`moderator` | Create match | JSON optional: `startsAt` (ISO timestamp) | `201 { match }` |
| GET | `/rounds/:roundId/matches` | none (drafts hidden unless staff) | List matches for round | – | `{ matches[] }` |
| GET | `/rounds/:roundId/battles` | none | Alias for match list | – | `{ matches[] }` |
| GET | `/battles/:matchId` | none (verifies round visibility) | Match detail | – | `{ match }` |
| POST | `/matches/:matchId/participants` | bearer `admin`/`moderator` | Seed participant into match | JSON: `participantId` (UUID), optional `seed` (int>0) | `201 { participant }` |
| GET | `/matches/:matchId/participants` | bearer (any role) | Participants in match | – | `{ participants[] }` |
| POST | `/matches/:matchId/tracks` | bearer `artist`/`admin`/`moderator` | Upload track for match | JSON: `participantId` (UUID), `audioId` (UUID), optional `lyrics` | `201 { track }` |
| GET | `/matches/:matchId/tracks` | bearer (any role) | Tracks for match | – | `{ tracks[] }` |

## Submissions
| Method | Path | Auth | Description | Body / Params | Response Highlights |
| --- | --- | --- | --- | --- | --- |
| POST | `/rounds/:roundId/submissions/draft` | bearer; artist or staff | Save draft submission | JSON: `participantId`, `audioId`, `lyrics` | `{ submission }` (status draft) |
| POST | `/rounds/:roundId/submissions/submit` | bearer; artist or staff | Finalize submission | JSON: `participantId`, `audioId`, `lyrics` | `{ submission }` (status submitted) |
| GET | `/rounds/:roundId/submissions` | none (non-staff see only `submitted`/`locked`) | List submissions for round | – | `{ submissions[] }` (filtered) |

## Evaluations
| Method | Path | Auth | Description | Body / Params | Response Highlights |
| --- | --- | --- | --- | --- | --- |
| POST | `/evaluations/submission/:submissionId` | bearer `judge`/`admin`/`moderator` | Record submission evaluation | JSON optional: `pass` (bool), `score` (int), `comment` (<=2000) | `201 { evaluation }` |
| POST | `/evaluations/match/:matchId` | bearer `judge`/`admin`/`moderator` | Record match evaluation | JSON: `rubric { [key]: number }`, optional `comment` | `201 { evaluation }` |
| GET | `/evaluations/submission/:submissionId` | bearer (any role) | List evaluations for submission | – | `{ evaluations[] }` |
| GET | `/evaluations/match/:matchId` | bearer (any role) | List evaluations for match | – | `{ evaluations[] }` |

## Notes for Frontend Integration
- **Auth tokens**: Bearer tokens unlock staff-only data and allow Bruno scripts to chain requests. Non-authenticated calls are still subject to visibility checks (`ensureTournamentVisible`, `ensureRoundVisible`).
- **Role checks**: Middlewares enforce roles per route; align frontend UX (hide admin-only actions).
- **UUID payloads**: Most link operations expect UUID strings; ensure the frontend formats IDs correctly.
- **Response shapes**: Controllers generally wrap data (`{ tournament }`, `{ participants }`), so unpack nested objects client-side.
- **Draft visibility**: Draft tournaments/rounds/matches are surfaced only to staff when a valid token is attached; design UI states accordingly.
