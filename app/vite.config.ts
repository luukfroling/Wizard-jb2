import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
<<<<<<< HEAD
  plugins: [solidPlugin()],
  base: "./",
  server: {
    port: 3000,
  },
  build: {
    target: "esnext",
  },
=======
    plugins: [solidPlugin()],
    server: {
        port: 3000,
    },
    build: {
        target: "esnext",
    },
>>>>>>> 38584ec (Add prosemirror support)
});
