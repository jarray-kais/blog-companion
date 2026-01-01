import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Récupérer l'Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ 
        success: false, 
        statusCode: 401,
        error: 'Non autorisé' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Créer le client Supabase côté serveur avec SERVICE_ROLE_KEY
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Vérifier l'utilisateur
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ 
        success: false, 
        statusCode: 401,
        error: 'Non autorisé' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Lire le body de la requête
    const { id } = await req.json();

    if (!id) {
      return new Response(JSON.stringify({ 
        success: false, 
        statusCode: 400,
        error: 'ID de l\'article requis' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Récupérer l'article pour vérifier son existence
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (articleError || !article) {
      return new Response(JSON.stringify({ 
        success: false, 
        statusCode: 404,
        error: 'Article introuvable' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Vérifier si l'utilisateur est propriétaire de l'article
    const isOwner = article.user_id === user.id;

    // Vérifier si l'utilisateur est admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';

    // Si l'utilisateur n'est ni propriétaire ni admin, refuser l'accès
    if (!isOwner && !isAdmin) {
      return new Response(JSON.stringify({ 
        success: false, 
        statusCode: 403,
        error: 'Vous n\'avez pas les permissions pour supprimer cet article' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Supprimer l'article (avec SERVICE_ROLE_KEY, on peut bypass RLS)
    const { error: deleteError } = await supabase
      .from('articles')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return new Response(JSON.stringify({ 
        success: false, 
        statusCode: 500,
        error: 'Erreur lors de la suppression de l\'article',
        details: deleteError.message 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      statusCode: 200,
      message: 'Article supprimé avec succès' 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      statusCode: 500,
      error: 'Erreur interne serveur' 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

