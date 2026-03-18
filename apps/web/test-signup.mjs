import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignUp() {
  console.log("Testing SignUp with teste22@gmail.com...");
  const { data, error } = await supabase.auth.signUp({
    email: 'teste22@gmail.com',
    password: 'securepassword123',
  });

  if (error) {
    console.error("SignUp Error:", error.message, error.status);
    process.exit(1);
  } else {
    console.log("SignUp Success!");
    console.log("User ID:", data.user?.id);
    
    // Now verify the profile was created
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user?.id)
      .single();
      
    if (profileError) {
      console.error("Profile Error (The trigger might have failed):", profileError.message);
      process.exit(1);
    } else {
      console.log("Profile Trigger Success! Profile data:", profile);
    }
  }
}

testSignUp();
