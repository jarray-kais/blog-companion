import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    const authSummary = (() => {
      if (!authHeader) return 'NULL';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
      return `present (len=${token.length}) prefix=${token.slice(0, 12)}...`;
    })();
    console.log('Authorization header received:', authSummary);
    console.log('Header keys:', Array.from(req.headers.keys()));
    
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('User authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Utilisateur non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    // Parse request body
    const { titre, contenu, auteur } = await req.json();

    if (!titre || !contenu || !auteur) {
      console.error('Missing required fields:', { titre: !!titre, contenu: !!contenu, auteur: !!auteur });
      return new Response(
        JSON.stringify({ error: 'Titre, contenu et auteur sont requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating article:', { titre, auteur, userId: user.id });

    // Insert the article
    const { data, error } = await supabase
      .from('articles')
      .insert({
        titre,
        contenu,
        auteur,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la création de l\'article', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Article created successfully:', data.id);

    return new Response(
      JSON.stringify({ article: data }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur interne du serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
