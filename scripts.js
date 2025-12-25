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

// ======================= GENERIEREN =======================

// -------- Loader Helpers --------
function showLoader(id) {
  const elem = document.getElementById(id);
  if (elem) elem.classList.remove("hidden");
}
function hideLoader(id) {
  const elem = document.getElementById(id);
  if (elem) elem.classList.add("hidden");
}

// Hilfsvariablen global für Confirm-Funktionen
window.workoutMarkdown = null;
window.nutritionMarkdown = null;

if (window.location.pathname.includes("generate.html")) {

  // WORKOUT GENERIEREN
  window.generateWorkout = async () => {
    showLoader("workout-loader");
    const workoutPlanDisplay = document.getElementById("workout-plan-display");
    if (workoutPlanDisplay) {
      workoutPlanDisplay.innerHTML = "";
    }
    try {
      // Session holen
      const { data, error: sessErr } = await supabase.auth.getSession();
      if (sessErr) throw new Error("Fehler beim Authentifizieren: " + sessErr.message);
      const session = data?.session;
      if (!session) throw new Error("Nicht eingeloggt.");

      // Felder validieren
      const experience = document.getElementById("workout-experience")?.value || "";
      const weight = document.getElementById("workout-weight")?.value || "";
      const age = document.getElementById("workout-age")?.value || "";
      const height = document.getElementById("workout-height")?.value || "";
      const gender = document.getElementById("workout-gender")?.value || "";
      const split = document.getElementById("workout-split")?.value || "";
      const frequency = document.getElementById("workout-frequency")?.value || "";
      const supplements = document.getElementById("workout-supplements")?.value || "";

      // Plausibilitätscheck
      if (
        (age && (isNaN(Number(age)) || Number(age) < 0)) ||
        (weight && (isNaN(Number(weight)) || Number(weight) < 0)) ||
        (height && (isNaN(Number(height)) || Number(height) < 0)) ||
        (experience && (isNaN(Number(experience)) || Number(experience) < 0)) ||
        (frequency && (isNaN(Number(frequency)) || Number(frequency) < 0))
      ) {
        throw new Error("Bitte überprüfe deine Angaben. Nur gültige Werte eingeben (keine negativen Zahlen).");
      }

      const reqBody = {
        userId: session.user.id,
        type: "workout",
        data: {
          experience,
          weight,
          age,
          height,
          gender,
          split,
          frequency,
          supplements
        }
      };

      // fetch URL: ggf. anpassen bei Deployment!
      const response = await fetch(
        "http://localhost:5678/webhook/c21aeeab-4ac2-4d90-ba1d-47718184ad8f",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reqBody)
        }
      );

      if (!response.ok) {
        let errorMsg = "Workout-Plan konnte nicht generiert werden.";
        try {
          const respErr = await response.json();
          if (respErr && respErr.error) errorMsg += " " + respErr.error;
        } catch (e) {}
        throw new Error(errorMsg);
      }

      const result = await response.json();
      if (!result || typeof result.plan !== "string" || !result.plan.length) {
        throw new Error("Ungültige Antwort vom Server.");
      }

      window.workoutMarkdown = result.plan;
      if (workoutPlanDisplay) {
        if (typeof marked !== "undefined" && marked && typeof marked.parse === "function") {
          workoutPlanDisplay.innerHTML = marked.parse(result.plan);
        } else {
          workoutPlanDisplay.textContent = result.plan;
        }
      }
    } catch (err) {
      alert("Fehler beim Generieren des Workout-Plans: " + (err && err.message ? err.message : err));
    } finally {
      hideLoader("workout-loader");
    }
  };

  // NUTRITION GENERIEREN
  window.generateNutrition = async () => {
    showLoader("nutrition-loader");
    const nutritionPlanDisplay = document.getElementById("nutrition-plan-display");
    if (nutritionPlanDisplay) {
      nutritionPlanDisplay.innerHTML = "";
    }
    try {
      // Session holen
      const { data, error: sessErr } = await supabase.auth.getSession();
      if (sessErr) throw new Error("Fehler beim Authentifizieren: " + sessErr.message);
      const session = data?.session;
      if (!session) throw new Error("Nicht eingeloggt.");

      // Felder validieren
      const height = document.getElementById("nutrition-height")?.value || "";
      const weight = document.getElementById("nutrition-weight")?.value || "";
      const age = document.getElementById("nutrition-age")?.value || "";
      const gender = document.getElementById("nutrition-gender")?.value || "";
      const calories = document.getElementById("nutrition-calories")?.value || "";
      const goal = document.getElementById("nutrition-goal")?.value || "";
      const additional = document.getElementById("addition")?.value || "";

      if (
        (age && (isNaN(Number(age)) || Number(age) < 0)) ||
        (weight && (isNaN(Number(weight)) || Number(weight) < 0)) ||
        (height && (isNaN(Number(height)) || Number(height) < 0)) ||
        (calories && (isNaN(Number(calories)) || Number(calories) < 0))
      ) {
        throw new Error("Bitte überprüfe deine Angaben. Nur gültige Werte eingeben (keine negativen Zahlen).");
      }

      const reqBody = {
        userId: session.user.id,
        type: "nutrition",
        data: {
          height,
          weight,
          age,
          gender,
          calories,
          goal,
          additional
        }
      };

      const response = await fetch(
        "http://localhost:5678/webhook/e2499cf7-e96f-45e2-ba15-6557cd588bfe",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reqBody)
        }
      );

      if (!response.ok) {
        let errorMsg = "Nutrition-Plan konnte nicht generiert werden.";
        try {
          const respErr = await response.json();
          if (respErr && respErr.error) errorMsg += " " + respErr.error;
        } catch (e) {}
        throw new Error(errorMsg);
      }

      const result = await response.json();
      if (!result || typeof result.plan !== "string" || !result.plan.length) {
        throw new Error("Ungültige Antwort vom Server.");
      }

      window.nutritionMarkdown = result.plan;
      if (nutritionPlanDisplay) {
        if (typeof marked !== "undefined" && marked && typeof marked.parse === "function") {
          nutritionPlanDisplay.innerHTML = marked.parse(result.plan);
        } else {
          nutritionPlanDisplay.textContent = result.plan;
        }
      }
    } catch (err) {
      alert("Fehler beim Generieren des Nutrition-Plans: " + (err && err.message ? err.message : err));
    } finally {
      hideLoader("nutrition-loader");
    }
  };
}


// ======================= BESTÄTIGEN =======================
window.confirmWorkout = async () => {
  if (!window.workoutMarkdown) {
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
      { user_id: session.user.id, plan: window.workoutMarkdown },
      { onConflict: ["user_id"], returning: "representation" }
    );
  if (upsertError) {
    alert("Fehler beim Speichern des Workout-Plans: " + upsertError.message);
    return;
  }

  alert("Workout-Plan gespeichert!");
  window.location.href = "dashboard.html";
};

window.confirmNutrition = async () => {
  if (!window.nutritionMarkdown) {
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
      { user_id: session.user.id, plan: window.nutritionMarkdown },
      { onConflict: ["user_id"], returning: "representation" }
    );
  if (upsertError) {
    alert("Fehler beim Speichern des Nutrition-Plans: " + upsertError.message);
    return;
  }

  alert("Nutrition-Plan gespeichert!");
  window.location.href = "dashboard.html";
};
