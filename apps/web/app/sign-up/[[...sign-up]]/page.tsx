import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
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
      <SignUp />
    </main>
  )
}
