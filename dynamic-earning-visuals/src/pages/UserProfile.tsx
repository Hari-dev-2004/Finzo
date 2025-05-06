import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Motion } from '@/components/ui/motion';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/toast-wrapper';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { 
  User, 
  Image as ImageIcon,
  X,
  Loader2,
  Camera,
  UserPlus,
  Users,
  FileText,
  Edit,
  EyeIcon,
  EyeOffIcon,
  KeyRound,
  Phone,
  Mail,
  UserCheck,
  AtSign
} from 'lucide-react';

// API URL
const API_URL = 'http://localhost:8000/api';
const MEDIA_URL = 'http://localhost:8000';

interface UserProfile {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  profile_picture: string | null;
  bio: string | null;
  followers_count: number;
  following_count: number;
  posts_count: number;
  is_following?: boolean;
}

const updateUserProfile = async (token: string, formData: FormData) => {
  try {
    // Log what's being sent to the API
    console.log("Updating profile with formData containing:", {
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      email: formData.get('email'),
      phone_number: formData.get('phone_number'),
      bio: formData.get('bio'),
      profile_picture: formData.get('profile_picture')
    });

    // Use the correct API endpoint matching what's used in Profile.tsx
    const response = await axios.patch(
      `${API_URL}/user-profile/`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    console.log("Update profile response:", response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

const getUserProfile = async (token: string, username?: string) => {
  try {
    // Use the correct API endpoint matching what's used in Profile.tsx
    const url = username 
      ? `${API_URL}/user-profile/${username}/`
      : `${API_URL}/user-profile/`;
      
    console.log("Fetching profile from:", url);
    
    const response = await axios.get(
      url,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log("API response data:", response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
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

const updatePassword = async (token: string, currentPassword: string, newPassword: string) => {
  try {
    const response = await axios.post(
      `${API_URL}/users/change-password/`,
      { current_password: currentPassword, new_password: newPassword },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
};

const UserProfile = () => {
  const { username } = useParams<{ username?: string }>();
  const { token, isAuthenticated, user, setUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bio, setBio] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log("Auth context user data:", user);
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) {
      toast({ 
        title: "Authentication Required", 
        description: "Please log in to view profiles", 
        variant: "destructive" 
      });
      navigate('/login');
      return;
    }

    loadUserProfile();
  }, [isAuthenticated, token, navigate, username]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      if (isAuthenticated && token) {
        console.log("Current auth user data before API call:", user);
        
        // DIRECT FIX: Get phone number directly from localStorage
        const storedUserData = localStorage.getItem("user");
        let phoneNumberFromStorage = "";
        
        if (storedUserData) {
          try {
            const userData = JSON.parse(storedUserData);
            console.log("USER DATA FROM LOCAL STORAGE:", userData);
            
            // This is the key line - getting phone from storage where it was saved during login
            phoneNumberFromStorage = userData.phone_number || "";
            console.log("PHONE NUMBER FROM STORAGE:", phoneNumberFromStorage);
          } catch (e) {
            console.error("Error parsing user data from storage:", e);
          }
        }
        
        // First try to get data from the user context (from login/auth)
        if (!username && user) {
          // This is current user's own profile, use auth data first
          console.log("Using auth data for current user");
          
          // Check user object for all possible phone number field names
          console.log("Looking for phone number in user context with keys:", Object.keys(user));
          
          // Use phone from localStorage as primary source
          const userPhoneNumber = user.phone_number || phoneNumberFromStorage;
          
          console.log("Found phone number to use:", userPhoneNumber);
          
          // Set the profile with auth user data
          const authUserProfile = {
            ...user,
            // Ensure these fields exist by using auth data
            id: user.id,
            username: user.username || '',
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            email: user.email || '',
            phone_number: userPhoneNumber, // Use the confirmed phone number
            profile_picture: user.profile_picture || null,
            bio: user.bio || null,
            followers_count: user.followers_count || 0,
            following_count: user.following_count || 0,
            posts_count: user.posts_count || 0
          };
          
          setProfile(authUserProfile);
          
          // Initialize form fields from auth data
          setFirstName(authUserProfile.first_name);
          setLastName(authUserProfile.last_name);
          setEmail(authUserProfile.email);
          setPhoneNumber(userPhoneNumber); // Use the confirmed phone number
          setBio(authUserProfile.bio || '');
          
          console.log("Form fields initialized from auth data:", {
            first_name: authUserProfile.first_name,
            last_name: authUserProfile.last_name,
            email: authUserProfile.email,
            phone_number: userPhoneNumber, // Log the phone number being used
            bio: authUserProfile.bio
          });
          
          setLoading(false);
          return; // Skip API call for own profile
        }
        
        // Only fetch from API if needed (for other users or as fallback)
        try {
          // Try direct user data API as fallback
          const userEndpoint = username 
            ? `${API_URL}/users/${username}/`
            : `${API_URL}/user-profile/`;
          
          console.log("Fetching user data from:", userEndpoint);
          
          const response = await axios.get(
            userEndpoint,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          console.log("User API response:", response.data);
          console.log("User API response keys:", Object.keys(response.data));
          
          const userData = response.data;
          
          // Use phone number directly from API response
          const phoneNumber = userData.phone_number || '';
          console.log("Found phone number in API response:", phoneNumber);
          
          // Set profile and form data from API response
          setProfile({
            ...userData,
            phone_number: phoneNumber
          });
          
          setIsOwnProfile(!username || (user && user.username === userData.username));
          
          if (!username || (user && user.username === userData.username)) {
            setFirstName(userData.first_name || '');
            setLastName(userData.last_name || '');
            setEmail(userData.email || '');
            setPhoneNumber(phoneNumber);
            setBio(userData.bio || '');
          }
        } catch (err) {
          console.error("Error fetching from user API, trying profile API:", err);
          
          // Still use phone from localStorage if available
          let phoneNumber = phoneNumberFromStorage;
          
          // Fallback to profile API
          const profileEndpoint = username 
            ? `${API_URL}/user-profile/${username}/`
            : `${API_URL}/user-profile/`;
          
          console.log("Falling back to profile API:", profileEndpoint);
          
          const profileResponse = await axios.get(
            profileEndpoint,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          console.log("Profile API response:", profileResponse.data);
          console.log("Profile API response keys:", Object.keys(profileResponse.data));
          
          const profileData = profileResponse.data;
          
          // Check all possible field names for phone number but prioritize localStorage
          phoneNumber = phoneNumber || profileData.phone_number || profileData.phoneNumber || profileData.phone || '';
          console.log("Found phone number in profile API response or storage:", phoneNumber);
          
          setProfile({
            ...profileData,
            phone_number: phoneNumber
          });
          
          setIsOwnProfile(!username || (user && user.username === profileData.username));
          
          if (!username || (user && user.username === profileData.username)) {
            setFirstName(profileData.first_name || '');
            setLastName(profileData.last_name || '');
            setEmail(profileData.email || '');
            setPhoneNumber(phoneNumber);
            setBio(profileData.bio || '');
          }
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      toast({ 
        title: "Error", 
        description: "Failed to load user profile", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePicture(file);
      setProfilePicturePreview(URL.createObjectURL(file));
    }
  };

  const clearProfilePicture = () => {
    setProfilePicture(null);
    setProfilePicturePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      console.log("Saving profile with data:", {
        firstName, lastName, email, phoneNumber, bio
      });
      
      if (token) {
        const formData = new FormData();
        formData.append('first_name', firstName);
        formData.append('last_name', lastName);
        formData.append('email', email);
        formData.append('phone_number', phoneNumber);
        
        if (bio !== null) {
          formData.append('bio', bio);
        }
        
        if (profilePicture) {
          formData.append('profile_picture', profilePicture);
        }
        
        console.log("Sending update to API:", formData);
        
        // Try multiple endpoints to ensure update works
        let updatedProfile;
        try {
          const response = await axios.patch(
            `${API_URL}/user-profile/`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
              }
            }
          );
          console.log("Profile update response:", response.data);
          updatedProfile = response.data;
        } catch (error) {
          console.error("Error with first update endpoint, trying alternate:", error);
          
          // Try alternate endpoint
          const altResponse = await axios.patch(
            `${API_URL}/users/me/`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
              }
            }
          );
          console.log("Alternate profile update response:", altResponse.data);
          updatedProfile = altResponse.data;
        }
        
        // Update local profile state
        setProfile({
          ...profile!,
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone_number: phoneNumber,
          bio: bio,
          ...(profilePicture ? {} : {})
        });
        
        // Update auth context user
        if (setUser && user) {
          setUser({
            ...user,
            first_name: firstName,
            last_name: lastName,
            email: email,
            phone_number: phoneNumber,
            ...(profilePicture ? { profile_picture: updatedProfile.profile_picture } : {})
          });
        }
        
        // Reset profile picture upload state
        setProfilePicture(null);
        setProfilePicturePreview(null);
        
        toast({ 
          title: "Success", 
          description: "Your profile has been updated", 
          variant: "default" 
        });
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      toast({ 
        title: "Error", 
        description: "Failed to update profile", 
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleFollowUser = async () => {
    if (!profile) return;
    
    try {
      if (token) {
        if (profile.is_following) {
          await unfollowUser(token, profile.id);
        } else {
          await followUser(token, profile.id);
        }
        
        // Update profile with new following status
        setProfile({
          ...profile,
          is_following: !profile.is_following,
          followers_count: profile.is_following 
            ? profile.followers_count - 1 
            : profile.followers_count + 1
        });
        
        toast({ 
          title: "Success", 
          description: profile.is_following ? "Unfollowed user" : "Followed user", 
          variant: "default" 
        });
      }
    } catch (err) {
      console.error('Error following/unfollowing user:', err);
      toast({ 
        title: "Error", 
        description: "Failed to follow/unfollow user", 
        variant: "destructive" 
      });
    }
  };
  
  const handleChangePassword = async () => {
    // Reset error
    setPasswordError('');
    
    // Validate passwords
    if (!currentPassword) {
      setPasswordError('Current password is required');
      return;
    }
    
    if (!newPassword) {
      setPasswordError('New password is required');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    
    try {
      setChangingPassword(true);
      if (token) {
        await updatePassword(token, currentPassword, newPassword);
        
        // Clear password fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        toast({ 
          title: "Success", 
          description: "Your password has been updated", 
          variant: "default" 
        });
      }
    } catch (err) {
      console.error('Error changing password:', err);
      setPasswordError('Failed to update password. The current password may be incorrect.');
      toast({ 
        title: "Error", 
        description: "Failed to update password", 
        variant: "destructive" 
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const renderProfileSkeleton = () => (
    <div className="space-y-6">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-32 w-32 rounded-full bg-muted/30 animate-pulse"></div>
        <div className="h-8 w-48 bg-muted/30 animate-pulse rounded"></div>
        <div className="h-4 w-36 bg-muted/30 animate-pulse rounded"></div>
      </div>
      
      <div className="grid gap-6 mt-8">
        <div className="h-10 bg-muted/30 animate-pulse rounded"></div>
        <div className="h-10 bg-muted/30 animate-pulse rounded"></div>
        <div className="h-32 bg-muted/30 animate-pulse rounded"></div>
      </div>
    </div>
  );

  return (
    <div className="bg-finzo-black min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <Motion animation="fade-in" duration={0.6}>
          <div className="flex flex-col md:flex-row justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-gradient">
                {isOwnProfile ? 'Your Profile' : `${profile?.first_name} ${profile?.last_name}'s Profile`}
              </h1>
              <p className="text-muted-foreground max-w-xl">
                {isOwnProfile ? 'Manage your profile information and settings' : 'View profile information'}
              </p>
            </div>
            
            {!isOwnProfile && profile && (
              <Button 
                className={profile.is_following ? "bg-muted hover:bg-muted/80" : "bg-finzo-purple hover:bg-finzo-dark-purple"}
                onClick={handleFollowUser}
              >
                {profile.is_following ? (
                  <>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Follow
                  </>
                )}
              </Button>
            )}
          </div>
        </Motion>

        {loading ? (
          renderProfileSkeleton()
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Profile sidebar */}
            <div className="md:col-span-1">
              <Card className="glass-card">
                <CardContent className="p-6 flex flex-col items-center">
                  <div className="relative group">
                    <Avatar className="h-32 w-32 border-2 border-finzo-purple mb-4">
                      <AvatarImage 
                        src={(profilePicturePreview || (profile?.profile_picture ? (profile.profile_picture.startsWith('http') ? profile.profile_picture : `${MEDIA_URL}${profile.profile_picture}`) : null)) || "/placeholder.svg"} 
                        alt="Profile" 
                        onError={(e) => {
                          console.error('Failed to load profile picture');
                          (e.target as HTMLImageElement).src = "/placeholder.svg";
                        }}
                      />
                      <AvatarFallback className="text-2xl">
                        {profile?.first_name?.[0] || ''}
                        {profile?.last_name?.[0] || ''}
                      </AvatarFallback>
                    </Avatar>
                    
                    {isOwnProfile && (
                      <>
                        <Button 
                          size="icon" 
                          className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-finzo-purple hover:bg-finzo-dark-purple"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Camera className="h-4 w-4" />
                        </Button>
                        
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          className="hidden" 
                          accept="image/*" 
                          onChange={handleProfilePictureUpload}
                        />
                      </>
                    )}
                  </div>
                  
                  <h2 className="text-xl font-semibold mt-2">
                    {profile?.first_name} {profile?.last_name}
                  </h2>
                  <p className="text-muted-foreground text-sm">@{profile?.username}</p>
                  
                  {profile?.bio && (
                    <p className="text-sm mt-3 text-center">{profile.bio}</p>
                  )}
                  
                  <Separator className="my-6" />
                  
                  <div className="grid grid-cols-3 gap-2 w-full text-center">
                    <div className="flex flex-col">
                      <span className="text-xl font-bold">{profile?.posts_count || 0}</span>
                      <span className="text-xs text-muted-foreground">Posts</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xl font-bold">{profile?.followers_count || 0}</span>
                      <span className="text-xs text-muted-foreground">Followers</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xl font-bold">{profile?.following_count || 0}</span>
                      <span className="text-xs text-muted-foreground">Following</span>
                    </div>
                  </div>
                  
                  {/* Always display contact information regardless of profile ownership */}
                  {profile && (
                    <>
                      <Separator className="my-6" />
                      
                      <div className="w-full space-y-3">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {profile.email || user?.email || ""}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {profile.phone_number || ""}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <AtSign className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">@{profile.username}</span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Profile edit form or view-only info */}
            <div className="md:col-span-2">
              {isOwnProfile ? (
                <>
                  <Card className="glass-card mb-6">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Edit className="w-4 h-4 mr-2 text-finzo-purple" />
                        Edit Profile
                      </CardTitle>
                      <CardDescription>Update your personal information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input 
                            id="firstName" 
                            value={firstName} 
                            onChange={(e) => setFirstName(e.target.value)} 
                            placeholder="First Name"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input 
                            id="lastName" 
                            value={lastName} 
                            onChange={(e) => setLastName(e.target.value)} 
                            placeholder="Last Name"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input 
                            id="email" 
                            type="email"
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            placeholder="Email"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="phoneNumber">Phone Number</Label>
                          <Input 
                            id="phoneNumber" 
                            value={phoneNumber} 
                            onChange={(e) => setPhoneNumber(e.target.value)} 
                            placeholder="Phone Number"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea 
                          id="bio" 
                          value={bio} 
                          onChange={(e) => setBio(e.target.value)} 
                          placeholder="Tell us about yourself"
                          className="resize-none min-h-[100px]"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Profile Picture</Label>
                        
                        {profilePicturePreview && (
                          <div className="relative rounded-md overflow-hidden border border-muted mt-2">
                            <Button 
                              variant="destructive" 
                              size="icon" 
                              className="absolute top-2 right-2 h-6 w-6 bg-black/60"
                              onClick={clearProfilePicture}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                            <img 
                              src={profilePicturePreview} 
                              alt="Profile preview" 
                              className="max-w-full h-auto max-h-60 object-contain mx-auto"
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-end">
                        <Button 
                          className="bg-finzo-purple hover:bg-finzo-dark-purple"
                          onClick={handleSaveProfile}
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : 'Save Changes'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <KeyRound className="w-4 h-4 mr-2 text-finzo-purple" />
                        Change Password
                      </CardTitle>
                      <CardDescription>Update your account password</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {passwordError && (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-md p-3 text-sm text-red-500">
                          {passwordError}
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <div className="relative">
                          <Input 
                            id="currentPassword" 
                            type={showCurrentPassword ? "text" : "password"}
                            value={currentPassword} 
                            onChange={(e) => setCurrentPassword(e.target.value)} 
                            placeholder="Enter your current password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            {showCurrentPassword ? (
                              <EyeOffIcon className="h-4 w-4" />
                            ) : (
                              <EyeIcon className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <div className="relative">
                          <Input 
                            id="newPassword" 
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword} 
                            onChange={(e) => setNewPassword(e.target.value)} 
                            placeholder="Enter your new password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? (
                              <EyeOffIcon className="h-4 w-4" />
                            ) : (
                              <EyeIcon className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input 
                          id="confirmPassword" 
                          type="password"
                          value={confirmPassword} 
                          onChange={(e) => setConfirmPassword(e.target.value)} 
                          placeholder="Confirm your new password"
                        />
                      </div>
                      
                      <div className="flex justify-end">
                        <Button 
                          className="bg-finzo-purple hover:bg-finzo-dark-purple"
                          onClick={handleChangePassword}
                          disabled={changingPassword}
                        >
                          {changingPassword ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Updating...
                            </>
                          ) : 'Update Password'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="w-4 h-4 mr-2 text-finzo-purple" />
                      About {profile?.first_name}
                    </CardTitle>
                    <CardDescription>User information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {profile?.bio ? (
                      <div className="space-y-2">
                        <h3 className="font-medium">Bio</h3>
                        <p className="text-sm">{profile.bio}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">This user hasn't added a bio yet.</p>
                    )}
                    
                    <div className="p-4 bg-muted/10 rounded-md mt-4">
                      <h3 className="font-medium mb-3">Recent Activity</h3>
                      <p className="text-sm text-muted-foreground">
                        {profile?.username} has made {profile?.posts_count || 0} posts in the community.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default UserProfile; 