import { appendFileSync } from 'node:fs';
import { NextRequest, NextResponse } from 'next/server';

export const POST = async (request: NextRequest) => {
  const payload = await request.json();

  // #region agent log
  appendFileSync(
    '/opt/cursor/logs/debug.log',
    `${JSON.stringify({ ...payload, timestamp: Date.now() })}\n`
  );
  // #endregion

  return NextResponse.json({ ok: true });
};
