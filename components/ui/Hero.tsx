import Image from 'next/image'
import { Button } from '@/components/ui/button'

const Hero = () => {
  
  return (
    <div className='relative min-h-[80vh] flex items-center justify-center pt-16 overflow-hidden'>
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero-bg.png"
          alt="Modern Hospital Building"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/60 to-transparent" />
      </div>

      {/* Content */}
      <div className='container relative z-10 px-4 grid md:grid-cols-2 gap-12 items-center'>
        <div className="space-y-6">
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
            Advanced <br />
            <span className="text-red-600">Medical Care</span>
          </h1>
          <p className="text-xl text-gray-200 max-w-lg">
            Experience world-class healthcare with our expert doctors and state-of-the-art facilities. Your health is our priority.
          </p>
          <div className="flex gap-4">
            <Button size="lg" className="bg-red-600 hover:bg-red-600/90 text-white border-0">
              Book Appointment
            </Button>
            <Button size="lg" variant="outline" className="text-red-600 border-red-600 hover:bg-red-600/10">
              Our Doctors
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero