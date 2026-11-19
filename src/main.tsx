import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/App'
import '@/index.css'
import { FeedbackProvider } from '@/components/common/Feedback'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FeedbackProvider><App /></FeedbackProvider>
  </StrictMode>,
)
