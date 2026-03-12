const markdownSource = `# Северный - жёлтые страницы

## Администрация

- Управа района Северный
\t- Москва, 9-я Северная линия, дом 5
\t- 8(499)767-68-65
\t- 8.00-17.00 (пн.-чт.) / 8.00-15.45 (пт.) 
\t\t- Обед: 12.00-12.45

## Косметические услуги

- VTV BEAUTY BAR

## Парикмахерские

- Кость

## Детское образование

- Панда

## 

## Шиномонтаж и автосервис

## Автомойки
`;

const contentEl = document.getElementById("content");
const tocEl = document.getElementById("toc");
const searchInput = document.getElementById("search");
const resultCount = document.getElementById("result-count");

const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u0400-\u04ff-]/g, "");

function parseSections(md) {
  const lines = md.split(/\r?\n/);
  const sections = [];
  let current = null;
  let currentItem = null;

  lines.forEach((line) => {
    if (line.startsWith("## ")) {
      const title = line.slice(3).trim();
      if (title) {
        current = { title, items: [] };
        sections.push(current);
      } else {
        current = null;
      }
      currentItem = null;
      return;
    }

    if (!current || current.title.toLowerCase() === "содержание") {
      return;
    }

    const match = line.match(/^(\s*)- (.+)$/);
    if (!match) return;

    const indent = match[1] || "";
    const text = match[2].trim();
    if (!indent) {
      currentItem = { name: text, details: [] };
      current.items.push(currentItem);
      return;
    }

    if (!currentItem) return;
    const normalized = indent.replace(/\t/g, "  ");
    const level = Math.max(1, Math.floor(normalized.length / 2));
    currentItem.details.push({ text, level });
  });

  return sections.filter((section) => section.title.toLowerCase() !== "содержание");
}

function render(sections) {
  tocEl.innerHTML = "";
  contentEl.innerHTML = "";

  sections.forEach((section) => {
    const id = slugify(section.title);

    const tocButton = document.createElement("button");
    tocButton.type = "button";
    tocButton.textContent = section.title;
    tocButton.addEventListener("click", () => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    });
    tocEl.appendChild(tocButton);

    const card = document.createElement("section");
    card.className = "section";
    card.id = id;

    const title = document.createElement("h2");
    title.textContent = section.title;
    card.appendChild(title);

    const list = document.createElement("ul");
    section.items.forEach((item) => {
      const li = document.createElement("li");
      li.className = "service";

      const name = document.createElement("div");
      name.className = "service-name";
      name.textContent = item.name;
      li.appendChild(name);

      if (item.details.length > 0) {
        const details = document.createElement("div");
        details.className = "service-details";
        item.details.forEach((detail) => {
          const line = document.createElement("div");
          line.className = "service-detail";
          line.style.paddingLeft = `${detail.level * 12}px`;
          line.textContent = detail.text;
          details.appendChild(line);
        });
        li.appendChild(details);
      }

      if (item.name.toLowerCase() === "пока нет") {
        li.classList.add("placeholder");
      }

      list.appendChild(li);
    });

    if (section.items.length === 0) {
      const li = document.createElement("li");
      li.className = "service placeholder";
      li.textContent = "Пока нет";
      list.appendChild(li);
    }

    card.appendChild(list);
    contentEl.appendChild(card);
  });
}

function applySearch(sections, query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    render(sections);
    updateCount(sections);
    return;
  }

  const filtered = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.name.toLowerCase().includes(normalized)) return true;
        return item.details.some((detail) =>
          detail.text.toLowerCase().includes(normalized)
        );
      }),
    }))
    .filter((section) => section.items.length > 0);

  render(filtered);
  updateCount(filtered);
}

function updateCount(sections) {
  const count = sections.reduce((sum, section) => sum + section.items.length, 0);
  resultCount.textContent = String(count);
}

let cachedSections = [];

function initWithSections(sections) {
  cachedSections = sections;
  render(cachedSections);
  updateCount(cachedSections);
}

fetch("YellowPages-Северный.md")
  .then((response) => (response.ok ? response.text() : Promise.reject(response)))
  .then((text) => initWithSections(parseSections(text)))
  .catch(() =>
    fetch("TelegramMiniAppNavigation.md")
      .then((response) => (response.ok ? response.text() : Promise.reject(response)))
      .then((text) => initWithSections(parseSections(text)))
      .catch(() => initWithSections(parseSections(markdownSource)))
  );

searchInput.addEventListener("input", (event) => {
  applySearch(cachedSections, event.target.value);
});

if (window.Telegram && window.Telegram.WebApp) {
  window.Telegram.WebApp.expand();
  const theme = window.Telegram.WebApp.themeParams || {};
  if (theme.bg_color) {
    document.documentElement.style.setProperty("--bg", theme.bg_color);
  }
  if (theme.text_color) {
    document.documentElement.style.setProperty("--text", theme.text_color);
  }
}
