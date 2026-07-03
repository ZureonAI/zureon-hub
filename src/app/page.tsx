import { redirect } from 'next/navigation'

// /hub-demo/ → redirect to dashboard
export default function HubRoot() {
  redirect('/dashboard')
}
