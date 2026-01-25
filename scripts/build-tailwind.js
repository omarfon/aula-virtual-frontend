const fs = require('fs');
const path = require('path');
const postcss = require('postcss');

async function build() {
  const input = path.join(__dirname, '..', 'src', 'styles.css');
  const output = path.join(__dirname, '..', 'src', 'tailwind.css');
  const css = fs.readFileSync(input, 'utf8');
  const plugins = [require('@tailwindcss/postcss')(), require('autoprefixer')];
  try {
    const result = await postcss(plugins).process(css, { from: input, to: output });
    fs.writeFileSync(output, result.css, 'utf8');
    console.log('Generated', output);
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }
}

build();
