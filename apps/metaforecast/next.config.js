// via https://nextjs.org/docs/pages/api-reference/config/next-config-js/output#caveats
// should help with prisma
module.exports = {
  // this includes files from the monorepo base two directories up
  outputFileTracingRoot: path.join(__dirname, "../../"),
};
