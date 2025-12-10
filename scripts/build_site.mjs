import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import ejs from 'ejs';
import { marked } from 'marked';

const CONTENT_DIR = 'content';
const LAYOUTS_DIR = '_layouts';
const OUTPUT_DIR = '.';

async function build() {
      // Ensure content dir exists
      try {
            await fs.access(CONTENT_DIR);
      } catch {
            console.error(`Content directory ${CONTENT_DIR} not found.`);
            return;
      }

      // Read default layout
      const layoutPath = path.join(LAYOUTS_DIR, 'default.html');
      let layout;
      try {
            layout = await fs.readFile(layoutPath, 'utf8');
      } catch (e) {
            console.error(`Layout ${layoutPath} not found.`);
            return;
      }

      const files = await fs.readdir(CONTENT_DIR);

      for (const file of files) {
            if (path.extname(file) !== '.md') continue;

            console.log(`Building ${file}...`);
            const filePath = path.join(CONTENT_DIR, file);
            const fileContent = await fs.readFile(filePath, 'utf8');

            const { data, content } = matter(fileContent);

            // Convert markdown to HTML
            const htmlContent = marked.parse(content);

            // Prepare data for template
            const templateData = {
                  ...data,
                  content: htmlContent,
                  currentPath: file.replace('.md', '.html'),
                  title: data.title || 'byAIm'
            };

            // Render template
            const rendered = ejs.render(layout, templateData);

            // Write output
            const outputFilename = file.replace('.md', '.html');
            const outputPath = path.join(OUTPUT_DIR, outputFilename);

            await fs.writeFile(outputPath, rendered);
            console.log(`Generated: ${outputPath}`);
      }
}

build().catch(console.error);
