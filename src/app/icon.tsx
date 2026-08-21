import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#e0332c",
          borderRadius: 14,
        }}
      >
        <div
          style={{
            width: 26,
            height: 40,
            borderRadius: 6,
            border: "4px solid white",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            paddingBottom: 4,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: "white",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
