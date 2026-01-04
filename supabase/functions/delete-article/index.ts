import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Authenticate User using Request Headers (Fresh Key)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = req.headers.get('apikey') ?? Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    
    if (userError || !user) {
      console.error('[Delete Article] Auth Error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized', details: userError?.message }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Setup Admin Client for Operations (using Service Role)
    // Note: If Service Role Key is stale, this part might fail.
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { id } = await req.json();

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID requis' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check Article Existence & Ownership
    const { data: article, error: articleError } = await supabaseAdmin
      .from('articles')
      .select('id, user_id')
      .eq('id', id)
      .maybeSingle();

    if (articleError || !article) {
      return new Response(JSON.stringify({ error: 'Article introuvable' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check Permissions (Owner or Admin)
    const isOwner = article.user_id === user.id;

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const isAdmin = profile?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return new Response(JSON.stringify({ error: 'Permission refusée' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Delete Article
    const { error: deleteError } = await supabaseAdmin
      .from('articles')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('[Delete Article] Delete Error:', deleteError);
      return new Response(JSON.stringify({ error: 'Erreur suppression', details: deleteError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Article supprimé' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Delete Article] Internal Error:', error);
    return new Response(JSON.stringify({ error: 'Erreur interne', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
