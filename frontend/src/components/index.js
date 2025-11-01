// Layout Components
export { default as Header } from './layout/Header'
export { default as Footer } from './layout/Footer'

// Form Components
export { default as LoginForm } from './forms/LoginForm'
export { default as RegisterForm } from './forms/RegisterForm'

// Common Components
export { default as LoadingPage, LoadingCard, LoadingButton } from './common/Loading'
export { 
  default as ErrorBoundary, 
  NotFoundError, 
  UnauthorizedError, 
  NetworkError 
} from './common/ErrorBoundary'

// UI Components - re-export from ui/index.js
export * from './ui'

// Note: Section components have been moved to features/home/components/
// Import them from '@/features/home' instead:
// import { Hero, Features, etc. } from '@/features/home'
