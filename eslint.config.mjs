import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import reactHooks from "eslint-plugin-react-hooks";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Declare the plugin explicitly so the advisory rule below always
    // resolves, regardless of how npm hoists eslint-config-next's deps.
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      // The React 19 hooks plugin flags the standard "fetch data on mount"
      // pattern (setState inside async .then/.finally callbacks after an
      // effect-triggered fetch) as `set-state-in-effect`. This is the pattern
      // recommended in the official React docs for data fetching, so we treat
      // the rule as advisory rather than a build error.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "scripts/**"]),
]);

export default eslintConfig;
