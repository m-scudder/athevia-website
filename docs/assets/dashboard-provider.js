(() => {
  const SUPABASE_URL = "https://njrbzobygmewfdfwcvqc.supabase.co";
  const SUPABASE_KEY = "sb_publishable_nYbFcvkWKM7gL9JLCDLELw_dOsuuF-0";

  let clientPromise;
  function getClient() {
    if (!clientPromise) {
      clientPromise = import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.95.0/+esm")
        .then(({ createClient }) => createClient(SUPABASE_URL, SUPABASE_KEY, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        }));
    }
    return clientPromise;
  }

  async function invoke(body) {
    const client = await getClient();
    const { data: { session }, error: sessionError } = await client.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) {
      const error = new Error("AUTH_REQUIRED");
      error.code = "AUTH_REQUIRED";
      throw error;
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/analytics-dashboard`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${session.access_token}`
      },
      body: JSON.stringify(body)
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload.error || `HTTP_${response.status}`);
      error.status = response.status;
      error.code = payload.error;
      throw error;
    }
    return payload;
  }

  window.AtheviaAnalyticsAuth = {
    async session() {
      const client = await getClient();
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      return data.session;
    },

    async sendMagicLink(email) {
      const client = await getClient();
      const normalized = String(email || "").trim().toLowerCase();
      if (!normalized || !normalized.includes("@")) {
        throw new Error("Enter a valid email address.");
      }
      const { error } = await client.auth.signInWithOtp({
        email: normalized,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: window.location.href.split("#")[0]
        }
      });
      if (error) throw error;
    },

    async signOut() {
      const client = await getClient();
      const { error } = await client.auth.signOut();
      if (error) throw error;
    },

    async onAuthStateChange(callback) {
      const client = await getClient();
      return client.auth.onAuthStateChange((_event, session) => callback(session));
    }
  };

  window.AtheviaAnalyticsDataProvider = {
    loadDashboard({ range, environment }) {
      return invoke({ action: "overview", range, environment });
    },

    loadUserDetail(userID) {
      return invoke({ action: "user_detail", user_id: userID });
    }
  };

  window.AtheviaAnalyticsReady = getClient();
})();