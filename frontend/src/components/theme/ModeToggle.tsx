import { Moon, Sun, Monitor } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { useTheme } from "@/hooks/useTheme" // Clean import from hooks

export function ModeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <div className="flex gap-2">
      <Button 
        variant={theme === 'light' ? 'default' : 'outline'} 
        size="sm" 
        onClick={() => setTheme("light")}
        className="gap-2"
      >
        <Sun className="h-4 w-4" />
        Light
      </Button>
      <Button 
        variant={theme === 'dark' ? 'default' : 'outline'} 
        size="sm" 
        onClick={() => setTheme("dark")}
        className="gap-2"
      >
        <Moon className="h-4 w-4" />
        Dark
      </Button>
      <Button 
        variant={theme === 'system' ? 'default' : 'outline'} 
        size="sm" 
        onClick={() => setTheme("system")}
        className="gap-2"
      >
        <Monitor className="h-4 w-4" />
        System
      </Button>
    </div>
  )
}
