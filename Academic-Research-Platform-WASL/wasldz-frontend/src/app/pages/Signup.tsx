import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { BookOpen, Upload } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import { toast } from 'sonner';

const ROLE_PARAM = ['student', 'professor', 'company'] as const;

function parseRoleParam(v: string | null): UserRole {
  if (v && ROLE_PARAM.includes(v as (typeof ROLE_PARAM)[number])) {
    return v as UserRole;
  }
  return 'student';
}

export const Signup = () => {
  const [searchParams] = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [university, setUniversity] = useState('');
  const [department, setDepartment] = useState('');
  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [verificationDoc, setVerificationDoc] = useState<File | null>(null);
  const [pendingApproval, setPendingApproval] = useState(false);
  const { signup } = useAuth();

  useEffect(() => {
    const r = parseRoleParam(searchParams.get('role'));
    setRole(r);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role || role === 'admin') {
      toast.error('Invalid role');
      return;
    }
    try {
      await signup({
        email,
        password,
        name,
        role: role as 'student' | 'professor' | 'company',
        verificationFile: verificationDoc,
        university: university || undefined,
        department: department || undefined,
        title: title || undefined,
        companyName: companyName || undefined,
        industry: industry || undefined,
      });
      // Account created but requires admin approval — show pending screen
      setPendingApproval(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      toast.error(msg);
    }
  };

  if (pendingApproval) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4">
        <Card className="w-full max-w-md border-t-4 border-t-[#f97316] text-center">
          <CardHeader>
            <div className="w-16 h-16 bg-gradient-to-br from-[#f97316] to-[#fb923c] rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Account submitted for review</CardTitle>
            <CardDescription>
              Your account is pending admin approval. You will receive access once an administrator
              reviews and verifies your registration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription className="text-sm">
                Please check back later and try logging in. You will be notified when your account
                is approved.
              </AlertDescription>
            </Alert>
            <Link to="/login" className="block">
              <Button className="w-full bg-[#f97316] hover:bg-[#ea580c]">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  const roleTitle =
    role === 'student' ? 'Student' : role === 'professor' ? 'Professor' : role === 'company' ? 'Company' : 'Member';

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-md border-t-4 border-t-[#f97316]">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[#f97316] to-[#fb923c] rounded-lg flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-2xl">Create {roleTitle} account</CardTitle>
          <CardDescription>Join WaslDZ — your dashboard opens after sign up</CardDescription>
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
              <Label htmlFor="role">I am registering as</Label>
              <Select value={role || 'student'} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student — projects & portfolio</SelectItem>
                  <SelectItem value="professor">Professor — supervise & mentor</SelectItem>
                  <SelectItem value="company">Company — opportunities & talent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(role === 'student' || role === 'professor') && (
              <div className="space-y-2">
                <Label htmlFor="university">University (optional)</Label>
                <Input id="university" value={university} onChange={(e) => setUniversity(e.target.value)} />
              </div>
            )}

            {role === 'professor' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="department">Department (optional)</Label>
                  <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Title (optional)</Label>
                  <Input
                    id="title"
                    placeholder="e.g. Associate Professor"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
              </>
            )}

            {role === 'company' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="company">Company name (optional)</Label>
                  <Input id="company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry (optional)</Label>
                  <Input id="industry" value={industry} onChange={(e) => setIndustry(e.target.value)} />
                </div>
              </>
            )}

            {role && role !== 'admin' && (
              <div className="space-y-2">
                <Label htmlFor="verification">{getVerificationLabel()} (optional)</Label>
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
                    Your account will be pending until reviewed and approved by an administrator.
                    You will be able to log in and use the platform once verified.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <Button type="submit" className="w-full bg-[#f97316] hover:bg-[#ea580c]">
              Create account & go to my space
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
