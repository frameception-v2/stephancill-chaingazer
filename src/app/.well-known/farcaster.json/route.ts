import { PROJECT_TITLE } from "~/lib/constants";

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL || `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;

  const config = {
    accountAssociation: {
        header: "eyJmaWQiOjg2OTk5OSwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDc2ZDUwQjBFMTQ3OWE5QmEyYkQ5MzVGMUU5YTI3QzBjNjQ5QzhDMTIifQ",
        payload: "eyJkb21haW4iOiJzdGVwaGFuY2lsbC1jaGFpbmdhemVyLnZlcmNlbC5hcHAifQ",
        signature: "MHgwYjY2OWZkNTJhOWQ0YTMzMDNhMDdhNGJmNzdmZDBiZjM3NDViMWU0YWZlZmI4YThjYmViZmExM2U0NDIxNzQ0MDljZTM5N2ZmODFjZWJlYjE5MmVmZTY3MzVmY2MwMjVhNmRhYjFmNGFkNjcwNjVhNDYzMDE2ZjJhMDcwODc3YjFj",
    },
    frame: {
      version: "1",
      name: PROJECT_TITLE,
      iconUrl: `${appUrl}/icon.png`,
      homeUrl: appUrl,
      imageUrl: `${appUrl}/frames/hello/opengraph-image`,
      buttonTitle: "Launch Frame",
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#f7f7f7",
      webhookUrl: `${appUrl}/api/webhook`,
    },
  };

  return Response.json(config);
}
