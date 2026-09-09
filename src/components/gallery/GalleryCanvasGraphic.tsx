"use client";

import React, { useMemo } from "react";
import { SocialPostData, PostStyleId, AspectRatioKey } from "./types";
import { BrandIcon } from "@/lib/brandLogos";
import { useSession } from "@/lib/auth/client";
import { useStaticAvatar } from "@/lib/useStaticAvatar";

interface GalleryCanvasGraphicProps {
  post: SocialPostData;
  styleId?: PostStyleId;
  aspectRatio?: AspectRatioKey | string;
  className?: string;
  isUnrounded?: boolean;
}

export const GalleryCanvasGraphic: React.FC<GalleryCanvasGraphicProps> = ({
  post,
  aspectRatio = "4:5",
  className = "",
  isUnrounded = false,
}) => {
  const { data: session } = useSession();
  const userImage = session?.user?.image;
  const { staticUrl, hasError } = useStaticAvatar(userImage);

  // Provider Accent Colors
  const accentColor = useMemo(() => {
    switch (post.provider) {
      case "polar":
        return "#3754F6";
      case "stripe":
        return "#6366F1";
      case "revenuecat":
        return "#FDAC04";
      case "lemonsqueezy":
        return "#FFC700";
      case "appstore":
        return "#007AFF";
      case "googleplay":
        return "#01875F";
      default:
        return "#3754F6";
    }
  }, [post.provider]);

  const isOrderPost = post.category === "volume" || post.title.toUpperCase().includes("ORDER");

  // Metric value formatting
  const formattedValue = useMemo(() => {
    if (isOrderPost) {
      const num = typeof post.metricValue === "number" && !isNaN(post.metricValue) ? post.metricValue : 0;
      return `${num.toLocaleString()} ${num === 1 ? "Order" : "Orders"}`;
    }
    const symbol = post.currencySymbol || "$";
    const num = typeof post.metricValue === "number" && !isNaN(post.metricValue) ? post.metricValue : 0;
    const formattedNum = num % 1 !== 0 ? num.toFixed(2) : num.toLocaleString();
    return `${symbol}${formattedNum}`;
  }, [isOrderPost, post.metricValue, post.currencySymbol]);

  // Peak tooltip value
  const peakDisplay = useMemo(() => {
    if (isOrderPost) {
      const p = Math.max(1, Math.round(post.metricValue * 0.4));
      return `${p} ${p === 1 ? "order" : "orders"}`;
    }
    const symbol = post.currencySymbol || "$";
    const p = Math.round(post.metricValue * 0.48);
    const formattedPeak = p % 1 !== 0 ? p.toFixed(2) : p.toLocaleString();
    return `${symbol}${formattedPeak}`;
  }, [isOrderPost, post.metricValue, post.currencySymbol]);

  // Dynamic Pill Width Calculation to prevent text and arrow overlap
  const deltaText = post.growthDelta || "+$129";
  const pillWidth = useMemo(() => {
    return Math.max(175, deltaText.length * 18 + 84);
  }, [deltaText]);

  // Compact Tooltip Width calculation
  const tooltipWidth = useMemo(() => {
    return Math.max(88, peakDisplay.length * 14.5 + 32);
  }, [peakDisplay]);

  // Initial letter
  const initialLetter = useMemo(() => {
    const clean = post.founderHandle.replace("@", "");
    return (clean[0] || post.productName[0] || "W").toUpperCase();
  }, [post.founderHandle, post.productName]);

  const uniqueId = useMemo(() => post.id.replace(/[^a-zA-Z0-9_-]/g, ""), [post.id]);

  // Product Name with generous room
  const displayName = useMemo(() => {
    if (post.productName.length > 36) {
      return `${post.productName.substring(0, 34)}...`;
    }
    return post.productName;
  }, [post.productName]);

  // Layout Calculations
  const { W, H, isVertical916, ratioCss, scale, offsetX, offsetY } = useMemo(() => {
    if (aspectRatio === "9:16") {
      return {
        W: 1080,
        H: 1920,
        isVertical916: true,
        ratioCss: "9 / 16",
        scale: 1,
        offsetX: 0,
        offsetY: 0,
      };
    }

    let targetW = 1080;
    let targetH = 1350;
    let rStr = "4 / 5";

    switch (aspectRatio) {
      case "1:1":
        targetW = 1080;
        targetH = 1080;
        rStr = "1 / 1";
        break;
      case "16:9":
        targetW = 1920;
        targetH = 1080;
        rStr = "16 / 9";
        break;
      case "4:3":
        targetW = 1200;
        targetH = 900;
        rStr = "4 / 3";
        break;
      case "3:2":
        targetW = 1200;
        targetH = 800;
        rStr = "3 / 2";
        break;
      case "3:1":
        targetW = 1500;
        targetH = 500;
        rStr = "3 / 1";
        break;
      case "21:9":
        targetW = 2560;
        targetH = 1080;
        rStr = "21 / 9";
        break;
      case "4:5":
      case "Auto":
      default:
        targetW = 1080;
        targetH = 1350;
        rStr = "4 / 5";
        break;
    }

    const s = Math.min(targetW / 1080, targetH / 1350);
    const ox = (targetW - 1080 * s) / 2;
    const oy = (targetH - 1350 * s) / 2;

    return {
      W: targetW,
      H: targetH,
      isVertical916: false,
      ratioCss: rStr,
      scale: s,
      offsetX: ox,
      offsetY: oy,
    };
  }, [aspectRatio]);

  return (
    <div
      style={{ aspectRatio: ratioCss }}
      className={`relative w-full h-full overflow-hidden select-none bg-[#F2F2F2] ${
        isUnrounded ? "rounded-none" : "rounded-2xl"
      } ${className}`}
    >
      {/* Master Artboard SVG Canvas */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-full block"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Native SVG Avatar Circular Clip Path (100% Round in DOM and Exported PNG) */}
          <clipPath id={`avatarClip_${uniqueId}`}>
            <circle cx="85.5" cy="85" r="35" />
          </clipPath>

          {/* Exact Figma Grey Chassis Linear Gradient */}
          <linearGradient
            id={`greyLinearGrad_${uniqueId}`}
            x1="540"
            y1={isVertical916 ? "780" : "200"}
            x2="540"
            y2={isVertical916 ? "1920" : "1350"}
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#E9E9E9" />
            <stop offset="1" stopColor="#C4C4C4" />
          </linearGradient>

          {/* Exact Figma Area Fill Gradient */}
          <linearGradient
            id={`areaGrad_${uniqueId}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.60" />
            <stop offset="60%" stopColor={accentColor} stopOpacity="0.18" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0.0" />
          </linearGradient>

          {/* Exact Soft Left Fade Mask */}
          <linearGradient id={`fadeMask_${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.0" />
            <stop offset="8%" stopColor="#FFFFFF" stopOpacity="1.0" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="1.0" />
          </linearGradient>

          <mask id={`chartMask_${uniqueId}`}>
            <rect x="0" y="0" width="778" height="360" fill={`url(#fadeMask_${uniqueId})`} />
          </mask>
        </defs>

        {/* 1. Full Canvas Background */}
        <rect
          width={W}
          height={H}
          rx={isUnrounded ? 0 : 28}
          fill="#F2F2F2"
        />

        {/* 2A. Special 9:16 Vertical Screen Mode: Header near Top (y=100) & Chassis extended to Bottom 1920 */}
        {isVertical916 ? (
          <g>
            {/* Top Header Bar at y=100 */}
            <g transform="translate(0, 50)">
              {staticUrl && !hasError ? (
                <g>
                  <circle cx="85.5" cy="85" r="35" fill="#E2E8F0" />
                  <image
                    href={staticUrl}
                    x="50"
                    y="50"
                    width="71"
                    height="70"
                    preserveAspectRatio="xMidYMid slice"
                    clipPath={`url(#avatarClip_${uniqueId})`}
                  />
                </g>
              ) : (
                <g>
                  <rect x="50" y="50" width="71" height="70" rx="35" fill="#E2E8F0" />
                  <text
                    x="85.5"
                    y="94"
                    textAnchor="middle"
                    fill="#0F172A"
                    fontFamily="'Inter', -apple-system, sans-serif"
                    fontWeight="700"
                    fontSize="26"
                  >
                    {initialLetter}
                  </text>
                </g>
              )}

              {/* Product Name */}
              <text
                x="142"
                y="97"
                fill="#000000"
                fontFamily="'Inter', -apple-system, sans-serif"
                fontWeight="500"
                fontSize={displayName.length > 26 ? "32" : "40"}
                letterSpacing="-0.02em"
              >
                {displayName}
              </text>

              {/* Provider Badge */}
              <rect x="959" y="50" width="71" height="70" rx="35" fill={accentColor} />
              <foreignObject x="975" y="66" width="39" height="38">
                <div className="w-full h-full flex items-center justify-center text-white">
                  <BrandIcon provider={post.provider} className="w-8 h-8 text-white" colored={false} />
                </div>
              </foreignObject>
            </g>

            {/* Grey Chassis: From y=780 down to Bottom y=1920 */}
            <path
              d="M50 980 C50 885.719 50 838.579 79.2893 809.289 C108.579 780 155.719 780 250 780 H830 C924.281 780 971.421 780 1000.71 809.289 C1030 838.579 1030 885.719 1030 980 V1920 H50 Z"
              fill={`url(#greyLinearGrad_${uniqueId})`}
            />

            {/* White Container Card (900px x 900px at y=820) */}
            <g transform="translate(0, 580)">
              <rect x="100" y="255" width="880" height="880" rx="60" fill="#000000" opacity="0.08" />
              <rect x="90" y="240" width="900" height="900" rx="60" fill="#FFFFFF" stroke="#D7D7D7" strokeWidth="1.5" />

              {/* Metric Summary Box */}
              <text x="150" y="336" fill="#5E5E5E" fontFamily="'Inter', -apple-system, sans-serif" fontWeight="500" fontSize="34">
                {post.title || "Revenue"}
              </text>
              <text x="150" y="442" fill="#1E1E1E" fontFamily="'Inter', -apple-system, sans-serif" fontWeight="500" fontSize={formattedValue.length > 10 ? "76" : "94"} letterSpacing="-0.03em">
                {formattedValue}
              </text>

              {/* Growth Pill */}
              <g>
                <rect x="151.5" y="476.5" width={pillWidth} height="71" rx="35.5" fill="#F2F2F2" stroke="#DBDBDB" strokeWidth="1.5" />
                <text x="178" y="524" fill="#000000" fontFamily="'Inter', -apple-system, sans-serif" fontWeight="600" fontSize="34">
                  {deltaText}
                </text>
                <g transform={`translate(${151.5 + pillWidth - 46}, 496)`}>
                  <path
                    d="M28.001 7.5V15.5C28.001 15.765 27.895 16.02 27.708 16.207C27.52 16.395 27.266 16.5 27.001 16.5C26.735 16.5 26.481 16.395 26.293 16.207C26.106 16.02 26.001 15.765 26.001 15.5V9.914L15.708 20.208C15.615 20.3 15.505 20.374 15.383 20.425C15.262 20.475 15.132 20.501 15.001 20.501C14.869 20.501 14.739 20.475 14.618 20.425C14.496 20.374 14.386 20.3 14.293 20.208L10.001 15.914L1.708 24.208C1.52 24.395 1.266 24.501 1.001 24.501C0.735 24.501 0.481 24.395 0.293 24.208C0.105 24.02 0 23.765 0 23.5C0 23.235 0.105 22.98 0.293 22.792L9.293 13.792C9.386 13.7 9.496 13.626 9.618 13.575C9.739 13.525 9.869 13.499 10.001 13.499C10.132 13.499 10.262 13.525 10.383 13.575C10.505 13.626 10.615 13.7 10.708 13.792L15.001 18.086L24.587 8.5H19.001C18.735 8.5 18.481 8.395 18.293 8.207C18.106 8.02 18.001 7.765 18.001 7.5C18.001 7.235 18.106 6.98 18.293 6.793C18.481 6.605 18.735 6.5 19.001 6.5H27.001C27.266 6.5 27.52 6.605 27.708 6.793C27.895 6.98 28.001 7.235 28.001 7.5Z"
                    fill="#34C759"
                  />
                </g>
              </g>

              {/* Graph Frame */}
              <g transform="translate(150, 590)">
                <g stroke="#EEF1F5" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="45" y1="80" x2="45" y2="340" />
                  <line x1="155" y1="80" x2="155" y2="340" />
                  <line x1="265" y1="80" x2="265" y2="340" />
                  <line x1="374" y1="40" x2="374" y2="340" stroke={accentColor} strokeOpacity="0.3" strokeDasharray="6 6" />
                  <line x1="484" y1="80" x2="484" y2="340" />
                  <line x1="594" y1="80" x2="594" y2="340" />
                  <line x1="704" y1="80" x2="704" y2="340" />
                </g>

                <g mask={`url(#chartMask_${uniqueId})`}>
                  <path
                    d="M 20 260 L 90 260 C 125 260, 125 195, 160 195 L 250 195 C 310 195, 310 95, 374 95 L 480 95 C 510 95, 510 140, 540 140 L 610 140 C 660 140, 660 28, 710 28 L 710 360 L 20 360 Z"
                    fill={`url(#areaGrad_${uniqueId})`}
                  />
                </g>

                <g fill="#FFFFFF" opacity="0.95">
                  <circle cx="280" cy="220" r="4" opacity="0.85" />
                  <circle cx="310" cy="245" r="5" opacity="0.9" />
                  <circle cx="340" cy="180" r="4" opacity="0.75" />
                  <circle cx="360" cy="285" r="5.5" opacity="0.95" />
                  <circle cx="400" cy="140" r="4.5" opacity="0.9" />
                  <circle cx="425" cy="205" r="4" opacity="0.8" />
                  <circle cx="445" cy="250" r="5.5" opacity="0.85" />
                  <circle cx="470" cy="170" r="4" opacity="0.9" />
                  <circle cx="495" cy="255" r="5" opacity="0.75" />
                  <circle cx="590" cy="190" r="4.5" opacity="0.85" />
                  <circle cx="620" cy="220" r="4" opacity="0.8" />
                </g>

                <path
                  d="M 20 260 L 90 260 C 125 260, 125 195, 160 195 L 250 195 C 310 195, 310 95, 374 95 L 480 95 C 510 95, 510 140, 540 140 L 610 140 C 660 140, 660 28, 710 28"
                  fill="none"
                  stroke={accentColor}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path d="M 700 48 L 710 28 L 688 33" fill="none" stroke={accentColor} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="374" cy="95" r="14" fill="#FFFFFF" stroke={accentColor} strokeWidth="7" />

                <g transform={`translate(${374 - tooltipWidth / 2}, 25)`}>
                  <rect x="0" y="0" width={tooltipWidth} height="56" rx="18" fill={accentColor} stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" />
                  <polygon points={`${tooltipWidth / 2 - 8},56 ${tooltipWidth / 2 + 8},56 ${tooltipWidth / 2},66`} fill={accentColor} />
                  <text x={tooltipWidth / 2} y="38" textAnchor="middle" fill="#FFFFFF" fontFamily="'Inter', -apple-system, sans-serif" fontWeight="700" fontSize="24">
                    {peakDisplay}
                  </text>
                </g>

                <g fontFamily="'Inter', -apple-system, sans-serif" fontSize="24" fill="#9E9E9E">
                  <text x="45" y="390" textAnchor="middle">Sun</text>
                  <text x="155" y="390" textAnchor="middle">Mon</text>
                  <text x="265" y="390" textAnchor="middle">Tue</text>
                  <text x="374" y="390" textAnchor="middle" fontWeight="700" fill="#1E1E1E">Wed</text>
                  <text x="484" y="390" textAnchor="middle">Thu</text>
                  <text x="594" y="390" textAnchor="middle">Fri</text>
                  <text x="704" y="390" textAnchor="middle">Sat</text>
                </g>
              </g>
            </g>
          </g>
        ) : (
          /* 2B. All Other Standard & Wide Formats: Pixel-Perfect 1080x1350 Original Master Card Scaled Cleanly */
          <g transform={`translate(${offsetX}, ${offsetY}) scale(${scale})`}>
            
            {/* Top Header Bar (at 50, 50) */}
            <g>
              {staticUrl && !hasError ? (
                <g>
                  <circle cx="85.5" cy="85" r="35" fill="#E2E8F0" />
                  <image
                    href={staticUrl}
                    x="50"
                    y="50"
                    width="71"
                    height="70"
                    preserveAspectRatio="xMidYMid slice"
                    clipPath={`url(#avatarClip_${uniqueId})`}
                  />
                </g>
              ) : (
                <g>
                  <rect x="50" y="50" width="71" height="70" rx="35" fill="#E2E8F0" />
                  <text
                    x="85.5"
                    y="94"
                    textAnchor="middle"
                    fill="#0F172A"
                    fontFamily="'Inter', -apple-system, sans-serif"
                    fontWeight="700"
                    fontSize="26"
                  >
                    {initialLetter}
                  </text>
                </g>
              )}

              {/* Product Name */}
              <text
                x="142"
                y="97"
                fill="#000000"
                fontFamily="'Inter', -apple-system, sans-serif"
                fontWeight="500"
                fontSize={displayName.length > 26 ? "32" : "40"}
                letterSpacing="-0.02em"
              >
                {displayName}
              </text>

              {/* Provider Icon Badge (71px x 70px at 959, 50) */}
              <rect x="959" y="50" width="71" height="70" rx="35" fill={accentColor} />
              <foreignObject x="975" y="66" width="39" height="38">
                <div className="w-full h-full flex items-center justify-center text-white">
                  <BrandIcon provider={post.provider} className="w-8 h-8 text-white" colored={false} />
                </div>
              </foreignObject>
            </g>

            {/* Chassis Container: 980px x 1150px with Exact True Figma Squircle Curvature extending to V1350 */}
            <path
              d="M50 400 C50 305.719 50 258.579 79.2893 229.289 C108.579 200 155.719 200 250 200 H830 C924.281 200 971.421 200 1000.71 229.289 C1030 258.579 1030 305.719 1030 400 V1350 H50 Z"
              fill={`url(#greyLinearGrad_${uniqueId})`}
            />

            {/* White Container Card: True Squircle (900px x 900px, rx=60) with Solid #FFFFFF & Subtle Under-Shadow */}
            <rect x="100" y="255" width="880" height="880" rx="60" fill="#000000" opacity="0.08" />
            <rect x="90" y="240" width="900" height="900" rx="60" fill="#FFFFFF" stroke="#D7D7D7" strokeWidth="1.5" />

            {/* Metric Summary Box (at x=150, y=300) */}
            <text
              x="150"
              y="336"
              fill="#5E5E5E"
              fontFamily="'Inter', -apple-system, sans-serif"
              fontWeight="500"
              fontSize="34"
            >
              {post.title || "Revenue"}
            </text>

            <text
              x="150"
              y="442"
              fill="#1E1E1E"
              fontFamily="'Inter', -apple-system, sans-serif"
              fontWeight="500"
              fontSize={formattedValue.length > 10 ? "76" : "94"}
              letterSpacing="-0.03em"
            >
              {formattedValue}
            </text>

            {/* Growth Pill with Dynamic Width */}
            <g>
              <rect
                x="151.5"
                y="476.5"
                width={pillWidth}
                height="71"
                rx="35.5"
                fill="#F2F2F2"
                stroke="#DBDBDB"
                strokeWidth="1.5"
              />
              <text
                x="178"
                y="524"
                fill="#000000"
                fontFamily="'Inter', -apple-system, sans-serif"
                fontWeight="600"
                fontSize="34"
              >
                {deltaText}
              </text>

              <g transform={`translate(${151.5 + pillWidth - 46}, 496)`}>
                <path
                  d="M28.001 7.5V15.5C28.001 15.765 27.895 16.02 27.708 16.207C27.52 16.395 27.266 16.5 27.001 16.5C26.735 16.5 26.481 16.395 26.293 16.207C26.106 16.02 26.001 15.765 26.001 15.5V9.914L15.708 20.208C15.615 20.3 15.505 20.374 15.383 20.425C15.262 20.475 15.132 20.501 15.001 20.501C14.869 20.501 14.739 20.475 14.618 20.425C14.496 20.374 14.386 20.3 14.293 20.208L10.001 15.914L1.708 24.208C1.52 24.395 1.266 24.501 1.001 24.501C0.735 24.501 0.481 24.395 0.293 24.208C0.105 24.02 0 23.765 0 23.5C0 23.235 0.105 22.98 0.293 22.792L9.293 13.792C9.386 13.7 9.496 13.626 9.618 13.575C9.739 13.525 9.869 13.499 10.001 13.499C10.132 13.499 10.262 13.525 10.383 13.575C10.505 13.626 10.615 13.7 10.708 13.792L15.001 18.086L24.587 8.5H19.001C18.735 8.5 18.481 8.395 18.293 8.207C18.106 8.02 18.001 7.765 18.001 7.5C18.001 7.235 18.106 6.98 18.293 6.793C18.481 6.605 18.735 6.5 19.001 6.5H27.001C27.266 6.5 27.52 6.605 27.708 6.793C27.895 6.98 28.001 7.235 28.001 7.5Z"
                  fill="#34C759"
                />
              </g>
            </g>

            {/* Graph Frame (778px x 472px at x=150, y=590) */}
            <g transform="translate(150, 590)">
              <g stroke="#EEF1F5" strokeWidth="2.5" strokeLinecap="round">
                <line x1="45" y1="80" x2="45" y2="340" />
                <line x1="155" y1="80" x2="155" y2="340" />
                <line x1="265" y1="80" x2="265" y2="340" />
                <line
                  x1="374"
                  y1="40"
                  x2="374"
                  y2="340"
                  stroke={accentColor}
                  strokeOpacity="0.3"
                  strokeDasharray="6 6"
                />
                <line x1="484" y1="80" x2="484" y2="340" />
                <line x1="594" y1="80" x2="594" y2="340" />
                <line x1="704" y1="80" x2="704" y2="340" />
              </g>

              <g mask={`url(#chartMask_${uniqueId})`}>
                <path
                  d="M 20 260 L 90 260 C 125 260, 125 195, 160 195 L 250 195 C 310 195, 310 95, 374 95 L 480 95 C 510 95, 510 140, 540 140 L 610 140 C 660 140, 660 28, 710 28 L 710 360 L 20 360 Z"
                  fill={`url(#areaGrad_${uniqueId})`}
                />
              </g>

              <g fill="#FFFFFF" opacity="0.95">
                <circle cx="280" cy="220" r="4" opacity="0.85" />
                <circle cx="310" cy="245" r="5" opacity="0.9" />
                <circle cx="340" cy="180" r="4" opacity="0.75" />
                <circle cx="360" cy="285" r="5.5" opacity="0.95" />
                <circle cx="400" cy="140" r="4.5" opacity="0.9" />
                <circle cx="425" cy="205" r="4" opacity="0.8" />
                <circle cx="445" cy="250" r="5.5" opacity="0.85" />
                <circle cx="470" cy="170" r="4" opacity="0.9" />
                <circle cx="495" cy="255" r="5" opacity="0.75" />
                <circle cx="590" cy="190" r="4.5" opacity="0.85" />
                <circle cx="620" cy="220" r="4" opacity="0.8" />
              </g>

              <path
                d="M 20 260 L 90 260 C 125 260, 125 195, 160 195 L 250 195 C 310 195, 310 95, 374 95 L 480 95 C 510 95, 510 140, 540 140 L 610 140 C 660 140, 660 28, 710 28"
                fill="none"
                stroke={accentColor}
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d="M 700 48 L 710 28 L 688 33"
                fill="none"
                stroke={accentColor}
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <circle
                cx="374"
                cy="95"
                r="14"
                fill="#FFFFFF"
                stroke={accentColor}
                strokeWidth="7"
              />

              <g transform={`translate(${374 - tooltipWidth / 2}, 25)`}>
                <rect
                  x="0"
                  y="0"
                  width={tooltipWidth}
                  height="56"
                  rx="18"
                  fill={accentColor}
                  stroke="rgba(255,255,255,0.45)"
                  strokeWidth="1.5"
                />
                <polygon
                  points={`${tooltipWidth / 2 - 8},56 ${tooltipWidth / 2 + 8},56 ${tooltipWidth / 2},66`}
                  fill={accentColor}
                />
                <text
                  x={tooltipWidth / 2}
                  y={38}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontFamily="'Inter', -apple-system, sans-serif"
                  fontWeight="700"
                  fontSize="24"
                >
                  {peakDisplay}
                </text>
              </g>

              <g fontFamily="'Inter', -apple-system, sans-serif" fontSize="24" fill="#9E9E9E">
                <text x="45" y="390" textAnchor="middle">Sun</text>
                <text x="155" y="390" textAnchor="middle">Mon</text>
                <text x="265" y="390" textAnchor="middle">Tue</text>
                <text x="374" y="390" textAnchor="middle" fontWeight="700" fill="#1E1E1E">Wed</text>
                <text x="484" y="390" textAnchor="middle">Thu</text>
                <text x="594" y="390" textAnchor="middle">Fri</text>
                <text x="704" y="390" textAnchor="middle">Sat</text>
              </g>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
};
