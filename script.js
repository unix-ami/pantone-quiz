const roundSize = 5;
const progress = document.querySelector("#progress");
const quiz = document.querySelector("#quiz");
const swatch = document.querySelector("#swatch");
const hex = document.querySelector("#hex");
const form = document.querySelector("#answer-form");
const guess = document.querySelector("#guess");
const feedback = document.querySelector("#feedback");
const nextButton = document.querySelector("#next");
const restartButton = document.querySelector("#restart");
const error = document.querySelector("#error");
let round = [];
let colourPool = [];
let questionIndex = 0;
let score = 0;

function startRound(colours) {
  colourPool = colours;
  round = [...colourPool].sort(() => Math.random() - 0.5).slice(0, roundSize);
  questionIndex = 0;
  score = 0;
  quiz.hidden = false;
  showQuestion();
}

function showQuestion() {
  const colour = round[questionIndex];
  progress.textContent = `${questionIndex + 1} / ${roundSize}  ·  Score ${score}`;
  swatch.style.backgroundColor = `#${colour.hex}`;
  hex.textContent = `#${colour.hex}`;
  feedback.textContent = "";
  feedback.className = "";
  guess.value = "";
  guess.disabled = false;
  form.hidden = false;
  nextButton.hidden = true;
  restartButton.hidden = true;
  guess.focus();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const answer = guess.value.trim().toLowerCase();
  const correctName = round[questionIndex].name.toLowerCase();
  const isCorrect = answer === correctName;
  if (isCorrect) score += 1;
  feedback.textContent = isCorrect
    ? "Correct!"
    : `Not quite. The colour is ${correctName}.`;
  feedback.className = isCorrect ? "correct" : "incorrect";
  progress.textContent = `${questionIndex + 1} / ${roundSize}  ·  Score ${score}`;
  guess.disabled = true;
  form.hidden = true;

  if (questionIndex + 1 < roundSize) {
    nextButton.hidden = false;
    nextButton.focus();
  } else {
    feedback.textContent += ` Final score: ${score} / ${roundSize}.`;
    progress.textContent = `Round complete  ·  Score ${score} / ${roundSize}`;
    restartButton.hidden = false;
    restartButton.focus();
  }
});

nextButton.addEventListener("click", () => {
  questionIndex += 1;
  showQuestion();
});

restartButton.addEventListener("click", () => startRound(colourPool));

fetch("pantone-numbers.json")
  .then((response) => {
    if (!response.ok) throw new Error("Could not load pantone-numbers.json");
    return response.json();
  })
  .then((data) => {
    const colours = Object.values(data).filter(
      (colour) => typeof colour.name === "string" && /^[0-9a-f]{6}$/i.test(colour.hex)
    );
    if (colours.length < roundSize) throw new Error("Not enough valid colours for a quiz.");
    startRound(colours);
  })
  .catch((loadError) => {
    progress.textContent = "Unable to load colours";
    error.hidden = false;
    error.textContent = `${loadError.message}. Open this page from a local web server.`;
  });