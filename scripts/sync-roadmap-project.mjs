import fs from "node:fs";

const token = process.env.GITHUB_TOKEN;
const repository = process.env.GITHUB_REPOSITORY ?? "xMPon/blockcraft";
const [owner, repo] = repository.split("/");
const projectNumber = Number(process.env.ROADMAP_PROJECT_NUMBER ?? "3");
const projectOwner = process.env.ROADMAP_PROJECT_OWNER ?? owner;
const sourcePath = process.env.ROADMAP_SOURCE_FILE ?? "TODO.md";

if (!token || !projectNumber) throw new Error("GITHUB_TOKEN and ROADMAP_PROJECT_NUMBER are required");

const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" };
async function api(path, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, { ...options, headers: { ...headers, ...(options.headers ?? {}) } });
  if (!response.ok) throw new Error(`${response.status} ${path}: ${await response.text()}`);
  return response.json();
}
async function graphql(query, variables) {
  const response = await fetch("https://api.github.com/graphql", { method: "POST", headers, body: JSON.stringify({ query, variables }) });
  const result = await response.json();
  if (result.errors) throw new Error(JSON.stringify(result.errors));
  return result.data;
}

const items = [];
let category = "Uncategorised";
for (const line of fs.readFileSync(sourcePath, "utf8").split(/\r?\n/)) {
  const heading = line.match(/^##\s+(.+)/);
  if (heading) { category = heading[1].trim(); continue; }
  const task = line.match(/^- \[ \]\s+(.+)/);
  if (task) items.push({ title: task[1].trim(), category });
}

const issues = await api(`/repos/${owner}/${repo}/issues?state=all&per_page=100`);
const project = await graphql(`query($login:String!,$number:Int!){user(login:$login){projectV2(number:$number){id}}}`, { login: projectOwner, number: projectNumber });
const projectId = project.user?.projectV2?.id;
if (!projectId) throw new Error(`Project ${projectOwner}/${projectNumber} not found`);

for (const item of items) {
  const marker = `<!-- roadmap-source:${repo}:${item.title} -->`;
  const existing = issues.find((issue) => issue.body?.includes(marker));
  const body = `${marker}\n\n## Roadmap item\n\n**Project:** BlockCraft\n**Category:** ${item.category}\n**Source:** [TODO.md](https://github.com/${repository}/blob/main/TODO.md)\n\n${item.title}`;
  const issue = existing
    ? await api(`/repos/${owner}/${repo}/issues/${existing.number}`, { method: "PATCH", body: JSON.stringify({ title: `[Roadmap] ${item.title}`, body }) })
    : await api(`/repos/${owner}/${repo}/issues`, { method: "POST", body: JSON.stringify({ title: `[Roadmap] ${item.title}`, body, labels: ["roadmap", "enhancement"] }) });
  await graphql(`mutation($project:ID!,$content:ID!){addProjectV2ItemById(input:{projectId:$project,contentId:$content}){item{id}}}`, { project: projectId, content: issue.node_id });
  console.log(`${existing ? "Updated" : "Created"}: ${issue.html_url}`);
}
