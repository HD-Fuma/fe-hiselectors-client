import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number
}

function SvgIcon({ size = 24, children, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      {children}
    </svg>
  )
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="m15 5-7 7 7 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </SvgIcon>
  )
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="m9 5 7 7-7 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </SvgIcon>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="m5 12 4.2 4.2L19 6.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </SvgIcon>
  )
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </SvgIcon>
  )
}

export function CopyIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <rect height="12" rx="1" stroke="currentColor" strokeWidth="1.5" width="12" x="8" y="8" />
      <path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" stroke="currentColor" strokeWidth="1.5" />
    </SvgIcon>
  )
}

export function SearchIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="10.5" cy="10.5" r="6" stroke="currentColor" strokeWidth="1.7" />
      <path d="m15 15 4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </SvgIcon>
  )
}

export function EyeIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M3.5 12s3-5 8.5-5 8.5 5 8.5 5-3 5-8.5 5-8.5-5-8.5-5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </SvgIcon>
  )
}

export function ShareIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="18" cy="5" fill="currentColor" r="2" />
      <circle cx="6" cy="12" fill="currentColor" r="2" />
      <circle cx="18" cy="19" fill="currentColor" r="2" />
      <path d="m8 11 8-5M8 13l8 5" stroke="currentColor" strokeWidth="1.6" />
    </SvgIcon>
  )
}

export function ExternalLinkIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M13 5h6v6M19 5l-8 8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
      <path d="M17 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h5" stroke="currentColor" strokeWidth="1.6" />
    </SvgIcon>
  )
}

export function PersonIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 19c.7-3.6 2.9-5.5 6.5-5.5s5.8 1.9 6.5 5.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </SvgIcon>
  )
}

export function LinkIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="m9.5 14.5 5-5M8 16l-1 1a3.5 3.5 0 0 1-5-5l3-3a3.5 3.5 0 0 1 5-.1M16 8l1-1a3.5 3.5 0 1 1 5 5l-3 3a3.5 3.5 0 0 1-5 .1" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </SvgIcon>
  )
}

export function CartIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M3 5h2l1.5 9h10.8l2-6H6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <circle cx="9" cy="18.5" fill="currentColor" r="1.5" />
      <circle cx="17" cy="18.5" fill="currentColor" r="1.5" />
    </SvgIcon>
  )
}

export function CoinIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 9.2c.6-.8 1.6-1.2 3-1.2 1.7 0 2.7.7 2.7 1.8 0 2.8-5.4 1.1-5.4 4 0 1.3 1 2.2 2.9 2.2 1.3 0 2.3-.4 3-1.3M12 6.5v11" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" />
    </SvgIcon>
  )
}

export function GiftIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M4 10h16v10H4zM3 7h18v4H3zM12 7v13" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M12 7c-2.6 0-4.5-.7-4.5-2.1 0-1 .8-1.7 1.8-1.4C10.7 3.8 11.5 5.4 12 7Zm0 0c2.6 0 4.5-.7 4.5-2.1 0-1-.8-1.7-1.8-1.4C13.3 3.8 12.5 5.4 12 7Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
    </SvgIcon>
  )
}

export function ChartIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M4 19V5M4 19h16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      <path d="m7 15 3-4 3 2 5-7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </SvgIcon>
  )
}
