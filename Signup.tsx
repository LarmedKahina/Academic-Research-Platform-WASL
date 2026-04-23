import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { BookOpen, Upload } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';

export const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [verificationDoc, setVerificationDoc] = useState<File | null>(null);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signup(email, password, name, role);
    navigate('/');
  };

  const getVerificationLabel = () => {
    switch (role) {
      case 'student':
        return 'Student Card';
      case 'professor':
        return 'Professional Proof';
      case 'company':
        return 'Official Company Document';
      default:
        return 'Verification Document';
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[#f97316] to-[#fb923c] rounded-lg flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>Join the academic community</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Ahmed Benali"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="student@university.dz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role || 'student'} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="professor">Professor</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {role && role !== 'admin' && (
              <div className="space-y-2">
                <Label htmlFor="verification">{getVerificationLabel()}</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <Input
                    id="verification"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setVerificationDoc(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <Label htmlFor="verification" className="cursor-pointer text-sm text-muted-foreground">
                    {verificationDoc ? verificationDoc.name : 'Click to upload document'}
                  </Label>
                </div>
                <Alert>
                  <AlertDescription className="text-xs">
                    Your account will be pending until verified by an administrator
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <Button type="submit" className="w-full bg-[#f97316] hover:bg-[#ea580c]">
              Create Account
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-[#f97316] hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
