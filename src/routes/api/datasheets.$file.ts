import { createFileRoute } from "@tanstack/react-router";
import { serveDatasheet } from "@/lib/server/datasheet-file";

export const Route = createFileRoute("/api/datasheets/$file")({
  component: () => null,
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          return await serveDatasheet(request, params.file);
        } catch (err) {
          console.error("[datasheet]", err);
          return new Response("Datasheet unavailable", { status: 500 });
        }
      },
    },
  },
});
