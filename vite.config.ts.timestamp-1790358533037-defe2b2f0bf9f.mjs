// vite.config.ts
import { defineConfig } from "file:///C:/Users/kened/Desktop/abhis/sih-privacy-agent/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/kened/Desktop/abhis/sih-privacy-agent/node_modules/@vitejs/plugin-react/dist/index.js";
import { crx } from "file:///C:/Users/kened/Desktop/abhis/sih-privacy-agent/node_modules/@crxjs/vite-plugin/dist/index.mjs";

// manifest.json
var manifest_default = {
  manifest_version: 3,
  name: "Privacy-Preserving Browser Agent",
  version: "1.0.0",
  description: "On-device Visual Perception for Light-weight Browser Agents",
  permissions: [
    "activeTab",
    "scripting",
    "storage",
    "sidePanel"
  ],
  host_permissions: [
    "<all_urls>"
  ],
  background: {
    service_worker: "src/background/service-worker.ts",
    type: "module"
  },
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["src/content/dom-extractor.ts"]
    }
  ],
  side_panel: {
    default_path: "index.html"
  },
  action: {
    default_title: "Open Privacy Dashboard"
  }
};

// vite.config.ts
var vite_config_default = defineConfig({
  plugins: [
    react(),
    crx({ manifest: manifest_default })
  ]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAibWFuaWZlc3QuanNvbiJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGtlbmVkXFxcXERlc2t0b3BcXFxcYWJoaXNcXFxcc2loLXByaXZhY3ktYWdlbnRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGtlbmVkXFxcXERlc2t0b3BcXFxcYWJoaXNcXFxcc2loLXByaXZhY3ktYWdlbnRcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2tlbmVkL0Rlc2t0b3AvYWJoaXMvc2loLXByaXZhY3ktYWdlbnQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcclxuaW1wb3J0IHsgY3J4IH0gZnJvbSAnQGNyeGpzL3ZpdGUtcGx1Z2luJztcclxuaW1wb3J0IG1hbmlmZXN0IGZyb20gJy4vbWFuaWZlc3QuanNvbic7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KCksXHJcbiAgICBjcngoeyBtYW5pZmVzdCB9KVxyXG4gIF1cclxufSk7XHJcbiIsICJ7XHJcbiAgXCJtYW5pZmVzdF92ZXJzaW9uXCI6IDMsXHJcbiAgXCJuYW1lXCI6IFwiUHJpdmFjeS1QcmVzZXJ2aW5nIEJyb3dzZXIgQWdlbnRcIixcclxuICBcInZlcnNpb25cIjogXCIxLjAuMFwiLFxyXG4gIFwiZGVzY3JpcHRpb25cIjogXCJPbi1kZXZpY2UgVmlzdWFsIFBlcmNlcHRpb24gZm9yIExpZ2h0LXdlaWdodCBCcm93c2VyIEFnZW50c1wiLFxyXG4gIFwicGVybWlzc2lvbnNcIjogW1xyXG4gICAgXCJhY3RpdmVUYWJcIixcclxuICAgIFwic2NyaXB0aW5nXCIsXHJcbiAgICBcInN0b3JhZ2VcIixcclxuICAgIFwic2lkZVBhbmVsXCJcclxuICBdLFxyXG4gIFwiaG9zdF9wZXJtaXNzaW9uc1wiOiBbXHJcbiAgICBcIjxhbGxfdXJscz5cIlxyXG4gIF0sXHJcbiAgXCJiYWNrZ3JvdW5kXCI6IHtcclxuICAgIFwic2VydmljZV93b3JrZXJcIjogXCJzcmMvYmFja2dyb3VuZC9zZXJ2aWNlLXdvcmtlci50c1wiLFxyXG4gICAgXCJ0eXBlXCI6IFwibW9kdWxlXCJcclxuICB9LFxyXG4gIFwiY29udGVudF9zY3JpcHRzXCI6IFtcclxuICAgIHtcclxuICAgICAgXCJtYXRjaGVzXCI6IFtcIjxhbGxfdXJscz5cIl0sXHJcbiAgICAgIFwianNcIjogW1wic3JjL2NvbnRlbnQvZG9tLWV4dHJhY3Rvci50c1wiXVxyXG4gICAgfVxyXG4gIF0sXHJcbiAgXCJzaWRlX3BhbmVsXCI6IHtcclxuICAgIFwiZGVmYXVsdF9wYXRoXCI6IFwiaW5kZXguaHRtbFwiXHJcbiAgfSxcclxuICBcImFjdGlvblwiOiB7XHJcbiAgICBcImRlZmF1bHRfdGl0bGVcIjogXCJPcGVuIFByaXZhY3kgRGFzaGJvYXJkXCJcclxuICB9XHJcbn1cclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF3VSxTQUFTLG9CQUFvQjtBQUNyVyxPQUFPLFdBQVc7QUFDbEIsU0FBUyxXQUFXOzs7QUNGcEI7QUFBQSxFQUNFLGtCQUFvQjtBQUFBLEVBQ3BCLE1BQVE7QUFBQSxFQUNSLFNBQVc7QUFBQSxFQUNYLGFBQWU7QUFBQSxFQUNmLGFBQWU7QUFBQSxJQUNiO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDRjtBQUFBLEVBQ0Esa0JBQW9CO0FBQUEsSUFDbEI7QUFBQSxFQUNGO0FBQUEsRUFDQSxZQUFjO0FBQUEsSUFDWixnQkFBa0I7QUFBQSxJQUNsQixNQUFRO0FBQUEsRUFDVjtBQUFBLEVBQ0EsaUJBQW1CO0FBQUEsSUFDakI7QUFBQSxNQUNFLFNBQVcsQ0FBQyxZQUFZO0FBQUEsTUFDeEIsSUFBTSxDQUFDLDhCQUE4QjtBQUFBLElBQ3ZDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsWUFBYztBQUFBLElBQ1osY0FBZ0I7QUFBQSxFQUNsQjtBQUFBLEVBQ0EsUUFBVTtBQUFBLElBQ1IsZUFBaUI7QUFBQSxFQUNuQjtBQUNGOzs7QUR6QkEsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sSUFBSSxFQUFFLDJCQUFTLENBQUM7QUFBQSxFQUNsQjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
