# Lead Generation API

Use this API to let a personal agent research prospects, save structured contact information and notes, enrich records over time, and promote qualified leads into the CRM.

## Authentication

Use the canonical host and the same long-lived agent key as the rest of the CRM:

```bash
export DELLIX_API_URL=https://www.dellix.dev
export DELLIX_API_KEY=dlx_your_key
```

Every request requires:

```http
Authorization: Bearer dlx_your_key
Content-Type: application/json
```

Do not call `https://dellix.dev`; its redirect to `www` can cause HTTP clients to remove the authorization header.

## Lead fields

| Field | Type | Purpose |
| --- | --- | --- |
| `name` | string, required | Person or prospect name |
| `email`, `phone`, `title` | string or null | Contact details |
| `company_name`, `company_domain` | string or null | Company identity |
| `website_url`, `linkedin_url` | string or null | Enrichment links |
| `source`, `source_url` | string or null | Where the agent found the lead |
| `notes` | string or null | Research, qualification, or outreach notes |
| `tags` | string[] or comma-separated string | Up to 30 normalized tags |
| `custom_fields` | JSON object | Any agent-specific structured data |
| `score` | integer 0–100 | Lead quality/fit score |
| `status` | enum | `new`, `researching`, `qualified`, `contacted`, `disqualified`, `converted` |
| `priority` | enum | `low`, `normal`, `high` |
| `discovered_at`, `last_enriched_at`, `viewed_at` | ISO-8601 timestamp | Research and review timing; `viewed_at: null` means new/unviewed |

Single and bulk creates upsert by default. Deduplication uses the first available identity in this order: email, LinkedIn URL, source URL, phone, then name plus company. Repeated research runs enrich the existing lead instead of creating a duplicate. By default, upserts append notes, merge tags, and merge `custom_fields`.

Agents can discover current enums, limits, filters, write controls, and endpoint templates at `GET /api/v1/leads/options`.

## Create or enrich one lead

```bash
curl -X POST "$DELLIX_API_URL/api/v1/leads" \
  -H "Authorization: Bearer $DELLIX_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ada Lovelace",
    "email": "ada@example.com",
    "title": "Founder",
    "company_name": "Analytical Engines",
    "company_domain": "example.com",
    "website_url": "https://example.com",
    "linkedin_url": "https://linkedin.com/in/example",
    "source": "LinkedIn",
    "source_url": "https://linkedin.com/in/example",
    "notes": "Strong fit for a workflow automation engagement.",
    "tags": ["automation", "founder", "b2b"],
    "score": 82,
    "status": "qualified",
    "priority": "high",
    "custom_fields": {
      "employee_count": 18,
      "pain_points": ["manual intake", "slow follow-up"]
    },
    "mark_enriched": true
  }'
```

Set `"upsert": false` to require a new record, `"notes_mode": "replace"` to replace notes, or `"tags_mode": "replace"` to replace tags.

## Bulk ingestion

Send up to 100 leads per request:

```bash
curl -X POST "$DELLIX_API_URL/api/v1/leads/bulk" \
  -H "Authorization: Bearer $DELLIX_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "upsert": true,
    "notes_mode": "append",
    "tags_mode": "merge",
    "leads": [
      {"name": "Prospect One", "email": "one@example.com", "source": "directory", "score": 70},
      {"name": "Prospect Two", "phone": "+1 555 0102", "source": "conference", "score": 55}
    ]
  }'
```

The response includes a result for every input index plus `created`, `updated`, and `failed` totals. A mixed result returns HTTP `207`; inspect each result instead of retrying the whole batch blindly.

## Search, filter, and paginate

```http
GET /api/v1/leads?q=automation&status=qualified&priority=high&source=LinkedIn&tag=b2b&viewed=false&sort=score&limit=50&offset=0
```

All parameters are optional. `viewed=false` returns only new/unviewed leads. `sort` accepts `created`, `updated`, or `score`; `limit` is capped at 100. The response includes global status and unviewed totals plus pagination metadata.

## Read, update, append research, or delete

```http
GET    /api/v1/leads/:id
PATCH  /api/v1/leads/:id
DELETE /api/v1/leads/:id
```

Any lead field can be patched. These update controls are also available:

- `append_notes: true` appends the supplied `notes` with a paragraph break.
- `merge_tags: true` merges supplied tags instead of replacing them.
- `mark_enriched: true` sets `last_enriched_at` to the current time.
- `mark_viewed: true` marks the lead reviewed; `mark_viewed: false` marks it new/unviewed again.

```bash
curl -X PATCH "$DELLIX_API_URL/api/v1/leads/LEAD_ID" \
  -H "Authorization: Bearer $DELLIX_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Confirmed they are hiring an operations lead.",
    "append_notes": true,
    "tags": ["hiring-signal"],
    "merge_tags": true,
    "score": 90,
    "mark_enriched": true
  }'
```

## Convert into the CRM

```http
POST /api/v1/leads/:id/convert
```

Conversion creates or updates a Contact, optionally finds or creates its Company, and can create a Deal in the pipeline. The lead is marked `converted` and linked to the resulting contact.

```bash
curl -X POST "$DELLIX_API_URL/api/v1/leads/LEAD_ID/convert" \
  -H "Authorization: Bearer $DELLIX_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "create_company": true,
    "is_active_client": false,
    "create_deal": true,
    "deal_name": "Automation discovery",
    "deal_value_cents": 500000,
    "deal_stage": "lead"
  }'
```

## CLI equivalents

```bash
node cli/dellix-crm.js leads list --status qualified --sort score
node cli/dellix-crm.js leads add --name "Ada Lovelace" --email ada@example.com --source LinkedIn --score 82 --tags automation,b2b
node cli/dellix-crm.js leads update LEAD_ID --data '{"notes":"New research","append_notes":true}'
node cli/dellix-crm.js leads bulk ./leads.json
node cli/dellix-crm.js leads convert LEAD_ID --create-deal --deal-value 5000
```

## Suggested agent workflow

1. Research only sources the agent is permitted to access and retain.
2. Send stable source URLs and as much structured data as available.
3. Bulk upsert discoveries in batches of 100 or fewer.
4. Re-run enrichment with appended notes and `mark_enriched: true`.
5. Query high-scoring `qualified` leads for human review.
6. Convert approved leads; do not mark scraped prospects as active clients automatically.
