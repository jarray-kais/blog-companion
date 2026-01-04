import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  console.log(`[Create Article] Incoming Request: ${req.method}`);
  
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    console.log(`[Create Article] Method: ${req.method}, Auth Header Present: ${!!authHeader}`);

    if (!authHeader) {
      console.error('[Create Article] Missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    // Use the API key passed by the client (which is verified by Gateway) 
    // instead of the potentially stale env var.
    const supabaseAnonKey = req.headers.get('apikey') ?? Deno.env.get('SUPABASE_ANON_KEY')!;

    // Create a Supabase client with the Auth context of the user
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Check if the user is valid using the forwarded token
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('[Create Article] Error getting user:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Create Article] User authenticated: ${user.id}`);

    const { titre, contenu, auteur, user_id } = await req.json();

    // Verify payload matches authenticated user (optional but good practice)
    if (user_id && user_id !== user.id) {
       console.warn(`[Create Article] Warning: payload user_id ${user_id} does not match auth user ${user.id}`);
    }

    if (!titre || !contenu || !auteur) {
      return new Response(JSON.stringify({ error: 'Tous les champs (titre, contenu, auteur) sont requis' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabase
      .from('articles')
      .insert({ 
        titre, 
        contenu, 
        auteur, 
        user_id: user.id // Force use of authenticated user ID for security
      })
      .select()
      .single();

    if (error) {
      console.error('[Create Article] Database Insert Error:', error);
      return new Response(JSON.stringify({ error: 'Erreur création article', details: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ article: data }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Create Article] Internal Server Error:', error);
    return new Response(JSON.stringify({ error: 'Erreur interne serveur', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
