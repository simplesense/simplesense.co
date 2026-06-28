'use client'
import { useTransition } from 'react'
import { Button } from '@ss/ui'
import { disconnectStoreAction } from '@/app/connections/actions'

export function DisconnectButton({ storeId }: { storeId: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="secondary"
      disabled={pending}
      onClick={() =>
        startTransition(() => {
          void disconnectStoreAction(storeId)
        })
      }
    >
      {pending ? 'Disconnecting…' : 'Disconnect & purge data'}
    </Button>
  )
}
