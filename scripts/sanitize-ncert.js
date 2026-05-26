const fs = require("node:fs");
const path = require("node:path");

function stripStandalonePageNumbers(text) {
  return text
    .replace(/^\s*--\s*\d+\s+of\s+\d+\s*--\s*$/gm, "")
    .replace(/^\s*(?:Page\s*)?\d{1,4}\s*$/gim, "");
}

function stripCapitalizedUnitHeaders(text) {
  return text
    .replace(/^\s*UNIT\s+[IVXLCDM0-9]+\s*$/gim, "")
    .replace(/^\s*CHAPTER\s+\d+\s*$/gim, "")
    .replace(/^\s*This unit deals with\b.*$/gim, "")
    .replace(/^\s*Geography as an integrating discipline\b.*$/gim, "")
    .replace(/^\s*[A-Z][A-Z\s,&:;()/-]{6,}(?:\s+\d{1,4})?\s*$/gm, "");
}

function cleanBulletInterruptions(text) {
  return text
    .replace(/^[\s>]*[•●○▪▫–—-]\s+/gm, "")
    .replace(/[•●○▪▫]/g, " ")
    .replace(/[ \t]*[|¦]+[ \t]*/g, " ");
}

function removePdfArtifacts(text) {
  return text
    .replace(/\bRationalised\s+\d{4}-\d{2}\b/gi, "")
    .replace(/\bReprint\s+\d{4}-\d{2}\b/gi, "")
    .replace(/\b(?:Fig\.|Figure)\s*\d+(?:\.\d+)?\b/gi, "")
    .replace(/\b\d{4}-\d{2}\b/g, "");
}

function joinNarrativeLines(text) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((block) => block
      .split(/\n/)
      .map((line) => line.trim())
      .filter(Boolean)
    .join(" "))
    .map((block) => block.replace(/\s+/g, " ").trim())
    .filter((block) => !/^Geography as an integrating discipline\b/i.test(block))
    .filter((block) => block.length >= 25);

  return paragraphs.join("\n\n").trim();
}

function sanitizeNcertText(rawText) {
  return joinNarrativeLines(
    removePdfArtifacts(
      cleanBulletInterruptions(
        stripCapitalizedUnitHeaders(
          stripStandalonePageNumbers(
            rawText
              .replace(/\r/g, "")
              .replace(/\u00a0/g, " ")
              .replace(/\u00e2\u20ac[\u201c\u201d]/g, "-")
              .replace(/[“”]/g, '"')
              .replace(/[‘’]/g, "'"),
          ),
        ),
      ),
    ),
  );
}

function parseArgs(argv) {
  const [input, ...rest] = argv;
  const outIndex = rest.findIndex((arg) => arg === "--out");
  const output = outIndex >= 0 ? rest[outIndex + 1] : "cleaned_chapter.txt";
  return { input, output };
}

function main() {
  const { input, output } = parseArgs(process.argv.slice(2));
  if (!input) {
    console.error("Usage: node scripts/sanitize-ncert.js <raw-chapter.txt> [--out cleaned_chapter.txt]");
    process.exit(1);
  }
  const inputPath = path.resolve(process.cwd(), input);
  const outputPath = path.resolve(process.cwd(), output);
  const rawText = fs.readFileSync(inputPath, "utf8");
  const cleaned = sanitizeNcertText(rawText);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${cleaned}\n`);
  console.log(JSON.stringify({ input: inputPath, output: outputPath, characters: cleaned.length }, null, 2));
}

if (require.main === module) {
  main();
}

module.exports = {
  cleanBulletInterruptions,
  joinNarrativeLines,
  removePdfArtifacts,
  sanitizeNcertText,
  stripCapitalizedUnitHeaders,
  stripStandalonePageNumbers,
};
