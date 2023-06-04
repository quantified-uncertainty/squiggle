import plugin from "tailwindcss/plugin";

export default plugin(() => {}, {
  theme: {
    extend: {
      animation: {
        "appear-and-spin":
          "spin 1s linear infinite, squiggle-appear 0.2s forwards",
        "semi-appear": "squiggle-semi-appear 0.2s forwards",
        hide: "squiggle-hide 0.2s forwards",
      },
      keyframes: {
        "squiggle-appear": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "squiggle-semi-appear": {
          from: { opacity: "0" },
          to: { opacity: "0.5" },
        },
        "squiggle-hide": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
      },
    },
  },
});
