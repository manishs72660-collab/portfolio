# Portfolio API v1

Base URL: `/api/v1`. JSON responses use `{ "success": true, "data": ... }`;
list responses also include `pagination`. Errors use `{ "success": false,
"message": "..." }`.

The frontend uses `https://portfolio-3wxj.onrender.com` as its API origin in
development and production. Set `VITE_API_URL` at frontend build time to
override it (for example, `http://localhost:5000` for a local backend).
Configure `FRONTEND_URL` on the backend with the deployed frontend's exact
origin (for example, `https://portfolio.example.com`); multiple
comma-separated origins are supported. Local development origins
`http://localhost:5173` and `http://127.0.0.1:5173`, and
`https://portfolio-eta-drab-90.vercel.app` are always allowed. In production,
the admin cookie uses `SameSite=None; Secure` so credentialed requests from an
approved frontend origin can use it.

`/blog` remains as a backward-compatible alias for `/blogs`.

Admin endpoints require the HTTP-only `adminToken` cookie issued by
`POST /api/v1/auth/login`. Send JSON for normal requests. For image upload
requests, send `multipart/form-data` with the documented file field; images
are limited to 5 MB and PNG, JPEG, GIF, and WebP.

## Contact messages

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/contact` | Public | Send a message to the configured Gmail inbox |

Send JSON with `name` (up to 100 characters), `email`, and `message` (up to
5000 characters). The endpoint is limited to 5 messages per IP per 15 minutes.
Configure `RESEND_API_KEY`, `RESEND_FROM`, and `MAIL_TO` in the backend
hosting service's environment settings. `RESEND_FROM` must be a sender address
verified with Resend; `MAIL_TO` is the inbox that should receive messages.
The backend sends mail through Resend's HTTPS API, which works on Render Free
where outbound SMTP is blocked. Provider requests time out after 15 seconds;
check backend logs for provider errors. Never put the API key in frontend code.

## Coding profiles

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/stats` | Public | GitHub and LeetCode profile summaries and activity heatmaps |

Set `GITHUB_USERNAME` and `LEETCODE_USERNAME` in `backend/.env` to choose the
public profiles. They default to the portfolio owner's profile names. Activity
data is cached in memory for five minutes. Each provider can fail independently;
if one is unavailable, its response entry includes an `error` while the other
provider's data remains available. If both providers fail, the endpoint returns
an error response.

## Projects

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/projects` | Public | Published projects; `page`, `limit`, `category` filters |
| GET | `/projects/:identifier` | Public | Published project by slug or MongoDB ID |
| GET | `/projects/admin` | Admin | All projects; optional `category`, `isPublished`, `page`, `limit` |
| GET | `/projects/admin/:id` | Admin | Any project by ID, including drafts |
| POST | `/projects` | Admin | Create a project |
| PATCH | `/projects/:id` | Admin | Update project fields |
| DELETE | `/projects/:id` | Admin | Delete a project |

Project JSON fields: `title` (required), `slug` (optional; generated from the
title), `description` (required), `category` (required), `technologies`
(string array or comma-separated string), `isFeatured`, `liveDemoUrl` (`liveUrl`
is also accepted), `githubUrl` (`repositoryUrl` is also accepted),
and `isPublished`. Set `thumbnail` as the multipart file field to upload an
image to Cloudinary; media URLs cannot be supplied in JSON. The API returns
the generated image URL as `imageUrl` and stores its Cloudinary public ID as
`imagePublicId`. The admin form provides `Full Stack`, `Frontend`, `Backend`,
`AI`, and `Chrome Extension` category choices. New projects are unpublished by
default.

```json
{
  "title": "Portfolio",
  "description": "A personal portfolio website.",
  "category": "Web",
  "technologies": ["Node.js", "MongoDB"],
  "isFeatured": true,
  "liveDemoUrl": "https://example.com",
  "githubUrl": "https://github.com/example/portfolio",
  "isPublished": true
}
```

## Portfolio Q&A (RAG)

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/rag/ask` | Public, rate limited | Answer a one-off question using indexed portfolio content |
| POST | `/rag/chat` | Public, rate limited | Continue a persisted portfolio conversation |
| GET | `/rag/conversations/:conversationId` | Public | Restore a saved conversation |
| DELETE | `/rag/conversations/:conversationId` | Public | Delete a saved conversation |

