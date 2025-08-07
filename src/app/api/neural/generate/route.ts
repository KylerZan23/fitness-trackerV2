// src/app/api/neural/generate/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { logger } from '@/lib/logging';
import { programGenerator } from '@/services/programGenerator';

import crypto from 'crypto';

export async function POST(request: Request) {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();
    
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        logger.warn('Unauthorized program generation attempt', {
            operation: 'neuralGenerateAPI',
            requestId,
            error: authError ? authError.message : 'No user found'
        });
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    try {
        const body = await request.json();

        const generationPayload = {
            userId: user.id,
            onboardingData: {
                primaryFocus: body.primaryFocus,
                experienceLevel: body.experienceLevel,
                sessionDuration: body.sessionDuration,
                equipmentAccess: body.equipmentAccess,
                personalRecords: body.personalRecords,
            },
            regenerate: body.regenerate || false,
            weekNumber: body.weekNumber || 1,
        };
        
        logger.info('Neural program generation request received', {
            operation: 'neuralGenerateAPI',
            requestId,
            userId: user.id,
        });
        
        const result = await programGenerator.createNewProgram(user.id, generationPayload.onboardingData);
        
        if (!result.success) {
            throw new Error(result.error || 'Program generation failed');
        }

        logger.info('Neural program generation successful', {
            operation: 'neuralGenerateAPI',
            requestId,
            userId: user.id,
            programId: result.program?.id,
            duration: Date.now() - startTime,
        });

        return NextResponse.json({
            programId: result.program?.id,
            program: result.program
        });

    } catch (error: any) {
        const isValidationError = error.message.includes('VALIDATION_ERROR');
        
        logger.error('Neural program generation failed', {
            operation: 'neuralGenerateAPI',
            requestId,
            userId: user.id,
            error: error.message,
            details: error.details || {},
            isValidationError,
            duration: Date.now() - startTime,
        });

        return new NextResponse(
            JSON.stringify({ 
                error: 'Failed to generate program.', 
                details: error.message 
            }), 
            { status: isValidationError ? 400 : 500 }
        );
    }
}