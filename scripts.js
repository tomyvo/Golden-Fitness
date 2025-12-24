import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://ghzppqrkilbtdniffdjr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoenBwcXJraWxidGRuaWZmZGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MDkzMjQsImV4cCI6MjA4MTk4NTMyNH0.jdgW4RT77G8a03IFvD7tiGrXbxRCfcLREGnN5SbJ5PM";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ======================= GLOBAL STATE =======================
let workoutMarkdown = "";
let nutritionMarkdown = "";

// ======================= LOGIN =======================
window.login = async () => {
  const email = document.getElementById("email")?.value;
  const password = document.getElementById("password")?.value;
  if (!email || !password) {
    alert("Bitte E-Mail und Passwort eingeben.");
    return;
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    alert(error.message);
    return;
  }
  window.location.href = "dashboard.html";
};

// ======================= REGISTER =======================
window.register = async () => {
  const email = document.getElementById("email")?.value;
  const password = document.getElementById("password")?.value;
  if (!email || !password) {
    alert("Bitte E-Mail und Passwort eingeben.");
    return;
  }
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    alert(error.message);
  } else {
    alert("Account erstellt!");
    window.location.href = "login.html";
  }
};

// ======================= LOGOUT =======================
window.logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    alert("Fehler beim Ausloggen: " + error.message);
    return;
  }
  window.location.href = "login.html";
};

// ======================= DASHBOARD =======================
window.goDashboard = () => {
  window.location.href = "dashboard.html";
};

(async () => {
  const path = window.location.pathname;
  const { data, error: sessionError } = await supabase.auth.getSession();
  const session = data?.session;
  if (sessionError) {
    alert("Session Fehler: " + sessionError.message);
    return;
  }
  if (!session && (path.includes("dashboard") || path.includes("generate"))) {
    window.location.href = "login.html";
    return;
  }

  if (session && path.includes("dashboard.html")) {
    const userElem = document.getElementById("user");
    if (userElem) userElem.innerText = "Eingeloggt als: " + session.user.email;
    const userId = session.user.id;

    // =================== Workout-Plan abrufen ===================
    const { data: workoutData, error: workoutError } = await supabase
      .from("workout_plans")
      .select("plan")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (workoutError) {
      console.error("Workout-Plan Fehler:", workoutError);
    } else if (workoutData && workoutData.length) {
      const elem = document.getElementById("workout-plan-text");
      if (elem) elem.innerHTML = typeof marked !== "undefined" ? marked.parse(workoutData[0].plan) : workoutData[0].plan;
    }

    // =================== Nutrition-Plan abrufen ===================
    const { data: nutritionData, error: nutritionError } = await supabase
      .from("nutrition_plans")
      .select("plan")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (nutritionError) {
      console.error("Nutrition-Plan Fehler:", nutritionError);
    } else if (nutritionData && nutritionData.length) {
      const elem = document.getElementById("nutrition-plan-text");
      if (elem) elem.innerHTML = typeof marked !== "undefined" ? marked.parse(nutritionData[0].plan) : nutritionData[0].plan;
    }
  }
})();

// ======================= GENERATE =======================

// -------- Loader Helpers --------
function showLoader(id) {
  const elem = document.getElementById(id);
  if (elem) elem.classList.remove("hidden");
}

function hideLoader(id) {
  const elem = document.getElementById(id);
  if (elem) elem.classList.add("hidden");
}

