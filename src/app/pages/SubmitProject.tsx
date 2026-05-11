import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Upload, X } from 'lucide-react';

export const SubmitProject = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const handleAddTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/projects');
  };

  const supervisors = [
    'Dr. Fatima Zahra - Computer Science',
    'Prof. Karim Mansouri - Engineering',
    'Dr. Amina Benali - Information Systems',
    'Prof. Mohamed Salah - Mathematics',
    'Dr. Nadia Saidi - Software Engineering',
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Submit Your Project</CardTitle>
            <CardDescription>
              Share your PFE project with the academic community
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
                <Label htmlFor="supervisor">Supervisor *</Label>
                <Select value={supervisor} onValueChange={setSupervisor} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your project supervisor" />
                  </SelectTrigger>
                  <SelectContent>
                    {supervisors.map((sup) => (
                      <SelectItem key={sup} value={sup}>
                        {sup}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Project Files *</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <Input
                    type="file"
                    accept=".pdf,.zip,.rar"
                    multiple
                    onChange={(e) => setFiles(Array.from(e.target.files || []))}
                    className="hidden"
                    id="file-upload"
                  />
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-[#2563eb] hover:underline">Click to upload</span> or drag and drop
                  </Label>
                  <p className="text-sm text-muted-foreground mt-2">
                    PDF, ZIP, or RAR (max 50MB)
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
                  <strong>Note:</strong> Your project will be reviewed by your supervisor before being published on the platform.
                  Make sure all information is accurate and complete.
                </p>
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="flex-1 bg-[#f97316] hover:bg-[#ea580c]">
                  Submit Project
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
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
