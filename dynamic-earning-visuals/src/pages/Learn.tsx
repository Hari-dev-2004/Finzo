import React, { useState, useEffect } from 'react';
import { Motion } from '@/components/ui/motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, BookOpen, Award, ArrowRight } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface Course {
  id: number;
  course_id: string;
  title: string;
  description: string;
  total_sections: number;
  estimated_duration: string;
  author: string;
  last_updated: string;
}

interface Enrollment {
  id: number;
  course: {
    id: number;
    course_id: string;
    title: string;
    description: string;
    total_sections: number;
    estimated_duration: string;
  };
  enrollment_date: string;
  last_accessed: string;
  is_completed: boolean;
  progress: {
    current_section: number;
    completed_sections: number[];
    overall_progress: number;
  };
}

const Learn = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          // Don't manually redirect to login since ProtectedRoute handles this
          setError('No authentication token found');
          setLoading(false);
          return;
        }

        const [coursesResponse, enrollmentsResponse] = await Promise.all([
          axios.get(`${API_URL}/courses/`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_URL}/enrollments/`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setCourses(coursesResponse.data);
        setEnrollments(enrollmentsResponse.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching courses:', err);
        
        // Check if error is due to authentication
        if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
          // Don't manually redirect to login since ProtectedRoute handles this
          setError('Authentication error. Please try logging in again.');
          setLoading(false);
          return;
        }
        
        // For other errors, just show error message but don't redirect
        setError('Failed to load courses. Please try again later.');
        setLoading(false);
        
        // Set empty arrays so UI can still render
        setCourses([]);
        setEnrollments([]);
      }
    };

    fetchCourses();
  }, []);

  const enrollInCourse = async (courseId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        // Don't manually redirect to login since ProtectedRoute handles this
        setError('No authentication token found');
        return;
      }

      await axios.post(
        `${API_URL}/courses/${courseId}/enroll/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh enrollments
      const enrollmentsResponse = await axios.get(`${API_URL}/enrollments/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEnrollments(enrollmentsResponse.data);
    } catch (err) {
      console.error('Error enrolling in course:', err);
      
      // Check if error is due to authentication
      if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
        // Don't manually redirect to login since ProtectedRoute handles this
        setError('Authentication error. Please try logging in again.');
        return;
      }
      
      setError('Failed to enroll in course. Please try again later.');
    }
  };

  const goToCourse = (courseId: string) => {
    navigate(`/learn/${courseId}`);
  };

  const isEnrolled = (courseId: string) => {
    return enrollments.some(enrollment => enrollment.course.course_id === courseId);
  };

  if (loading) {
    return (
      <div className="bg-finzo-black min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-20 max-w-7xl">
          <p className="text-center text-xl">Loading courses...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-finzo-black min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-20 max-w-7xl">
          <p className="text-center text-xl text-red-500">{error}</p>
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
          <h1 className="text-4xl font-bold mb-8 text-gradient">Learning Center</h1>
          <p className="text-lg text-muted-foreground mb-8">Enhance your financial knowledge and skills with our comprehensive learning resources.</p>
        </Motion>

        <Tabs defaultValue="modules" className="mb-10">
          <TabsList className="bg-muted/20 mb-6">
            <TabsTrigger value="modules">Learning Modules</TabsTrigger>
            <TabsTrigger value="my-courses">My Enrollments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="modules" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Card key={course.id} className="bg-card/30 border-0 hover:bg-card/40 transition-all">
                  <CardHeader>
                    <CardTitle>{course.title}</CardTitle>
                    <CardDescription>{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Clock size={16} />
                      <span>{course.estimated_duration}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <BookOpen size={16} />
                      <span>{course.total_sections} sections</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Award size={16} />
                      <span>By {course.author}</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    {isEnrolled(course.course_id) ? (
                      <Button 
                        className="w-full" 
                        onClick={() => goToCourse(course.course_id)}
                      >
                        Continue Learning <ArrowRight className="ml-2" size={16} />
                      </Button>
                    ) : (
                      <Button 
                        className="w-full" 
                        variant="outline" 
                        onClick={() => enrollInCourse(course.course_id)}
                      >
                        Enroll Now
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="my-courses" className="space-y-8">
            {enrollments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">You're not enrolled in any courses yet. Explore our learning modules to get started!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {enrollments.map((enrollment) => (
                  <Card key={enrollment.id} className="bg-card/30 border-0 hover:bg-card/40 transition-all">
                    <CardHeader>
                      <CardTitle>{enrollment.course.title}</CardTitle>
                      <CardDescription>{enrollment.course.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-muted-foreground mb-2">
                          <span>Progress</span>
                          <span>{enrollment.progress.overall_progress}%</span>
                        </div>
                        <Progress value={enrollment.progress.overall_progress} className="h-2" />
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Clock size={16} />
                        <span>{enrollment.course.estimated_duration}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <BookOpen size={16} />
                        <span>
                          Section {enrollment.progress.current_section} of {enrollment.course.total_sections}
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full" 
                        onClick={() => goToCourse(enrollment.course.course_id)}
                        variant={enrollment.is_completed ? "outline" : "default"}
                      >
                        {enrollment.is_completed ? "Review Course" : "Continue Learning"} 
                        <ArrowRight className="ml-2" size={16} />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <Footer />
    </div>
  );
};

export default Learn;
