const pageSize = 20;
const studyGrid = document.querySelector("#study-grid");
const studyCount = document.querySelector("#study-count");
const pageCount = document.querySelector("#page-count");
const familyFilter = document.querySelector("#family-filter");
const previousButton = document.querySelector("#previous");
const nextButton = document.querySelector("#next-page");
const error = document.querySelector("#error");
let colours = [];
let page = 0;

function getcolourFamily(hex, name) {
  const rgb = [0, 2, 4]
    .map((index) => parseInt(hex.slice(index, index + 2), 16) / 255)
    .map((value) => value <= 0.04045
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4);
  const [red, green, blue] = rgb;
  const xyz = [
    (0.4124564 * red + 0.3575761 * green + 0.1804375 * blue) / 0.95047,
    0.2126729 * red + 0.7151522 * green + 0.072175 * blue,
    (0.0193339 * red + 0.119192 * green + 0.9503041 * blue) / 1.08883,
  ];
  const labCurve = (value) => value > 216 / 24389
    ? Math.cbrt(value)
    : value / (3 * (6 / 29) ** 2) + 4 / 29;
  const [x, y, z] = xyz.map(labCurve);
  const lightness = 116 * y - 16;
  const a = 500 * (x - y);
  const b = 200 * (y - z);
  const chroma = Math.hypot(a, b);
  const hue = (Math.atan2(b, a) * 180 / Math.PI + 360) % 360;

  if (chroma < 10) return "neutral";
  if (/green|lime|olive|shoot/.test(name)) return "green";
  if (lightness < 48 && hue >= 25 && hue < 115) return "orange-brown";
  if (hue >= 330 || hue < 45) return "red-pink";
  if (hue < 85) return "orange-brown";
  if (hue < 112) return "yellow";
  if (hue < 200) return "green";
  if (hue < 285) return "blue";
  return "purple";
}

function renderCards() {
  const group = familyFilter.value;
  const visiblecolours = colours.filter((colour) => colour.family === group);
  const pageTotal = Math.max(1, Math.ceil(visiblecolours.length / pageSize));
  page = Math.min(page, pageTotal - 1);
  const pagecolours = visiblecolours.slice(page * pageSize, (page + 1) * pageSize);

  studyGrid.replaceChildren(...pagecolours.map(createCard));
  studyCount.textContent = `${visiblecolours.length} colours`;
  pageCount.textContent = `Page ${page + 1} of ${pageTotal}`;
  previousButton.disabled = page === 0;
  nextButton.disabled = page >= pageTotal - 1;
}

function createCard(colour) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "study-card";
  card.setAttribute("aria-expanded", "false");
  card.setAttribute("aria-label", "Reveal colour name");

  const swatch = document.createElement("span");
  swatch.className = "study-swatch";
  swatch.style.backgroundColor = `#${colour.hex}`;
  swatch.setAttribute("aria-hidden", "true");

  const prompt = document.createElement("span");
  prompt.className = "study-prompt";
  prompt.textContent = "Click to reveal";

  const details = document.createElement("span");
  details.className = "study-details";
  details.hidden = true;

  const name = document.createElement("span");
  name.className = "study-name";
  name.textContent = colour.name;

  const meta = document.createElement("span");
  meta.className = "study-meta";
  meta.textContent = `${colour.code}  ·  #${colour.hex}`;
  details.append(name, meta);
  card.append(swatch, prompt, details);

  card.addEventListener("click", () => {
    const isRevealed = card.getAttribute("aria-expanded") !== "true";
    card.setAttribute("aria-expanded", String(isRevealed));
    card.setAttribute("aria-label", isRevealed ? `${colour.name}, ${colour.code}, #${colour.hex}` : "Reveal colour name");
    prompt.hidden = isRevealed;
    details.hidden = !isRevealed;
  });

  return card;
}

familyFilter.addEventListener("change", () => {
  page = 0;
  renderCards();
});

previousButton.addEventListener("click", () => {
  page -= 1;
  renderCards();
});

nextButton.addEventListener("click", () => {
  page += 1;
  renderCards();
});

fetch("pantone-numbers.json")
  .then((response) => {
    if (!response.ok) throw new Error("Could not load pantone-numbers.json");
    return response.json();
  })
  .then((data) => {
    colours = Object.entries(data)
      .filter(([, colour]) => typeof colour.name === "string" && /^[0-9a-f]{6}$/i.test(colour.hex))
      .map(([code, colour]) => ({ ...colour, code, family: getcolourFamily(colour.hex, colour.name) }))
      .sort((first, second) => first.name.localeCompare(second.name));
    renderCards();
  })
  .catch((loadError) => {
    studyCount.textContent = "Unable to load colours";
    error.hidden = false;
    error.textContent = `${loadError.message}. Open this page from a local web server.`;
  });