if (window.location.pathname.includes("generate.html")) {

  // ======================= WORKOUT =======================
  window.generateWorkout = async () => {
    showLoader("workout-loader");
    const workoutPlanDisplay = document.getElementById("workout-plan-display");
    if (workoutPlanDisplay) {
      workoutPlanDisplay.innerHTML = "";
    }

    try {
      const { data, error: sessErr } = await supabase.auth.getSession();
      if (sessErr) throw new Error("Fehler beim Authentifizieren: " + sessErr.message);
      const session = data?.session;
      if (!session) throw new Error("Nicht eingeloggt.");

      const response = await fetch(
        "http://localhost:5678/webhook/c21aeeab-4ac2-4d90-ba1d-47718184ad8f",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: session.user.id,
            type: "workout",
            data: {
              experience: document.getElementById("workout-experience")?.value || "",
              weight: document.getElementById("workout-weight")?.value || "",
              age: document.getElementById("workout-age")?.value || "",
              height: document.getElementById("workout-height")?.value || "",
              gender: document.getElementById("workout-gender")?.value || "",
              split: document.getElementById("workout-split")?.value || "",
              frequency: document.getElementById("workout-frequency")?.value || "",
              supplements: document.getElementById("workout-supplements")?.value || ""
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error("Workout-Plan konnte nicht generiert werden.");
      }

      const result = await response.json();
      if (!result.plan) throw new Error("Ungültige Antwort vom Server.");

      workoutMarkdown = result.plan;
      if (workoutPlanDisplay) {
        workoutPlanDisplay.innerHTML = typeof marked !== "undefined" ? marked.parse(result.plan) : result.plan;
      }

    } catch (err) {
      alert("Fehler beim Generieren des Workout-Plans: " + err.message);
    } finally {
      hideLoader("workout-loader");
    }
  };

  // ======================= NUTRITION =======================
  window.generateNutrition = async () => {
    showLoader("nutrition-loader");
    const nutritionPlanDisplay = document.getElementById("nutrition-plan-display");
    if (nutritionPlanDisplay) {
      nutritionPlanDisplay.innerHTML = "";
    }

    try {
      const { data, error: sessErr } = await supabase.auth.getSession();
      if (sessErr) throw new Error("Fehler beim Authentifizieren: " + sessErr.message);
      const session = data?.session;
      if (!session) throw new Error("Nicht eingeloggt.");

      const response = await fetch(
        "http://localhost:5678/webhook/e2499cf7-e96f-45e2-ba15-6557cd588bfe",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: session.user.id,
            type: "nutrition",
            data: {
              height: document.getElementById("nutrition-height")?.value || "",
              weight: document.getElementById("nutrition-weight")?.value || "",
              age: document.getElementById("nutrition-age")?.value || "",
              gender: document.getElementById("nutrition-gender")?.value || "",
              calories: document.getElementById("nutrition-calories")?.value || "",
              goal: document.getElementById("nutrition-goal")?.value || "",
              additional: document.getElementById("addition")?.value || ""
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error("Nutrition-Plan konnte nicht generiert werden.");
      }

      const result = await response.json();
      if (!result.plan) throw new Error("Ungültige Antwort vom Server.");

      nutritionMarkdown = result.plan;
      if (nutritionPlanDisplay) {
        nutritionPlanDisplay.innerHTML = typeof marked !== "undefined" ? marked.parse(result.plan) : result.plan;
      }

    } catch (err) {
      alert("Fehler beim Generieren des Nutrition-Plans: " + err.message);
    } finally {
      hideLoader("nutrition-loader");
    }
  };
}

// ======================= BESTÄTIGEN =======================
window.confirmWorkout = async () => {
  if (!workoutMarkdown) {
    alert("Bitte zuerst einen Workout-Plan generieren.");
    return;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    alert("Fehler beim Authentifizieren: " + error.message);
    return;
  }
  const session = data?.session;
  if (!session) {
    alert("Nicht eingeloggt.");
    window.location.href = "login.html";
    return;
  }

  const { error: upsertError } = await supabase.from("workout_plans")
    .upsert(
      { user_id: session.user.id, plan: workoutMarkdown },
      { onConflict: ["user_id"], returning: "representation" }
    );
  if (upsertError) {
    alert("Fehler beim Speichern des Workout-Plans: " + upsertError.message);
    return;
  }

  alert("Workout-Plan gespeichert!");
  window.location.href = "dashboard.html"; // sofort Dashboard anzeigen
};

window.confirmNutrition = async () => {
  if (!nutritionMarkdown) {
    alert("Bitte zuerst einen Nutrition-Plan generieren.");
    return;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    alert("Fehler beim Authentifizieren: " + error.message);
    return;
  }
  const session = data?.session;
  if (!session) {
    alert("Nicht eingeloggt.");
    window.location.href = "login.html";
    return;
  }

  const { error: upsertError } = await supabase.from("nutrition_plans")
    .upsert(
      { user_id: session.user.id, plan: nutritionMarkdown },
      { onConflict: ["user_id"], returning: "representation" }
    );
  if (upsertError) {
    alert("Fehler beim Speichern des Nutrition-Plans: " + upsertError.message);
    return;
  }

  alert("Nutrition-Plan gespeichert!");
  window.location.href = "dashboard.html"; // sofort Dashboard anzeigen
};
