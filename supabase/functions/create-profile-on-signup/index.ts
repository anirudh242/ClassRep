import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0';

serve(async (req) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { record: user } = await req.json();
    const userData = user.raw_user_meta_data;

    // --- Step 1: Create the user's profile ---
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: user.id,
        full_name: userData?.full_name ?? null,
        section: userData?.section ?? null,
        university_id: userData?.university_id ?? null,
        role: 'Student',
      });

    if (profileError) throw profileError;

    // --- Step 2: Find classes that match the user's section (CASE-INSENSITIVE) ---
    if (userData?.section) {
      const { data: classes, error: classesError } = await supabaseAdmin
        .from('classes')
        .select('id')
        .ilike('section', userData.section); // Changed .eq to .ilike

      if (classesError) throw classesError;

      // --- Step 3: Enroll the user in all found classes ---
      if (classes && classes.length > 0) {
        const memberships = classes.map((classItem) => ({
          profile_id: user.id,
          class_id: classItem.id,
        }));

        const { error: membershipError } = await supabaseAdmin
          .from('class_members')
          .insert(memberships);

        if (membershipError) throw membershipError;
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
