import { PROJECT_TITLE } from "~/lib/constants";

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL || `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;

  const config = {
    accountAssociation: {
      message: {
        domain: "chaingazer.vercel.app",
        timestamp: 1738534380,
        expirationTime: 1746310380
      },
      signature: "68d4047f6056d50f3db5fa2bf6a6e4573ac75033fa601f363b74ff9be1ae4fab6e305e70e2d490c2a5420117c19aef5d7feb6aff7430b77b9db25e1a15636e9e1c",
      signingKey: "1fe4bb4b772852c2b80fc6e104d58d07e89158a12402b11e1e619e9a3449ac02"
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
