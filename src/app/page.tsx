import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

export default function Home() {
  return (
    <div className="flex min-h-screen bg-background relative overflow-hidden flex-col items-center justify-center p-6">
      
      {/* Background ambient effect */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background mix-blend-screen animate-pulse" style={{ animationDuration: '15s' }} />
      </div>

      <div className="z-10 w-full max-w-2xl flex flex-col items-center text-center space-y-12">
        
        <div className="space-y-6">
          <h1 className="text-5xl md:text-6xl font-light tracking-tight text-foreground leading-[1.1] fade-in">
            Welcome to <span className="font-normal opacity-90">Serenity</span> 🌿
          </h1>
          <p className="text-xl font-light text-muted-foreground fade-in" style={{ animationDelay: '0.2s' }}>
            A private space for intentional connection. <br className="hidden sm:block" />
            Less noise. More meaning.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto fade-in" style={{ animationDelay: '0.4s' }}>
          <Link 
            href="/signup" 
            className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground shadow-md transition-colors hover:bg-primary/90 gap-2"
          >
            Create your space
            <ArrowRight size={16} />
          </Link>
          <Link 
            href="/login" 
            className="inline-flex h-12 items-center justify-center rounded-full border border-border/50 bg-background/50 backdrop-blur-md px-8 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
          >
            Sign in
          </Link>
        </div>

        <p className="text-sm text-muted-foreground/50 font-light fade-in" style={{ animationDelay: '0.6s' }}>
          Your thoughts deserve a safe place.
        </p>

      </div>

      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

    </div>
  )
}
