import { primaryNavigation, type AppSection } from '../../routes'

export default function MainNavigation({ current }: { current: AppSection }) {
  return (
    <nav aria-label="주요 기능" className="primary-navigation">
      {primaryNavigation.map((item) => (
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
