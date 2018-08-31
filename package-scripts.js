const registerSx = (sx, _ = (global.SX = {})) =>
  Object.keys(sx).forEach((key) => (global.SX[key] = sx[key]));
const sx = (name) => `node -r ./package-scripts.js -e "global.SX.${name}()"`;
const scripts = (x) => ({ scripts: x });
const exit0 = (x) => `${x} || shx echo `;
const series = (x) => `(${x.join(') && (')})`;
// const intrim = (x) => x.replace(/\n/g, ' ').replace(/ {2,}/g, ' ');

process.env.LOG_LEVEL = 'disable';
module.exports = scripts({
  build: series([exit0('shx rm -r out'), `tsc -p ./`]),
  watch: series([exit0('shx rm -r out'), `tsc -watch -p ./`]),
  fix: `prettier --write "./**/*.{js,jsx,ts,scss}"`,
  lint: {
    default: 'tslint ./src/**/*',
    md: 'markdownlint *.md --config markdown.json'
  },
  test: 'nps build && node ./node_modules/vscode/bin/test',
  validate: 'nps fix lint lint.md private.validate_last',
  update: 'npm update --save/save-dev && npm outdated',
  clean: `${exit0('shx rm -r out')} && shx rm -rf node_modules`,
  // Private
  private: {
    validate_last: `npm outdated || ${sx('countdown')}`
  }
});

registerSx({
  clear: () => console.log('\x1Bc'),
  countdown: (i = 8) => {
    if (!process.env.MSG) return;
    console.log('');
    const t = setInterval(() => {
      process.stdout.write('\r' + process.env.MSG + ' ' + i);
      !i-- && (clearInterval(t) || true) && console.log('\n');
    }, 1000);
  }
});
