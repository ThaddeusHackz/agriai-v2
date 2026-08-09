import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // The React 19 hooks plugin flags the standard "fetch data on mount"
      // pattern (setState inside async .then/.finally callbacks after an
      // effect-triggered fetch) as `set-state-in-effect`. This is the pattern
      // recommended in the official React docs for data fetching, so we treat
      // the rule as advisory rather than a build error.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
