import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { supabaseService } from '@/services/supabase';
import { completeSupabaseService } from '@/services/supabase-complete';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Users, Shield, DollarSign, Settings, Camera, ArrowRight, Plus, UserPlus, Trash2, Edit } from 'lucide-react';

const AdminDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalRevenue: 0,
  });
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editingRoles, setEditingRoles] = useState<string[]>([]);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    try {
      const user = await supabaseService.getCurrentUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const roles = await supabaseService.getUserRoles(user.id);
      setUserRoles(roles);

      const hasAdminAccess = roles.includes('admin') || roles.includes('super_admin');
      setIsAuthorized(hasAdminAccess);

      if (!hasAdminAccess) {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to access the admin dashboard',
          variant: 'destructive',
        });
        navigate('/overview');
        return;
      }

      await loadDashboardData();
    } catch (error) {
      console.error('Authorization error:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify permissions',
        variant: 'destructive',
      });
      navigate('/overview');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      // Load user count
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Load events count
      const { count: eventCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      // Load total revenue from creator balances
      const { data: balances } = await supabase
        .from('creator_balances')
        .select('total_earned');

      const totalRevenue = balances?.reduce((sum, b) => sum + (b.total_earned || 0), 0) || 0;

      setStats({
        totalUsers: userCount || 0,
        totalEvents: eventCount || 0,
        totalRevenue,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    }
  };

  const loadUsers = async () => {
    if (!isAuthorized) return;
    
    setUsersLoading(true);
    try {
      const userList = await completeSupabaseService.getAllUsers();
      setUsers(userList);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setUsersLoading(false);
    }
  };

  const handleRoleEdit = async (user: any) => {
    setSelectedUser(user);
    const roles = user.user_roles?.map((r: any) => r.role) || [];
    setEditingRoles(roles);
  };

  const handleUpdateRoles = async () => {
    if (!selectedUser) return;

    try {
      await completeSupabaseService.updateUserRoles(selectedUser.id, editingRoles);
      
      toast({
        title: 'Success',
        description: 'User roles updated successfully',
      });
      
      setSelectedUser(null);
      setEditingRoles([]);
      await loadUsers(); // Reload users list
    } catch (error) {
      console.error('Error updating roles:', error);
      toast({
        title: 'Error', 
        description: 'Failed to update user roles',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    try {
      await completeSupabaseService.deleteUser(userId);
      
      toast({
        title: 'Success',
        description: `User ${userEmail} deleted successfully`,
      });
      
      await loadUsers(); // Reload users list
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      await completeSupabaseService.createUser(
        newUserEmail, 
        newUserPassword, 
        [newUserRole]
      );
      
      toast({
        title: 'Success',
        description: `User ${newUserEmail} created successfully`,
      });
      
      // Reset form
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('user');
      setCreateUserOpen(false);
      
      await loadUsers(); // Reload users list
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to create user',
        variant: 'destructive',
      });
    }
  };

  const toggleRole = (role: string) => {
    if (editingRoles.includes(role)) {
      setEditingRoles(editingRoles.filter(r => r !== role));
    } else {
      setEditingRoles([...editingRoles, role]);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'destructive';
      case 'admin':
        return 'secondary';
      case 'creator':
        return 'outline';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/overview')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            {userRoles.includes('super_admin') && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                Super Admin
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(stats.totalRevenue / 100).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tools */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Admin Tools</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="group cursor-pointer hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 border-border hover:border-primary/50">
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Camera className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="group-hover:text-primary transition-colors">
                  Train Model
                </CardTitle>
                <CardDescription>
                  Train new AI models for headshot generation (Admin Only)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="ghost" 
                  className="w-full justify-between group/btn hover:bg-primary/10"
                  onClick={() => navigate('/admin/train')}
                >
                  Access Tool
                  <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>

            {/* Placeholder for future admin tools */}
            <Card className="opacity-50 border-dashed">
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mb-4">
                  <Settings className="h-7 w-7 text-muted-foreground" />
                </div>
                <CardTitle className="text-muted-foreground">
                  More Tools Coming Soon
                </CardTitle>
                <CardDescription>
                  Additional admin functionality will be added here
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" disabled className="w-full">
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            {userRoles.includes('super_admin') && (
              <TabsTrigger value="settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Overview</CardTitle>
                <CardDescription>
                  Quick view of platform statistics and health
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    • Platform is operational
                  </p>
                  <p className="text-sm text-muted-foreground">
                    • {stats.totalUsers} registered users
                  </p>
                  <p className="text-sm text-muted-foreground">
                    • {stats.totalEvents} total events created
                  </p>
                  <p className="text-sm text-muted-foreground">
                    • ${(stats.totalRevenue / 100).toFixed(2)} in total revenue
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Manage user accounts and roles
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={loadUsers} variant="outline" disabled={usersLoading}>
                    Refresh
                  </Button>
                  <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add User
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                        <DialogDescription>
                          Create a new user account with specified role
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newUserEmail}
                            onChange={(e) => setNewUserEmail(e.target.value)}
                            placeholder="user@example.com"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={newUserPassword}
                            onChange={(e) => setNewUserPassword(e.target.value)}
                            placeholder="Minimum 6 characters"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="role">Initial Role</Label>
                          <Select value={newUserRole} onValueChange={setNewUserRole}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="creator">Creator</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              {userRoles.includes('super_admin') && (
                                <SelectItem value="super_admin">Super Admin</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateUserOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateUser}>Create User</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground mb-4">No users loaded</p>
                    <Button onClick={loadUsers} variant="outline">
                      Load Users
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Roles</TableHead>
                        <TableHead>App Source</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.email}</TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {user.user_roles?.map((roleObj: any) => (
                                <Badge
                                  key={roleObj.role}
                                  variant={getRoleBadgeVariant(roleObj.role)}
                                  className="text-xs"
                                >
                                  {roleObj.role}
                                </Badge>
                              )) || (
                                <Badge variant="outline" className="text-xs">
                                  No roles
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{user.appsource || 'Unknown'}</TableCell>
                          <TableCell>
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRoleEdit(user)}
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                    <Trash2 className="w-3 h-3 mr-1" />
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete User</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete user "{user.email}"? 
                                      This action cannot be undone and will remove all user data.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-red-600 hover:bg-red-700"
                                      onClick={() => handleDeleteUser(user.id, user.email)}
                                    >
                                      Delete User
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Role Edit Dialog */}
            <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit User Roles</DialogTitle>
                  <DialogDescription>
                    Manage roles for {selectedUser?.email}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-3">
                    <Label>User Roles</Label>
                    <div className="space-y-2">
                      {['user', 'creator', 'admin'].map((role) => (
                        <div key={role} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={role}
                            checked={editingRoles.includes(role)}
                            onChange={() => toggleRole(role)}
                            className="w-4 h-4"
                          />
                          <Label htmlFor={role} className="capitalize">
                            {role.replace('_', ' ')}
                          </Label>
                        </div>
                      ))}
                      {userRoles.includes('super_admin') && (
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="super_admin"
                            checked={editingRoles.includes('super_admin')}
                            onChange={() => toggleRole('super_admin')}
                            className="w-4 h-4"
                          />
                          <Label htmlFor="super_admin" className="capitalize">
                            Super Admin
                          </Label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSelectedUser(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateRoles}>Update Roles</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Event Management</CardTitle>
                <CardDescription>
                  Manage and moderate events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Event management features coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {userRoles.includes('super_admin') && (
            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Settings</CardTitle>
                  <CardDescription>
                    Configure platform-wide settings and commission rates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="font-medium text-purple-900">Super Admin Access</p>
                      <p className="text-sm text-purple-700 mt-1">
                        You have full control over commission rates and platform settings.
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Commission and platform settings interface coming soon...
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
