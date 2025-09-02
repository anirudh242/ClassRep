import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0';
import JSZip from 'https://esm.sh/jszip@3.10.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { filePaths } = await req.json();
    if (!filePaths || !Array.isArray(filePaths) || filePaths.length === 0) {
      throw new Error('No file paths were provided.');
    }

    const zip = new JSZip();

    const downloadPromises = filePaths.map(async (filePath) => {
      const { data, error } = await supabaseAdmin.storage
        .from('submissions')
        .download(filePath);

      if (error) throw error;

      // --- This is the key change ---
      // We pass the downloaded Blob (data) directly to the zipping library
      // without converting it to an ArrayBuffer first.
      const fileName = filePath.split('/').pop() || 'file';
      zip.file(fileName, data);
    });

    await Promise.all(downloadPromises);

    const zipBlob = await zip.generateAsync({ type: 'blob' });

    return new Response(zipBlob, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="submission.zip"`,
      },
    });
  } catch (error) {
    console.error('Function crashed with an error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
