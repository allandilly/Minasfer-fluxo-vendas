/*
  Navegação e ativos de marca da apresentação.
  - Troque os arquivos na pasta /assets/img para atualizar as logos.
  - Este script mantém a navegação por teclado e botões.
*/
const BRAND_ASSETS = {
  primary: "./assets/img/logo-horizontes-horizontal-master.svg",
  cover: "./assets/img/logo-horizontes-primary-master.svg",
  secondary: "./assets/img/logo-horizontes-stacked-master.svg",
  icon: "./assets/img/logo-horizontes-icon-master.svg",
};

const slides = Array.from(document.querySelectorAll(".slide"));
const totalSlides = slides.length;

const slideCounter = document.getElementById("slideCounter");
const progressBar = document.getElementById("progressBar");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const slidesContainer = document.getElementById("slides");

let currentIndex = 0;

function applyLogoToNodes(type, src) {
  const nodes = document.querySelectorAll(`[data-logo="${type}"]`);

  nodes.forEach((imageEl) => {
    imageEl.src = src;

    imageEl.addEventListener("error", () => {
      imageEl.closest(".logo-slot")?.classList.add("logo-missing");
      imageEl.style.display = "none";
    });

    imageEl.addEventListener("load", () => {
      imageEl.closest(".logo-slot")?.classList.remove("logo-missing");
      imageEl.style.display = "block";
    });
  });
}

function updateSlideState() {
  slides.forEach((slide, index) => {
    slide.classList.remove("active", "prev");

    if (index === currentIndex) {
      slide.classList.add("active");
      return;
    }

    if (index < currentIndex) {
      slide.classList.add("prev");
    }
  });

  const visibleNumber = currentIndex + 1;
  slideCounter.textContent = `${visibleNumber} / ${totalSlides}`;
  progressBar.style.width = `${(visibleNumber / totalSlides) * 100}%`;

  prevBtn.disabled = currentIndex === 0;
  nextBtn.disabled = currentIndex === totalSlides - 1;

  const title = slides[currentIndex]?.dataset?.title;
  if (title) {
    document.title = title === "Capa" ? "Novo Fluxo de Vendas Minasfer" : `${title} | Novo Fluxo de Vendas Minasfer`;
  }
}

function goToSlide(nextIndex) {
  if (nextIndex < 0 || nextIndex > totalSlides - 1 || nextIndex === currentIndex) {
    return;
  }

  currentIndex = nextIndex;
  updateSlideState();
}

function handleKeyboardNavigation(event) {
  const tag = event.target?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
    return;
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    goToSlide(currentIndex + 1);
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    goToSlide(currentIndex - 1);
  }
}

function handleTapNavigation(event) {
  if (!slidesContainer) {
    return;
  }

  const interactiveTarget = event.target?.closest?.("button, a, input, textarea, select, label, summary");
  if (interactiveTarget) {
    return;
  }

  const rect = slidesContainer.getBoundingClientRect();
  if (!rect.width) {
    return;
  }

  const pointerX = event.clientX;
  if (typeof pointerX !== "number") {
    return;
  }

  const relativeX = (pointerX - rect.left) / rect.width;
  if (relativeX <= 0.33) {
    goToSlide(currentIndex - 1);
    return;
  }

  if (relativeX >= 0.67) {
    goToSlide(currentIndex + 1);
  }
}

prevBtn.addEventListener("click", () => goToSlide(currentIndex - 1));
nextBtn.addEventListener("click", () => goToSlide(currentIndex + 1));
document.addEventListener("keydown", handleKeyboardNavigation);
slidesContainer?.addEventListener("click", handleTapNavigation);

applyLogoToNodes("primary", BRAND_ASSETS.primary);
applyLogoToNodes("cover", BRAND_ASSETS.cover);
applyLogoToNodes("secondary", BRAND_ASSETS.secondary);
applyLogoToNodes("icon", BRAND_ASSETS.icon);
updateSlideState();
