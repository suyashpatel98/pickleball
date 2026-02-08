'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Image from 'next/image'

export default function DiscoverPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen">
      {/* Hero Section with Video */}
      <section className="relative h-[90vh] overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/assets/watermarked_preview.mp4" type="video/mp4" />
          </video>
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Floating Memphis Shapes */}
        <div className="absolute top-20 right-20 w-32 h-32 rounded-full bg-primary opacity-30 animate-[float_6s_ease-in-out_infinite]" />
        <div className="absolute bottom-40 left-10 w-24 h-24 bg-secondary opacity-30 rotate-12 animate-[float-slow_8s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 left-1/4 w-0 h-0 border-l-[40px] border-l-transparent border-r-[40px] border-r-transparent border-b-[70px] border-b-accent opacity-30 animate-[float-fast_5s_ease-in-out_infinite]" />

        {/* Hero Content */}
        <div className="relative z-10 h-full flex items-center justify-center px-4">
          <div className="text-center max-w-4xl">
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 drop-shadow-[4px_4px_0px_rgba(0,0,0,0.8)]">
              WHERE LEGENDS PLAY
            </h1>
            <p className="text-2xl md:text-3xl text-white mb-8 font-medium drop-shadow-[2px_2px_0px_rgba(0,0,0,0.8)]">
              Join Dinkers Pickleball Academy
            </p>
            <Button
              onClick={() => router.push('/')}
              size="lg"
              className="text-xl px-12 py-8 bg-primary hover:bg-primary/90 text-foreground shadow-[8px_8px_0px_black] hover:shadow-[10px_10px_0px_black]"
            >
              JOIN A TOURNAMENT
            </Button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-8 h-12 border-4 border-white rounded-full flex items-start justify-center p-2">
            <div className="w-2 h-3 bg-white rounded-full" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-card relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-10 right-20 w-20 h-20 rounded-full bg-accent opacity-20" />
        <div className="absolute bottom-10 left-10 w-16 h-16 bg-secondary opacity-20 rotate-45" />

        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-7xl font-bold text-primary mb-4 drop-shadow-[3px_3px_0px_rgba(0,0,0,0.1)]">
                500+
              </div>
              <p className="text-xl font-medium uppercase">Matches Played</p>
            </div>
            <div className="text-center">
              <div className="text-7xl font-bold text-accent mb-4 drop-shadow-[3px_3px_0px_rgba(0,0,0,0.1)]">
                50+
              </div>
              <p className="text-xl font-medium uppercase">Active Players</p>
            </div>
            <div className="text-center">
              <div className="text-7xl font-bold text-secondary mb-4 drop-shadow-[3px_3px_0px_rgba(0,0,0,0.1)]">
                100%
              </div>
              <p className="text-xl font-medium uppercase">Pure Energy</p>
            </div>
          </div>
        </div>
      </section>

      {/* Night Action Section - Two Column Grid */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-5xl font-bold text-center mb-16 drop-shadow-[3px_3px_0px_rgba(0,0,0,0.1)]">
            THE DINKERS EXPERIENCE
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Card 1 */}
            <Card className="group overflow-hidden p-0 relative h-[500px]">
              <div className="absolute inset-0">
                <Image
                  src="/assets/pexels-jessie-kiermayr-2156410560-35688563.jpg"
                  alt="Pickleball action at night"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Gradient overlay for text */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              </div>

              {/* Floating geometric accent */}
              <div className="absolute top-6 right-6 w-16 h-16 bg-primary opacity-80 rounded-full shadow-[4px_4px_0px_black] group-hover:scale-110 transition-transform" />

              {/* Text overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
                <h3 className="text-3xl font-bold text-white mb-2 drop-shadow-[2px_2px_0px_rgba(0,0,0,0.8)]">
                  NIGHT SESSIONS
                </h3>
                <p className="text-white/90 text-lg">
                  Premium courts with professional lighting for intense evening matches
                </p>
              </div>
            </Card>

            {/* Image Card 2 */}
            <Card className="group overflow-hidden p-0 relative h-[500px]">
              <div className="absolute inset-0">
                <Image
                  src="/assets/pexels-jessie-kiermayr-2156410560-35775691.jpg"
                  alt="Competitive pickleball match"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Gradient overlay for text */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              </div>

              {/* Floating geometric accent */}
              <div className="absolute top-6 right-6 w-16 h-16 bg-accent opacity-80 rotate-45 shadow-[4px_4px_0px_black] group-hover:scale-110 transition-transform" />

              {/* Text overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
                <h3 className="text-3xl font-bold text-white mb-2 drop-shadow-[2px_2px_0px_rgba(0,0,0,0.8)]">
                  COMPETITIVE PLAY
                </h3>
                <p className="text-white/90 text-lg">
                  Tournament-level competition with skilled players pushing their limits
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Decorative floating shapes */}
        <div className="absolute top-20 left-10 w-24 h-24 rounded-full bg-secondary opacity-10 animate-[float_7s_ease-in-out_infinite]" />
        <div className="absolute bottom-20 right-20 w-0 h-0 border-l-[50px] border-l-transparent border-r-[50px] border-r-transparent border-b-[85px] border-b-primary opacity-10 animate-[float-slow_9s_ease-in-out_infinite]" />
      </section>

      {/* Final CTA Section */}
      <section className="py-32 bg-primary relative overflow-hidden">
        {/* Memphis pattern background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-black" />
          <div className="absolute top-40 right-20 w-24 h-24 bg-black rotate-12" />
          <div className="absolute bottom-20 left-1/3 w-28 h-28 rounded-full bg-black" />
          <div className="absolute bottom-40 right-10 w-0 h-0 border-l-[60px] border-l-transparent border-r-[60px] border-r-transparent border-b-[100px] border-b-black" />
        </div>

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-6xl md:text-7xl font-bold mb-8 text-foreground drop-shadow-[4px_4px_0px_rgba(0,0,0,0.2)]">
            READY TO COMPETE?
          </h2>
          <p className="text-2xl md:text-3xl mb-12 text-foreground/90 font-medium">
            Your next great match is waiting
          </p>
          <Button
            onClick={() => router.push('/')}
            size="lg"
            className="text-2xl px-16 py-10 bg-card text-foreground hover:bg-card/90 shadow-[10px_10px_0px_black] hover:shadow-[12px_12px_0px_black]"
          >
            VIEW TOURNAMENTS
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-card text-center">
        <p className="text-muted-foreground text-lg">
          © 2024 Dinkers Pickleball Academy • Where Champions Are Made
        </p>
        <div className="mt-4 flex justify-center gap-6">
          <a
            href="https://www.instagram.com/dinkerspickleballacademy/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground hover:text-primary font-medium transition-colors"
          >
            Instagram
          </a>
        </div>
      </footer>
    </div>
  )
}
