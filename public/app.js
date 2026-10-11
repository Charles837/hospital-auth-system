const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".panel");

for (const tab of tabs) {
  tab.addEventListener("click", () => {
    tabs.forEach((item) => item.classList.remove("active"));
    panels.forEach((panel) => panel.classList.remove("active"));

    tab.classList.add("active");
    const target = document.getElementById(`${tab.dataset.tab}-panel`);
    target.classList.add("active");
  });
}

let pendingEmail = "";

const registerForm = document.getElementById("registerForm");
registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const registerMessage = document.getElementById("registerMessage");
  registerMessage.className = "message";

  const payload = {
    staffId: document.getElementById("staffId").value,
    name: document.getElementById("name").value,
    email: document.getElementById("registerEmail").value,
    password: document.getElementById("registerPassword").value,
    role: document.getElementById("role").value
  };

  try {
    const response = await fetch("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Registration failed.");
    }

    registerMessage.textContent = data.message;
    registerMessage.classList.add("success");

    document.getElementById("qrCodeImage").src = data.qrCode;
    document.getElementById("qrCodeContainer").classList.remove("hidden");
  } catch (error) {
    registerMessage.textContent = error.message;
    registerMessage.classList.add("error");
  }
});

const loginForm = document.getElementById("loginForm");
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const loginMessage = document.getElementById("loginMessage");
  loginMessage.className = "message";

  const payload = {
    email: document.getElementById("loginEmail").value,
    password: document.getElementById("loginPassword").value
  };

  try {
    const response = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed.");
    }

    pendingEmail = payload.email;
    document.getElementById("otpSection").classList.remove("hidden");
    loginMessage.textContent = data.message;
    loginMessage.classList.add("success");
  } catch (error) {
    loginMessage.textContent = error.message;
    loginMessage.classList.add("error");
  }
});

const verifyOtpBtn = document.getElementById("verifyOtpBtn");
verifyOtpBtn.addEventListener("click", async () => {
  const loginMessage = document.getElementById("loginMessage");
  loginMessage.className = "message";

  const otp = document.getElementById("otpInput").value.trim();

  try {
    const response = await fetch("/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: pendingEmail, otp })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "OTP verification failed.");
    }

    loginMessage.textContent = `${data.message} Redirecting...`;
    loginMessage.classList.add("success");

    const role = data.user.role;
    setTimeout(() => {
      if (role === "admin") {
        window.location.href = "/admin";
      } else if (role === "doctor") {
        window.location.href = "/doctor";
      } else {
        window.location.href = "/nurse";
      }
    }, 900);
  } catch (error) {
    loginMessage.textContent = error.message;
    loginMessage.classList.add("error");
  }
});
