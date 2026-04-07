"use client"
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Doc } from '@/convex/_generated/dataModel'
import { Badge } from "@/components/ui/badge"
import { MapPin } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useState } from 'react'

interface DoctorCardProps {
  doctor: Doc<"doctors">
}

function DoctorCard({ doctor }: DoctorCardProps) {
  const [imgError, setImgError] = useState(false)

  return (
    <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
      <Card className="overflow-hidden border border-gray-100 bg-card rounded-2xl shadow-sm hover:shadow-xl hover:border-primary/40 transition-all duration-300 group h-full flex flex-col"
        style={{ boxShadow: '0 4px 20px -5px rgb(13 148 136 / 0.08)' }}
      >
        {/* Image / Avatar */}
        <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-primary/10 to-teal-50 flex items-center justify-center">
          {!imgError && doctor.image ? (
            <Image
              src={doctor.image}
              alt={doctor.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center border-4 border-white shadow-lg">
              <span className="text-3xl font-bold text-primary">{doctor.name.charAt(0)}</span>
            </div>
          )}
          {/* Overlay gradient for text readability */}
          {!imgError && doctor.image && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          )}
          <div className="absolute top-3 right-3">
            <Badge className="bg-primary/90 text-white border-0 text-xs backdrop-blur-sm">
              {doctor.category}
            </Badge>
          </div>
        </div>

        <CardHeader className="p-4 pb-2">
          <h3 className="font-bold text-base truncate text-foreground">{doctor.name}</h3>
          <div className="flex items-center text-xs text-muted-foreground gap-1">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate">{doctor.location}</span>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-1 space-y-2.5 flex-1">
          {/* Experience */}
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/5">
              {doctor.experience} yrs experience
            </Badge>
          </div>

          {/* Expertise tags */}
          <div className="flex flex-wrap gap-1">
            {doctor.expertise.slice(0, 2).map((exp) => (
              <Badge key={exp} variant="outline" className="text-xs border-primary/20 text-muted-foreground bg-primary/3">
                {exp}
              </Badge>
            ))}
            {doctor.expertise.length > 2 && (
              <Badge variant="outline" className="text-xs border-primary/20 text-muted-foreground">
                +{doctor.expertise.length - 2}
              </Badge>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <Link href={`/all-doctors/${doctor._id}`} className="w-full">
            <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-full text-sm transition-all duration-200 shadow-sm shadow-primary/20 hover:shadow-primary/30">
              Book Now
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

export default DoctorCard
