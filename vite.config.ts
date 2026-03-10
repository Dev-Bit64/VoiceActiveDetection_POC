import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      // Force onnxruntime wasm loader to resolve correctly
      "onnxruntime-web/wasm": "/onnx/ort-wasm-simd-threaded.wasm"
    }
  },

  optimizeDeps: {
    exclude: ["onnxruntime-web"]
  },

  assetsInclude: ["**/*.onnx", "**/*.wasm"]
});