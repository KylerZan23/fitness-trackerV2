'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { CheckCircle, BarChart, BrainCircuit, HeartPulse, ShieldCheck, Dumbbell, Users, Star, Goal } from 'lucide-react'
import Image from 'next/image'

// --- Custom Hook for Scroll Animations ---
const useScrollAnimation = () => {
  const elementsRef = useRef<HTMLElement[]>([]);
  const observer = useRef<IntersectionObserver | null>(null);

  const refCallback = useCallback((node: HTMLElement | null) => {
    if (node) {
      // Ensure the element is initially hidden
      node.classList.add('opacity-0');
      elementsRef.current.push(node);
    }
  }, []);

  useEffect(() => {
    if (observer.current) {
      observer.current.disconnect();
    }

    if (elementsRef.current.length === 0) return;
    
    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove('opacity-0');
            entry.target.classList.add('animate-fade-in-up');
            observer.current?.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    elementsRef.current.forEach((el) => observer.current?.observe(el));

    return () => observer.current?.disconnect();
  }, [refCallback]);

  return refCallback;
}

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
        <AppRatings />
        <FeaturedLogos />
        <HowItWorksSection />
        <PlansSection />
        <TestimonialsSection />
        <AiCoachSection />
        <FaqSection />
      </main>
      <Footer />
    </div>
  )
}

// --- Reusable Page Section Components ---

const Header = ({ isAuthenticated, profile, onSignOut }: { isAuthenticated: boolean; profile: UserProfile | null; onSignOut: () => void }) => (
  <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
      <Link href="/" className="flex items-center space-x-2">
        <Dumbbell className="h-6 w-6 text-primary" />
        <span className="font-bold">FitTrackAI</span>
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

const HeroSection = () => (
    <section className="relative w-full py-20 md:py-24 lg:py-32 bg-gray-50 overflow-hidden">
      <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
        <div className="text-center lg:text-left">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900">
            Stop Guessing.
            <br />
            <span className="text-primary">Start Progressing.</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto lg:mx-0 text-lg md:text-xl text-gray-600">
            Get personalized, AI-powered workout plans that adapt to your goals, equipment, and performance. Your elite AI personal trainer is ready.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link href="/signup">Start Your Free Trial</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-gray-500">First week free. Cancel anytime.</p>
        </div>
        <div className="relative h-96 lg:h-auto flex justify-center lg:justify-end">
          <div className="relative w-[250px] h-[500px] bg-gray-800 rounded-[40px] border-[10px] border-gray-800 shadow-2xl -rotate-3">
             <div className="absolute top-0 left-0 w-full h-full rounded-[30px] overflow-hidden">
                <Image 
                   src="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=2070&auto=format&fit=crop" 
                   alt="App Screenshot" 
                   layout="fill"
                   objectFit="cover"
                   className="brightness-90"
                   priority 
                />
             </div>
             <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-4 bg-gray-900 rounded-full"></div>
          </div>
        </div>
      </div>
    </section>
)

const AppRatings = () => {
    const animationRef = useScrollAnimation();
    return (
    <section ref={animationRef} className="py-16 bg-background opacity-0">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="text-center p-6 bg-gray-50 border-gray-200">
            <div className="flex justify-center items-center gap-2 mb-2">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />)}
            </div>
            <p className="text-lg font-bold text-gray-900">4.9 Star Rating</p>
            <p className="text-sm text-gray-500">from 10,000+ App Store reviews</p>
          </Card>
          <Card className="text-center p-6 bg-gray-50 border-gray-200">
            <div className="flex justify-center items-center gap-2 mb-2">
              {[...Array(4)].map((_, i) => <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />)}
              <Star className="w-6 h-6 text-yellow-200 fill-current" />
            </div>
            <p className="text-lg font-bold text-gray-900">4.7 Star Rating</p>
            <p className="text-sm text-gray-500">from 5,000+ Google Play reviews</p>
          </Card>
        </div>
      </div>
    </section>
  )
}

