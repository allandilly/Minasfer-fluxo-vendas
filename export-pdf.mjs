import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_HTML = path.join(__dirname, "index.html");
const OUT_PDF = path.join(__dirname, "minasfer-apresentacao-iphone.pdf");
const TMP_DIR = path.join(__dirname, ".tmp-pdf-export");
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function ensureDir(dir) {
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
}

function slideToDataUrl(buffer) {
  return `data:image/jpeg;base64,${buffer.toString("base64")}`;
}

async function main() {
  await ensureDir(TMP_DIR);

  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME_PATH,
  });

  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });

  await page.goto(`file://${SOURCE_HTML}`, { waitUntil: "networkidle" });

  const totalSlides = await page.evaluate(() => document.querySelectorAll(".slide").length);
  const dataUrls = [];

  for (let i = 0; i < totalSlides; i += 1) {
    await page.evaluate((idx) => {
      if (typeof goToSlide === "function") {
        goToSlide(idx);
      }
    }, i);

    await page.waitForTimeout(120);

    const screenshotPath = path.join(TMP_DIR, `slide-${String(i + 1).padStart(2, "0")}.jpg`);
    await page.screenshot({
      path: screenshotPath,
      type: "jpeg",
      quality: 88,
    });

    const raw = await fs.readFile(screenshotPath);
    dataUrls.push(slideToDataUrl(raw));
  }

  const pdfPage = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
  });

  const slidesHtml = dataUrls
    .map(
      (src) => `
      <section class="pdf-slide">
        <img src="${src}" alt="Slide" />
      </section>`
    )
    .join("\n");

  const html = `<!doctype html>
  <html lang="pt-BR">
    <head>
      <meta charset="utf-8" />
      <title>Minasfer - Apresentação PDF</title>
      <style>
        @page { size: 1920px 1080px; margin: 0; }
        html, body { margin: 0; padding: 0; background: #ffffff; }
        .pdf-slide {
          width: 1920px;
          height: 1080px;
          page-break-after: always;
          break-after: page;
        }
        .pdf-slide:last-child {
          page-break-after: auto;
          break-after: auto;
        }
        .pdf-slide img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      </style>
    </head>
    <body>
      ${slidesHtml}
    </body>
  </html>`;

  await pdfPage.setContent(html, { waitUntil: "load" });
  await pdfPage.pdf({
    path: OUT_PDF,
    printBackground: true,
    width: "1920px",
    height: "1080px",
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
  });

  await browser.close();
  await fs.rm(TMP_DIR, { recursive: true, force: true });

  console.log(`PDF gerado com sucesso: ${OUT_PDF}`);
}

main().catch(async (error) => {
  console.error("Falha ao gerar PDF:", error);
  try {
    await fs.rm(TMP_DIR, { recursive: true, force: true });
  } catch {}
  process.exit(1);
});
