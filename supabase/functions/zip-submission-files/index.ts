import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0';
// We're importing a library called JSZip that knows how to create zip files.
import JSZip from 'https://esm.sh/jszip@3.10.1';

// These headers are a standard security requirement to allow our app to talk to this function.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // First, we handle a "preflight" request. This is just a security check the browser/app does.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // We create a special "admin" version of the Supabase client.
    // This uses a secret key to safely bypass any security rules, which is necessary for an admin task like this.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // We expect our app to send a list of file paths in the request.
    const { filePaths } = await req.json();
    if (!filePaths || !Array.isArray(filePaths) || filePaths.length === 0) {
      throw new Error('No file paths provided.');
    }

    // Initialize the zip library.
    const zip = new JSZip();

    // Now, we download each file from Supabase Storage.
    // Promise.all lets us download all files at the same time, which is much faster.
    const downloadPromises = filePaths.map(async (filePath) => {
      const { data, error } = await supabaseAdmin.storage
        .from('submissions')
        .download(filePath);

      if (error) throw error;

      // We get the original file name to use inside the zip.
      const fileName = filePath.split('/').pop() || 'file';
      // We add the downloaded file into our zip archive.
      zip.file(fileName, await data.arrayBuffer());
    });

    await Promise.all(downloadPromises);

    // Once all files are in the zip archive, we generate the final zip file.
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    // Finally, we send the zip file back to the app as a response.
    return new Response(zipBlob, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/zip',
        // This header tells the browser to treat it as a downloadable file.
        'Content-Disposition': `attachment; filename="submission.zip"`,
      },
    });
  } catch (error) {
    // If anything goes wrong, we send back an error message.
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
