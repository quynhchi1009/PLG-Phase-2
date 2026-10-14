import { useEffect } from 'react'
import { AppShell } from './components/shell/AppShell'
import { Toaster } from './components/ui/primitives'
import { BillingPage } from './features/billing/BillingPage'
import { PrototypeControls } from './features/dev/PrototypeControls'
import { CheckoutPage } from './features/checkout/CheckoutPage'
import { OrderProvider, useOrder } from './features/checkout/order'
import { PlansPage } from './features/plans/PlansPage'
import { ReportPage } from './features/report/ReportPage'
import { SuccessDialog } from './features/upgrade/SuccessDialog'
import { BillingProvider } from './state/billing'
import { UiProvider, useUi } from './state/ui'

function Routes() {
  const { route } = useUi()
  return route === 'plans' ? <PlansPage /> : route === 'report' ? <ReportPage /> : <BillingPage />
}

function Screen() {
  const { route } = useUi()
  const { setOrder } = useOrder()
  // An order belongs to one visit to checkout; drop it once the customer leaves.
  useEffect(() => {
    if (route !== 'checkout') setOrder(null)
  }, [route, setOrder])
  // Checkout is a separate, hosted page in production, so it renders without the portal shell.
  if (route === 'checkout') return <CheckoutPage />
  return (
    <AppShell>
      <Routes />
    </AppShell>
  )
}

export default function App() {
  return (
    <UiProvider>
      <BillingProvider>
        <OrderProvider>
          <Screen />
          <SuccessDialog />
          <PrototypeControls />
          <Toaster />
        </OrderProvider>
      </BillingProvider>
    </UiProvider>
  )
}
