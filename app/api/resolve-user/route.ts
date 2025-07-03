/* eslint-disable */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json({ message: 'Username is required' }, { status: 400 });
  }

  const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY || '';

  try {
    const response = await fetch(`https://api.neynar.com/v2/farcaster/user/search?q=${username}&viewer_fid=1`, {
      headers: {
        'api_key': NEYNAR_API_KEY,
      },
    });

    const data = await response.json();
    
    // Find the user with an exact match
    const user = data.result.users.find((u: any) => u.username === username);

    if (user && user.verifications && user.verifications.length > 0) {
      return NextResponse.json({ address: user.verifications[0] }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'User not found or has no verified address' }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error', error }, { status: 500 });
  }
}