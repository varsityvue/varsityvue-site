import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

const outerPath =
  "M 47 49 L 46 194 L 99 195 L 282 678 L 592 678 L 784 195 L 836 194 L 835 47 L 499 48 L 499 194 L 542 207 L 444 447 L 340 207 L 384 193 L 384 48 Z";
const redPath =
  "M 76 76 L 75 167 L 122 170 L 304 649 L 570 648 L 758 177 L 806 164 L 807 76 L 527 77 L 527 167 L 587 179 L 445 523 L 423 514 L 299 167 L 355 166 L 355 76 Z";

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
          background: "#05070A",
        }}
      >
        <svg
          width="450"
          height="362"
          viewBox="0 0 883 710"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d={outerPath} fill="#F3E9D5" stroke="#111111" strokeWidth="32" strokeLinejoin="round" />
          <path d={redPath} fill="#C8102E" stroke="#111111" strokeWidth="8" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    size
  );
}
