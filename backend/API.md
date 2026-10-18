# Portfolio API v1

Base URL: `/api/v1`. JSON responses use `{ "success": true, "data": ... }`;
list responses also include `pagination`. Errors use `{ "success": false,
"message": "..." }`.

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
Configure `MAIL_USER` and `MAIL_APP_PASSWORD` in `backend/.env` with the Gmail
account and its Google App Password. Set `MAIL_TO` to the inbox that should
receive messages; it defaults to `MAIL_USER`. Never use your regular Gmail
password or expose these values in frontend code.

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
`imagePublicId`. New projects are unpublished by default.

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
