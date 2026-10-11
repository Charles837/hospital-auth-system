const dashboardStyles = `
  <style>
    :root {
      --bg: #edf5fb;
      --sidebar: #123d68;
      --sidebar-soft: #1d5b96;
      --card: #ffffff;
      --primary: #1f6fb2;
      --primary-dark: #163f68;
      --text: #19324b;
      --muted: #71849a;
      --accent: #25a571;
      --danger: #d76363;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      font-family: Arial, Helvetica, sans-serif;
      background: var(--bg);
      color: var(--text);
    }

    .dashboard-shell {
      display: grid;
      grid-template-columns: 260px 1fr;
      min-height: 100vh;
    }

    .sidebar {
      background: linear-gradient(180deg, var(--sidebar) 0%, #0d2d50 100%);
      color: white;
      padding: 24px 18px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 22px;
    }

    .brand-icon {
      width: 38px;
      height: 38px;
      display: grid;
      place-items: center;
      border-radius: 12px;
      background: rgba(255,255,255,0.12);
      font-size: 24px;
      font-weight: bold;
    }

    .sidebar-brand h2 {
      margin: 0;
      font-size: 1.5rem;
    }

    .sidebar-brand p {
      margin: 4px 0 0;
      opacity: 0.8;
    }

    nav {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 12px;
    }

    nav a {
      color: rgba(255,255,255,0.9);
      text-decoration: none;
      padding: 12px 14px;
      border-radius: 10px;
      background: rgba(255,255,255,0.04);
      transition: background 0.2s ease;
    }

    nav a:hover {
      background: rgba(255,255,255,0.1);
    }

    .logout-btn {
      width: 100%;
      border: none;
      border-radius: 12px;
      padding: 12px 16px;
      font-weight: 700;
      color: var(--text);
      background: white;
      cursor: pointer;
    }

    .content-area {
      padding: 32px;
    }

    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 28px;
      gap: 20px;
    }

    .label {
      margin: 0 0 8px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--muted);
      font-size: 0.75rem;
      font-weight: 700;
    }

    h1 {
      margin: 0;
      font-size: clamp(2rem, 3vw, 2.5rem);
      color: var(--text);
    }

    .user-pill {
      background: var(--card);
      border-radius: 999px;
      padding: 10px 18px;
      box-shadow: 0 12px 20px rgba(17, 46, 75, 0.08);
      font-weight: 700;
      color: var(--primary-dark);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(180px, 1fr));
      gap: 20px;
    }

    .stat-card {
      background: var(--card);
      padding: 22px 20px;
      border-radius: 18px;
      box-shadow: 0 12px 24px rgba(17, 46, 75, 0.08);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .stat-card span {
      color: var(--muted);
      font-size: 0.9rem;
      font-weight: 700;
    }

    .stat-card strong {
      font-size: 2rem;
      color: var(--primary-dark);
    }

    .panel-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(260px, 1fr));
      gap: 20px;
      margin-top: 26px;
    }

    .panel-card {
      background: var(--card);
      border-radius: 18px;
      padding: 22px 20px;
      box-shadow: 0 12px 24px rgba(17, 46, 75, 0.08);
    }

    .panel-card h3 {
      margin: 0 0 15px;
      font-size: 1.28rem;
      color: var(--primary-dark);
    }

    .panel-card ul {
      margin: 0;
      padding-left: 20px;
      line-height: 2;
      color: var(--text);
    }

    @media (max-width: 920px) {
      .dashboard-shell {
        grid-template-columns: 1fr;
      }

      .sidebar {
        gap: 12px;
      }

      .stats-grid,
      .panel-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    @media (max-width: 620px) {
      .stats-grid,
      .panel-grid {
        grid-template-columns: 1fr;
      }

      .content-area {
        padding: 18px;
      }

      .topbar {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  </style>
`;

document.head.insertAdjacentHTML("beforeend", dashboardStyles);

async function loadUser() {
  try {
    const response = await fetch("/api/me");
    const data = await response.json();

    if (!response.ok) {
      window.location.href = "/";
      return;
    }

    const userInfo = document.getElementById("userInfo");
    if (userInfo) {
      userInfo.textContent = `${data.user.name} (${data.user.role})`;
    }
  } catch (error) {
    window.location.href = "/";
  }
}

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await fetch("/logout", { method: "POST" });
      window.location.href = "/";
    } catch (error) {
      window.location.href = "/";
    }
  });
}

loadUser();
