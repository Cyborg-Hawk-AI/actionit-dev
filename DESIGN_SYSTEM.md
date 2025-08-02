Action.IT Design System Documentation

Overview

Action.IT employs a sophisticated design system inspired by Apple's minimalist aesthetic, combining clean typography, strategic use of color gradients, and purposeful spacing to create an enterprise-grade AI meeting assistant interface. The design emphasizes clarity, professionalism, and subtle engagement mechanics while maintaining accessibility and cross-platform consistency. The updated design also reflects contrast improvements and futuristic touches to align with the platform's AI-enhanced core.

Design Philosophy
Core Principles

```
Apple-Inspired Minimalism
    Clean, uncluttered layouts with generous whitespace
    Focus on content hierarchy and readability
    Subtle shadows and rounded corners for modern feel
    Refined typography with careful attention to spacing

Enterprise-Grade Confidence
    Professional color palette with strategic accent colors
    Consistent component patterns across all interfaces
    Clear visual hierarchy and information architecture
    Secure, trustworthy visual language

Functional Color Coding
    Context-aware color systems for different content types
    Gradient-based categorization for visual organization
    Accessibility-compliant contrast ratios
    Consistent semantic color usage

Futuristic Intelligence
    Transparent card styling with blurred backgrounds for depth
    AI-tinted gradients representing insight-rich modules
    Section-level tagging with data-backed tooltips
    Speaker-specific highlights and tone mapping visuals
```

Color System
Primary Palette
Core Neutrals

```
Background: #F9FAFB - Primary app background, light gray for optimal readability
Text Primary: #111827 - Main text color, deep charcoal for high contrast
Text Secondary: #6B7280 - Secondary text, medium gray for supporting information
Accent: #2563EB - Primary blue for interactive elements and CTAs
```

Extended Brand Colors

```
Ivory: #F5F5F5 - Alternative light background
Mist: #EDF1F7 - Subtle background variant
Charcoal: #303030 - Deep text alternative
Medium Gray: #999999 - Mid-tone gray for subtle elements
```

Accent Colors

```
Teal: #5ECFC0 - Success states and positive actions
Forest: #1D3E38 - Deep accent for emphasis
Aqua: #A9E6E1 - Light accent for backgrounds
Sand: #E5E3DB - Warm neutral for cards
Taupe: #938D87 - Sophisticated neutral
```

Functional Color Coding System

The application uses specific gradient combinations to create visual categories and improve user navigation:
Calendar & Meeting Colors

Gradient: from-blue-50/80 via-indigo-50/40 to-purple-50/30

```
Used for: Calendar views, meeting cards, scheduling interfaces
Psychology: Blue conveys trust, reliability, and professionalism
Application: Primary meeting-related UI elements
```

Insights & Analytics Colors

Gradient: from-emerald-50/80 via-teal-50/40 to-cyan-50/30

```
Used for: Analytics cards, insights displays, data visualization
Psychology: Green represents growth, success, and positive outcomes
Application: Performance metrics, AI insights, analytics dashboards
```

Recent Activity Colors

Gradient: from-purple-50/80 via-violet-50/40 to-fuchsia-50/30

```
Used for: Activity feeds, recent actions, historical data
Psychology: Purple suggests creativity, intelligence, and premium experience
Application: Recent meetings, activity logs, user history
```

System Status Colors

Gradient: from-amber-50/80 via-orange-50/40 to-red-50/30

```
Used for: Status indicators, alerts, system notifications
Psychology: Orange/amber for attention, warnings, and system states
Application: System health, notifications, status updates
```

Calendar View Specific Colors
Day View

Gradient: from-orange-50/80 via-amber-50/40 to-yellow-50/30

```
Warm gradient for focused, detailed day planning
Represents energy and immediate action
```

Week View

Gradient: from-emerald-50/80 via-teal-50/40 to-cyan-50/30

```
Cool, productive gradient for week-level planning
Suggests organization and systematic approach
```

Month View

Gradient: from-purple-50/80 via-violet-50/40 to-fuchsia-50/30

```
Sophisticated gradient for high-level overview
Conveys strategic thinking and long-term planning
```

Agenda View

Gradient: from-blue-50/80 via-indigo-50/40 to-purple-50/30

```
Professional gradient for structured list views
Emphasizes organization and systematic approach
```

Typography System
Font Family

Primary: SF Pro Display, Helvetica Neue, system-ui, sans-serif

```
Apple's SF Pro Display for headlines and display text
System font fallbacks for cross-platform consistency
Clean, modern typeface with excellent readability
```

