const GITHUB_USERNAME = "Jordi098";
const API_URL = "https://51.21.248.23:3000.execute-api.eu-north-1.amazonaws.com/github";

const SKILLS = {
    frontend: [
        {name: "HTML", icon: "devicon-html5-plain"},
        {name: "CSS", icon: "devicon-css3-plain"},
        {name: "JavaScript", icon: "devicon-javascript-plain"},
        {name: "Tailwind", icon: "devicon-tailwindcss-plain"},
        {name: "React", icon: "devicon-react-original"},
    ],
    backend: [
        {name: "Node.js", icon: "devicon-nodejs-plain"},
        {name: "Express", icon: "devicon-express-original"},
        {name: "PHP", icon: "devicon-php-plain"},
    ],
    databases: [
        {name: "MySQL", icon: "devicon-mysql-plain"},
        {name: "MongoDB", icon: "devicon-mongodb-plain"},
    ],
};

const el = (id) => document.getElementById(id);

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (m) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[m]));
}

function repoCard(repo) {
    const updated = new Date(repo.updatedAt).toLocaleDateString();

    return `
    <a href="${repo.url}" target="_blank" rel="noreferrer"
      class="group rounded-2xl border border-orange-500/20
             bg-gradient-to-br from-white/5 to-orange-500/5
             p-5 transition-all hover:-translate-y-0.5
             hover:from-white/10 hover:to-orange-500/10">

      <div class="flex items-start justify-between gap-3">
        <h3 class="font-semibold text-zinc-100">${escapeHtml(repo.name)}</h3>

        <span class="text-xs border border-orange-400/20 bg-orange-500/10 text-orange-200
                     px-2 py-1 rounded-full">
          ★ ${repo.stargazerCount}
        </span>
      </div>

      <p class="mt-2 text-sm text-zinc-200/90 line-clamp-2">
        ${repo.description ? escapeHtml(repo.description) : "Geen beschrijving."}
      </p>

      <div class="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-300">
        ${repo.primaryLanguage ? `
          <span class="border border-orange-400/20 bg-orange-500/10 text-orange-200 px-2 py-1 rounded-full">
            ${escapeHtml(repo.primaryLanguage.name)}
          </span>
        ` : ""}

        <span class="text-zinc-400">Updated: ${updated}</span>
      </div>

      <div class="mt-3 text-sm text-orange-200/90 opacity-80 group-hover:opacity-100">
        Bekijk op GitHub →
      </div>
    </a>
  `;
}

// ===== INIT =====
el("year").textContent = new Date().getFullYear();
el("ghUserText").textContent = GITHUB_USERNAME;
el("allReposLink").href = `https://github.com/${GITHUB_USERNAME}`;

const skillsWrap = el("skillsWrap");

function renderSkillSection(
    title,
    items,
    colsClass = "grid-cols-2 sm:grid-cols-3",
    wrap = true
) {
    const textClass = wrap ? "whitespace-normal break-normal" : "whitespace-nowrap";

    return `
    <div class="rounded-2xl border border-orange-500/20
                bg-gradient-to-br from-white/5 to-orange-500/5
                p-5 h-full flex flex-col transition-all
                hover:from-white/10 hover:to-orange-500/10 hover:-translate-y-0.5">
      <h3 class="text-lg font-semibold tracking-tight text-orange-200/90">${title}</h3>

      <div class="mt-4 grid gap-3 ${colsClass}">
        ${items.map(({name, icon}) => `
          <div class="flex items-center gap-3 rounded-xl
                      border border-orange-400/20 bg-orange-500/10
                      px-4 py-3 transition-colors hover:bg-orange-500/15">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center">
              <i class="${icon} text-3xl"></i>
            </div>

            <span class="min-w-0 text-sm text-zinc-100 leading-snug ${textClass}">
              ${escapeHtml(name)}
            </span>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

skillsWrap.innerHTML = `
  <div class="grid gap-4 md:grid-cols-3">
    ${renderSkillSection("Frontend", SKILLS.frontend, "grid-cols-2", true)}
    ${renderSkillSection("Backend", SKILLS.backend, "grid-cols-2", false)}
    ${renderSkillSection("Databases", SKILLS.databases, "grid-cols-2", false)}
  </div>
`;

async function loadPinned() {
    const status = el("projectsStatus");
    const grid = el("projectsGrid");

    status.textContent = "Pinned repos laden…";

    const query = `
      query($login: String!) {
        user(login: $login) {
          pinnedItems(first: 6, types: REPOSITORY) {
            nodes {
              ... on Repository {
                name
                description
                url
                updatedAt
                stargazerCount
                primaryLanguage {
                  name
                }
              }
            }
          }
        }
      }
    `;

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                query,
                variables: {
                    login: GITHUB_USERNAME
                }
            })
        });

        if (!res.ok) {
            throw new Error("Backend error: " + res.status);
        }

        const data = await res.json();

        if (data.errors) {
            throw new Error(data.errors[0]?.message || "Onbekende GraphQL fout");
        }

        const repos = data.data?.user?.pinnedItems?.nodes || [];

        if (!repos.length) {
            status.textContent = "Geen pinned repos gevonden.";
            return;
        }

        grid.innerHTML = repos.map(repoCard).join("");
        status.classList.add("hidden");
        grid.classList.remove("hidden");

    } catch (err) {
        status.innerHTML = `
          <div class="font-semibold">Fout bij laden</div>
          <div class="text-sm mt-1">${escapeHtml(err.message)}</div>
          <div class="text-sm mt-2 text-zinc-400">
            Check of je backend draait en CORS goed staat.
          </div>
        `;
    }
}

loadPinned();