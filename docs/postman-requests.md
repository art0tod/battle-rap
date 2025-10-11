# Battle Rap API – Quick Postman Guide

Set the collection `baseUrl` variable to `http://localhost:3000/api`. Every request assumes an `Authorization: Bearer {{token}}` header unless noted.

## Auth
- **Register** (no auth)  
  `POST {{baseUrl}}/auth/register`  
  ```json
  {
    "email": "admin@example.com",
    "password": "ChangeMe123!",
    "displayName": "Super Admin",
    "roles": ["admin"]
  }
  ```
- **Login** (no auth)  
  `POST {{baseUrl}}/auth/login`  
  ```json
  {
    "email": "admin@example.com",
    "password": "ChangeMe123!"
  }
  ```
  Copy `token` from the response into the collection variable `token`.

## Users
- **Me**  
  `GET {{baseUrl}}/users/me`
- **Get User (admin/moderator or self)**  
  `GET {{baseUrl}}/users/{{userId}}`
- **Add Roles (admin)**  
  `POST {{baseUrl}}/users/{{userId}}/roles`  
  ```json
  { "roles": ["judge"] }
  ```
- **Replace Roles (admin)**  
  `PUT {{baseUrl}}/users/{{userId}}/roles`
- **Artist Profile (self/admin/moderator)**  
  `PUT {{baseUrl}}/users/{{userId}}/artist-profile`  
  ```json
  {
    "avatarKey": "media/avatars/artist-01.png",
    "bio": "MC Example – punchlines & flow.",
    "socials": { "vk": "https://vk.com/example" }
  }
  ```

## Admin (admin role required)
- **Dashboard Metrics**  
  `GET {{baseUrl}}/admin/dashboard`
- **List Users**  
  `GET {{baseUrl}}/admin/users`
- **Lock / Unlock Submission**  
  `PATCH {{baseUrl}}/admin/submissions/{{submissionId}}/moderation`  
  ```json
  { "locked": true, "status": "locked" }
  ```
- **Create Media Asset Stub**  
  `POST {{baseUrl}}/admin/media-assets`  
  ```json
  {
    "kind": "audio",
    "storageKey": "media/audio/qualifier-001.mp3",
    "mime": "audio/mpeg",
    "sizeBytes": 4200000,
    "durationSec": 95.4
  }
  ```
- **List Media Assets**  
  `GET {{baseUrl}}/admin/media-assets?kind=audio`

## Tournaments
- **List**  
  `GET {{baseUrl}}/tournaments`
- **Create (admin/moderator)**  
  `POST {{baseUrl}}/tournaments`  
  ```json
  { "title": "Battle Rap Cup", "maxBracketSize": 128 }
  ```
- **Show**  
  `GET {{baseUrl}}/tournaments/{{tournamentId}}`
- **Update Status (admin/moderator)**  
  `PATCH {{baseUrl}}/tournaments/{{tournamentId}}/status`  
  ```json
  { "status": "active" }
  ```
- **Register Participant (self/admin/moderator)**  
  `POST {{baseUrl}}/tournaments/{{tournamentId}}/participants`  
  ```json
  { "userId": "{{participantUserId}}" }
  ```
- **Assign Judge (admin/moderator)**  
  `POST {{baseUrl}}/tournaments/{{tournamentId}}/judges`
- **Create Round (admin/moderator)**  
  `POST {{baseUrl}}/tournaments/{{tournamentId}}/rounds`  
  ```json
  {
    "kind": "qualifier1",
    "number": 1,
    "scoring": "pass_fail"
  }
  ```

## Submissions (artist/self)
- **Save Draft**  
  `POST {{baseUrl}}/rounds/{{roundId}}/submissions/draft`  
  ```json
  {
    "participantId": "{{tournamentParticipantId}}",
    "audioId": "{{mediaAssetId}}",
    "lyrics": "Some raw qualifier bars."
  }
  ```
- **Submit**  
  `POST {{baseUrl}}/rounds/{{roundId}}/submissions/submit`
- **List (admin/moderator/judge)**  
  `GET {{baseUrl}}/rounds/{{roundId}}/submissions`

## Matches & Tracks
- **Create Match (admin/moderator)**  
  `POST {{baseUrl}}/rounds/{{roundId}}/matches`  
  ```json
  { "startsAt": "2025-01-20T20:00:00Z" }
  ```
- **Add Match Participant (admin/moderator)**  
  `POST {{baseUrl}}/matches/{{matchId}}/participants`  
  ```json
  { "participantId": "{{tournamentParticipantId}}", "seed": 1 }
  ```
- **Upload Match Track (artist/admin/moderator)**  
  `POST {{baseUrl}}/matches/{{matchId}}/tracks`  
  ```json
  {
    "participantId": "{{tournamentParticipantId}}",
    "audioId": "{{mediaAssetId}}",
    "lyrics": "Battle round verse."
  }
  ```

## Evaluations
- **Judge Submission (judge/admin/moderator)**  
  `POST {{baseUrl}}/evaluations/submission/{{submissionId}}`  
  ```json
  { "pass": true, "score": 5, "comment": "Strong delivery." }
  ```
- **Judge Match (rubric rounds only)**  
  `POST {{baseUrl}}/evaluations/match/{{matchId}}`  
  ```json
  {
    "rubric": {
      "rhyme": 3,
      "sense": 3,
      "theme": 2,
      "impression": 3
    },
    "comment": "Tight battle."
  }
  ```
- **List Evaluations**  
  `GET {{baseUrl}}/evaluations/submission/{{submissionId}}`  
  `GET {{baseUrl}}/evaluations/match/{{matchId}}`
