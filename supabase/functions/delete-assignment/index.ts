import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

console.log('Function cold start: Initializing.');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Function invoked.');
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { assignmentId } = await req.json();
    if (!assignmentId) throw new Error('Missing assignmentId.');

    console.log(
      `Step 1: Finding submissions for assignmentId: ${assignmentId}`
    );

    // Getting all submission ids related to the assignment
    const { data: submissions, error: submissionsError } = await supabaseAdmin
      .from('submissions')
      .select('id')
      .eq('assignment_id', assignmentId);

    if (submissionsError) throw submissionsError;

    let filesToDelete = [];
    if (submissions && submissions.length > 0) {
      // getting file paths using submission ids
      const submissionIds = submissions.map((s) => s.id);
      const { data: files, error: filesError } = await supabaseAdmin
        .from('submission_files')
        .select('file_path')
        .in('submission_id', submissionIds);

      if (filesError) throw filesError;
      if (files) filesToDelete = files.map((f) => f.file_path);
    }
    console.log(`Found ${filesToDelete.length} files to delete.`);

    // deleting files from storage
    if (filesToDelete.length > 0) {
      console.log('Step 2: Deleting files from Storage...');
      const { error: storageError } = await supabaseAdmin.storage
        .from('submissions')
        .remove(filesToDelete);

      if (storageError) throw storageError;
      console.log('Storage deletion successful.');
    }

    // deleting assignment from db
    console.log('Step 3: Deleting assignment from database...');
    const { error: assignmentError } = await supabaseAdmin
      .from('assignments')
      .delete()
      .eq('id', assignmentId);

    if (assignmentError) throw assignmentError;
    console.log('Database deletion successful.');

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Function crashed with an error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
