(() => {
  const SUPABASE_URL = "https://njrbzobygmewfdfwcvqc.supabase.co";
  const SUPABASE_KEY = "sb_publishable_nYbFcvkWKM7gL9JLCDLELw_dOsuuF-0";
  const TOKEN_KEY = "athevia.analytics.adminSession.v1";

  function token() {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  async function request(path, body, includeSession = true) {
    const headers = {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY
    };
    if (includeSession) {
      const value = token();
      if (!value) {
        const error = new Error("AUTH_REQUIRED");
        error.code = "AUTH_REQUIRED";
        throw error;
      }
      headers["x-athevia-admin-token"] = value;
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 && includeSession) {
        sessionStorage.removeItem(TOKEN_KEY);
      }
      const error = new Error(payload.error || `HTTP_${response.status}`);
      error.status = response.status;
      error.code = payload.error;
      throw error;
    }
    return payload;
  }

  window.AtheviaAnalyticsAuth = {
    session() {
      return token() ? { active: true } : null;
    },

    async signIn(email, password) {
      const normalized = String(email || "").trim().toLowerCase();
      if (!normalized || !normalized.includes("@")) {
        throw new Error("Enter a valid admin email address.");
      }
      if (!password) {
        throw new Error("Enter the admin password.");
      }

      const payload = await request(
        "analytics-admin-login",
        { email: normalized, password },
        false
      );
      sessionStorage.setItem(TOKEN_KEY, payload.token);
      return payload;
    },

    signOut() {
      sessionStorage.removeItem(TOKEN_KEY);
    }
  };

  window.AtheviaAnalyticsDataProvider = {
    loadDashboard({ range, environment }) {
      return request("analytics-dashboard", {
        action: "overview",
        range,
        environment
      });
    },

    loadUserDetail(userID) {
      return request("analytics-dashboard", {
        action: "user_detail",
        user_id: userID
      });
    }
  };

  window.AtheviaAnalyticsReady = Promise.resolve();
})();