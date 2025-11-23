import { supabaseServer } from '../lib/supabase'; // adjust path

async function testSupabase() {
  const supabase = supabaseServer();

  try {
    console.log('--- Supabase CRUD Test ---');

    // 1️⃣ CREATE: insert a new tournament
    const { data: insertData, error: insertError } = await supabase
      .from('tournaments')
      .insert([{ name: 'Test Tournament', format: 'single-elim' }])
      .select()
      .single();

    if (insertError) throw insertError;
    console.log('Created tournament:', insertData);

    const tournamentId = insertData.id;

    // 2️⃣ READ: select tournaments
    const { data: selectData, error: selectError } = await supabase
      .from('tournaments')
      .select('*')
      .limit(5);

    if (selectError) throw selectError;
    console.log('Selected tournaments:', selectData);

    // 3️⃣ UPDATE: update the tournament name
    const { data: updateData, error: updateError } = await supabase
      .from('tournaments')
      .update({ name: 'Updated Test Tournament' })
      .eq('id', tournamentId)
      .select()
      .single();

    if (updateError) throw updateError;
    console.log('Updated tournament:', updateData);

    // 4️⃣ DELETE: delete the tournament
    const { data: deleteData, error: deleteError } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', tournamentId)
      .select();

    if (deleteError) throw deleteError;
    console.log('Deleted tournament:', deleteData);

    console.log('✅ Supabase connection and CRUD working!');
  } catch (err: any) {
    console.error('❌ Supabase test failed:', err.message || err);
  }
}

testSupabase();
