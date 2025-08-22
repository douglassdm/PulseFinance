import { NavLink, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  CreditCard,
  TrendingUp,
  Target,
  PiggyBank,
  Receipt,
  Tag,
  Calendar,
  Settings,
  LogOut,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Transações", url: "/transactions", icon: Receipt },
  { title: "Contas", url: "/accounts", icon: CreditCard },
  { title: "Investimentos", url: "/investments", icon: TrendingUp },
  { title: "Metas", url: "/goals", icon: Target },
  { title: "Dívidas", url: "/debts", icon: PiggyBank },
]

const managementItems = [
  { title: "Categorias", url: "/categories", icon: Tag },
  { title: "Recorrentes", url: "/recurring", icon: Calendar },
  { title: "Configurações", url: "/settings", icon: Settings },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const location = useLocation()
  const currentPath = location.pathname
  const { signOut } = useAuth()
  const { toast } = useToast()

  const isActive = (path: string) => currentPath === path
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary text-primary-foreground font-medium hover:bg-primary/90" 
      : "hover:bg-accent hover:text-accent-foreground"

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao sair da conta.",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Sucesso",
        description: "Você foi desconectado com sucesso.",
      })
    }
  }

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-semibold text-muted-foreground">
            {!isCollapsed && "Principal"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={getNavCls}
                      style={{ transition: 'var(--transition-smooth)' }}
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-semibold text-muted-foreground">
            {!isCollapsed && "Gerencial"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={getNavCls}
                      style={{ transition: 'var(--transition-smooth)' }}
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full justify-start px-2 py-2 h-10 font-normal"
              style={{ transition: 'var(--transition-smooth)' }}
            >
              <LogOut className="h-4 w-4" />
              {!isCollapsed && <span className="ml-2">Sair</span>}
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}