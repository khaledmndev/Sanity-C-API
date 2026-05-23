import { defineConfig } from "sanity";
import { presentationTool } from "sanity/presentation";
import { structureTool } from "sanity/structure";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION;
const studioUrl = process.env.NEXT_PUBLIC_SANITY_STUDIO_URL;

if (!projectId || !dataset || !apiVersion || !studioUrl) {
  throw new Error(
    "[sanity.config] Missing NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, NEXT_PUBLIC_SANITY_API_VERSION, or NEXT_PUBLIC_SANITY_STUDIO_URL",
  );
}

const frontendOrigin = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export default defineConfig({
  name: "default",
  title: "Sanity Studio",
  projectId,
  dataset,
  apiVersion,
  basePath: new URL(studioUrl).pathname || "/studio",
  plugins: [
    structureTool(),
    presentationTool({
      previewUrl: {
        origin: frontendOrigin,
        draftMode: {
          enable: "/api/draft-mode/enable",
        },
      },
    }),
  ],
  schema: {
    types: [],
  },
});
