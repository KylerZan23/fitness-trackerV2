'use client'

import React, { useEffect, useState } from 'react'
import Image, { type StaticImageData } from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { Button } from '@/components/ui/button'
import { Dumbbell } from 'lucide-react'
import { 
  HeroSection, 
  SocialProof, 
  FeatureSection, 
  Testimonials, 
  HowItWorks 
} from '@/components/landing'
import { EXPERT_COACHES, type ExpertCoach } from '@/lib/coaches'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createCheckoutSession } from '@/app/_actions/stripeActions'
import { loadStripe } from '@stripe/stripe-js'
import { getClientEnv } from '@/lib/env'

// --- Main Component ---
interface UserProfile {
  name: string
  email: string
  profile_picture_url?: string | null
}

export default function HomePage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setIsAuthenticated(true)
        const { data: profileData } = await supabase
          .from('profiles')
          .select('name, email, profile_picture_url')
          .eq('id', session.user.id)
          .single()
        setProfile(profileData)
      }
      setIsLoading(false)
    }
    checkAuth()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setIsAuthenticated(false)
    setProfile(null)
    router.refresh()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="bg-background text-foreground">
      <Header isAuthenticated={isAuthenticated} profile={profile} onSignOut={handleSignOut} />
      <main>
        <HeroSection />
        <SocialProof />
        <FeatureSection />
        <HowItWorks />
        <ExpertCoachesSection />
        <PricingSection />
        <Testimonials />
      </main>
      <Footer />
    </div>
  )
}

