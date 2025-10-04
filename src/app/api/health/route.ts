import { NextResponse } from 'next/server'

// Simple health endpoint for Kubernetes probes
export async function GET() {
  try {
    // Lightweight response — keep fast and reliable for probes
    return NextResponse.json({ status: 'ok' }, { status: 200 })
  } catch (err) {
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}

