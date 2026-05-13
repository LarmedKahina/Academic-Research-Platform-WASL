import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Upload, X, Shield, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import type { ApiEnvelope, ProjectApi } from '../types/api';
import { useAuth, dashboardPathForRole, UserRole } from '../contexts/AuthContext';
import { toast } from 'sonner';

export const SubmitProject = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [university, setUniversity] = useState('');
  const [department, setDepartment] = useState('');
  const [projectType, setProjectType] = useState('pfe');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleAddTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Please sign in to submit a project');
      navigate('/login');
      return;
    }
    if (user?.role !== 'student') {
      toast.error('Only students can submit projects');
      return;
    }
    const pdfFiles = files.filter((f) => f.name.toLowerCase().endsWith('.pdf'));
    if (pdfFiles.length === 0) {
      toast.error('Please attach at least one PDF (max 50MB)');
      return;
    }
    setSubmitting(true);
    try {
      const createRes = await api.post<ApiEnvelope<ProjectApi>>('/api/projects', {
        title,
        abstract,
        tags: tags.length ? tags : undefined,
        university: university || undefined,
        department: department || undefined,
        project_type: projectType,
        supervisor_id: null,
      });
      if (!createRes.data.success || !createRes.data.data) {
        throw new Error('Could not create project draft');
      }
      const projectId = createRes.data.data.id;
      for (const file of pdfFiles) {
        const fd = new FormData();
        fd.append('file', file);
        await api.post(`/api/projects/${projectId}/files`, fd);
      }
      toast.success('Submitted for review. An admin will approve your project before it goes public.');
      navigate('/profile/student');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 via-white to-emerald-50/40 py-10 md:py-14">
      <div className="container mx-auto px-4 max-w-3xl space-y-6">
        <Button variant="ghost" asChild className="text-slate-600 -ml-2">
          <Link
            to={user?.role ? dashboardPathForRole(user.role as UserRole) : '/'}
            className="inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </Link>
        </Button>

        <Card className="border border-emerald-100 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 via-emerald-900 to-slate-900 text-white px-6 py-8 md:px-8">
            <CardTitle className="text-2xl md:text-3xl font-bold tracking-tight">Submit a project</CardTitle>
            <CardDescription className="text-emerald-100/90 mt-2 text-base">
              Upload your PDF and details — your work is shared publicly only after admin approval.
            </CardDescription>
          </div>
          <CardContent className="p-6 md:p-8 pt-6">
            <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-950">
              <Shield className="h-4 w-4 text-amber-700" />
              <AlertTitle>Admin approval required</AlertTitle>
              <AlertDescription>
                Every student project is reviewed by a platform administrator (e.g. moderation, quality, and policy).
                You can open your draft from <strong>My projects</strong> on your dashboard while it is pending.
              </AlertDescription>
            </Alert>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter your project title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="abstract">Abstract *</Label>
                <Textarea
                  id="abstract"
                  placeholder="Provide a detailed description of your project, including objectives, methodology, and results..."
                  value={abstract}
                  onChange={(e) => setAbstract(e.target.value)}
                  rows={8}
                  required
                />
                <p className="text-xs text-muted-foreground">{abstract.length} / 1000 characters recommended</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="uni">University</Label>
                  <Input id="uni" value={university} onChange={(e) => setUniversity(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dept">Department</Label>
                  <Input id="dept" value={department} onChange={(e) => setDepartment(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Project type</Label>
                <Select value={projectType} onValueChange={setProjectType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pfe">PFE</SelectItem>
                    <SelectItem value="thesis">Thesis</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    placeholder="Add a tag (e.g., Machine Learning)"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  />
                  <Button type="button" onClick={handleAddTag} variant="secondary">
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => handleRemoveTag(tag)} />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Project PDF *</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFiles(Array.from(e.target.files || []))}
                    className="hidden"
                    id="file-upload"
                  />
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-[#2563eb] hover:underline">Click to upload</span> PDF only
                  </Label>
                  <p className="text-sm text-muted-foreground mt-2">PDF only (max 50MB per file)</p>
                  {files.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {files.map((file, index) => (
                        <div
                          key={index}
                          className="text-sm text-left bg-gray-50 p-2 rounded flex items-center justify-between"
                        >
                          <span>{file.name}</span>
                          <span className="text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  type="submit"
                  className="flex-1 h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-md"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting…' : 'Submit for admin review'}
                </Button>
                <Button type="button" variant="outline" className="h-12 sm:w-36" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
