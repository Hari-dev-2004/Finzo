import React, { useState, useEffect } from 'react';
import { Motion, MotionGroup } from '@/components/ui/motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  MessageSquare, 
  CalendarClock, 
  TrendingUp, 
  AlertCircle,
  Plus,
  Loader2,
  UsersRound,
  PenSquare,
  ChevronRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/toast-wrapper';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Replace process.env with a direct URL
const API_URL = 'http://localhost:8000/api';
const MEDIA_URL = 'http://localhost:8000';

// Data interfaces
interface Group {
  id: number;
  name: string;
  description?: string;
  members_count: number;
  is_member: boolean;
  is_admin: boolean;
  profile_picture?: string;
  created_at: string;
}

interface Event {
  id: number;
  title: string;
  date: string;
  description?: string;
  attendees: number;
  image?: string;
}

// API service functions
const getCommunityGroups = async (token: string) => {
  try {
    const response = await axios.get(`${API_URL}/community/groups/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching community groups:', error);
    throw error;
  }
};

const getEvents = async (token: string) => {
  try {
    const response = await axios.get(`${API_URL}/community/events/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

const joinGroup = async (token: string, groupId: number) => {
  try {
    const response = await axios.post(
      `${API_URL}/community/groups/${groupId}/join/`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Error joining group:', error);
    throw error;
  }
};

const createGroup = async (token: string, formData: FormData) => {
  try {
    const response = await axios.post(
      `${API_URL}/community/groups/`,
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
    console.error('Error creating group:', error);
    throw error;
  }
};

const Community = () => {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joiningGroup, setJoiningGroup] = useState<number | null>(null);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [groupProfilePicture, setGroupProfilePicture] = useState<File | null>(null);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (isAuthenticated) {
          const [groupsData, eventsData] = await Promise.all([
            getCommunityGroups(token as string),
            getEvents(token as string).catch(() => []) // Make events optional
          ]);
          
          setGroups(groupsData);
          setEvents(eventsData);
        } else {
          // Handle case where user is not authenticated
          setError('You need to be logged in to access community features.');
        }
      } catch (err) {
        console.error('Error fetching community data:', err);
        setError('Failed to load community data. Please try again later.');
        toast({ 
          title: "Error", 
          description: "Failed to load community data", 
          variant: "destructive" 
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, isAuthenticated]);

  const handleJoinGroup = async (groupId: number) => {
    if (!isAuthenticated) {
      toast({ 
        title: "Authentication Required", 
        description: "Please log in to join groups", 
        variant: "destructive" 
      });
      return;
    }
    
    try {
      setJoiningGroup(groupId);
      await joinGroup(token as string, groupId);
      
      // Update the groups list to reflect the change
      setGroups(groups.map(group => 
        group.id === groupId ? { ...group, is_member: true } : group
      ));
      
      toast({ 
        title: "Success", 
        description: "You have joined the group", 
        variant: "default" 
      });
    } catch (err) {
      console.error("Failed to join group:", err);
      toast({ 
        title: "Error", 
        description: "Failed to join group", 
        variant: "destructive" 
      });
    } finally {
      setJoiningGroup(null);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) {
      toast({ 
        title: "Missing Information", 
        description: "Please enter a name for your group", 
        variant: "destructive" 
      });
      return;
    }

    try {
      setCreatingGroup(true);
      
      // Create FormData object for file upload
      const formData = new FormData();
      formData.append('name', newGroup.name);
      formData.append('description', newGroup.description || '');
      
      if (groupProfilePicture) {
        formData.append('profile_picture', groupProfilePicture);
      }
      
      const createdGroup = await createGroup(token as string, formData);
      
      // Add new group to the list
      setGroups([createdGroup, ...groups]);
      
      // Reset form and close dialog
      setNewGroup({ name: '', description: '' });
      setGroupProfilePicture(null);
      setProfilePicturePreview(null);
      setCreateGroupOpen(false);
      
      toast({ 
        title: "Success", 
        description: "Your group has been created", 
        variant: "default" 
      });
    } catch (err) {
      console.error("Failed to create group:", err);
      toast({ 
        title: "Error", 
        description: "Failed to create group", 
        variant: "destructive" 
      });
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setGroupProfilePicture(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Format time ago from ISO date
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffSeconds < 60) return `${diffSeconds} seconds ago`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} minutes ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hours ago`;
    return `${Math.floor(diffSeconds / 86400)} days ago`;
  };

  // Render loading skeletons
  const renderSkeleton = () => (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-4 w-2/4" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Skeleton className="h-64 rounded-lg" />
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-finzo-black min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-10 max-w-7xl">
          {renderSkeleton()}
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-finzo-black min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-10 max-w-7xl text-center">
          <Card className="glass-card p-8">
            <CardContent>
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Error Loading Community</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <div className="flex justify-center gap-4">
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/login'}
                >
                  Log In
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-finzo-black min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 py-10 max-w-7xl">
        <Motion animation="fade-in" duration={0.6}>
          <div className="flex flex-col md:flex-row justify-between items-start mb-10">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-gradient">Community Hub</h1>
              <p className="text-muted-foreground max-w-xl">
                Connect with other financial enthusiasts, join groups, and attend events.
              </p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-finzo-purple hover:bg-finzo-dark-purple">
              <Plus className="mr-2 h-4 w-4" />
                    Create Group
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create a New Group</DialogTitle>
                    <DialogDescription>
                      Create a community group to discuss specific financial topics with like-minded individuals.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {/* Group Profile Picture Upload */}
                    <div className="space-y-2">
                      <Label htmlFor="profile-picture">Group Picture</Label>
                      <div className="flex items-center gap-4">
                        <div 
                          className={`w-24 h-24 rounded-lg ${profilePicturePreview ? '' : 'bg-muted/20'} flex items-center justify-center overflow-hidden border border-border`}
                        >
                          {profilePicturePreview ? (
                            <img 
                              src={profilePicturePreview} 
                              alt="Group profile preview" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <UsersRound className="h-12 w-12 text-muted-foreground/40" />
                          )}
                        </div>
                        <div className="flex-1">
                          <Input
                            id="profile-picture"
                            type="file"
                            accept="image/*"
                            onChange={handleProfilePictureChange}
                            className="cursor-pointer"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Recommended: Square image, at least 200x200px
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="group-name">Group Name</Label>
                      <Input 
                        id="group-name" 
                        placeholder="e.g., Stock Market Investors" 
                        value={newGroup.name}
                        onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="group-description">Description</Label>
                      <Textarea 
                        id="group-description" 
                        placeholder="Describe what your group is about..." 
                        value={newGroup.description}
                        onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setCreateGroupOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateGroup}
                      className="bg-finzo-purple hover:bg-finzo-dark-purple"
                      disabled={creatingGroup}
                    >
                      {creatingGroup ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : 'Create Group'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Button 
                variant="outline" 
                className="border-finzo-purple/30 text-finzo-purple hover:bg-finzo-purple/10"
                onClick={() => navigate('/community-discussions')}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Discussions
            </Button>
            </div>
          </div>
        </Motion>

        {/* Community Stats */}
        <Motion animation="fade-in" delay={0.2}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <Card className="glass-card">
              <CardContent className="flex items-center p-6">
                <div className="bg-finzo-purple/20 rounded-full p-3 mr-4">
                  <Users className="h-6 w-6 text-finzo-purple" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Members</p>
                  <h3 className="text-2xl font-bold">
                    {groups.reduce((total, group) => total + group.members_count, 0)}+
                  </h3>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-card">
              <CardContent className="flex items-center p-6">
                <div className="bg-finzo-purple/20 rounded-full p-3 mr-4">
                  <Users className="h-6 w-6 text-finzo-purple" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Groups</p>
                  <h3 className="text-2xl font-bold">{groups.length}</h3>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-card">
              <CardContent className="flex items-center p-6">
                <div className="bg-finzo-purple/20 rounded-full p-3 mr-4">
                  <CalendarClock className="h-6 w-6 text-finzo-purple" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Events</p>
                  <h3 className="text-2xl font-bold">{events.length}+</h3>
                </div>
              </CardContent>
            </Card>
          </div>
        </Motion>

        {/* Featured Group */}
        {groups.length > 0 && (
          <Motion animation="fade-in" delay={0.3}>
            <Card className="glass-card mb-10">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-finzo-purple" />
                  Featured Group
                </CardTitle>
                <CardDescription>Most active community group</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                  <div className="w-24 h-24 rounded-lg bg-finzo-purple/30 overflow-hidden flex-shrink-0">
                    <img 
                      src={groups[0].profile_picture && !groups[0].profile_picture.startsWith('http') 
                        ? `${MEDIA_URL}${groups[0].profile_picture}` 
                        : (groups[0].profile_picture || "/placeholder.svg")} 
                      alt={groups[0].name} 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                        </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xl font-medium mb-2">{groups[0].name}</h3>
                    <p className="text-muted-foreground mb-4">{groups[0].description || "Join this active community group to discuss financial topics and share insights."}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="bg-finzo-purple/20 text-finzo-purple text-xs px-3 py-1 rounded-full">
                        {groups[0].members_count} members
                      </span>
                      <span className="bg-muted/10 text-xs px-3 py-1 rounded-full">
                        Created {formatTimeAgo(groups[0].created_at)}
                      </span>
                        </div>
                    {!groups[0].is_member ? (
                      <Button 
                        className="bg-finzo-purple hover:bg-finzo-dark-purple"
                        onClick={() => handleJoinGroup(groups[0].id)}
                        disabled={joiningGroup === groups[0].id}
                      >
                        {joiningGroup === groups[0].id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <UsersRound className="mr-2 h-4 w-4" />
                        )}
                        Join Group
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline"
                          className="border-finzo-purple/30 text-finzo-purple"
                          onClick={() => navigate(`/group/${groups[0].id}`)}
                        >
                          View Group
                        </Button>
                        <Button 
                          className="bg-finzo-purple hover:bg-finzo-dark-purple"
                          onClick={() => navigate(`/group/${groups[0].id}`)}
                        >
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Send Message
                        </Button>
                      </div>
                    )}
                    </div>
                </div>
              </CardContent>
            </Card>
          </Motion>
        )}

        {/* Community Groups */}
          <Motion animation="fade-in" delay={0.4}>
          <Card className="glass-card mb-10">
              <CardHeader>
                <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-finzo-purple" />
                Community Groups
                </CardTitle>
              <CardDescription>Join groups that match your interests</CardDescription>
              </CardHeader>
              <CardContent>
              {groups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {groups.map((group) => (
                    <Card key={group.id} className="bg-muted/5 border-muted/10 overflow-hidden">
                      <div className="h-24 bg-finzo-purple/20 relative">
                        <img 
                          src={group.profile_picture && !group.profile_picture.startsWith('http') 
                            ? `${MEDIA_URL}${group.profile_picture}` 
                            : (group.profile_picture || "/placeholder.svg")} 
                          alt={group.name} 
                          className="w-full h-full object-cover opacity-50" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder.svg";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
                        <div className="absolute bottom-3 left-3 right-3">
                          <h4 className="font-medium text-lg truncate">{group.name}</h4>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2 min-h-[2.5rem]">
                          {group.description || "A community group for financial discussions."}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">
                            {group.members_count} members
                          </span>
                          {group.is_member ? (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 text-xs px-3"
                              onClick={() => navigate(`/group/${group.id}`)}
                            >
                              View
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              className="h-8 text-xs bg-finzo-purple hover:bg-finzo-dark-purple"
                              onClick={() => handleJoinGroup(group.id)}
                              disabled={joiningGroup === group.id}
                            >
                              {joiningGroup === group.id ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : null}
                              Join
                            </Button>
                          )}
                      </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Groups Found</h3>
                  <p className="text-muted-foreground mb-4">There are no community groups available yet.</p>
                  <Button 
                    className="bg-finzo-purple hover:bg-finzo-dark-purple"
                    onClick={() => setCreateGroupOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create the First Group
                  </Button>
                </div>
              )}
            </CardContent>
            {groups.length > 3 && (
              <CardFooter className="px-6 pb-6 pt-0">
                <Button variant="outline" className="w-full border-finzo-purple/30 text-finzo-purple hover:bg-finzo-purple/10">
                  View All Groups
                </Button>
              </CardFooter>
            )}
            </Card>
          </Motion>

        {/* Upcoming Events */}
        <Motion animation="fade-in" delay={0.5}>
          <Card className="glass-card mb-10">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarClock className="w-5 h-5 mr-2 text-finzo-purple" />
                Upcoming Events
              </CardTitle>
              <CardDescription>Financial events you might be interested in</CardDescription>
            </CardHeader>
            <CardContent>
              {events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {events.map((event) => (
                  <div key={event.id} className="flex bg-muted/10 rounded-lg overflow-hidden hover:bg-muted/20 transition-colors cursor-pointer">
                    <div className="w-24 h-auto bg-finzo-purple/20">
                        <img 
                          src={event.image || "/placeholder.svg"} 
                          alt={event.title} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder.svg";
                          }}
                        />
                    </div>
                    <div className="p-4 flex flex-col justify-between flex-1">
                      <div>
                        <h4 className="font-medium mb-1">{event.title}</h4>
                        <p className="text-xs text-muted-foreground mb-2">{event.date}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">{event.attendees} attending</span>
                        <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-finzo-purple hover:text-finzo-purple hover:bg-finzo-purple/20">
                          RSVP
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarClock className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Upcoming Events</h3>
                  <p className="text-muted-foreground mb-4">Check back later for community events!</p>
                </div>
              )}
              
              {events.length > 0 && (
              <Button variant="outline" className="w-full mt-6 border-finzo-purple/30 text-finzo-purple hover:bg-finzo-purple/10">
                View All Events
              </Button>
              )}
            </CardContent>
          </Card>
        </Motion>

        {/* Community Link Banner */}
        <Motion animation="fade-in" delay={0.6}>
          <Card className="glass-card mb-10 overflow-hidden">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-finzo-purple/30 to-transparent z-0"></div>
              <CardContent className="p-6 md:p-8 relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold mb-2">Join the Discussion</h3>
                    <p className="text-muted-foreground max-w-md mb-4">
                      Share your financial insights, ask questions, and engage with the community in our discussion forum.
                    </p>
                    <Button 
                      className="bg-finzo-purple hover:bg-finzo-dark-purple"
                      onClick={() => navigate('/community-discussions')}
                    >
                      <PenSquare className="mr-2 h-4 w-4" />
                      Go to Discussions
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                  <div className="hidden md:block">
                    <MessageSquare className="h-24 w-24 text-finzo-purple/50" />
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        </Motion>

        {/* Announcements */}
        <Motion animation="fade-in" delay={0.7}>
          <Card className="glass-card mb-10">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-finzo-purple" />
                Community Announcements
              </CardTitle>
              <CardDescription>Important updates from the Finzo team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-finzo-purple/10 border border-finzo-purple/20 rounded-lg p-4 mb-4">
                <h4 className="text-finzo-purple font-medium mb-2">Community Features Now Live!</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  We've updated our community features with separate pages for groups and discussions. Create and join groups, and participate in discussions with other financial enthusiasts.
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Posted just now</span>
                  <Button variant="ghost" size="sm" className="h-8 text-xs px-3 text-finzo-purple hover:text-finzo-purple hover:bg-finzo-purple/20">
                    Learn More
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </Motion>
      </div>
      
      <Footer />
    </div>
  );
};

export default Community;
