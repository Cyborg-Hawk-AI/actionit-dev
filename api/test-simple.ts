import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('[Test] Simple API route working');
    
    return NextResponse.json({
      success: true,
      message: 'Simple API route is working',
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV
      }
    });

  } catch (error) {
    console.error('[Test] Simple API route failed:', error);
    return NextResponse.json(
      { 
        error: 'Simple API route failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}