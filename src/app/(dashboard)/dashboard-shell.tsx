'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  Building2,
  CalendarDays,
  Car,
  Handshake,
  KeyRound,
  LogOut,
  Receipt,
  Settings,
  User,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { TooltipProvider } from '@/components/ui/tooltip'

const navItems = [
  { label: 'Κρατήσεις', href: '/bookings', icon: CalendarDays },
  { label: 'Οδηγοί', href: '/drivers', icon: User },
  { label: 'Οχήματα', href: '/vehicles', icon: Car },
  { label: 'Συνεργάτες', href: '/partners', icon: Handshake },
  { label: 'Πάροχοι', href: '/providers', icon: Building2 },
  { label: 'Μικροέξοδα', href: '/micro-expenses', icon: Receipt },
  { label: 'Ρυθμίσεις', href: '/settings', icon: Settings },
]

export default function DashboardShell({
  username,
  children,
}: {
  username: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [changePasswordError, setChangePasswordError] = useState('')
  const [changePasswordLoading, setChangePasswordLoading] = useState(false)

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setChangePasswordError('')
    setChangePasswordLoading(true)

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      if (res.ok) {
        setChangePasswordOpen(false)
        setCurrentPassword('')
        setNewPassword('')
      } else {
        const data = await res.json()
        setChangePasswordError(data.error ?? 'Σφάλμα. Δοκιμάστε ξανά.')
      }
    } catch {
      setChangePasswordError('Σφάλμα. Δοκιμάστε ξανά.')
    } finally {
      setChangePasswordLoading(false)
    }
  }

  function handleChangePasswordOpenChange(open: boolean) {
    setChangePasswordOpen(open)
    if (!open) {
      setCurrentPassword('')
      setNewPassword('')
      setChangePasswordError('')
    }
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader className="px-4 py-3">
            <span className="font-semibold text-sm">Thess Transfers</span>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        render={<Link href={item.href} />}
                        isActive={pathname.startsWith(item.href)}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="px-2 py-2">
            <div className="text-xs text-muted-foreground px-2 pb-1 truncate">
              {username}
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          {/* Top bar */}
          <header className="flex h-14 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-5" />
            <div className="flex-1" />
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {username}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setChangePasswordOpen(true)}
              className="gap-1.5"
            >
              <KeyRound className="h-4 w-4" />
              <span className="hidden sm:inline">Αλλαγή κωδικού</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-1.5"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Αποσύνδεση</span>
            </Button>
          </header>

          {/* Main content */}
          <main className="flex-1 p-6">
            {children}
          </main>
        </SidebarInset>

        {/* Change password dialog */}
        <Dialog open={changePasswordOpen} onOpenChange={handleChangePasswordOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Αλλαγή κωδικού</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Τρέχων κωδικός</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={changePasswordLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Νέος κωδικός</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={changePasswordLoading}
                />
              </div>
              {changePasswordError && (
                <p className="text-sm text-destructive">{changePasswordError}</p>
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleChangePasswordOpenChange(false)}
                  disabled={changePasswordLoading}
                >
                  Ακύρωση
                </Button>
                <Button type="submit" disabled={changePasswordLoading}>
                  {changePasswordLoading ? 'Αποθήκευση...' : 'Αποθήκευση'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </SidebarProvider>
    </TooltipProvider>
  )
}
