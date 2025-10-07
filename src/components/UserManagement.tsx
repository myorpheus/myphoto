import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Edit, Trash2, UserPlus } from 'lucide-react';
import { completeSupabaseService } from '@/services/supabase-complete';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface User {
  id: string;
  email: string;
  user_roles?: { role: string }[];
  appsource?: string;
  created_at: string;
}

interface UserManagementProps {
  userRoles: string[];
}

const UserManagement: React.FC<UserManagementProps> = ({ userRoles }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingRoles, setEditingRoles] = useState<string[]>([]);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const { toast } = useToast();

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const userList = await completeSupabaseService.getAllUsers();
      setUsers(userList);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load users', variant: 'destructive' });
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleEdit = (user: User) => {
    setSelectedUser(user);
    setEditingRoles(user.user_roles?.map(r => r.role) || []);
  };

  const handleUpdateRoles = async () => {
    if (!selectedUser) return;
    try {
      await completeSupabaseService.updateUserRoles(selectedUser.id, editingRoles);
      toast({ title: 'Success', description: 'User roles updated successfully' });
      setSelectedUser(null);
      setEditingRoles([]);
      await loadUsers();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update user roles', variant: 'destructive' });
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    try {
      await completeSupabaseService.deleteUser(userId);
      toast({ title: 'Success', description: `User ${userEmail} deleted successfully` });
      await loadUsers();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete user', variant: 'destructive' });
    }
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    try {
      await completeSupabaseService.createUser(newUserEmail, newUserPassword, [newUserRole]);
      toast({ title: 'Success', description: `User ${newUserEmail} created successfully` });
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('user');
      setCreateUserOpen(false);
      await loadUsers();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create user', variant: 'destructive' });
    }
  };

  const toggleRole = (role: string) => {
    setEditingRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  const getRoleBadgeVariant = (role: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (role) {
      case 'super_admin': return 'destructive';
      case 'admin': return 'secondary';
      case 'creator': return 'outline';
      default: return 'default';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage user accounts and roles</CardDescription>
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
                <DialogDescription>Create a new user account with specified role</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="user@example.com" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="Minimum 6 characters" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Initial Role</Label>
                  <Select value={newUserRole} onValueChange={setNewUserRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="creator">Creator</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      {userRoles.includes('super_admin') && <SelectItem value="super_admin">Super Admin</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateUserOpen(false)}>Cancel</Button>
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
            <Button onClick={loadUsers} variant="outline">Load Users</Button>
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
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {user.user_roles?.map(roleObj => (
                        <Badge key={roleObj.role} variant={getRoleBadgeVariant(roleObj.role)} className="text-xs">
                          {roleObj.role}
                        </Badge>
                      )) || <Badge variant="outline" className="text-xs">No roles</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>{user.appsource || 'Unknown'}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleRoleEdit(user)}>
                        <Edit className="w-3 h-3 mr-1" />Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-3 h-3 mr-1" />Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete user "{user.email}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDeleteUser(user.id, user.email)}>
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

      {/* Role Edit Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Roles</DialogTitle>
            <DialogDescription>Manage roles for {selectedUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-3">
              <Label>User Roles</Label>
              <div className="space-y-2">
                {['user', 'creator', 'admin'].map(role => (
                  <div key={role} className="flex items-center space-x-2">
                    <input type="checkbox" id={role} checked={editingRoles.includes(role)} onChange={() => toggleRole(role)} className="w-4 h-4" />
                    <Label htmlFor={role} className="capitalize">{role.replace('_', ' ')}</Label>
                  </div>
                ))}
                {userRoles.includes('super_admin') && (
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="super_admin" checked={editingRoles.includes('super_admin')} onChange={() => toggleRole('super_admin')} className="w-4 h-4" />
                    <Label htmlFor="super_admin" className="capitalize">Super Admin</Label>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>Cancel</Button>
            <Button onClick={handleUpdateRoles}>Update Roles</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default UserManagement;
