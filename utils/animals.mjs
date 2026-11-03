import { createClient } from "@supabase/supabase-js";

// The scraper changes listings outside Next.js, so its Data Cache cannot know
// when animals are added or removed. Always read the current database contents.
export async function fetchAnimals() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    throw new Error("Missing Supabase URL or public API key");
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
  const { data, error } = await supabase
    .from("Available Animals")
    .select("*")
    .order("id");

  if (error) throw error;
  if (!Array.isArray(data)) throw new Error("Invalid animals response");
  return data;
}
