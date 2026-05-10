import { notFound } from 'next/navigation'
import { SPORTS_CONFIG } from '@/config/sports.config'
import SportPageClient from '@/components/SportPageClient'

export function generateStaticParams() {
  return SPORTS_CONFIG.map((s) => ({ slug: s.slug }))
}

export default function SportPage({ params }: { params: { slug: string } }) {
  const sport = SPORTS_CONFIG.find((s) => s.slug === params.slug)
  if (!sport) notFound()
  return <SportPageClient sport={sport!} />
}
