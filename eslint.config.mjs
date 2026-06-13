import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  {
    ignores: ["ignore/**"],
  },
  ...nextVitals,
];

export default config;
