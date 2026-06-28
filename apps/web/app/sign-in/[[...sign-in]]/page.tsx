import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        background: 'var(--surface-page)',
        padding: 24,
      }}
    >
      <SignIn />
    </main>
  )
}
