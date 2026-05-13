import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Textarea } from '../components/ui/textarea';
import { Download, Eye, MessageSquare, Star, Bookmark } from 'lucide-react';
import { getRatings, submitRating } from '../../services/ratingsService';
import { addComment, deleteComment, getComments, updateComment } from '../../services/commentsService';
import { checkSaved, saveProject, unsaveProject } from '../../services/savedProjectsService';
import { getProject } from '../../services/projectsService';
import { getErrorMessage } from '../../services/errors';
import { useAuth } from '../contexts/AuthContext';

type CommentItem = {
  id: string;
  user_id?: string;
  content?: string;
  comment?: string;
  user_name?: string;
  author?: string;
  created_at?: string;
};

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

type Project = {
  id: string;
  title: string;
  description?: string;
  avg_rating?: number;
  total_ratings?: number;
  created_at?: string;
};

export const ProjectDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const projectId = id ?? '';
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentText, setCommentText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [saved, setSaved] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [project, setProject] = useState<Project | null>(null);

  const canRateOrComment = Boolean(user && (user.role === 'student' || user.role === 'admin'));

  useEffect(() => {
    if (!projectId || !isUuid(projectId)) return;

    const loadProjectActivity = async () => {
      try {
        const [ratingsResponse, commentsResponse, savedResponse] = await Promise.all([
          getRatings(projectId),
          getComments(projectId),
          checkSaved(projectId),
        ]);
        const ratingsData = ratingsResponse.data;
        setAverageRating(
          Number(ratingsData.avg_rating ?? ratingsData.average ?? ratingsData.avg ?? 0),
        );
        setComments(commentsResponse.data.comments ?? commentsResponse.data ?? []);
        setSaved(Boolean(savedResponse.data.saved));
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    };

    const loadProject = async () => {
      try {
        const response = await getProject(projectId);
        setProject(response.data);
        setAverageRating(Number(response.data.avg_rating ?? 0));
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    };

    loadProject();
    loadProjectActivity();
  }, [projectId]);

  const handleRating = async (rating: number) => {
    try {
      await submitRating(projectId, rating);
      const ratingsResponse = await getRatings(projectId);
      const ratingsData = ratingsResponse.data;
      setAverageRating(ratingsData.avg_rating ?? ratingsData.average ?? rating);
      toast.success('Rating saved');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      const response = await addComment(projectId, commentText.trim());
      setComments((current) => [response.data, ...current]);
      setCommentText('');
      toast.success('Comment posted');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editingText.trim()) return;
    try {
      const response = await updateComment(commentId, editingText.trim());
      setComments((current) => current.map((comment) => comment.id === commentId ? response.data : comment));
      setEditingId(null);
      setEditingText('');
      toast.success('Comment updated');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      setComments((current) => current.filter((comment) => comment.id !== commentId));
      toast.success('Comment deleted');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleToggleSaved = async () => {
    try {
      if (saved) {
        await unsaveProject(projectId);
        setSaved(false);
        toast.success('Project removed from saved');
      } else {
        await saveProject(projectId);
        setSaved(true);
        toast.success('Project saved');
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Project is already saved'));
    }
  };

  if (!projectId || !isUuid(projectId)) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card>
            <CardContent className="pt-8 pb-8 text-center text-muted-foreground">
              Invalid project link. <Link to="/browse" className="text-[#f97316] hover:underline">Browse projects</Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-6">
          <Link to="/projects" className="text-[#f97316] hover:underline inline-flex items-center gap-2">
            Back to Projects
          </Link>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl mb-3">{project?.title ?? 'Project'}</h1>
              </div>
              <Button onClick={handleToggleSaved} variant={saved ? 'default' : 'outline'} className="ml-4 gap-2">
                <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
                {saved ? 'Saved' : 'Save'}
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#1e3a8a]" />
                <span style={{ fontWeight: 600 }}>{project?.total_ratings ?? 0}</span> ratings
              </span>
              <span className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#f97316]" />
                <span style={{ fontWeight: 600 }}>{comments.length}</span> comments
              </span>
              <Badge className="bg-[#f97316] text-white">
                <Star className="w-4 h-4 mr-1 inline" />
                {Number(averageRating).toFixed(1)}
              </Badge>
              <span>{project?.created_at ? new Date(project.created_at).toLocaleDateString() : 'Recently added'}</span>
            </div>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <Card className="md:col-span-2">
            <CardHeader><CardTitle>Abstract</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground leading-relaxed">{project?.description ?? 'No description provided.'}</p></CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Student</CardTitle></CardHeader>
              <CardContent>
                <Link to="/community" className="flex items-center gap-3 hover:text-[#2563eb]">
                  <Avatar><AvatarFallback className="bg-[#2563eb] text-white">U</AvatarFallback></Avatar>
                  <span>Project owner</span>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Supervisor</CardTitle></CardHeader>
              <CardContent>
                <Link to="/community" className="hover:text-[#f97316]">
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar><AvatarFallback className="bg-[#0ea5e9] text-white">S</AvatarFallback></Avatar>
                    <div>
                      <div>Supervisor</div>
                      <div className="text-sm text-muted-foreground">Academic supervision</div>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader><CardTitle>Project Document</CardTitle></CardHeader>
          <CardContent>
            <div className="bg-gray-100 rounded-lg p-12 text-center">
              <p className="text-muted-foreground mb-4">PDF Document Preview</p>
              <Button className="bg-[#f97316] hover:bg-[#ea580c] gap-2">
                <Download className="w-4 h-4" />
                Download Full Document
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Reviews & Comments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-8 space-y-4">
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Button
                    key={rating}
                    variant="outline"
                    size="sm"
                    disabled={!canRateOrComment}
                    onClick={() => handleRating(rating)}
                  >
                    {rating} <Star className="w-4 h-4 ml-1 text-[#f97316] fill-current" />
                  </Button>
                ))}
              </div>
              {!canRateOrComment && (
                <p className="text-sm text-muted-foreground">Sign in as a student to rate and comment.</p>
              )}
              <Textarea
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                placeholder="Add a comment..."
                disabled={!canRateOrComment}
              />
              <Button
                onClick={handleAddComment}
                className="bg-[#f97316] hover:bg-[#ea580c]"
                disabled={!canRateOrComment}
              >
                Post Comment
              </Button>
            </div>

            <div className="space-y-6">
              {comments.map((comment) => {
                const content = comment.content ?? comment.comment ?? '';
                const author = comment.user_name ?? comment.author ?? 'Community member';
                return (
                  <div key={comment.id}>
                    <div className="flex items-start gap-3">
                      <Avatar><AvatarFallback className="bg-gray-200">{author.split(' ').map((n) => n[0]).join('')}</AvatarFallback></Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div>{author}</div>
                            <div className="text-sm text-muted-foreground">{comment.created_at ?? 'Just now'}</div>
                          </div>
                        </div>
                        {editingId === comment.id ? (
                          <div className="space-y-3">
                            <Textarea value={editingText} onChange={(event) => setEditingText(event.target.value)} />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleUpdateComment(comment.id)}>Save</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-muted-foreground">{content}</p>
                            {user && comment.user_id === user.id && (
                              <div className="mt-3 flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => { setEditingId(comment.id); setEditingText(content); }}>Edit</Button>
                                <Button size="sm" variant="outline" onClick={() => handleDeleteComment(comment.id)}>Delete</Button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <Separator className="mt-6" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
