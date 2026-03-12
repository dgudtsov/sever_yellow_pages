const markdownSource = `# Навигация по разделам (Telegram Mini App)

Выберите категорию, чтобы открыть список сервисов внутри мини‑приложения.

## Содержание

- [Администрация](#администрация)
- [Участковый](#участковый)
- [Детское образование](#детское-образование)
- [Прочее](#прочее)
- [Шиномонтаж и автосервис](#шиномонтаж-и-автосервис)
- [Автомойки](#автомойки)

## Администрация

- Управа района Северный
 Москва, 9-я Северная линия, дом 5
8(499)767-68-65
8.00-17.00 (пн.-чт.) 8.00-15.45 (пт.) 
Обед: 12.00-12.45

## Участковый

- Участковый пункт полиции
Александров Михаил Георгиевич
8(977)365-53-53


## Детское образование

- Панда

## Прочее

- Пока нет

## Шиномонтаж и автосервис

- Пока нет

## Автомойки

- Пока нет
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

  lines.forEach((line) => {
    if (line.startsWith("## ")) {
      const title = line.slice(3).trim();
      current = { title, items: [] };
      sections.push(current);
      return;
    }

    if (!current || current.title.toLowerCase() === "содержание") {
      return;
    }

    if (line.startsWith("- ")) {
      current.items.push(line.slice(2).trim());
    }
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
      li.textContent = item;
      if (item.toLowerCase() === "пока нет") {
        li.classList.add("placeholder");
      }
      list.appendChild(li);
    });

    if (section.items.length === 0) {
      const li = document.createElement("li");
      li.textContent = "Пока нет";
      li.classList.add("placeholder");
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
      items: section.items.filter((item) => item.toLowerCase().includes(normalized)),
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

fetch("TelegramMiniAppNavigation.md")
  .then((response) => (response.ok ? response.text() : Promise.reject(response)))
  .then((text) => initWithSections(parseSections(text)))
  .catch(() => initWithSections(parseSections(markdownSource)));

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
