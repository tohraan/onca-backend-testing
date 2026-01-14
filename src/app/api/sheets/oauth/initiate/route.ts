import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * OAuth Initiation Route
 * Redirects user to Google OAuth consent screen
 */
export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // We don't check for profile/org here anymore because the callback 
    // will create it if missing. This prevents blocking users before they connect.
    if (!user) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login`);
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/sheets/oauth/callback`;
    const scopes = [
        'https://www.googleapis.com/auth/spreadsheets.readonly',
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
    ].join(' ');

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', user.id); // Pass user ID for verification

    return NextResponse.redirect(authUrl.toString());
}
