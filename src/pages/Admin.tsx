import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Shield, UserPlus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserWithRole {
  user_id: string;
  role: AppRole;
  created_at: string;
  email?: string;
}

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<AppRole>("staff");

  // Fetch all user roles
  const { data: userRoles = [], isLoading } = useQuery({
    queryKey: ["admin_user_roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as UserWithRole[];
    },
  });

  // Add role mutation
  const addRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_user_roles"] });
      toast.success("Role assigned successfully");
      setNewUserEmail("");
    },
    onError: (error) => {
      toast.error("Failed to assign role: " + error.message);
    },
  });

  // Remove role mutation
  const removeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_user_roles"] });
      toast.success("Role removed successfully");
    },
    onError: (error) => {
      toast.error("Failed to remove role: " + error.message);
    },
  });

  const roleColors: Record<AppRole, string> = {
    admin: "bg-destructive/20 text-destructive border-destructive/30",
    staff: "bg-primary/20 text-primary border-primary/30",
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-muted-foreground">
            Manage staff roles and permissions
          </p>
        </div>

        {/* Info Card */}
        <Card className="border-info/30 bg-info/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-info mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Role Permissions</p>
                <ul className="mt-1 text-muted-foreground space-y-1">
                  <li><strong>Admin:</strong> Full access - can delete items, manage staff, and access all features</li>
                  <li><strong>Staff:</strong> Standard access - can view, create, and update records but cannot delete</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current User Roles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Staff Roles
            </CardTitle>
            <CardDescription>
              View and manage assigned roles. To add a new role, you'll need the user's ID from the authentication system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : userRoles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <Shield className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <p className="mt-2 text-muted-foreground">No roles assigned yet</p>
                      <p className="text-sm text-muted-foreground">The first admin must be added manually</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  userRoles.map((ur) => (
                    <TableRow key={`${ur.user_id}-${ur.role}`}>
                      <TableCell className="font-mono text-sm">
                        {ur.user_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <Badge className={roleColors[ur.role]}>
                          {ur.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(ur.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRole.mutate({ userId: ur.user_id, role: ur.role })}
                          disabled={removeRole.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
