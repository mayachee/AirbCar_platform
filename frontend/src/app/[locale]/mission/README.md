# Mission Page Architecture

This directory contains the mission/about page with a clean, modular architecture.

## 📁 Directory Structure

```
mission/
├── components/       # React components for different sections
├── hooks/           # Custom hooks for business logic
├── constants/       # Static data and configuration
├── data/            # Re-exported data for imports
├── page.js          # Main page component (orchestrator)
└── README.md        # This file
```

## 🧩 Components

All page sections are broken down into independent, reusable components:

- **HeroSection** - Hero banner with call-to-action
- **CarSharingSection** - Introduction to car sharing concept
- **ChallengeSection** - The problem we're solving
- **SolutionSection** - Three solution cards
- **ImpactSection** - Impact metrics and statistics
- **WhyChooseUsSection** - Features and benefits
- **KeyFactsSection** - Key statistics and facts
- **TestimonialsSection** - Customer testimonials carousel
- **CTASection** - Call-to-action with app mockup
- **ContactSection** - Contact form and social links
- **MissionLayout** - Wrapper component for Header/Footer

## 🎣 Custom Hooks

### `useMissionAnimations`

Manages all scroll-based animations for the mission page. Returns an object with visibility states for each section.

```javascript
const animations = useMissionAnimations();
// Access: animations.heroVisible, animations.challengeVisible, etc.
```

## 📊 Data Layer

### Constants (`constants/index.js`)

Centralized data storage for:
- `TESTIMONIALS` - Customer testimonials array
- `IMPACT_METRICS` - Impact bullet points
- `KEY_FACTS` - Key statistics
- `FEATURES` - Feature descriptions
- `SOCIAL_LINKS` - Social media links

### Data Re-export (`data/index.js`)

Provides clean imports for components:
```javascript
import { TESTIMONIALS } from '../data';
```

## ✨ Benefits

1. **Maintainability** - Easy to find and update sections
2. **Reusability** - Components can be reused in other pages
3. **Testability** - Each component can be tested independently
4. **Performance** - Smaller bundles, better code splitting
5. **Developer Experience** - Clear structure, easy to navigate

## 🔧 Adding New Sections

1. Create a new component in `components/`
2. Add animation hook in `useMissionAnimations.js`
3. Export from `components/index.js`
4. Add to `page.js`

## 📝 Example Usage

```javascript
import { HeroSection, CTASection } from './components';

<HeroSection />
<CTASection />
```

