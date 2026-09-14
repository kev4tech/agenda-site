/** POST /api/unlock — validates an edit key without touching the record. */

type Env = { EDIT_KEY?: string }

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const expected = env.EDIT_KEY
  if (!expected) {
    return new Response(JSON.stringify({ error: 'EDIT_KEY is not configured.' }), {
      status: 403,
      headers: { 'content-type': 'application/json' },
    })
  }

  let key = ''
  try {
    const body = (await request.json()) as { key?: unknown }
    key = typeof body.key === 'string' ? body.key : ''
  } catch {
    /* fall through to the mismatch below */
  }

  if (key !== expected) {
    return new Response(JSON.stringify({ error: 'Invalid edit key.' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    })
  }
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'content-type': 'application/json' },
  })
}
