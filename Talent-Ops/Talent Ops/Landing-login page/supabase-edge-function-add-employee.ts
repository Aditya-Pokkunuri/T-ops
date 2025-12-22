// Supabase Edge Function: add-employee
// Deploy this to: supabase/functions/add-employee/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Get the authorization header
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('No authorization header')
        }

        // Create a Supabase client with the service role key
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // Parse the request body
        const {
            full_name,
            email,
            password,
            role,
            team_id,
            monthly_leave_quota
        } = await req.json()

        // Validate required fields
        if (!full_name || !email || !password) {
            throw new Error('Missing required fields: full_name, email, password')
        }

        // Create the user in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name,
            }
        })

        if (authError) {
            console.error('Auth error:', authError)
            throw new Error(`Failed to create user: ${authError.message}`)
        }

        if (!authData.user) {
            throw new Error('User creation failed - no user returned')
        }

        // Insert the profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert([{
                id: authData.user.id,
                full_name,
                email,
                role: role || 'employee',
                team_id: team_id || null,
                monthly_leave_quota: monthly_leave_quota || 3,
                // leaves_remaining will use the database DEFAULT value
                leaves_taken_this_month: 0,
            }])

        if (profileError) {
            console.error('Profile error:', profileError)
            // Try to delete the auth user if profile creation fails
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
            throw new Error(`Failed to create profile: ${profileError.message}`)
        }

        return new Response(
            JSON.stringify({
                success: true,
                user: {
                    id: authData.user.id,
                    email: authData.user.email,
                    full_name,
                }
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        console.error('Error in add-employee function:', error)
        return new Response(
            JSON.stringify({
                error: error.message || 'An error occurred',
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