// --- Expert Coaches Section Component ---
const ExpertCoachesSection = () => (
  <section className="py-16 bg-gray-50">
    <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Meet the Experts Behind Your AI Coach
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Our AI is trained and overseen by these world-class experts to ensure scientific accuracy and optimal results.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {EXPERT_COACHES.map((coach) => (
          <Card key={coach.id} className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-teal to-brand-teal-dark mb-4 flex items-center justify-center relative overflow-hidden">
                  <Image 
                    src={coach.photo_url} 
                    alt={coach.name}
                    className="object-cover"
                    style={{ objectPosition: coach.objectPosition ?? 'top' }}
                    layout="fill"
                    onError={(e) => {
                      // This fallback will now be harder to trigger, but good to keep
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = 'none';
                      // We need a way to show the initials div if image fails
                    }}
                  />
                  {/* The initials div is now a sibling, and would need to be shown via state on error */}
                  <div className="hidden text-white font-bold text-xl">
                    {coach.name.split(' ').map(n => n[0]).join('')}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-1">{coach.name}</h3>
                <p className="text-brand-teal font-semibold mb-3">{coach.title}</p>
                
                <div className="flex flex-wrap gap-1 mb-4 justify-center">
                  {coach.credentials.map((credential, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {credential}
                    </Badge>
                  ))}
                </div>
                
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  {coach.bio_summary}
                </p>
                
                <div className="flex flex-wrap gap-1 justify-center">
                  {coach.specialties.map((specialty, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="text-center mt-12">
        <p className="text-gray-600 font-medium">
          Combined, our experts have trained hundreds of elite athletes and hold decades of experience in exercise science.
        </p>
      </div>
    </div>
  </section>
)

// --- Pricing Section Component ---
const PricingSection = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubscribe = async (priceId: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const { NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY } = getClientEnv()
      const stripe = await loadStripe(NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
      
      if (!stripe) {
        throw new Error('Stripe failed to load')
      }

      const result = await createCheckoutSession(priceId)

      if (result.sessionId && stripe) {
        await stripe.redirectToCheckout({ sessionId: result.sessionId })
      } else {
        throw new Error(result.error || 'Failed to create checkout session')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Flexible Plans to Fit Your Journey</h2>
          <p className="mt-4 text-lg text-gray-600">Start with a 7-day free trial. Cancel anytime.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Mock Tier 1: Free Trial */}
          <Card className="p-6 text-center flex flex-col">
            <h3 className="text-xl font-bold">Free Trial</h3>
            <p className="text-muted-foreground mt-2">7 Days</p>
            <ul className="text-left mt-4 space-y-2 flex-grow">
              <li>✓ Full AI Programs</li>
              <li>✓ AI Coach Access</li>
              <li>✓ Basic Tracking</li>
            </ul>
            <Button className="mt-8 w-full" asChild><Link href="/signup">Start Free Trial</Link></Button>
          </Card>
          
          {/* Mock Tier 2: Monthly */}
          <Card className="p-6 text-center flex flex-col">
            <h3 className="text-xl font-bold">Monthly</h3>
            <p className="text-brand-green text-3xl font-bold mt-2">$9.99<span className="text-lg text-muted-foreground">/month</span></p>
            <ul className="text-left mt-4 space-y-2 flex-grow">
              <li>✓ Full AI Programs</li>
              <li>✓ AI Coach Access</li>
              <li>✓ Advanced Analytics</li>
              <li>✓ Community Access</li>
              <li>✓ Priority Support</li>
            </ul>
            <Button 
              className="mt-8 w-full" 
              onClick={() => handleSubscribe(getClientEnv().NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY)} 
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Subscribe Monthly'}
            </Button>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </Card>
          
          {/* Mock Tier 3: Annual */}
          <Card className="p-6 text-center border-2 border-brand-green flex flex-col">
            <h3 className="text-xl font-bold">Annual</h3>
            <p className="text-brand-green text-3xl font-bold mt-2">$39.99<span className="text-lg text-muted-foreground">/year</span></p>
            <ul className="text-left mt-4 space-y-2 flex-grow">
              <li>✓ Full AI Programs</li>
              <li>✓ AI Coach Access</li>
              <li>✓ Advanced Analytics</li>
              <li>✓ Community Access</li>
              <li>✓ Priority Support</li>
              <li>✓ Exclusive Features</li>
            </ul>
            <Button 
              className="mt-8 w-full" 
              onClick={() => handleSubscribe(getClientEnv().NEXT_PUBLIC_STRIPE_PRICE_ID_ANNUAL)} 
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Save 67% Annually'}
            </Button>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </Card>
        </div>
      </div>
    </section>
  )
}

// --- Header Component ---
const Header = ({ isAuthenticated, profile, onSignOut }: { isAuthenticated: boolean; profile: UserProfile | null; onSignOut: () => void }) => (
  <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
      <Link href="/" className="flex items-center space-x-2">
        <Dumbbell className="h-6 w-6 text-brand-indigo" />
                        <span className="font-bold">NeuralLift</span>
      </Link>
      <nav className="flex items-center space-x-4">
        {isAuthenticated && profile ? (
          <>
            <Button variant="ghost" asChild>
              <Link href="/program">My Program</Link>
            </Button>
            <UserAvatar name={profile.name} email={profile.email} profilePictureUrl={profile.profile_picture_url} />
            <Button variant="secondary" onClick={onSignOut}>Sign Out</Button>
          </>
        ) : (
          <>
            <Button variant="ghost" asChild>
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </>
        )}
      </nav>
    </div>
  </header>
)

// --- Footer Component ---
const Footer = () => (
  <footer className="bg-gray-900 text-gray-400">
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h3 className="font-semibold text-white mb-4">Product</h3>
          <ul className="space-y-2">
            <li><Link href="#" className="hover:text-white transition-colors">Features</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">FAQ</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-white mb-4">Company</h3>
          <ul className="space-y-2">
            <li><Link href="#" className="hover:text-white transition-colors">About Us</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-white mb-4">Legal</h3>
          <ul className="space-y-2">
            <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-white mb-4">Follow Us</h3>
          <ul className="space-y-2">
            <li><Link href="#" className="hover:text-white transition-colors">Twitter</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Instagram</Link></li>
          </ul>
        </div>
      </div>
      <div className="mt-12 border-t border-gray-800 pt-8 text-center text-sm">
                    <p>© {new Date().getFullYear()} NeuralLift. All rights reserved.</p>
      </div>
    </div>
  </footer>
)
