import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Motion } from '@/components/ui/motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/toast-wrapper';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  MessageSquare, 
  Send, 
  Image as ImageIcon, 
  UserMinus, 
  UserPlus, 
  Settings, 
  Loader2, 
  X,
  ArrowLeft,
  Trash2,
  AlertCircle,
  Video,
  Trash
} from 'lucide-react';

// Replace process.env with a direct URL
const API_URL = 'http://localhost:8000/api';
const MEDIA_URL = 'http://localhost:8000';

// Data interfaces
interface Member {
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_picture?: string;
  };
  is_admin: boolean;
  joined_at: string;
}

interface Message {
  id: number;
  sender: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_picture?: string;
  };
  content: string;
  image?: string;
  video?: string;
  created_at: string;
}

interface GroupDetail {
  id: number;
  name: string;
  description?: string;
  profile_picture?: string;
  created_by: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  members: Member[];
  recent_messages: Message[];
  members_count: number;
  is_member: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

// API service functions
const getGroupDetails = async (token: string, groupId: string) => {
  try {
    const response = await axios.get(`${API_URL}/community/groups/${groupId}/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching group details:', error);
    throw error;
  }
};

const getGroupMessages = async (token: string, groupId: string) => {
  try {
    const response = await axios.get(`${API_URL}/community/messages/group_messages/?group_id=${groupId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching group messages:', error);
    throw error;
  }
};

const sendGroupMessage = async (token: string, groupId: string, formData: FormData) => {
  try {
    const response = await axios.post(
      `${API_URL}/community/messages/`,
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
    console.error('Error sending message:', error);
    throw error;
  }
};

const deleteGroupMessage = async (token: string, messageId: number) => {
  try {
    const response = await axios.delete(
      `${API_URL}/community/messages/${messageId}/`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

const removeGroupMember = async (token: string, groupId: string, userId: number) => {
  try {
    const response = await axios.post(
      `${API_URL}/community/groups/${groupId}/remove_member/`,
      { user_id: userId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Error removing member:', error);
    throw error;
  }
};

const inviteToGroup = async (token: string, groupId: string, username: string) => {
  try {
    const response = await axios.post(
      `${API_URL}/community/groups/${groupId}/invite/`,
      { username },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Error inviting user:', error);
    throw error;
  }
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000; // Difference in seconds
  
  if (diff < 60) {
    return 'just now';
  } else if (diff < 3600) {
    const minutes = Math.floor(diff / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diff < 604800) {
    const days = Math.floor(diff / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
};

// Add delete group function
const deleteGroup = async (token: string, groupId: string) => {
  try {
    const response = await axios.delete(
      `${API_URL}/community/groups/${groupId}/`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting group:', error);
    throw error;
  }
};

const GroupDetail = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [groupDetails, setGroupDetails] = useState<GroupDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [messageText, setMessageText] = useState('');
  const [messageImage, setMessageImage] = useState<File | null>(null);
  const [messageVideo, setMessageVideo] = useState<File | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviting, setInviting] = useState(false);
  const [deletingMessage, setDeletingMessage] = useState<number | null>(null);
  const [deleteMessageDialogOpen, setDeleteMessageDialogOpen] = useState(false);
  const [confirmDeleteGroupOpen, setConfirmDeleteGroupOpen] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Fetch group details and messages
  useEffect(() => {
    const fetchData = async () => {
      if (!groupId || !isAuthenticated) {
        navigate('/community');
        return;
      }

      try {
        setLoading(true);
        const [details, messagesData] = await Promise.all([
          getGroupDetails(token as string, groupId),
          getGroupMessages(token as string, groupId)
        ]);
        
        setGroupDetails(details);
        setMessages(messagesData);
      } catch (err) {
        console.error('Error fetching group data:', err);
        setError('Failed to load group data. Please try again later.');
        toast({ 
          title: "Error", 
          description: "Failed to load group data", 
          variant: "destructive" 
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [groupId, token, isAuthenticated, navigate]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if ((!messageText.trim() && !messageImage && !messageVideo) || !groupId) {
      return;
    }

    try {
      setSendingMessage(true);
      
      const formData = new FormData();
      formData.append('group', groupId);
      
      if (messageText.trim()) {
        formData.append('content', messageText.trim());
      }
      
      if (messageImage) {
        formData.append('image', messageImage);
      }

      if (messageVideo) {
        formData.append('video', messageVideo);
      }
      
      const newMessage = await sendGroupMessage(token as string, groupId, formData);
      
      // Update messages list
      setMessages([...messages, newMessage]);
      
      // Clear input
      setMessageText('');
      setMessageImage(null);
      setMessageVideo(null);
      
    } catch (err) {
      console.error("Failed to send message:", err);
      toast({ 
        title: "Error", 
        description: "Failed to send message", 
        variant: "destructive" 
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMessageImage(e.target.files[0]);
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMessageVideo(e.target.files[0]);
    }
  };

  const handleRemoveMember = async () => {
    if (!groupId || !selectedUser) return;
    
    try {
      await removeGroupMember(token as string, groupId, selectedUser);
      
      // Update group details to reflect the change
      if (groupDetails) {
        const updatedMembers = groupDetails.members.filter(
          member => member.user.id !== selectedUser
        );
        
        setGroupDetails({
          ...groupDetails,
          members: updatedMembers,
          members_count: groupDetails.members_count - 1
        });
      }
      
      setRemoveDialogOpen(false);
      toast({ 
        title: "Success", 
        description: "Member removed from the group", 
        variant: "default" 
      });
    } catch (err) {
      console.error("Failed to remove member:", err);
      toast({ 
        title: "Error", 
        description: "Failed to remove member", 
        variant: "destructive" 
      });
    }
  };

  const handleInviteUser = async () => {
    if (!groupId || !inviteUsername.trim()) return;
    
    try {
      setInviting(true);
      await inviteToGroup(token as string, groupId, inviteUsername.trim());
      
      setInviteUsername('');
      setInviteDialogOpen(false);
      toast({ 
        title: "Success", 
        description: "User has been invited to the group", 
        variant: "default" 
      });
    } catch (err) {
      console.error("Failed to invite user:", err);
      toast({ 
        title: "Error", 
        description: "Failed to invite user. Please check the username is correct.", 
        variant: "destructive" 
      });
    } finally {
      setInviting(false);
    }
  };

  const handleDeleteMessage = async () => {
    if (!deletingMessage) return;
    
    try {
      await deleteGroupMessage(token as string, deletingMessage);
      
      // Remove message from state
      setMessages(messages.filter(m => m.id !== deletingMessage));
      
      setDeleteMessageDialogOpen(false);
      toast({ 
        title: "Success", 
        description: "Message deleted", 
        variant: "default" 
      });
    } catch (err) {
      console.error("Failed to delete message:", err);
      toast({ 
        title: "Error", 
        description: "Failed to delete message", 
        variant: "destructive" 
      });
    } finally {
      setDeletingMessage(null);
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupId) return;
    
    try {
      setDeletingGroup(true);
      await deleteGroup(token as string, groupId);
      
      setConfirmDeleteGroupOpen(false);
      toast({ 
        title: "Success", 
        description: "Group has been deleted", 
        variant: "default" 
      });
      
      // Redirect to community page
      navigate('/community');
    } catch (err) {
      console.error("Failed to delete group:", err);
      toast({ 
        title: "Error", 
        description: "Failed to delete group", 
        variant: "destructive" 
      });
      setDeletingGroup(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-finzo-purple" />
      </div>
    );
  }

  if (error || !groupDetails) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-medium mb-2">Error Loading Group</h2>
        <p className="text-muted-foreground mb-4 text-center">{error || "Group not found or you don't have access."}</p>
        <Button 
          onClick={() => navigate('/community')}
          className="bg-finzo-purple hover:bg-finzo-dark-purple"
        >
          Back to Community
        </Button>
      </div>
    );
  }

  if (!groupDetails.is_member) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Users className="h-12 w-12 text-finzo-purple mb-4" />
        <h2 className="text-xl font-medium mb-2">Join Required</h2>
        <p className="text-muted-foreground mb-4 text-center">
          You need to join this group to view its content.
        </p>
        <Button 
          onClick={() => navigate('/community')}
          className="bg-finzo-purple hover:bg-finzo-dark-purple"
        >
          Back to Community
        </Button>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Motion animation="fade-in">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate('/community')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Community
          </Button>

          {/* Group Header */}
          <div className="flex flex-col md:flex-row gap-6 mb-8 items-center md:items-start">
            <div className="w-24 h-24 rounded-lg bg-finzo-purple/20 overflow-hidden">
              <img 
                src={groupDetails.profile_picture && !groupDetails.profile_picture.startsWith('http') 
                  ? `${MEDIA_URL}${groupDetails.profile_picture}` 
                  : (groupDetails.profile_picture || "/placeholder.svg")} 
                alt={groupDetails.name} 
                className="w-full h-full object-cover" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold mb-2">{groupDetails.name}</h1>
              <p className="text-muted-foreground mb-4">{groupDetails.description}</p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <span className="bg-finzo-purple/20 text-finzo-purple text-xs px-3 py-1 rounded-full">
                  {groupDetails.members_count} members
                </span>
                <span className="bg-muted/10 text-xs px-3 py-1 rounded-full">
                  Created by {groupDetails.created_by.username}
                </span>
              </div>
            </div>

            {/* Admin controls */}
            {groupDetails.is_admin && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setInviteDialogOpen(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 border-red-500/30 hover:bg-red-500/10"
                  onClick={() => setConfirmDeleteGroupOpen(true)}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete Group
                </Button>
              </div>
            )}
          </div>

          {/* Group Content */}
          <Tabs defaultValue="messages">
            <TabsList className="mb-6">
              <TabsTrigger value="messages">
                <MessageSquare className="h-4 w-4 mr-2" />
                Messages
              </TabsTrigger>
              <TabsTrigger value="members">
                <Users className="h-4 w-4 mr-2" />
                Members
              </TabsTrigger>
            </TabsList>

            {/* Messages Tab */}
            <TabsContent value="messages" className="space-y-4">
              <Card className="glass-card">
                <CardContent className="p-4">
                  {/* Messages */}
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-4">
                      {messages.length > 0 ? (
                        messages.map((message) => (
                          <div 
                            key={message.id} 
                            className={`flex gap-3 ${message.sender.id === groupDetails.created_by.id ? 'items-start' : 'items-start'}`}
                          >
                            <Avatar className="w-10 h-10 mt-1">
                              <AvatarImage 
                                src={message.sender.profile_picture || "/placeholder.svg"} 
                                alt={message.sender.username} 
                              />
                              <AvatarFallback>
                                {message.sender.first_name ? message.sender.first_name[0] : message.sender.username[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {message.sender.first_name && message.sender.last_name 
                                    ? `${message.sender.first_name} ${message.sender.last_name}` 
                                    : message.sender.username}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatTimeAgo(message.created_at)}
                                </span>
                                {message.sender.id === groupDetails.created_by.id && (
                                  <span className="text-xs bg-finzo-purple/20 text-finzo-purple px-2 py-0.5 rounded">
                                    Admin
                                  </span>
                                )}
                                
                                {/* Delete message button (for sender or admin) */}
                                {(message.sender.id === groupDetails.created_by.id || 
                                   groupDetails.is_admin || 
                                   message.sender.id === (message.sender.id)) && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 text-muted-foreground hover:text-red-500"
                                    onClick={() => {
                                      setDeletingMessage(message.id);
                                      setDeleteMessageDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                              {message.content && (
                                <p className="text-sm mt-1">{message.content}</p>
                              )}
                              {message.image && (
                                <div className="mt-2">
                                  <img 
                                    src={message.image && !message.image.startsWith('http') 
                                      ? `${MEDIA_URL}${message.image}` 
                                      : message.image} 
                                    alt="Message attachment" 
                                    className="rounded-md max-w-full max-h-[300px] object-contain bg-muted/20"
                                    onError={(e) => {
                                      console.error("Failed to load image:", message.image);
                                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                                    }}
                                  />
                                </div>
                              )}
                              {message.video && (
                                <div className="mt-2">
                                  <video 
                                    src={message.video && !message.video.startsWith('http') 
                                      ? `${MEDIA_URL}${message.video}` 
                                      : message.video} 
                                    controls
                                    className="rounded-md max-w-full max-h-[300px] bg-muted/20"
                                    onError={(e) => {
                                      console.error("Failed to load video:", message.video);
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground opacity-40 mb-4" />
                          <p className="text-muted-foreground">No messages yet. Be the first to send a message!</p>
                        </div>
                      )}
                      <div ref={messagesEndRef}></div>
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="mt-4 flex gap-2 items-end">
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Type your message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={handleKeyPress}
                        className="bg-muted/5"
                      />
                      <div className="flex flex-wrap gap-2">
                        {messageImage && (
                          <div className="relative inline-flex bg-muted/10 rounded-md p-1 pr-8">
                            <ImageIcon className="h-3 w-3 mr-1" />
                            <span className="text-xs truncate max-w-[120px]">
                              {messageImage.name}
                            </span>
                            <button 
                              className="absolute top-1 right-1"
                              onClick={() => setMessageImage(null)}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                        {messageVideo && (
                          <div className="relative inline-flex bg-muted/10 rounded-md p-1 pr-8">
                            <Video className="h-3 w-3 mr-1" />
                            <span className="text-xs truncate max-w-[120px]">
                              {messageVideo.name}
                            </span>
                            <button 
                              className="absolute top-1 right-1"
                              onClick={() => setMessageVideo(null)}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleImageSelect}
                    />
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      ref={videoInputRef}
                      onChange={handleVideoSelect}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={sendingMessage}
                      title="Add image"
                    >
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => videoInputRef.current?.click()}
                      disabled={sendingMessage}
                      title="Add video"
                    >
                      <Video className="h-5 w-5 text-muted-foreground" />
                    </Button>
                    <Button
                      className="bg-finzo-purple hover:bg-finzo-dark-purple w-12"
                      size="icon"
                      onClick={handleSendMessage}
                      disabled={sendingMessage || (!messageText.trim() && !messageImage && !messageVideo)}
                    >
                      {sendingMessage ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Members ({groupDetails.members_count})</CardTitle>
                  <CardDescription>People who have joined this group</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {groupDetails.members.map((member) => (
                      <div 
                        key={member.user.id} 
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage 
                              src={member.user.profile_picture || "/placeholder.svg"} 
                              alt={member.user.username} 
                            />
                            <AvatarFallback>
                              {member.user.first_name ? member.user.first_name[0] : member.user.username[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {member.user.first_name && member.user.last_name 
                                  ? `${member.user.first_name} ${member.user.last_name}` 
                                  : member.user.username}
                              </span>
                              {member.is_admin && (
                                <span className="text-xs bg-finzo-purple/20 text-finzo-purple px-2 py-0.5 rounded">
                                  Admin
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              Joined {formatTimeAgo(member.joined_at)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Remove member button (only for admins and not for yourself or other admins) */}
                        {groupDetails.is_admin && !member.is_admin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedUser(member.user.id);
                              setRemoveDialogOpen(true);
                            }}
                          >
                            <UserMinus className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </Motion>
      </main>

      {/* Remove Member Dialog */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this member from the group?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRemoveMember}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite User Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite User to Group</DialogTitle>
            <DialogDescription>
              Enter the username of the person you want to invite.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                placeholder="Enter username" 
                value={inviteUsername}
                onChange={(e) => setInviteUsername(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setInviteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleInviteUser}
              className="bg-finzo-purple hover:bg-finzo-dark-purple"
              disabled={inviting || !inviteUsername.trim()}
            >
              {inviting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Inviting...
                </>
              ) : 'Invite User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Message Dialog */}
      <Dialog open={deleteMessageDialogOpen} onOpenChange={setDeleteMessageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Message</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteMessageDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteMessage}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Group Dialog */}
      <Dialog open={confirmDeleteGroupOpen} onOpenChange={setConfirmDeleteGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this group? This action cannot be undone.
              All messages, files and group data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setConfirmDeleteGroupOpen(false)}
              disabled={deletingGroup}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteGroup}
              disabled={deletingGroup}
            >
              {deletingGroup ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash className="mr-2 h-4 w-4" />
                  Delete Group
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </>
  );
};

export default GroupDetail; 