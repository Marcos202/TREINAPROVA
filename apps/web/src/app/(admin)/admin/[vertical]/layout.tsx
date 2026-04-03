import { notFound } from 'next/navigation'
import { VALID_TENANTS } from '@/config/tenants'

interface VerticalLayoutProps {
  children: React.ReactNode
  params: Promise<{ vertical: string }>
}

export default async function VerticalLayout({ children, params }: VerticalLayoutProps) {
  const { vertical } = await params

  if (!VALID_TENANTS.includes(vertical as any)) {
    notFound()
  }

  return <>{children}</>
}

export function generateStaticParams() {
  return VALID_TENANTS.map((vertical) => ({ vertical }))
}
