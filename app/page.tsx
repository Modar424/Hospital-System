import Hero from '@/components/Hero'
import Categories from '@/components/Categories'
import TopDoctors from '@/components/TopDoctors'
import Stats from '@/components/Stats'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Hero />
      <Categories />
      <TopDoctors />
      <Stats />
    </div>
  )
}
