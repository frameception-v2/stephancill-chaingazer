import { ImageResponse } from "next/og";
import { PROJECT_TITLE, PROJECT_DESCRIPTION } from "~/lib/constants";

export const alt = "chaingazer - On-chain Analytics";
export const size = {
  width: 600,
  height: 400,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div tw="h-full w-full flex flex-col justify-center items-center relative bg-gradient-to-br from-purple-900 to-indigo-900">
        <div tw="flex flex-col items-center bg-white/10 px-12 py-8 rounded-2xl backdrop-blur-sm">
          <h1 tw="text-7xl font-bold text-white mb-4">{PROJECT_TITLE}</h1>
          <h3 tw="text-2xl text-purple-200 text-center max-w-md">{PROJECT_DESCRIPTION}</h3>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
