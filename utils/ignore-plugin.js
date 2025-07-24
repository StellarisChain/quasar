/* Ignores the legacy Newtab.jsx (ESBuild) */
module.exports = {
  name: 'ignore-files',
  setup(build) {
    build.onLoad({ filter: /Newtab\.jsx$/ }, () => {
      return { contents: '', loader: 'js' };
    });
  }
};