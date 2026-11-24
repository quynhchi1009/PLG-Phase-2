import type { PaymentFailure } from '../../state/billing'

/* The card itself is entered and checked on Stripe's page (number, expiry, security code), so the
   only failures the Portal can report are the ones Stripe sends back. Each says what failed, why
   when it is known, and what to do; none shows a Stripe error code. The popup shows it while the
   customer is trying, and the My Plan warning keeps it afterwards. */
export const PAYMENT_FAILURE: Record<PaymentFailure, { title: string; text: string }> = {
  'stripe-unavailable': {
    title: 'We couldn’t open Stripe',
    text: 'Check your connection and try again. Nothing was changed.',
  },
  'card-declined': {
    title: 'Your card wasn’t saved',
    text: 'The card was declined. Try a different card, or contact your bank.',
  },
  'card-expired': {
    title: 'Your card wasn’t saved',
    text: 'The card has expired. Try a different card.',
  },
  'authentication-failed': {
    title: 'Your card wasn’t saved',
    text: 'Your bank’s verification wasn’t completed. Try again and follow your bank’s steps, or use a different card.',
  },
}