const FeaturedLogos = () => {
  const animationRef = useScrollAnimation();
  return (
    <section ref={animationRef} className="py-12 bg-background opacity-0">
      <div className="container mx-auto px-4">
        <h2 className="text-center text-sm font-semibold text-gray-500 tracking-wider uppercase">
          Trusted by the best in fitness
        </h2>
        <div className="mt-8 grid max-w-lg grid-cols-4 items-center gap-x-8 gap-y-10 sm:max-w-xl sm:grid-cols-6 sm:gap-x-10 lg:mx-0 lg:max-w-none lg:grid-cols-5">
          {['Men\'s Health', 'Bodybuilding.com', 'TechCrunch', 'Women\'s Fitness', 'Iron Paradise'].map((name) => (
            <p key={name} className="col-span-2 lg:col-span-1 text-center text-lg font-medium text-gray-400 grayscale hover:grayscale-0 transition-all">
              {name}
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}

const HowItWorksSection = () => {
  const animationRef = useScrollAnimation();
  const features = [
    { icon: BrainCircuit, title: 'Truly Personalized Plans', description: 'Your AI coach analyzes your goals, experience, and available equipment to build the perfect plan from scratch.', color: 'brand-blue' },
    { icon: BarChart, title: 'Dynamic Progress Tracking', description: 'Log your workouts and watch as your plan adapts. Your AI coach adjusts future workouts based on your performance.', color: 'brand-green' },
    { icon: HeartPulse, title: 'Holistic Fitness Approach', description: 'Integrate strength training and cardio with seamless Strava integration. Get a complete picture of your fitness.', color: 'brand-pink' },
    { icon: ShieldCheck, title: 'Safe and Effective', description: 'Tell us about your injuries or limitations. Your AI will provide safer alternatives to keep you training without setbacks.', color: 'brand-purple' },
  ]
  return (
    <section id="how-it-works" ref={animationRef} className="py-20 bg-gray-50 opacity-0">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">A Smarter Way to Get Stronger</h2>
          <p className="mt-4 text-lg text-gray-600">Finally, a training plan that thinks like a coach.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature) => (
            <Card key={feature.title} className="bg-white hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-${feature.color}-light text-${feature.color}`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <CardTitle>{feature.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

const PlansSection = () => {
    const animationRef = useScrollAnimation();
    const plans = [
        { icon: Dumbbell, title: "Build Muscle", description: "Hypertrophy-focused training to maximize muscle growth.", color: 'brand-green' },
        { icon: Goal, title: "Strength Gain", description: "Powerlifting-style programs to increase your 1-rep max.", color: 'brand-pink' },
        { icon: Users, title: "General Fitness", description: "Balanced routines to improve overall health and wellness.", color: 'brand-blue' },
        { icon: HeartPulse, title: "Weight Loss", description: "Combine strength and cardio to effectively burn fat.", color: 'brand-purple' },
    ];
    return (
        <section ref={animationRef} className="py-20 bg-background opacity-0">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">A Plan for Every Goal</h2>
                    <p className="mt-4 text-lg text-gray-600">Whether you're starting out or a seasoned lifter, we have a plan for you.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {plans.map((plan) => (
                        <Card key={plan.title} className="text-center p-6 hover:-translate-y-2 transition-transform duration-300">
                            <div className={`flex h-16 w-16 items-center justify-center rounded-full bg-${plan.color}-light text-${plan.color} mx-auto mb-4`}>
                                <plan.icon className="h-8 w-8" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">{plan.title}</h3>
                            <p className="text-muted-foreground text-sm">{plan.description}</p>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    )
}

const TestimonialsSection = () => {
  const animationRef = useScrollAnimation();
  const testimonials = [
    { quote: "The AI programming is a game-changer. I'm finally breaking through plateaus I've been stuck at for years.", author: 'Alex R.', role: 'Powerlifter', color: 'border-brand-blue' },
    { quote: "As someone with a busy schedule and limited equipment at home, FitTrackAI built the perfect, most effective plan for me.", author: 'Samantha B.', role: 'Home Gym User', color: 'border-brand-green' },
    { quote: "The injury-aware feature is incredible. My coach suggested alternatives for my bad knee that still challenged me without causing pain.", author: 'Mike T.', role: 'Fitness Enthusiast', color: 'border-brand-pink' },
  ];
  return (
    <section ref={animationRef} className="py-20 bg-gray-50 opacity-0">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Loved by Lifters Everywhere</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.author} className={`flex flex-col bg-white border-t-4 ${testimonial.color}`}>
              <CardContent className="flex-grow p-8">
                <p className="text-muted-foreground text-lg">"{testimonial.quote}"</p>
              </CardContent>
              <CardHeader className="pt-0 p-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center font-bold text-primary">
                    {testimonial.author.slice(0, 1)}
                  </div>
                  <div>
                    <CardTitle className="text-base">{testimonial.author}</CardTitle>
                    <CardDescription>{testimonial.role}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

const AiCoachSection = () => {
    const animationRef = useScrollAnimation();
    return (
    <section ref={animationRef} className="py-20 bg-background opacity-0">
      <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Your Personal AI Strength Coach</h2>
          <p className="mt-4 text-lg text-gray-600">
            Our advanced AI, trained on millions of data points from elite coaches and athletes, provides guidance that's previously been unavailable to anyone but pro athletes.
          </p>
          <ul className="mt-8 space-y-4">
            <li className="flex items-start"><CheckCircle className="h-6 w-6 text-brand-green mr-3 mt-1 flex-shrink-0" /><div><h3 className="font-semibold">Weekly Check-ins & Adaptations</h3><p className="text-muted-foreground">Tell your coach how your week felt, and your plan for next week is automatically adjusted.</p></div></li>
            <li className="flex items-start"><CheckCircle className="h-6 w-6 text-brand-green mr-3 mt-1 flex-shrink-0" /><div><h3 className="font-semibold">Daily Readiness Score</h3><p className="text-muted-foreground">Adjust today's workout intensity based on your sleep and energy levels to prevent overtraining.</p></div></li>
          </ul>
        </div>
        <div className="flex items-center justify-center p-8 bg-gray-100 rounded-2xl">
            <div className="p-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-2xl transform -rotate-2">
                <BrainCircuit className="h-48 w-48 text-white opacity-80" />
            </div>
        </div>
      </div>
    </section>
  )
}

const FaqSection = () => {
  const animationRef = useScrollAnimation();
  const faqs = [
    { question: "Is this for beginners?", answer: "Absolutely! FitTrackAI is designed for all fitness levels. When you start, our onboarding process assesses your experience level and creates a program that's perfectly suited for a beginner, focusing on foundational movements and proper form." },
    { question: "What if I don't have a gym membership?", answer: "No problem. During onboarding, you'll tell us what equipment you have access to—even if it's just your bodyweight. The AI will generate an effective program using only the equipment you select." },
    { question: "How does the AI adapt my plan?", answer: "The AI considers several factors: your performance on previous workouts (weight lifted, reps completed), your weekly check-in feedback (was the week too easy or too hard?), and your daily readiness score (how you slept, your energy levels)." },
    { question: "Can I track cardio too?", answer: "Yes! FitTrackAI has seamless Strava integration. Connect your Strava account to automatically sync your runs, rides, and other cardio activities, giving you a complete view of your fitness." },
  ];
  return (
    <section ref={animationRef} className="py-20 bg-gray-50 opacity-0">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Frequently Asked Questions</h2>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-lg text-left">{faq.question}</AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}

const Footer = () => (
  <footer className="bg-gray-900 text-gray-400">
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div><h3 className="font-semibold text-white mb-4">Product</h3><ul className="space-y-2"><li><Link href="#" className="hover:text-white">Features</Link></li><li><Link href="#" className="hover:text-white">Pricing</Link></li><li><Link href="#" className="hover:text-white">FAQ</Link></li></ul></div>
        <div><h3 className="font-semibold text-white mb-4">Company</h3><ul className="space-y-2"><li><Link href="#" className="hover:text-white">About Us</Link></li><li><Link href="#" className="hover:text-white">Contact</Link></li><li><Link href="#" className="hover:text-white">Blog</Link></li></ul></div>
        <div><h3 className="font-semibold text-white mb-4">Legal</h3><ul className="space-y-2"><li><Link href="#" className="hover:text-white">Terms of Service</Link></li><li><Link href="#" className="hover:text-white">Privacy Policy</Link></li></ul></div>
        <div><h3 className="font-semibold text-white mb-4">Follow Us</h3></div>
      </div>
      <div className="mt-12 border-t border-gray-800 pt-8 text-center text-sm"><p>© {new Date().getFullYear()} FitTrackAI. All rights reserved.</p></div>
    </div>
  </footer>
)
