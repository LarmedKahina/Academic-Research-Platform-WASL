import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Upload, X } from 'lucide-react';
import { createProject, uploadProjectFile } from '../../services/projectsService';
import { getErrorMessage } from '../../services/errors';

export const SubmitProject = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [university, setUniversity] = useState('');
  const [department, setDepartment] = useState('');
  const [projectType, setProjectType] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAddTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !abstract.trim()) {
      toast.error('Please fill in title and abstract');
      return;
    }

    setLoading(true);
    try {
      // Create project
      const payload = {
        title: title.trim(),
        abstract: abstract.trim(),
        tags: tags && tags.length > 0 ? tags : undefined,
        university: university && university.trim() ? university : undefined,
        department: department && department.trim() ? department : undefined,
        project_type: projectType && projectType.trim() ? projectType : undefined,
      };
      
      console.log('Submitting project with payload:', payload);
      
      const projectRes = await createProject(payload);
      
      console.log('Project creation response:', projectRes);

      const projectId = projectRes.data?.id;
      if (!projectId) {
        throw new Error('Failed to create project - no ID returned');
      }

      // Upload file if provided
      if (files.length > 0) {
        await uploadProjectFile(projectId, files[0]);
      }

      toast.success('✅ Project submitted! Waiting for admin approval to appear on the platform.');
      navigate('/projects');
    } catch (error) {
      console.error('Project creation error:', error);
      toast.error(getErrorMessage(error, 'Failed to submit project'));
    } finally {
      setLoading(false);
    }
  };

  const universities = [
    'University of Algiers',
    'ESI Algiers',
    'UMBB Boumerdes',
    'USTO Oran',
    'UMP Tlemcen',
  ];

  const departments = [
    'Computer Science',
    'Software Engineering',
    'Information Technology',
    'Information Systems',
    'Electronics',
    'Telecommunications',
    'Mathematics',
  ];

  const projectTypes = [
    'PFE',
    'Master Thesis',
    'Research Paper',
    'Application',
    'Tool',
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Submit Your Project</CardTitle>
            <CardDescription>
              Share your project with the academic community. Your project will be reviewed by admins before being published.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                <p className="text-xs text-muted-foreground">
                  {abstract.length} / 1000 characters recommended
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="university">University</Label>
                  <Select value={university} onValueChange={setUniversity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select university" />
                    </SelectTrigger>
                    <SelectContent>
                      {universities.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectType">Project Type</Label>
                <Select value={projectType} onValueChange={setProjectType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project type" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
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
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Project File (PDF)</Label>
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
                    <span className="text-[#2563eb] hover:underline">Click to upload</span> or drag and drop
                  </Label>
                  <p className="text-sm text-muted-foreground mt-2">
                    PDF (max 50MB)
                  </p>
                  {files.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {files.map((file, index) => (
                        <div key={index} className="text-sm text-left bg-gray-50 p-2 rounded flex items-center justify-between">
                          <span>{file.name}</span>
                          <span className="text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <p className="text-blue-900">
                  <strong>Note:</strong> Your project will be reviewed by admins before being published on the platform.
                  Make sure all information is accurate and complete.
                </p>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="flex-1 bg-[#f97316] hover:bg-[#ea580c]">
                  {loading ? 'Submitting...' : 'Submit Project'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={loading}>
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
