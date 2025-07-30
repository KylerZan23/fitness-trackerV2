'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  Lightbulb, 
  Target, 
  Zap,
  Brain,
  Info
} from 'lucide-react'
import { ScientificRationale } from '@/lib/validation/enhancedProgramSchema'

interface ExerciseRationaleData {
  scientificJustification: string
  muscleTargets: string[]
  stimulusToFatigueRatio: 'High' | 'Moderate' | 'Low'
  tier: 'Tier_1' | 'Tier_2' | 'Tier_3'
  progressionProtocol: string
}

interface ScientificRationaleProps {
  rationale: ScientificRationale
  exerciseRationale?: Record<string, ExerciseRationaleData>
  expandedByDefault?: boolean
  showCitations?: boolean
  className?: string
}

interface RationaleSection {
  title: string
  content: string
  icon: React.ReactNode
  priority: 'high' | 'medium' | 'low'
}

const STIMULUS_TO_FATIGUE_COLORS = {
  'High': 'bg-green-100 text-green-800 border-green-200',
  'Moderate': 'bg-yellow-100 text-yellow-800 border-yellow-200', 
  'Low': 'bg-red-100 text-red-800 border-red-200'
}

const TIER_COLORS = {
  'Tier_1': 'bg-purple-100 text-purple-800 border-purple-200',
  'Tier_2': 'bg-blue-100 text-blue-800 border-blue-200',
  'Tier_3': 'bg-gray-100 text-gray-800 border-gray-200'
}

const TIER_DESCRIPTIONS = {
  'Tier_1': 'Primary compound movements - highest priority',
  'Tier_2': 'Secondary movements - moderate priority',
  'Tier_3': 'Accessory movements - lowest priority'
}

function formatCitation(citation: string, index: number): React.ReactNode {
  // Simple citation formatting - could be enhanced with DOI links
  const isURL = citation.startsWith('http')
  
  return (
    <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded text-xs">
      <span className="text-gray-500 font-mono">[{index + 1}]</span>
      {isURL ? (
        <a 
          href={citation} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
        >
          {citation}
          <ExternalLink className="w-3 h-3" />
        </a>
      ) : (
        <span className="text-gray-700">{citation}</span>
      )}
    </div>
  )
}

function ExerciseRationaleCard({ 
  exerciseName, 
  rationale 
}: { 
  exerciseName: string
  rationale: ExerciseRationaleData 
}) {
  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{exerciseName}</CardTitle>
          <div className="flex gap-2">
            <Badge 
              variant="outline" 
              className={TIER_COLORS[rationale.tier]}
            >
              {rationale.tier}
            </Badge>
            <Badge 
              variant="outline"
              className={STIMULUS_TO_FATIGUE_COLORS[rationale.stimulusToFatigueRatio]}
            >
              {rationale.stimulusToFatigueRatio} SFR
            </Badge>
          </div>
        </div>
        <CardDescription className="text-xs">
          Targets: {rationale.muscleTargets.join(', ')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <h5 className="text-sm font-medium mb-1 flex items-center gap-1">
            <Brain className="w-3 h-3" />
            Scientific Justification
          </h5>
          <p className="text-xs text-gray-700 leading-relaxed">
            {rationale.scientificJustification}
          </p>
        </div>
        
        <div>
          <h5 className="text-sm font-medium mb-1 flex items-center gap-1">
            <Target className="w-3 h-3" />
            Progression Protocol
          </h5>
          <p className="text-xs text-gray-700 leading-relaxed">
            {rationale.progressionProtocol}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export function ScientificRationaleComponent({
  rationale,
  exerciseRationale,
  expandedByDefault = false,
  showCitations = true,
  className = ''
}: ScientificRationaleProps) {
  const [isExpanded, setIsExpanded] = useState(expandedByDefault)
  const [activeExerciseSection, setActiveExerciseSection] = useState<string>('')

  const rationalizationSections: RationaleSection[] = [
    {
      title: 'Scientific Principle',
      content: rationale.principle,
      icon: <Brain className="w-4 h-4" />,
      priority: 'high'
    },
    {
      title: 'Supporting Evidence',
      content: rationale.evidence,
      icon: <BookOpen className="w-4 h-4" />,
      priority: 'high'
    },
    {
      title: 'Practical Application',
      content: rationale.application,
      icon: <Zap className="w-4 h-4" />,
      priority: 'medium'
    }
  ]

  const exercisesByTier = exerciseRationale ? 
    Object.entries(exerciseRationale).reduce((acc, [exercise, data]) => {
      if (!acc[data.tier]) acc[data.tier] = []
      acc[data.tier].push({ exercise, data })
      return acc
    }, {} as Record<string, Array<{ exercise: string, data: ExerciseRationaleData }>>) 
    : {}

  return (
    <div className={className}>
      <Card>
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Scientific Rationale</CardTitle>
                    <CardDescription>
                      Evidence-based program design principles
                    </CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Main Rationale Sections */}
              <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
                {rationalizationSections.map((section, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        {section.icon}
                        {section.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {section.content}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Citations Section */}
              {showCitations && rationale.citations && rationale.citations.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Supporting Research
                  </h4>
                  <div className="space-y-2">
                    {rationale.citations.map((citation, index) => 
                      formatCitation(citation, index)
                    )}
                  </div>
                </div>
              )}

              {/* Exercise-Specific Rationale */}
              {exerciseRationale && Object.keys(exerciseRationale).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Exercise Selection Rationale
                  </h4>

                  {/* Tier Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 p-4 bg-gray-50 rounded-lg">
                    {(['Tier_1', 'Tier_2', 'Tier_3'] as const).map((tier) => (
                      <div key={tier} className="text-center">
                        <Badge className={`${TIER_COLORS[tier]} mb-1`}>
                          {tier}
                        </Badge>
                        <p className="text-xs text-gray-600">
                          {TIER_DESCRIPTIONS[tier]}
                        </p>
                        <p className="text-xs font-medium text-gray-800">
                          {exercisesByTier[tier]?.length || 0} exercises
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Exercise Breakdown by Tier */}
                  <Accordion type="single" collapsible className="space-y-2">
                    {(['Tier_1', 'Tier_2', 'Tier_3'] as const).map((tier) => {
                      const tierExercises = exercisesByTier[tier] || []
                      
                      if (tierExercises.length === 0) return null

                      return (
                        <AccordionItem key={tier} value={tier} className="border rounded-lg">
                          <AccordionTrigger className="px-4 hover:no-underline">
                            <div className="flex items-center gap-3">
                              <Badge className={TIER_COLORS[tier]}>
                                {tier}
                              </Badge>
                              <span className="font-medium">
                                {tierExercises.length} Exercise{tierExercises.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="grid gap-3 md:grid-cols-1 lg:grid-cols-2">
                              {tierExercises.map(({ exercise, data }) => (
                                <ExerciseRationaleCard
                                  key={exercise}
                                  exerciseName={exercise}
                                  rationale={data}
                                />
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )
                    })}
                  </Accordion>
                </div>
              )}

              {/* Educational Note */}
              <div className="border-t pt-4">
                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800 mb-1">
                      Understanding Exercise Science
                    </p>
                    <p className="text-blue-700 text-xs leading-relaxed">
                      This program is designed using evidence-based exercise science principles. 
                      Each exercise selection, volume prescription, and progression strategy is backed 
                      by peer-reviewed research to maximize your training outcomes while minimizing injury risk.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  )
} 