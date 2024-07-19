module.exports = {
  async redirects() {
    return [
      {
        source: "/",
        destination:
          "https://www.aoe2companion.com/red-bull-wololo-live-standings",
        permanent: false,
        basePath: false,
      },
    ];
  },
};
