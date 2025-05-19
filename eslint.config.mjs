import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Disable the no-explicit-any rule for TypeScript
      "@typescript-eslint/no-explicit-any": "warn", // Change to "error" in production
      
      // Disable unused vars in development but warn in production
      "@typescript-eslint/no-unused-vars": "warn",
      
      // Allow certain entities in JSX
      "react/no-unescaped-entities": [
        "error",
        {
          forbid: [">", "}"],
        },
      ],
    },
  },
];

export default eslintConfig;
