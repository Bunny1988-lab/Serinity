import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getMoodInkwellStyle(mood?: string) {
  if (!mood) return ""
  
  const m = mood.toLowerCase().trim()
  switch (m) {
    case 'reflective':
      return "font-display italic font-medium tracking-wide text-foreground/90 leading-relaxed"
    case 'calm':
      return "font-sans font-light tracking-[0.06em] text-foreground/80 lowercase leading-relaxed"
    case 'inspired':
      return "font-display font-semibold tracking-wider bg-gradient-to-r from-amber-600 via-rose-500 to-orange-500 bg-clip-text text-transparent italic leading-relaxed"
    case 'melancholy':
      return "font-display tracking-tight bg-gradient-to-r from-indigo-800 to-slate-500 bg-clip-text text-transparent italic leading-relaxed"
    case 'grateful':
      return "font-display tracking-wide bg-gradient-to-r from-yellow-600 via-amber-700 to-orange-500 bg-clip-text text-transparent font-medium drop-shadow-[0_1px_1px_rgba(251,191,36,0.1)] leading-relaxed"
    default:
      return ""
  }
}

