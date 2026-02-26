import withMT from "@material-tailwind/react/utils/withMT";
import plugin from "tailwindcss/plugin";

/** @type {import('tailwindcss').Config} */
export default withMT({
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [
    plugin(function ({ addVariant }) {
      addVariant("not-last-child", "&>*:not(:last-child)"); // select all child except last
    }),
  ],
});
