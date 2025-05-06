import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Motion } from '@/components/ui/motion';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/toast-wrapper';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  MessageSquare, 
  Heart, 
  Share2, 
  MoreHorizontal,
  ThumbsUp,
  Send,
  UserPlus,
  TrendingUp,
  Loader2,
  Filter,
  UserCheck,
  Image as ImageIcon,
  X,
  Video,
  Link,
  Trash2,
  Copy
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

// API URL
const API_URL = 'http://localhost:8000/api';
const MEDIA_URL = 'http://localhost:8000';

// Interfaces
interface Author {
  id: number;
  first_name: string;
  last_name: string;
  profile_picture?: string;
}

interface Post {
  id: number;
  content: string;
  author: Author;
  like_count: number;
  comment_count: number;
  created_at: string;
  is_liked: boolean;
  image?: string;
  video?: string;
  is_saved?: boolean;
}

interface Comment {
  id: number;
  content: string;
  author: Author;
  created_at: string;
  post: number;
  parent: number | null;
  replies?: Comment[];
  is_liked?: boolean;
  like_count?: number;
}

interface Hashtag {
  name: string;
  count: number;
  last_used: string;
}

interface User {
  id?: number;
  username?: string;
  display_name?: string;
  profile_picture?: string | null;
}

// API service functions
const fetchPosts = async (token: string) => {
  try {
    const response = await axios.get(`${API_URL}/community/posts/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
};

const createPost = async (token: string, formData: FormData) => {
  try {
    const response = await axios.post(
      `${API_URL}/community/posts/`,
      formData,
      { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        } 
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

const likePost = async (token: string, postId: number) => {
  try {
    const response = await axios.post(
      `${API_URL}/community/posts/${postId}/like/`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Error liking post:', error);
    throw error;
  }
};

const fetchPostComments = async (token: string, postId: number) => {
  try {
    const response = await axios.get(
      `${API_URL}/community/comments/?post=${postId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

const createComment = async (token: string, postId: number, content: string) => {
  try {
    const response = await axios.post(
      `${API_URL}/community/comments/`,
      { post: postId, content },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
};

const fetchTrendingHashtags = async (token: string) => {
  try {
    const response = await axios.get(
      `${API_URL}/community/trending-hashtags/`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching trending hashtags:', error);
    throw error;
  }
};

const fetchActiveUsers = async (token: string) => {
  try {
    console.log("Trying to fetch active users");
    const response = await axios.get(`${API_URL}/community/active-users/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Active users API response:", response.data);
    // Ensure we always return an array, even if backend sends null or invalid data
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: any) {
    console.error('Error fetching active users:', error);
    // Return empty array instead of throwing an error
    if (error.response) {
      console.log("Error response status:", error.response.status);
      console.log("Error response data:", error.response.data);
    }
    return [];
  }
};

const followUser = async (token: string, userId: number) => {
  try {
    const response = await axios.post(
      `${API_URL}/users/${userId}/follow/`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Error following user:', error);
    throw error;
  }
};

const unfollowUser = async (token: string, userId: number) => {
  try {
    const response = await axios.post(
      `${API_URL}/users/${userId}/unfollow/`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Error unfollowing user:', error);
    throw error;
  }
};

// Add delete post function
const deletePost = async (token: string, postId: number) => {
  try {
    const response = await axios.delete(
      `${API_URL}/community/posts/${postId}/`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

// Add share post function to generate permanent link
const sharePost = async (token: string, postId: number) => {
  try {
    const response = await axios.post(
      `${API_URL}/community/posts/${postId}/share/`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Error sharing post:', error);
    throw error;
  }
};

const likeComment = async (token: string, commentId: number) => {
  try {
    const response = await axios.post(
      `${API_URL}/community/comments/${commentId}/like/`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Error liking comment:', error);
    throw error;
  }
};

const createReply = async (token: string, postId: number, parentId: number, content: string) => {
  try {
    const response = await axios.post(
      `${API_URL}/community/comments/`,
      { post: postId, parent: parentId, content },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating reply:', error);
    throw error;
  }
};

const CommunityDiscussions = () => {
  const { token, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingPost, setCreatingPost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [expandedPost, setExpandedPost] = useState<number | null>(null);
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<number, boolean>>({});
  const [newComment, setNewComment] = useState<Record<number, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<number, boolean>>({});
  const [likeInProgress, setLikeInProgress] = useState<number[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<Hashtag[]>([]);
  const [loadingHashtags, setLoadingHashtags] = useState(false);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [followingUsers, setFollowingUsers] = useState<number[]>([]);
  const [postImage, setPostImage] = useState<File | null>(null);
  const [postVideo, setPostVideo] = useState<File | null>(null);
  const [postMediaPreview, setPostMediaPreview] = useState<string | null>(null);
  const [isMediaImage, setIsMediaImage] = useState(true);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [currentShareUrl, setCurrentShareUrl] = useState("");
  const [currentSharePostId, setCurrentSharePostId] = useState<number | null>(null);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [newReply, setNewReply] = useState<Record<number, string>>({});
  const [submittingReply, setSubmittingReply] = useState<Record<number, boolean>>({});
  const [likeCommentInProgress, setLikeCommentInProgress] = useState<number[]>([]);
  
  const postContentRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      toast({ 
        title: "Authentication Required", 
        description: "Please log in to access community discussions", 
        variant: "destructive" 
      });
      navigate('/login');
      return;
    }

    loadPosts();
    loadTrendingHashtags();
    loadActiveUsers();
  }, [isAuthenticated, token, navigate]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      if (isAuthenticated && token) {
        const postsData = await fetchPosts(token);
        setPosts(postsData);
        
        // Get trending posts (most liked)
        const trending = [...postsData].sort((a, b) => b.like_count - a.like_count).slice(0, 5);
        setTrendingPosts(trending);
      }
    } catch (err) {
      console.error('Error loading posts:', err);
      toast({ 
        title: "Error", 
        description: "Failed to load community discussions", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTrendingHashtags = async () => {
    if (!isAuthenticated || !token) return;
    
    try {
      setLoadingHashtags(true);
      const hashtags = await fetchTrendingHashtags(token);
      setTrendingHashtags(hashtags);
    } catch (err) {
      console.error('Error loading trending hashtags:', err);
    } finally {
      setLoadingHashtags(false);
    }
  };

  const loadActiveUsers = async () => {
    if (!isAuthenticated || !token) return;
    
    try {
      // Set loading state for active users
      const loadingActiveUsersToast = toast({
        title: "Loading",
        description: "Fetching active community members...",
        variant: "default"
      });
      
      setActiveUsers([]); // Clear previous data
      
      // Use a timeout to prevent infinite loading
      const timeoutPromise = new Promise<[]>((_, reject) => {
        setTimeout(() => reject(new Error("Timeout fetching active users")), 5000);
      });
      
      // Race between the actual fetch and the timeout
      const activeUsersData = await Promise.race([
        fetchActiveUsers(token),
        timeoutPromise
      ]).catch(err => {
        console.error("Error or timeout loading active users:", err);
        return [];
      });
      
      console.log("Active users data received:", activeUsersData);
      
      // If data is null or not an array, use empty array
      const validData = Array.isArray(activeUsersData) ? activeUsersData : [];
      
      // Filter out any items without valid IDs
      const filteredData = validData.filter(user => typeof user?.id === 'number' && user.id > 0);
      
      setActiveUsers(filteredData);
      
      // Update following users, making sure we only store valid IDs
      const validIds = filteredData.map(user => user.id).filter(id => id !== undefined && id !== null);
      setFollowingUsers(validIds);
    } catch (err) {
      console.error('Error loading active users:', err);
      toast({ 
        title: "Note", 
        description: "Could not load active users at this time", 
        variant: "default" 
      });
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !postImage && !postVideo) {
      toast({ 
        title: "Empty Post", 
        description: "Please enter content, image, or video for your post", 
        variant: "destructive" 
      });
      return;
    }

    try {
      setCreatingPost(true);
      if (token) {
        const formData = new FormData();
        formData.append('content', newPostContent.trim());
        
        if (postImage) {
          formData.append('image', postImage);
        }
        
        if (postVideo) {
          formData.append('video', postVideo);
        }
        
        const newPost = await createPost(token, formData);
        
        // Add the new post to the list
        setPosts([newPost, ...posts]);
        
        // Reset form
        setNewPostContent('');
        setPostImage(null);
        setPostVideo(null);
        setPostMediaPreview(null);
        
        toast({ 
          title: "Success", 
          description: "Your post has been created", 
          variant: "default" 
        });
        loadPosts(); // Reload posts to show the new one
      }
    } catch (err) {
      console.error('Error creating post:', err);
      toast({ 
        title: "Error", 
        description: "Failed to create post", 
        variant: "destructive" 
      });
    } finally {
      setCreatingPost(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Clear any existing video
      setPostVideo(null);
      setPostImage(file);
      setIsMediaImage(true);
      setPostMediaPreview(URL.createObjectURL(file));
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Clear any existing image
      setPostImage(null);
      setPostVideo(file);
      setIsMediaImage(false);
      setPostMediaPreview(URL.createObjectURL(file));
    }
  };

  const clearMedia = () => {
    setPostImage(null);
    setPostVideo(null);
    setPostMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handleExpandPost = async (postId: number) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
      return;
    }

    setExpandedPost(postId);
    
    if (!comments[postId]) {
      try {
        setLoadingComments({ ...loadingComments, [postId]: true });
        if (token) {
          const commentData = await fetchPostComments(token, postId);
          setComments(prev => ({ ...prev, [postId]: commentData }));
        }
      } catch (err) {
        console.error('Error fetching comments:', err);
      } finally {
        setLoadingComments({ ...loadingComments, [postId]: false });
      }
    }
  };

  const handleSubmitComment = async (postId: number) => {
    if (!newComment[postId]?.trim()) {
      toast({ 
        title: "Empty Comment", 
        description: "Please enter content for your comment", 
        variant: "destructive" 
      });
      return;
    }

    try {
      setSubmittingComment({ ...submittingComment, [postId]: true });
      if (token) {
        const comment = await createComment(token, postId, newComment[postId]);
        
        // Update comments list
        setComments(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), comment]
        }));
        
        // Update comment count in post
        setPosts(prev => 
          prev.map(post => 
            post.id === postId 
              ? { ...post, comment_count: post.comment_count + 1 } 
              : post
          )
        );
        
        // Clear comment input
        setNewComment(prev => ({ ...prev, [postId]: '' }));
      }
    } catch (err) {
      console.error('Error submitting comment:', err);
      toast({ 
        title: "Error", 
        description: "Failed to post comment", 
        variant: "destructive" 
      });
    } finally {
      setSubmittingComment({ ...submittingComment, [postId]: false });
    }
  };

  const handleLikePost = async (postId: number) => {
    if (likeInProgress.includes(postId)) return;
    
    try {
      setLikeInProgress(prev => [...prev, postId]);
      if (token) {
        await likePost(token, postId);
        
        // Update like count and liked status in the UI
        setPosts(prev => 
          prev.map(post => {
            if (post.id === postId) {
              return { 
                ...post, 
                like_count: post.is_liked ? post.like_count - 1 : post.like_count + 1,
                is_liked: !post.is_liked 
              };
            }
            return post;
          })
        );
      }
    } catch (err) {
      console.error('Error liking post:', err);
    } finally {
      setLikeInProgress(prev => prev.filter(id => id !== postId));
    }
  };

  const handleFollowUser = async (userId: number) => {
    if (!isAuthenticated) {
      toast({ 
        title: "Authentication Required", 
        description: "Please log in to follow users", 
        variant: "destructive" 
      });
      return;
    }
    
    try {
      if (followingUsers.includes(userId)) {
        // Unfollow
        await unfollowUser(token, userId);
        setFollowingUsers(followingUsers.filter(id => id !== userId));
        
        toast({ 
          title: "Success", 
          description: "User unfollowed", 
          variant: "default" 
        });
      } else {
        // Follow
        await followUser(token, userId);
        setFollowingUsers([...followingUsers, userId]);
        
        toast({ 
          title: "Success", 
          description: "User followed", 
          variant: "default" 
        });
      }
    } catch (err) {
      toast({ 
        title: "Error", 
        description: "Failed to follow/unfollow user", 
        variant: "destructive" 
      });
    }
  };

  const handleDeletePost = async (postId: number) => {
    try {
      if (token) {
        await deletePost(token, postId);
        
        // Remove the post from the state
        setPosts(posts.filter(post => post.id !== postId));
        setTrendingPosts(trendingPosts.filter(post => post.id !== postId));
        
        toast({ 
          title: "Success", 
          description: "Post deleted successfully", 
          variant: "default" 
        });
      }
    } catch (err) {
      console.error('Error deleting post:', err);
      toast({ 
        title: "Error", 
        description: "Failed to delete post", 
        variant: "destructive" 
      });
    }
  };

  const handleSharePost = async (postId: number) => {
    // Create a shareable link using the post ID
    const shareUrl = `${window.location.origin}/community/post/${postId}`;
    setCurrentShareUrl(shareUrl);
    setCurrentSharePostId(postId);
    setShareDialogOpen(true);
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(currentShareUrl);
    toast({ 
      title: "Success", 
      description: "Link copied to clipboard", 
      variant: "default" 
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffSeconds < 60) return `${diffSeconds}s`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h`;
    if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d`;
    return `${Math.floor(diffSeconds / 604800)}w`;
  };

  const renderPostContent = (content: string) => {
    // Format text to highlight hashtags
    if (!content) return '';
    
    // Replace hashtags with highlighted version
    return content.replace(
      /#(\w+)/g, 
      '<span class="text-finzo-purple font-medium">#$1</span>'
    );
  };

  const renderSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="bg-muted/5 glass-card">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-16 w-full" />
                <div className="flex justify-between pt-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderComment = (comment: Comment, postId: number, isReply = false) => (
    <div key={comment.id} className={`flex items-start gap-2 ${isReply ? 'ml-8 mt-3' : ''}`}>
      <Avatar className="h-8 w-8">
        <AvatarImage 
          src={comment.author.profile_picture || "/placeholder.svg"} 
          alt={`${comment.author.first_name} ${comment.author.last_name}`} 
        />
        <AvatarFallback>
          {(comment.author.first_name?.[0] || '') + (comment.author.last_name?.[0] || '')}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="bg-muted/10 rounded-xl p-3 text-sm">
          <div className="font-medium text-xs">
            {comment.author.first_name} {comment.author.last_name}
          </div>
          <p className="text-sm mt-1">{comment.content}</p>
        </div>
        <div className="flex items-center gap-4 mt-1 ml-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-6 text-xs px-2 flex items-center gap-1 ${comment.is_liked ? 'text-finzo-purple' : ''}`}
            onClick={() => handleLikeComment(comment.id)}
            disabled={likeCommentInProgress.includes(comment.id)}
          >
            {likeCommentInProgress.includes(comment.id) ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <ThumbsUp className={`h-3 w-3 ${comment.is_liked ? 'fill-finzo-purple' : ''}`} />
            )}
            {comment.like_count ? <span>{comment.like_count}</span> : null}
            Like
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 text-xs px-2"
            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
          >
            Reply
          </Button>
          
          <span className="text-xs text-muted-foreground">{formatTimeAgo(comment.created_at)}</span>
        </div>

        {/* Reply input */}
        {replyingTo === comment.id && (
          <div className="flex items-start gap-2 mt-3 ml-8">
            <Avatar className="h-6 w-6">
              <AvatarImage 
                src={user?.profile_picture || "/placeholder.svg"} 
                alt="You" 
              />
              <AvatarFallback>
                {user?.first_name?.[0] || ''}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 flex gap-2">
              <Textarea 
                placeholder="Write a reply..." 
                className="min-h-10 text-sm resize-none flex-1"
                value={newReply[comment.id] || ''}
                onChange={(e) => setNewReply(prev => ({ ...prev, [comment.id]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitReply(postId, comment.id);
                  }
                }}
              />
              <Button 
                size="icon" 
                className="h-7 w-7 rounded-full"
                onClick={() => handleSubmitReply(postId, comment.id)}
                disabled={submittingReply[comment.id]}
              >
                {submittingReply[comment.id] ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Send className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        )}
        
        {/* Nested replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-3 mt-2">
            {comment.replies.map(reply => renderComment(reply, postId, true))}
          </div>
        )}
      </div>
    </div>
  );

  const renderPosts = (postsToRender: Post[]) => (
    <div className="space-y-4">
      {postsToRender.length === 0 ? (
        <div className="text-center py-10">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <h3 className="text-lg font-medium">No posts yet</h3>
          <p className="text-muted-foreground mt-1 mb-4">Be the first to start a discussion!</p>
        </div>
      ) : (
        postsToRender.map((post) => (
          <Card key={post.id} className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage 
                    src={post.author.profile_picture 
                      ? (post.author.profile_picture.startsWith('http')
                        ? post.author.profile_picture
                        : `${MEDIA_URL}${post.author.profile_picture}`)
                      : "/placeholder.svg"} 
                    alt={`${post.author.first_name} ${post.author.last_name}`}
                    loading="lazy" 
                    onError={(e) => {
                      console.error('Failed to load author profile picture');
                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                    }}
                  />
                  <AvatarFallback>
                    {(post.author.first_name?.[0] || '') + (post.author.last_name?.[0] || '')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {post.author.first_name} {post.author.last_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        · {formatTimeAgo(post.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {post.author.id === user?.id && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-2 mb-3">
                    <p 
                      className="text-sm whitespace-pre-wrap" 
                      dangerouslySetInnerHTML={{ __html: renderPostContent(post.content) }}
                    ></p>
                    
                    {/* Display post image if exists */}
                    {post.image && (
                      <div className="mt-3 rounded-md overflow-hidden">
                        <img 
                          src={post.image.startsWith('http') ? post.image : `${MEDIA_URL}${post.image}`} 
                          alt="Post attachment" 
                          className="max-w-full h-auto object-cover" 
                          loading="lazy"
                          onError={(e) => {
                            console.error(`Failed to load image: ${post.image}`);
                            // Set a default image or hide the element
                            (e.target as HTMLImageElement).src = "/placeholder.svg";
                            toast({ 
                              title: "Note", 
                              description: "Some media content could not be loaded", 
                              variant: "default" 
                            });
                          }}
                        />
                      </div>
                    )}
                    
                    {/* Display post video if exists */}
                    {post.video && (
                      <div className="mt-3 rounded-md overflow-hidden">
                        <video 
                          src={post.video.startsWith('http') ? post.video : `${MEDIA_URL}${post.video}`} 
                          controls 
                          className="max-w-full h-auto" 
                          onError={(e) => {
                            console.error(`Failed to load video: ${post.video}`);
                            // Add a fallback message
                            const videoElement = e.target as HTMLVideoElement;
                            const parent = videoElement.parentElement;
                            if (parent) {
                              const fallback = document.createElement('p');
                              fallback.textContent = 'Video could not be loaded';
                              fallback.className = 'text-sm text-center p-4 bg-muted/10';
                              parent.appendChild(fallback);
                            }
                            videoElement.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-muted/20 pt-3 mt-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`flex items-center gap-1 text-xs ${post.is_liked ? 'text-finzo-purple' : ''}`}
                      onClick={() => handleLikePost(post.id)}
                      disabled={likeInProgress.includes(post.id)}
                    >
                      {likeInProgress.includes(post.id) ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <ThumbsUp className={`h-4 w-4 ${post.is_liked ? 'fill-finzo-purple' : ''}`} />
                      )}
                      {post.like_count > 0 && <span>{post.like_count}</span>}
                      <span>Like</span>
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex items-center gap-1 text-xs"
                      onClick={() => handleExpandPost(post.id)}
                    >
                      <MessageSquare className="h-4 w-4" />
                      {post.comment_count > 0 && <span>{post.comment_count}</span>}
                      <span>Comment</span>
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex items-center gap-1 text-xs"
                      onClick={() => handleSharePost(post.id)}
                    >
                      <Share2 className="h-4 w-4" />
                      <span>Share</span>
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Comments section */}
              {expandedPost === post.id && (
                <div className="mt-4 pl-12 space-y-4">
                  <Separator className="bg-muted/20" />
                  
                  {/* Comment input */}
                  <div className="flex items-start gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={user?.profile_picture || "/placeholder.svg"} 
                        alt="You" 
                      />
                      <AvatarFallback>
                        {user?.first_name?.[0] || ''}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex gap-2">
                      <Textarea 
                        placeholder="Write a comment..." 
                        className="min-h-10 text-sm resize-none flex-1"
                        value={newComment[post.id] || ''}
                        onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmitComment(post.id);
                          }
                        }}
                      />
                      <Button 
                        size="icon" 
                        className="h-8 w-8 rounded-full"
                        onClick={() => handleSubmitComment(post.id)}
                        disabled={submittingComment[post.id]}
                      >
                        {submittingComment[post.id] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Comments list */}
                  <div className="space-y-3 pt-2">
                    {loadingComments[post.id] ? (
                      <div className="flex justify-center py-2">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : comments[post.id]?.length ? (
                      comments[post.id].map(comment => renderComment(comment, post.id))
                    ) : (
                      <div className="text-center py-2">
                        <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  const handleSubmitReply = async (postId: number, commentId: number) => {
    if (!newReply[commentId]?.trim()) {
      toast({ 
        title: "Empty Reply", 
        description: "Please enter content for your reply", 
        variant: "destructive" 
      });
      return;
    }

    try {
      setSubmittingReply({ ...submittingReply, [commentId]: true });
      if (token) {
        const reply = await createReply(token, postId, commentId, newReply[commentId]);
        
        // Update comments list
        setComments(prev => {
          const updatedComments = [...(prev[postId] || [])];
          const parentCommentIndex = updatedComments.findIndex(c => c.id === commentId);
          
          if (parentCommentIndex !== -1) {
            if (!updatedComments[parentCommentIndex].replies) {
              updatedComments[parentCommentIndex].replies = [];
            }
            updatedComments[parentCommentIndex].replies?.push(reply);
          }
          
          return {
            ...prev,
            [postId]: updatedComments
          };
        });
        
        // Update comment count in post
        setPosts(prev => 
          prev.map(post => 
            post.id === postId 
              ? { ...post, comment_count: post.comment_count + 1 } 
              : post
          )
        );
        
        // Clear reply input and reset replying state
        setNewReply(prev => ({ ...prev, [commentId]: '' }));
        setReplyingTo(null);
      }
    } catch (err) {
      console.error('Error submitting reply:', err);
      toast({ 
        title: "Error", 
        description: "Failed to post reply", 
        variant: "destructive" 
      });
    } finally {
      setSubmittingReply({ ...submittingReply, [commentId]: false });
    }
  };

  const handleLikeComment = async (commentId: number) => {
    if (likeCommentInProgress.includes(commentId)) return;
    
    try {
      setLikeCommentInProgress(prev => [...prev, commentId]);
      if (token) {
        await likeComment(token, commentId);
        
        // Update comments in state with the liked status
        setComments(prev => {
          const updatedComments: Record<number, Comment[]> = {};
          
          // Loop through all posts' comments
          Object.keys(prev).forEach(postIdStr => {
            const postId = parseInt(postIdStr);
            const postComments = [...prev[postId]];
            
            // Function to update a comment or its replies
            const updateCommentLike = (comment: Comment): Comment => {
              if (comment.id === commentId) {
                // Toggle like status and count
                const isCurrentlyLiked = comment.is_liked || false;
                const currentLikeCount = comment.like_count || 0;
                
                return {
                  ...comment,
                  is_liked: !isCurrentlyLiked,
                  like_count: isCurrentlyLiked ? currentLikeCount - 1 : currentLikeCount + 1
                };
              }
              
              // Handle nested replies
              if (comment.replies && comment.replies.length > 0) {
                return {
                  ...comment,
                  replies: comment.replies.map(reply => updateCommentLike(reply))
                };
              }
              
              return comment;
            };
            
            updatedComments[postId] = postComments.map(comment => updateCommentLike(comment));
          });
          
          return updatedComments;
        });
      }
    } catch (err) {
      console.error('Error liking comment:', err);
    } finally {
      setLikeCommentInProgress(prev => prev.filter(id => id !== commentId));
    }
  };

  return (
    <div className="bg-finzo-black min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 py-10 max-w-7xl">
        <Motion animation="fade-in" duration={0.6}>
          <div className="flex flex-col md:flex-row justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-gradient">Discussions</h1>
              <p className="text-muted-foreground max-w-xl">
                Share your financial insights and engage with the community
              </p>
            </div>
          </div>
        </Motion>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content - posts and create post */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create post card */}
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Avatar>
                    <AvatarImage 
                      src={user?.profile_picture || "/placeholder.svg"} 
                      alt="Your profile" 
                    />
                    <AvatarFallback>
                      {user?.first_name?.[0] || ''}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      ref={postContentRef}
                      placeholder="Share your financial insights or ask a question..."
                      className="resize-none border-0 focus-visible:ring-0 p-0 min-h-fit text-sm bg-transparent"
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                    />
                    
                    {/* Media preview */}
                    {postMediaPreview && (
                      <div className="relative mt-3 rounded-md overflow-hidden border border-muted">
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          className="absolute top-2 right-2 h-6 w-6 bg-black/60"
                          onClick={clearMedia}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        {isMediaImage ? (
                          <img 
                            src={postMediaPreview} 
                            alt="Post preview" 
                            className="max-w-full h-auto max-h-80 object-contain mx-auto"
                          />
                        ) : (
                          <video 
                            src={postMediaPreview} 
                            controls 
                            className="max-w-full h-auto max-h-80 mx-auto"
                          />
                        )}
                      </div>
                    )}
                    
                    <div className="flex justify-between mt-4 items-center">
                      {/* Media upload buttons */}
                      <div className="flex gap-2">
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          className="hidden" 
                          accept="image/*" 
                          onChange={handleImageUpload}
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex items-center gap-1 text-xs"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={!!postVideo}
                        >
                          <ImageIcon className="h-4 w-4" />
                          <span>Photo</span>
                        </Button>
                        
                        <input 
                          type="file" 
                          ref={videoInputRef}
                          className="hidden" 
                          accept="video/*" 
                          onChange={handleVideoUpload}
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex items-center gap-1 text-xs"
                          onClick={() => videoInputRef.current?.click()}
                          disabled={!!postImage}
                        >
                          <Video className="h-4 w-4" />
                          <span>Video</span>
                        </Button>
                      </div>
                      
                      <Button 
                        className="bg-finzo-purple hover:bg-finzo-dark-purple"
                        disabled={creatingPost || (!newPostContent.trim() && !postImage && !postVideo)}
                        onClick={handleCreatePost}
                      >
                        {creatingPost ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Posting...
                          </>
                        ) : 'Post'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Posts tabs */}
            <Tabs defaultValue="recent" className="w-full">
              <TabsList className="glass-card w-full p-0">
                <TabsTrigger value="recent" className="flex-1 py-3 rounded-none">Recent</TabsTrigger>
                <TabsTrigger value="trending" className="flex-1 py-3 rounded-none">Trending</TabsTrigger>
              </TabsList>
              
              <TabsContent value="recent" className="mt-4">
                {loading ? renderSkeleton() : renderPosts(posts)}
              </TabsContent>
              
              <TabsContent value="trending" className="mt-4">
                {loading ? renderSkeleton() : renderPosts(trendingPosts)}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Popular topics */}
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <TrendingUp className="w-4 h-4 mr-2 text-finzo-purple" />
                  Popular Topics
                </CardTitle>
                <CardDescription>What's being discussed</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                {loadingHashtags ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : trendingHashtags.length > 0 ? (
                  <div className="space-y-2">
                    {trendingHashtags.map((tag) => (
                      <div 
                        key={tag.name} 
                        className="bg-muted/10 hover:bg-muted/20 px-4 py-2 rounded-md text-sm cursor-pointer flex justify-between items-center"
                      >
                        <span className="text-finzo-purple font-medium">#{tag.name}</span>
                        <span className="text-xs text-muted-foreground">{tag.count} posts</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No trending topics yet. Start using hashtags in your posts!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active members */}
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <UserPlus className="w-4 h-4 mr-2 text-finzo-purple" />
                  Active Members
                </CardTitle>
                <CardDescription>Connect with other members</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {activeUsers.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">
                        Active users information is currently unavailable. Please try again later.
                      </p>
                    </div>
                  ) : (
                    activeUsers.map((user) => (
                      <div key={user?.id || Math.random()} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage 
                              src={user?.profile_picture && user.profile_picture.startsWith('http') 
                                ? user.profile_picture 
                                : (user?.profile_picture 
                                  ? `${MEDIA_URL}${user.profile_picture}` 
                                  : "/placeholder.svg")} 
                              alt={user?.display_name || 'User'} 
                              loading="lazy"
                              onError={(e) => {
                                console.error('Failed to load profile picture');
                                (e.target as HTMLImageElement).src = "/placeholder.svg";
                              }}
                            />
                            <AvatarFallback>{(user?.display_name || 'U').charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{user?.display_name || 'User'}</p>
                            <p className="text-xs text-muted-foreground">@{user?.username || 'user'}</p>
                          </div>
                        </div>
                        <Button 
                          variant={followingUsers.includes(user?.id || -1) ? "default" : "outline"} 
                          size="sm"
                          className={followingUsers.includes(user?.id || -1) ? "bg-finzo-purple hover:bg-finzo-dark-purple" : ""}
                          onClick={() => user?.id && handleFollowUser(user.id)}
                          disabled={!user?.id}
                        >
                          {followingUsers.includes(user?.id || -1) ? (
                            <UserCheck className="h-4 w-4" />
                          ) : (
                            <UserPlus className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Community rules */}
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Community Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="bg-finzo-purple/20 rounded-full p-1 mt-0.5">
                      <span className="text-xs text-finzo-purple">1</span>
                    </div>
                    <span>Be respectful and constructive in discussions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="bg-finzo-purple/20 rounded-full p-1 mt-0.5">
                      <span className="text-xs text-finzo-purple">2</span>
                    </div>
                    <span>No financial advice - share insights, not specific recommendations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="bg-finzo-purple/20 rounded-full p-1 mt-0.5">
                      <span className="text-xs text-finzo-purple">3</span>
                    </div>
                    <span>No spam or self-promotion</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="bg-finzo-purple/20 rounded-full p-1 mt-0.5">
                      <span className="text-xs text-finzo-purple">4</span>
                    </div>
                    <span>Cite sources when sharing information</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Share Post Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Post</DialogTitle>
            <DialogDescription>Copy the link to share this post with others</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 mt-2">
            <input 
              type="text" 
              value={currentShareUrl}
              readOnly
              className="flex-1 px-3 py-2 rounded-md border bg-muted/10 text-sm"
            />
            <Button onClick={copyShareLink} className="flex items-center gap-1">
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
};

export default CommunityDiscussions; 