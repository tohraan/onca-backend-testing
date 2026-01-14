import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { exchangeCodeForTokens } from '@core/source/sheets';
import { storeOAuthConnection } from '@core/ingestion/google-sheets-oauth';
import { logger } from '@lib/logging';

/**
 * OAuth Callback Route
 * Handles redirect from Google after user grants/denies consent
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
        logger.error('OAuth error', { error });
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/sheets?error=access_denied`);
    }

    if (!code || !state) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/sheets?error=invalid_request`);
    }

    try {
        console.log('[DEBUG] OAuth Callback hit with code:', code ? 'present' : 'missing', 'state:', state);
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            console.error('[DEBUG] Callback failed: No authenticated session found');
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/sheets?error=unauthorized`);
        }

        console.log('[DEBUG] Authenticated user:', user.email, 'ID:', user.id);

        if (user.id !== state) {
            console.error('[DEBUG] Callback failed: State mismatch. User ID:', user.id, 'State:', state);
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/sheets?error=unauthorized`);
        }

        // Get or create user's org_id
        let { data: profile } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', user.id)
            .maybeSingle();

        if (!profile?.org_id) {
            console.log('[DEBUG] No profile found, creating default organization with SERVICE ROLE');

            // Use service role for onboarding to bypass RLS select/insert loop
            const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
            const supabaseAdmin = createSupabaseClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            const { data: org, error: orgError } = await supabaseAdmin
                .from('organizations')
                .insert({ name: `${user.email?.split('@')[0]}'s Organization` })
                .select()
                .single();

            if (orgError) {
                console.error('[DEBUG] Organization creation failed (admin):', orgError);
                return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/sheets?error=org_creation_failed`);
            }

            console.log('[DEBUG] Organization created:', org.id);

            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .insert({
                    id: user.id,
                    org_id: org.id,
                    email: user.email!,
                    full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
                });

            if (profileError) {
                console.error('[DEBUG] Profile creation failed (admin):', profileError);
                return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/sheets?error=profile_creation_failed`);
            }

            console.log('[DEBUG] Profile created successfully via service role');
            profile = { org_id: org.id };
        } else {
            console.log('[DEBUG] Existing profile found with org_id:', profile.org_id);
        }

        // Exchange code for tokens
        console.log('[DEBUG] Exchanging code for tokens...');
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/sheets/oauth/callback`;
        const tokens = await exchangeCodeForTokens(code!, redirectUri);
        console.log('[DEBUG] Tokens received successfully');

        // Get user's Google email
        console.log('[DEBUG] Fetching Google user info...');
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const userInfo = await userInfoResponse.json();
        const googleEmail = userInfo.email || userInfo.verified_email || 'Connected Account';
        console.log('[DEBUG] Google User info received:', JSON.stringify(userInfo));
        console.log('[DEBUG] Target email:', googleEmail);

        // Store connection
        console.log('[DEBUG] Storing connection in DB for org:', profile.org_id);
        await storeOAuthConnection(user.id, profile.org_id, tokens, googleEmail);
        console.log('[DEBUG] Connection stored successfully');

        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/sheets?connected=true`);
    } catch (err: any) {
        console.error('[DEBUG] UNEXPECTED CALLBACK ERROR:', err);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/sheets?error=connection_failed`);
    }
}
