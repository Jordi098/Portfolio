const GITHUB_USERNAME = "Jordi098";
const API_URL =
    ["localhost", "127.0.0.1"].includes(location.hostname)
        ? "http://localhost:3000/github"
        : "https://ckku79crp6.execute-api.eu-north-1.amazonaws.com/github";

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
    const updated = new Date(repo.updatedAt).toLocaleDateString("nl-NL");

    return `
    <a href="${repo.url}" target="_blank" rel="noreferrer"
      class="group surface flex min-h-56 flex-col rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-amber-300/30">

      <div class="flex items-start justify-between gap-3">
        <h3 class="text-lg font-bold tracking-normal text-white">${escapeHtml(repo.name)}</h3>

        <span class="rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-xs font-medium text-amber-100">
          ★ ${repo.stargazerCount}
        </span>
      </div>

      <p class="mt-3 line-clamp-3 text-sm leading-6 text-stone-300">
        ${repo.description ? escapeHtml(repo.description) : "Geen beschrijving."}
      </p>

      <div class="mt-auto flex flex-wrap items-center gap-2 pt-5 text-xs text-stone-300">
        ${repo.primaryLanguage ? `
          <span class="rounded-full border border-teal-300/20 bg-teal-300/10 px-2.5 py-1 font-medium text-teal-100">
            ${escapeHtml(repo.primaryLanguage.name)}
          </span>
        ` : ""}

        <span class="text-stone-400">Updated: ${updated}</span>
      </div>

      <div class="mt-4 text-sm font-semibold text-amber-200 opacity-80 transition group-hover:opacity-100">
        Bekijk op GitHub →
      </div>
    </a>
  `;
}

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
    <div class="surface flex h-full flex-col rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-amber-300/30">
      <h3 class="text-lg font-bold tracking-normal text-white">${title}</h3>

      <div class="mt-4 grid gap-3 ${colsClass}">
        ${items.map(({name, icon}) => `
          <div class="flex min-h-16 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition-colors hover:bg-white/10">
            <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-stone-950/35">
              <i class="${icon} text-2xl"></i>
            </div>

            <span class="min-w-0 text-sm font-medium leading-snug text-stone-100 ${textClass}">
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

    status.textContent = "Pinned repos laden...";

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
          <div class="mt-1 text-sm">${escapeHtml(err.message)}</div>
          <div class="mt-2 text-sm text-stone-400">
            Check of je backend draait en CORS goed staat.
          </div>
        `;
    }
}

loadPinned();
