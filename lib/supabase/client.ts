import { createBrowserClient } from "@supabase/ssr";
import type { LockFunc } from "@supabase/supabase-js";

// Bypass the Web Locks API which causes "Lock broken by another request
// with the 'steal' option" errors during navigation and React strict mode
// double-mounts. Uses a simple async callback instead.
// See: https://github.com/supabase/supabase-js/issues/2013
const lock: LockFunc = async (_name, _acquireTimeout, fn) => {
  return await fn();
};

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: "pkce",
        lock,
      },
    }
  );
}
