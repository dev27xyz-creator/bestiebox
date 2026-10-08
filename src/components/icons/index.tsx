import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  width: 20,
  height: 20,
  fill: "currentColor",
  "aria-hidden": true,
} as const;

export function BestieMark(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 2.4 14.1 7l5 .7-3.6 3.5.9 5-4.4-2.4-4.4 2.4.8-5-3.6-3.5 5-.7L12 2.4Z" />
      <path d="M6.3 17.2c1.5 1.8 3.4 2.7 5.7 2.7s4.2-.9 5.7-2.7l1.8 1.5c-1.9 2.4-4.4 3.6-7.5 3.6s-5.6-1.2-7.5-3.6l1.8-1.5Z" />
    </svg>
  );
}

export function RulerIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-11Zm3 .1v3h2v-2h2v2h2v-2h2v2h2v-2h2v-1h-12Zm0 10.8h12v-1h-2v-2h-2v2h-2v-2h-2v2H8v-2H6v3Z" />
    </svg>
  );
}

export function CompareIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 4h6.2v16H4A2 2 0 0 1 2 18V6a2 2 0 0 1 2-2Zm9.8 0H20a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6.2V4ZM6 8v2h2V8H6Zm0 4v2h2v-2H6Zm9-4v2h4V8h-4Zm0 4v2h4v-2h-4Z" />
    </svg>
  );
}

export function ArrowLeftRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7.7 4.3a1 1 0 0 1 1.4 0l3 3a1 1 0 0 1-.7 1.7H9v6h2.4a1 1 0 0 1 0 2H8a1 1 0 0 1-1-1V9H4.6a1 1 0 0 1-.7-1.7l3.8-3Zm8.6 15.4a1 1 0 0 1-1.4 0l-3-3a1 1 0 0 1 .7-1.7H15V9h-2.4a1 1 0 0 1 0-2H16a1 1 0 0 1 1 1v7h2.4a1 1 0 0 1 .7 1.7l-3.8 3Z" />
    </svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM11 2h2v3h-2V2Zm0 17h2v3h-2v-3ZM2 11h3v2H2v-2Zm17 0h3v2h-3v-2ZM4.2 5.6l1.4-1.4 2.1 2.1-1.4 1.4-2.1-2.1Zm12.1 12.1 1.4-1.4 2.1 2.1-1.4 1.4-2.1-2.1Zm1.4-11.4 2.1-2.1 1.4 1.4-2.1 2.1-1.4-1.4ZM4.2 18.4l2.1-2.1 1.4 1.4-2.1 2.1-1.4-1.4Z" />
    </svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20.4 15.3A8.5 8.5 0 0 1 8.7 3.6a8.5 8.5 0 1 0 11.7 11.7Z" />
    </svg>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8 3h9a2 2 0 0 1 2 2v11h-2V5H8V3Zm-3 4h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Zm0 2v10h9V9H5Z" />
    </svg>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M11 3h2v9.2l3.1-3.1 1.4 1.4-5.5 5.5-5.5-5.5 1.4-1.4 3.1 3.1V3ZM4 18h16v3H4v-3Z" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m9.2 16.6-4-4 1.7-1.7 2.3 2.3 7.9-7.9 1.7 1.7-9.6 9.6Z" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m5.3 8.5 1.4-1.4 5.3 5.3 5.3-5.3 1.4 1.4-6.7 6.7-6.7-6.7Z" />
    </svg>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-6h2v6Zm0-8h-2V7h2v2Z" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M11 3h2v8h8v2h-8v8h-2v-8H3v-2h8V3Z" />
    </svg>
  );
}

export function MinusIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 11h16v2H4v-2Z" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M13.2 4.3 20.9 12l-7.7 7.7-1.4-1.4 5.3-5.3H3v-2h14.1l-5.3-5.3 1.4-1.4Z" />
    </svg>
  );
}

export function DotGridIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm7 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm7 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM5 10.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm7 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm7 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM5 17a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm7 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm7 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
    </svg>
  );
}

export function TshirtIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8.3 3h2.4a1.3 1.3 0 0 0 2.6 0h2.4l5.1 3.5-2.4 4-2.1-1.3V21H7.7V9.2l-2.1 1.3-2.4-4L8.3 3Z" />
    </svg>
  );
}

export function ShirtIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8.4 3h2.1l1.5 2 1.5-2h2.1l4.8 3.1-2.1 4.4-2.2-1.2V21H7.9V9.3l-2.2 1.2-2.1-4.4L8.4 3Z" />
      <path d="m10.5 3 1.5 2 1.5-2-1.5 7-1.5-7Zm1 8h1v2h-1zm0 4h1v2h-1z" fill="#fff" opacity=".88" />
    </svg>
  );
}

export function JeansIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 3h10l2 18h-5l-2-8-2 8H5L7 3Zm1.5 2-.7 6.5h8.4L15.5 5h-7Z" />
      <path d="M11.5 5h1v2h-1zm-2.8 8h1v1.5h-1zm5.6 0h1v1.5h-1z" fill="#fff" opacity=".86" />
    </svg>
  );
}

export function PantsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 3h10l2 18h-5.2L12 12l-1.8 9H5L7 3Zm1.7 2-.5 4.5h7.6L15.3 5H8.7Z" />
      <path d="M11.5 5h1v2h-1z" fill="#fff" opacity=".86" />
    </svg>
  );
}

export function DressIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M10 3h4l1 3 2 2-1.1 3 4.1 10H4l4.1-10L7 8l2-2 1-3Zm.6 3.2L9.1 8l1.3 2.2h3.2L14.9 8l-1.5-1.8-.6-1.8h-1.6l-.6 1.8Z" />
    </svg>
  );
}

export function JacketIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8.4 3h2.1l1.5 2 1.5-2h2.1l4.2 3-1.8 4.7-2-1.2V21H8V9.5L6 10.7 4.2 6l4.2-3Z" />
      <path d="M11.5 5h1v14h-1zm-1.8 1.1 1.1 1.1-1.4 1.4-1.1-1.1zm4.6 0 1.4 1.4-1.1 1.1-1.4-1.4z" fill="#fff" opacity=".88" />
    </svg>
  );
}
