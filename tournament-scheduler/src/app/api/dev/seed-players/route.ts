import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({
    message: 'This endpoint has been deprecated. Use /api/dev/seed instead.',
    redirect: '/api/dev/seed'
  }, { status: 410 })
}
