import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#252729" }}>
      <div style={{ width: 430, height: 430, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="430" height="430" viewBox="0 0 430 430" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#000" floodOpacity="0.45"/></filter>
          </defs>
          <path filter="url(#shadow)" fill="#080808" d="M35 42h143l37 94 37-94h143v77h-57L258 388h-86L92 119H35z"/>
          <path fill="#F1E5CF" d="M49 55h119l47 119 47-119h119v50h-53L247 374h-64L102 105H49z"/>
          <path fill="#B20D22" stroke="#080808" strokeWidth="8" d="M63 69h96l56 143 56-143h96v22h-50L236 360h-42L113 91H63z"/>
        </svg>
      </div>
    </div>,
    size
  );
}