Typography Hierarchy
Headings

```
H1: text-4xl md:text-5xl - Page titles and major headings
H2: text-3xl md:text-4xl - Section headings
H3: text-2xl md:text-3xl - Subsection headings
Card Titles: text-2xl - Card and component titles
```

Body Text

```
Body: text-base - Standard paragraph text
Metadata: text-sm - Supporting information and labels
Captions: text-xs - Fine print and secondary details
```

Typography Utilities

```
SF Display: .sf-display - Font-medium tracking-tight for headings
SF Text: .sf-text - Font-normal for body text
Letter Spacing: Tight tracking (tracking-tight) for display text
Line Height: Relaxed leading (leading-relaxed) for readability
```

Spacing System
Grid System

8px Base Grid: All spacing follows an 8-pixel grid system for visual consistency

```
spacing-4 (1rem/16px)
spacing-6 (1.5rem/24px)
spacing-8 (2rem/32px)
spacing-12 (3rem/48px)
spacing-16 (4rem/64px)
```

Component Spacing

```
Card Padding: p-6 (24px) for consistent card interiors
Section Padding: py-16 px-6 md:px-8 for page sections
Content Container: max-w-7xl mx-auto with responsive padding
```

Component Design Patterns
Card System
Apple Card Style

Class: .apple-card

```
bg-card rounded-xl shadow-sm border border-border/40
Subtle shadows with rounded corners
Minimal borders for definition
```

Glass Card Style

Class: .glass-card

```
bg-white/80 dark:bg-black/20 backdrop-blur-md
Frosted glass effect with transparency
Modern, sophisticated appearance
```

Button Patterns
Primary Action Button

Class: .action-button

```
bg-primary hover:bg-primary/90 text-primary-foreground
Strong visual weight for primary actions
Consistent hover states
```

Secondary Button

Class: .ghost-button

```
bg-transparent hover:bg-muted text-foreground border border-border/50
Subtle appearance for secondary actions
Maintains accessibility without visual dominance
```

Interactive Elements
Hover Effects

Class: .interactive-element

```
transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
Subtle scale animations for engagement
Consistent interaction feedback
```

Status Indicators

```
Live: bg-green-100 text-green-800 - Active/live states
Upcoming: bg-blue-100 text-blue-800 - Scheduled states
Completed: bg-slate-100 text-slate-800 - Finished states
```

Layout Patterns
Dashboard Grid System

```
Primary Content: 2/3 width on large screens (lg:col-span-2)
Sidebar Content: 1/3 width on large screens
Responsive: Single column on mobile, two-column on tablet+
```

Calendar Layout

```
Grid-based: 7-column grid for week/month views
Time-based: Hourly divisions for day/week views
Flexible: Responsive breakpoints for mobile optimization
```

Animation System
Keyframe Animations

```
Fade In: fade-in 0.3s ease-out - Smooth content appearance
Slide Up: slide-up 0.3s ease-out - Bottom-to-top content reveal
Gentle Pulse: gentle-pulse 2s ease-in-out infinite - Subtle attention indicators
```

Transition Patterns

```
Duration: 200ms for micro-interactions, 300ms for content changes
Easing: ease-out for natural feel
Properties: Transform, opacity, colors for smooth transitions
```

Dark Mode Support
Color Adaptation

```
Automatic HSL color adaptation for dark themes
Maintains contrast ratios across light/dark modes
Consistent visual hierarchy in both themes
```

Background Adjustments

```
Light Mode: Light grays and whites (#F9FAFB)
Dark Mode: Dark grays and blacks (#0F0F0F)
Gradients: Adjusted opacity and saturation for dark themes
```

Accessibility Features
Contrast Compliance

```
WCAG AA compliant contrast ratios
Enhanced contrast for text elements
Clear visual separation between interactive elements
```

Focus States

```
Visible focus indicators for keyboard navigation
Consistent focus ring styling across components
Logical tab order throughout interfaces
```

Screen Reader Support

```
Semantic HTML structure
Proper ARIA labels and descriptions
Alternative text for visual elements
```

Implementation Guidelines
Component Creation

```
Start with ShadCN/UI base components
Apply consistent spacing using 8px grid
Use established color patterns for context
Implement hover states and transitions
Ensure responsive behavior
```

Color Usage Rules

```
Primary colors for main actions and navigation
Functional gradients for content categorization
Neutral tones for supporting content
Semantic colors for status and feedback
```

Typography Application

```
Establish clear hierarchy with heading levels
Use appropriate font weights and tracking
Maintain consistent line heights
Apply semantic color to text elements
```
