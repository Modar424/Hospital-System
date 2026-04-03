import { useAuth } from '@clerk/nextjs'
import { Stethoscope } from 'lucide-react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const Header = () => {
  const { isSignedIn } = useAuth()
  const pathname = usePathname()
  
  const navLinks = [
    { name: 'Home', href: '/', label: "Home" },
    { name: 'Doctors', href: '/doctors', label: "Doctors" },
    { name: 'Appointments', href: '/appointments', label: "My Appointments" },
  ]
  
  return (
    <nav className='border-b border-border bg-background/80 
    backdrop-blur-md sticky top-0 z-50'>
      <div className='container mx-auto px-4 h-16 flex items-center
      justify-between'>
        {/*logo*/}
        <Link href='/' className='flex items-center gap-2 text-2xl
        font-bold text-primary'>
          <Stethoscope className='w-8 h-8'/>
          <span>MedCare</span>
        </Link>
        
        <div className='hidden md:flex items-center gap-8'>
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              className={cn(
                "text-sm font-medium hover:text-primary",
                pathname === link.href ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
        {/* Auth Button */}
        <div className='flex itens-center gap-4'>
            {isSignedIn}

        </div>
      </div>
    </nav>
  )
}  

export default Header