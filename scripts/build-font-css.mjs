import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';

const root = new URL('..', import.meta.url).pathname;

const fonts = [
  {
    path: 'public/fonts/AlbertSans-Regular.ttf',
    sources: [
      { family: 'Albert Sans', weight: 400 },
    ],
  },
  {
    path: 'public/fonts/AlbertSans-Bold.ttf',
    sources: [
      { family: 'Albert Sans', weight: 700 },
      { family: 'Albert_Sans:Bold', weight: 700 },
    ],
  },
  {
    path: 'public/fonts/Antonio-Regular.ttf',
    sources: [
      { family: 'Antonio', weight: 400 },
      { family: 'Antonio:Regular', weight: 400 },
    ],
  },
  {
    path: 'public/fonts/Antonio-Bold.ttf',
    sources: [
      { family: 'Antonio', weight: 700 },
    ],
  },
  {
    path: 'public/fonts/BarlowCondensed-Bold.ttf',
    sources: [
      { family: 'Barlow Condensed', weight: 700 },
      { family: 'Barlow_Condensed:Bold', weight: 700 },
    ],
  },
  {
    path: 'public/fonts/Kanit-Regular.ttf',
    sources: [
      { family: 'Kanit', weight: 400 },
    ],
  },
  {
    path: 'public/fonts/Kanit-SemiBold.ttf',
    sources: [
      { family: 'Kanit', weight: 600 },
      { family: 'Adirek_Sans:SemiBold', weight: 600 },
    ],
  },
];

const fontFace = (family, weight, data) => `@font-face {\n  font-family: '${family}';\n  font-style: normal;\n  font-weight: ${weight};\n  font-display: swap;\n  src: url('data:font/ttf;base64,${data}') format('truetype');\n}`;

const main = async () => {
  const chunks = [];

  for (const font of fonts) {
    const absolutePath = resolve(root, font.path);
    const buffer = await readFile(absolutePath);
    const base64 = buffer.toString('base64');
    for (const source of font.sources) {
      chunks.push(fontFace(source.family, source.weight, base64));
    }
  }

  const css = chunks.join('\n\n');
  const targetPath = resolve(root, 'src/styles/fonts-inline.css.ts');
  const fileContent = `export const INLINE_FONT_CSS = \`${css}\`;\n`;
  await writeFile(targetPath, fileContent);
  console.log(`✅ Generated ${targetPath}`);
};

main().catch((error) => {
  console.error('Failed to generate font CSS', error);
  process.exitCode = 1;
});
