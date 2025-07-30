# ADR-049: Enhanced User Profiling Data Structures for Science-Based Training

## Status
Accepted

## Context
The NeuralLift application required comprehensive TypeScript interfaces to support advanced training periodization, individualized programming, and science-based training methodologies. The existing user data structures were insufficient for sophisticated AI-driven program generation that considers individual recovery patterns, volume tolerance, weak point analysis, and periodization strategies.

## Decision
We have implemented a comprehensive set of TypeScript interfaces in `src/lib/types/program.ts` to support science-based training programming:

### New Interfaces Added:
1. **UserData** - Base interface consolidating existing user profile information
2. **VolumeParameters** - Training load management based on individual characteristics
3. **VolumeLandmarks** - MEV/MAV/MRV guidelines per muscle group
4. **RecoveryProfile** - Individual recovery characteristics and fatigue management
5. **WeakPointAnalysis** - Strength imbalance identification and correction strategies
6. **RPEProfile** - Autoregulation based on Rate of Perceived Exertion
7. **PeriodizationModel** - Long-term training structure and progression
8. **EnhancedUserData** - Comprehensive interface extending UserData with all advanced features

### Key Design Principles:
- **Exercise Science Foundation**: Based on established research (MEV/MAV/MRV, RPE autoregulation)
- **Type Safety**: Comprehensive TypeScript interfaces with proper documentation
- **Modularity**: Separate interfaces for different aspects of training science
- **Extensibility**: Optional fields and Record types for flexible data structures
- **Integration**: Designed to work with existing onboarding and AI systems

## Alternatives Considered

### Alternative 1: Single Monolithic Interface
- **Pros**: Simpler structure
- **Cons**: Poor separation of concerns, difficult to maintain, less type safety
- **Rejected**: Would create a massive interface that violates single responsibility principle

### Alternative 2: Minimal Extensions
- **Pros**: Smaller scope, easier to implement
- **Cons**: Insufficient for advanced training science, would require frequent additions
- **Rejected**: Would not provide adequate foundation for science-based programming

### Alternative 3: External Library Integration
- **Pros**: Leverage existing exercise science libraries
- **Cons**: External dependencies, less control, potential licensing issues
- **Rejected**: No suitable TypeScript libraries found for comprehensive training science

## Consequences

### Positive
- **Individualized Programming**: Enables highly personalized training based on scientific principles
- **Type Safety**: Comprehensive TypeScript interfaces prevent runtime errors
- **AI Enhancement**: Provides rich context for AI program generation
- **Scalability**: Modular design allows for easy extension and modification
- **Scientific Accuracy**: Based on established exercise science research
- **Developer Experience**: Clear documentation and type hints improve development efficiency

### Negative
- **Complexity**: Increased interface complexity may require developer training
- **Data Migration**: Existing users will need default values for new fields
- **Database Changes**: Schema updates required to support new data structures
- **Initial Overhead**: Implementation of assessment algorithms for new parameters

### Neutral
- **Code Volume**: Significant addition to type definitions (200+ lines)
- **Documentation**: Requires maintenance of comprehensive JSDoc comments

## Implementation Details

### Volume Landmarks (MEV/MAV/MRV)
Based on Renaissance Periodization research:
- **MEV**: Minimum Effective Volume - threshold for muscle growth
- **MAV**: Maximum Adaptive Volume - optimal training volume
- **MRV**: Maximum Recoverable Volume - limit before negative returns

### RPE Autoregulation
Implements scientific RPE protocols for:
- Daily load adjustments based on subjective readiness
- Phase-specific intensity targets
- Individual calibration for accuracy

### Periodization Models
Supports evidence-based approaches:
- Linear, Undulating, Block, Conjugate, Autoregulated models
- Structured phases with specific adaptation targets
- Systematic deload protocols

## Future Considerations

### Database Integration
- Schema updates for new user profile fields
- Migration scripts for existing users
- Default value generation algorithms

### AI Integration
- Enhanced program generation using new parameters
- Machine learning for parameter refinement
- Predictive modeling for training responses

### User Interface
- Assessment wizards for new parameters
- Visual representation of training science concepts
- Progress tracking for advanced metrics

## References
- Renaissance Periodization Volume Guidelines
- RPE-based Autoregulation Research
- Periodization Models in Strength Training
- TypeScript Best Practices for Complex Data Structures

## Review Notes
This ADR establishes the foundation for sophisticated, science-based training programming while maintaining type safety and developer productivity. The modular design allows for incremental implementation and future enhancements based on user feedback and emerging exercise science research. 