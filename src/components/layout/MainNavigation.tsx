export type AppSection = 'shop' | 'campaigns' | 'performance' | 'settlement'

const mainNavigation = [
  { section: 'shop', href: '#/shop/groups', label: '샵' },
  { section: 'campaigns', href: '#/campaigns', label: '캠페인' },
  { section: 'performance', href: '#/performance', label: '성과' },
  { section: 'settlement', href: '#/settlement/info', label: '정산' },
] as const

export default function MainNavigation({ current }: { current: AppSection }) {
  return (
    <nav aria-label="주요 기능" className="main-navigation">
      {mainNavigation.map((item) => (
        <a
          aria-current={item.section === current ? 'page' : undefined}
          href={item.href}
          key={item.section}
        >
          {item.label}
        </a>
      ))}
    </nav>
  )
}