Send JSON with a non-empty `question` of at most 1000 characters:

```json
{ "question": "Which technologies has Manish used in his projects?" }
```

The response contains `data.answer` and `data.sources` (source title, type,
portfolio URL, and retrieval score). If the indexed content does not support
an answer, the API says it does not have that information instead of guessing.
Requests are limited by IP using `RAG_RATE_LIMIT_WINDOW_MS` and
`RAG_RATE_LIMIT_MAX`.

For a multi-turn chat, send the same question with an optional `conversationId`
to `POST /rag/chat`. The first response returns a UUID `conversationId`; pass it
on later messages. The backend stores the transcript in MongoDB and uses it to
resolve follow-up questions, while factual answers still require matching
portfolio sources. `GET /rag/conversations/:conversationId` restores the
transcript and source references; `DELETE` clears it. The browser widget keeps
the ID in local storage so the chat can be restored after a page reload.
Conversations expire after `RAG_CONVERSATION_TTL_DAYS` (30 days by default);
older turns are summarized for model context while the full transcript remains
available for restoration.

At startup, the backend indexes the static content in
`frontend/src/Profile.js` and current MongoDB profile, published projects, and
published blog posts in the configured Qdrant collection. Project/blog create,
update, publish, unpublish, and delete API operations sync that record before
returning. Draft projects and unpublished or scheduled blog posts are not
available to public answers. The collection is reconciled at startup, so
content removed while the backend was offline is removed from the index.

Configure `GOOGLE_API_KEY`, `GROQ_API_KEY`, `QDRANT_URL`, and
`QDRANT_API_KEY` in `backend/.env`; the server will not start without these
RAG credentials. `GEMINI_EMBEDDING_MODEL` defaults to `gemini-embedding-001`
with 768 dimensions, while `GROQ_CHAT_MODEL` defaults to
`llama-3.3-70b-versatile`. Use a dedicated Qdrant collection
(`QDRANT_COLLECTION_NAME`) for this portfolio. Chunking, retrieval score,
result count, and request limits can be adjusted with the `RAG_*` settings in
`backend/.env.example`.

## Blog posts

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/blogs` | Public | Published posts; `page`, `limit`, `search`, `category`, `tag` filters |
| GET | `/blogs/:slug` | Public | A published post by slug |
| GET | `/blogs/admin` | Admin | All posts; optional `isPublished`, `search`, `category`, `tag`, `page`, `limit` |
| GET | `/blogs/admin/:id` | Admin | Any post by ID, including drafts |
| POST | `/blogs` | Admin | Create a post |
| PATCH | `/blogs/:id` | Admin | Update fields or publish/unpublish |
| DELETE | `/blogs/:id` | Admin | Delete a post |

Blog JSON fields: `title` and `content` (required), `slug` (optional; generated
from the title), `excerpt`, `tags`, `categories`, `seoTitle`,
`metaDescription`, `isPublished`, and `publishedAt`.
`readingTime` and `author` are server-managed and cannot be supplied by a
client. Reading time is calculated from article content at 200 words per
minute. Set `coverImage` as the multipart file field to upload a cover image
to Cloudinary; media URLs cannot be supplied in JSON. The API returns the
generated image URL as `coverImageUrl` and stores its Cloudinary public ID as
`coverImagePublicId`.

```json
{
  "title": "Getting Started with Express",
  "excerpt": "A short introduction to Express.",
  "content": "Express is a web framework for Node.js.",
  "tags": ["node", "express"],
  "categories": ["Backend"],
  "seoTitle": "Express Guide",
  "metaDescription": "Learn the basics of Express.",
  "isPublished": true
}
```

Uploaded images are removed from Cloudinary after a successful database
replacement or deletion. Configure `CLOUDINARY_CLOUD_NAME`,
`CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in `backend/.env` to enable
uploads.
