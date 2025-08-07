// src/app/api/neural/generate/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { logger } from '@/lib/logging';
import { programGenerator, ProgramGeneratorError, ProgramGeneratorErrorType } from '@/services/programGenerator';

import crypto from 'crypto';

/**
 * Structured API error response interface
 */
interface APIErrorResponse {
  error: string;           // Generic error message
  message: string;         // Specific error details
  details: ValidationError[] | null;  // Structured validation errors
  timestamp: string;
  requestId?: string;
}

/**
 * Validation error structure for API responses
 */
interface ValidationError {
  field: string;
  message: string;
  code: string;
}

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
        
        // Handle ServiceResult pattern - return structured error if failed
        if (!result.success) {
            const apiError = result.error;
            
            logger.error('Neural program generation failed', {
                operation: 'neuralGenerateAPI',
                requestId,
                userId: user.id,
                errorCode: apiError.code,
                errorMessage: apiError.message,
                duration: Date.now() - startTime,
            });

            return new NextResponse(
                JSON.stringify({
                    error: apiError.message,
                    code: apiError.code,
                    details: apiError.details,
                    timestamp: apiError.timestamp,
                    requestId
                }),
                { 
                    status: apiError.statusCode,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Handle success case - use result.data
        const programData = result.data;
        
        if (!programData.program) {
            logger.error('Program generation succeeded but no program returned', {
                operation: 'neuralGenerateAPI',
                requestId,
                userId: user.id,
                duration: Date.now() - startTime,
            });

            return new NextResponse(
                JSON.stringify({
                    error: 'Program generation completed but no program was returned',
                    code: 'INTERNAL_ERROR',
                    timestamp: new Date().toISOString(),
                    requestId
                }),
                { 
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        logger.info('Neural program generation successful', {
            operation: 'neuralGenerateAPI',
            requestId,
            userId: user.id,
            programId: programData.program.id,
            duration: Date.now() - startTime,
        });

        // Return complete program data in same format as fetch endpoint
        // This eliminates the need for a second API call and bypasses replication lag
        if (!programData.databaseRecord) {
            logger.error('Program generation succeeded but no database record returned', {
                operation: 'neuralGenerateAPI',
                requestId,
                userId: user.id,
                duration: Date.now() - startTime,
            });

            return new NextResponse(
                JSON.stringify({
                    error: 'Program generation completed but database record is missing',
                    code: 'INTERNAL_ERROR',
                    timestamp: new Date().toISOString(),
                    requestId
                }),
                { 
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Return in exact same format as GET /api/programs/[id] to ensure compatibility
        return NextResponse.json({
            success: true,
            programId: programData.databaseRecord.id,
            // Complete program response matching fetch endpoint format
            id: programData.databaseRecord.id,
            userId: programData.databaseRecord.user_id,
            createdAt: programData.databaseRecord.created_at,
            updatedAt: programData.databaseRecord.updated_at,
            program: programData.databaseRecord.program_content,
            metadata: programData.databaseRecord.metadata
        });

    } catch (error: any) {
        const timestamp = new Date().toISOString();
        const duration = Date.now() - startTime;
        
        // Handle only unexpected errors (auth, JSON parsing, etc.)
        // Business logic errors are now handled via ServiceResult pattern above
        let statusCode = 500;
        let errorMessage = 'Internal server error';
        let specificMessage = 'An unexpected error occurred';
        let validationDetails: ValidationError[] | null = null;
        
        // Note: ProgramGeneratorError is no longer thrown - handled via ServiceResult pattern
        if (error.message?.includes('JSON')) {
            // Handle JSON parsing errors
            statusCode = 400;
            errorMessage = 'Invalid request format';
            specificMessage = 'Request body must be valid JSON';
        } else {
            // Handle other unexpected errors
            statusCode = 500;
            errorMessage = 'Internal server error';
            specificMessage = error.message || 'An unexpected error occurred';
        }
        
        // Log the unexpected error with full context
        logger.error('Neural program generation API unexpected error', {
            operation: 'neuralGenerateAPI',
            requestId,
            error: error.message,
            errorType: error.constructor?.name,
            statusCode,
            duration,
            stackTrace: error.stack,
        });

        // Create structured error response
        const errorResponse: APIErrorResponse = {
            error: errorMessage,
            message: specificMessage,
            details: validationDetails,
            timestamp,
            requestId,
        };

        return new NextResponse(
            JSON.stringify(errorResponse), 
            { 
                status: statusCode,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    }
}