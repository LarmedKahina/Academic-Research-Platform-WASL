import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Download, Star, Eye, MessageSquare } from 'lucide-react';
import { api } from '../services/api';
import type { ApiEnvelope, CommentApi, ProjectApi, RatingApi, RatingsBundle } from '../types/api';
import { useAuth } from '../contexts/AuthContext';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';

export const ProjectDetail = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const [project, setProject] = useState<ProjectApi | null>(null);
  const [comments, setComments] = useState<CommentApi[]>([]);
  const [ratings, setRatings] = useState<RatingApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [ratingVal, setRatingVal] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const [pRes, cRes, rRes] = await Promise.all([
          api.get<ApiEnvelope<ProjectApi>>(`/api/projects/${id}`),
          api.get<ApiEnvelope<CommentApi[]>>(`/api/projects/${id}/comments`),
          api.get<ApiEnvelope<RatingApi[]>>(`/api/projects/${id}/ratings`),
        ]);
        if (pRes.data.success && pRes.data.data) {
          setProject(pRes.data.data);
        }
        if (cRes.data.success && cRes.data.data) setComments(cRes.data.data);
        if (rRes.data.success && rRes.data.data) {
          const rd = rRes.data.data as RatingsBundle | RatingApi[];
          if (Array.isArray(rd)) setRatings(rd);
          else if (rd?.ratings) setRatings(rd.ratings);
        }

        await api.post(`/api/projects/${id}/view`);
      } catch {
        toast.error('Could not load project');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleDownload = async () => {
    if (!id) return;
    try {
      const res = await api.get<ApiEnvelope<{ file_url: string; downloads: number }>>(
        `/api/projects/${id}/download`
      );
      if (res.data.success && res.data.data?.file_url) {
        window.open(res.data.data.file_url, '_blank', 'noopener,noreferrer');
        if (project) {
          setProject({ ...project, downloads: res.data.data.downloads });
        }
      } else {
        toast.error('No file available yet');
      }
    } catch {
      toast.error('Download failed');
    }
  };

  const submitComment = async () => {
    if (!id || !token) {
      toast.error('Sign in to comment');
      return;
    }
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/api/projects/${id}/comments`, { content: commentText.trim() });
      setCommentText('');
      const res = await api.get<ApiEnvelope<CommentApi[]>>(`/api/projects/${id}/comments`);
      if (res.data.success && res.data.data) setComments(res.data.data);
      toast.success('Comment posted');
    } catch {
      toast.error('Could not post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const submitRating = async () => {
    if (!id || !token) {
      toast.error('Sign in to rate');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/api/projects/${id}/ratings`, { rating: ratingVal });
      const [rRes, pRes] = await Promise.all([
        api.get<ApiEnvelope<RatingsBundle>>(`/api/projects/${id}/ratings`),
        api.get<ApiEnvelope<ProjectApi>>(`/api/projects/${id}`),
      ]);
      if (rRes.data.success && rRes.data.data) {
        const rd = rRes.data.data as RatingsBundle | RatingApi[];
        if (Array.isArray(rd)) setRatings(rd);
        else if (rd?.ratings) setRatings(rd.ratings);
      }
      if (pRes.data.success && pRes.data.data) setProject(pRes.data.data);
      toast.success('Thanks for your rating');
    } catch {
      toast.error('Could not submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !project) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 text-center text-gray-600">
        {loading ? 'Loading project…' : 'Project not found'}
      </div>
    );
  }

  const authorId = project.user_id;
  const supervisorId = project.supervisor_id;
  const score =
    project.avg_rating != null ? Number(project.avg_rating).toFixed(1) : '—';

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-6">
          <Link to="/projects" className="text-[#f97316] hover:underline inline-flex items-center gap-2">
            ← Back to Projects
          </Link>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl mb-3">{project.title}</h1>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(project.tags || []).map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <Badge className="bg-[#f97316] text-white text-lg px-4 py-2 ml-4">
                <Star className="w-5 h-5 mr-1 inline" />
                {score}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#1e3a8a]" />
                <span style={{ fontWeight: 600 }}>{project.views?.toLocaleString() ?? 0}</span> views
              </span>
              <span className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#f97316]" />
                <span style={{ fontWeight: 600 }}>{project.comments_count ?? comments.length}</span> comments
              </span>
              <span>
                {project.created_at
                  ? new Date(project.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : ''}
              </span>
              <span>{project.university || ''}</span>
              <Badge variant="outline" className="capitalize">
                {project.status}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Abstract</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{project.abstract}</p>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Student / Author</CardTitle>
              </CardHeader>
              <CardContent>
                <Link to={`/profile/${authorId}`} className="flex items-center gap-3 hover:text-[#2563eb]">
                  <Avatar>
                    <AvatarFallback className="bg-[#2563eb] text-white">
                      {(project.author_name || 'S').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>{project.author_name || 'Student'}</span>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Supervisor</CardTitle>
              </CardHeader>
              <CardContent>
                {supervisorId ? (
                  <Link to={`/professor/${supervisorId}`} className="hover:text-[#f97316]">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar>
                        <AvatarFallback className="bg-[#0ea5e9] text-white">
                          {(project.supervisor_name || 'S').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div>{project.supervisor_name || 'Supervisor'}</div>
                        <div className="text-sm text-muted-foreground">{project.department || ''}</div>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <p className="text-muted-foreground text-sm">No supervisor linked</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Project Document</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 rounded-lg p-12 text-center">
              <div className="text-4xl mb-4">📄</div>
              <p className="text-muted-foreground mb-4">PDF stored securely on WaslDZ storage</p>
              <Button
                type="button"
                onClick={handleDownload}
                className="bg-[#f97316] hover:bg-[#ea580c] gap-2"
                disabled={!project.file_url}
              >
                <Download className="w-4 h-4" />
                Download Full Document
              </Button>
              {!project.file_url && (
                <p className="text-xs text-muted-foreground mt-2">File will appear after upload & approval</p>
              )}
            </div>
          </CardContent>
        </Card>

        {token && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Rate & comment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Rating (1–5)</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={ratingVal}
                    onChange={(e) => setRatingVal(Number(e.target.value))}
                    className="border rounded px-2 py-1 w-24"
                  />
                </div>
                <Button type="button" onClick={submitRating} disabled={submitting}>
                  Submit rating
                </Button>
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Comment</label>
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                  placeholder="Share constructive feedback…"
                />
                <Button type="button" className="mt-2" variant="secondary" onClick={submitComment} disabled={submitting}>
                  Post comment
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Ratings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-8">
              {ratings.length === 0 && <p className="text-muted-foreground text-sm">No ratings yet.</p>}
              {ratings.map((r) => (
                <div key={r.id} className="flex items-center gap-3 text-sm">
                  <Badge className="bg-[#f97316] text-white">{r.rating} ★</Badge>
                  <span>{r.user_name || 'User'}</span>
                  <span className="text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <CardTitle className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5" />
              Comments
            </CardTitle>
            <div className="space-y-6">
              {comments.length === 0 && <p className="text-muted-foreground text-sm">No comments yet.</p>}
              {comments.map((c) => (
                <div key={c.id}>
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-gray-200">
                        {(c.user_name || 'U').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div>{c.user_name || 'User'}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(c.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <p className="text-muted-foreground">{c.content}</p>
                    </div>
                  </div>
                  <Separator className="mt-6" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
