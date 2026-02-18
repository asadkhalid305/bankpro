import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  variant?: 'default' | 'primary' | 'success' | 'destructive' | 'info' | 'purple';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  variant = 'default',
  className 
}) => {
  const variants = {
    default: "border-muted/40 border-l-muted",
    primary: "border-primary/20 bg-primary/5 border-l-primary",
    success: "border-emerald-500/20 bg-emerald-500/5 border-l-emerald-500",
    destructive: "border-red-500/20 bg-red-500/5 border-l-red-500",
    info: "border-blue-500/20 bg-blue-500/5 border-l-blue-500",
    purple: "border-purple-500/20 bg-purple-500/5 border-l-purple-500"
  };

  const iconColors = {
    default: "text-muted-foreground",
    primary: "text-primary",
    success: "text-emerald-500",
    destructive: "text-red-500",
    info: "text-blue-500",
    purple: "text-purple-500"
  };

  return (
    <Card className={cn(
      "shadow-sm transition-all hover:shadow-md border-l-4", 
      variants[variant],
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={cn("w-4 h-4", iconColors[variant])} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <p className="text-[10px] text-muted-foreground mt-1 text-nowrap truncate font-medium">
          {description}
        </p>
      </CardContent>
    </Card>
  );
};
