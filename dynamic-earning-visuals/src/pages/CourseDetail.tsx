import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Motion } from '@/components/ui/motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Clock, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import ReactMarkdown from 'react-markdown';
import DOMPurify from 'dompurify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface CourseContent {
  courseId?: string;
  id?: string;
  title: string;
  description: string;
  totalSections?: number;
  estimatedDuration?: string;
  author?: string;
  lastUpdated?: string;
  sections: Section[];
  userProgress?: {
    currentSection: number;
    completedSections: number[];
    quizScores: Record<string, number>;
    overallProgress: number;
  };
}

interface Section {
  sectionId?: number;
  id?: string;
  sectionTitle: string;
  title?: string;
  progressPercentage?: number;
  progress?: number;
  content: ContentItem[];
  quiz: Quiz;
}

interface ContentItem {
  title: string;
  body: string;
  type?: string;
  data?: string;
}

interface Quiz {
  quizId?: string;
  id?: string;
  quizTitle: string;
  title?: string;
  passingScore: number;
  questions: Question[];
}

interface Question {
  questionId?: string;
  id?: string;
  questionText?: string;
  question?: string;
  options: string[];
  correctAnswer: string | number;
  explanation?: string;
}

const CourseDetail = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<CourseContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentSection, setCurrentSection] = useState(1);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<{
    score: number;
    passed: boolean;
    correctAnswers: number;
    totalQuestions: number;
  } | null>(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          // Don't manually redirect to login since ProtectedRoute handles this
          setError('No authentication token found');
          setLoading(false);
          return;
        }

        const response = await axios.get(`${API_URL}/courses/${courseId}/`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.data) {
          setError('No course data received from server');
          setLoading(false);
          return;
        }

        const normalizedCourse = normalizeData(response.data);
        setCourse(normalizedCourse);
        
        // Set current section from userProgress if available
        if (response.data.user_progress) {
          setCurrentSection(response.data.user_progress.current_section);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching course details:', err);
        
        // Check if error is due to authentication
        if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
          // Don't manually redirect to login since ProtectedRoute handles this
          setError('Authentication error. Please try logging in again.');
          setLoading(false);
          return;
        }
        
        setError('Failed to load course details. Please try again later.');
        setLoading(false);
      }
    };

    // Reset state when courseId changes
    setLoading(true);
    setError('');
    setCourse(null);
    
    fetchCourseDetails();
  }, [courseId]);

  // Normalize different JSON structures into a consistent format
  const normalizeData = (data: any): CourseContent => {
    // Handle case where data is null or undefined
    if (!data) {
      return {
        title: 'Unknown Course',
        description: 'Course data could not be loaded',
        sections: [],
      };
    }
    
    // Handle basic stock market structure
    if (data.sections && Array.isArray(data.sections)) {
      return {
        ...data,
        userProgress: data.user_progress
      };
    }
    
    // Handle structure with content property
    if (data.content && data.content.sections) {
      return {
        title: data.title || data.content.courseTitle || 'Unknown Course',
        description: data.description || data.content.courseDescription || '',
        totalSections: data.total_sections || data.content.totalSections,
        estimatedDuration: data.estimated_duration || data.content.estimatedDuration,
        author: data.author,
        lastUpdated: data.last_updated,
        sections: data.content.sections || [],
        userProgress: data.user_progress
      };
    }
    
    // Handle risk management structure
    if (data.course && data.course.sections && Array.isArray(data.course.sections)) {
      return {
        title: data.course.title || 'Unknown Course',
        description: data.course.description || '',
        sections: data.course.sections.map((section: any) => ({
          sectionId: parseInt(section.id.replace('section', '')),
          sectionTitle: section.title || 'Unknown Section',
          progressPercentage: section.progress || 0,
          content: Array.isArray(section.content) 
            ? section.content.map((item: any) => ({
                title: item.title || '',
                body: item.data || item.body || ''
              }))
            : [],
          quiz: section.quiz || {
            quizTitle: 'Quiz',
            passingScore: 4,
            questions: []
          }
        })),
        userProgress: data.user_progress
      };
    }
    
    // If we get here, we don't have a recognized format, so return a fallback structure
    console.error('Unrecognized course data format:', data);
    return {
      title: data.title || 'Unknown Course',
      description: data.description || '',
      sections: Array.isArray(data.sections) ? data.sections : [],
      userProgress: data.user_progress
    };
  };

  const handleQuizSubmit = async () => {
    if (!course) return;
    
    setSubmittingQuiz(true);
    
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        // Don't manually redirect to login since ProtectedRoute handles this
        setError('No authentication token found');
        setSubmittingQuiz(false);
        return;
      }

      const response = await axios.post(
        `${API_URL}/courses/${courseId}/quiz/`,
        {
          section_id: currentSection,
          answers: quizAnswers
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setQuizResult({
        score: response.data.score,
        passed: response.data.passed,
        correctAnswers: response.data.correct_answers,
        totalQuestions: response.data.total_questions
      });
      
      // If passed, update current section and progress
      if (response.data.passed) {
        // Refresh course data to get updated progress
        const courseResponse = await axios.get(`${API_URL}/courses/${courseId}/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setCourse(normalizeData(courseResponse.data));
        setCurrentSection(response.data.current_section);
      }
    } catch (err) {
      console.error('Error submitting quiz:', err);
      
      // Check if error is due to authentication
      if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
        // Don't manually redirect to login since ProtectedRoute handles this
        setError('Authentication error. Please try logging in again.');
        return;
      }
      
      setError('Failed to submit quiz. Please try again later.');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const startQuiz = () => {
    setQuizAnswers({});
    setQuizResult(null);
    setShowQuiz(true);
  };

  const goToNextSection = () => {
    if (!course) return;
    
    const nextSection = currentSection + 1;
    if (nextSection <= course.sections.length) {
      setCurrentSection(nextSection);
      setShowQuiz(false);
      setQuizResult(null);
      window.scrollTo(0, 0);
    }
  };

  const goToPreviousSection = () => {
    if (currentSection > 1) {
      setCurrentSection(currentSection - 1);
      setShowQuiz(false);
      setQuizResult(null);
      window.scrollTo(0, 0);
    }
  };

  const resetQuiz = () => {
    setQuizAnswers({});
    setQuizResult(null);
  };

  if (loading) {
    return (
      <div className="bg-finzo-black min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-20 max-w-7xl">
          <p className="text-center text-xl">Loading course content...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="bg-finzo-black min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-20 max-w-7xl">
          <p className="text-center text-xl text-red-500">{error || 'Course not found'}</p>
          <div className="flex justify-center mt-8">
            <Button onClick={() => navigate('/learn')}>Back to Learning Center</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Ensure course.sections exists before trying to find a section
  if (!course.sections || !Array.isArray(course.sections)) {
    return (
      <div className="bg-finzo-black min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-20 max-w-7xl">
          <p className="text-center text-xl text-red-500">Invalid course data: sections not found</p>
          <div className="flex justify-center mt-8">
            <Button onClick={() => navigate('/learn')}>Back to Learning Center</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Try multiple ways to find the current section
  const currentSectionData = course.sections.find(s => {
    // Try matching by sectionId or id property
    if (s.sectionId === currentSection) return true;
    if (s.id === `section${currentSection}`) return true;
    
    // Convert string or numeric id
    const sectionIdNum = parseInt(String(s.sectionId || s.id || '').replace(/\D/g, ''));
    return sectionIdNum === currentSection;
  });

  if (!currentSectionData) {
    return (
      <div className="bg-finzo-black min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-20 max-w-7xl">
          <p className="text-center text-xl text-red-500">Section not found</p>
          <div className="flex justify-center mt-8">
            <Button onClick={() => navigate('/learn')}>Back to Learning Center</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const isQuizCompleted = course.userProgress?.quizScores && 
    (course.userProgress.quizScores[currentSection.toString()] !== undefined);

  const isLastSection = currentSection === course.sections.length;
  
  // Check if section is completed or locked
  const isSectionCompleted = course.userProgress?.completedSections?.includes(currentSection);
  const isNextSectionLocked = !course.userProgress?.completedSections?.includes(currentSection) && 
    !course.userProgress?.completedSections?.includes(currentSection - 1) && 
    currentSection !== 1;

  return (
    <div className="bg-finzo-black min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 py-10 max-w-7xl">
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => navigate('/learn')}
            className="mb-4"
          >
            <ChevronLeft className="mr-2" size={16} />
            Back to Learning Center
          </Button>
          
          <Motion animation="fade-in" duration={0.6}>
            <h1 className="text-3xl font-bold mb-4 text-gradient">{course.title}</h1>
            <p className="text-lg text-muted-foreground mb-6">{course.description}</p>
            
            <div className="flex flex-wrap gap-4 mb-6">
              {course.estimatedDuration && (
                <div className="flex items-center gap-2">
                  <Clock size={18} />
                  <span>{course.estimatedDuration}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <BookOpen size={18} />
                <span>{course.sections.length} sections</span>
              </div>
            </div>
            
            <div className="mb-8">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Overall Progress</span>
                <span>{course.userProgress?.overallProgress || 0}%</span>
              </div>
              <Progress value={course.userProgress?.overallProgress || 0} className="h-2" />
            </div>
          </Motion>
          
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">
              Section {currentSection}: {currentSectionData.sectionTitle || currentSectionData.title}
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={goToPreviousSection}
                disabled={currentSection === 1}
              >
                <ChevronLeft size={16} />
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={goToNextSection}
                disabled={currentSection === course.sections.length || !isSectionCompleted}
              >
                Next
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Section content or quiz */}
        {showQuiz ? (
          <div className="bg-card/20 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4">
              {currentSectionData.quiz.quizTitle || currentSectionData.quiz.title}
            </h3>
            
            {quizResult ? (
              <div className="space-y-6">
                <Alert variant={quizResult.passed ? "default" : "destructive"}>
                  {quizResult.passed ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                  <AlertTitle>
                    {quizResult.passed 
                      ? "Congratulations! You passed the quiz." 
                      : "You didn't pass the quiz yet."}
                  </AlertTitle>
                  <AlertDescription>
                    You got {quizResult.correctAnswers} out of {quizResult.totalQuestions} questions correct ({quizResult.score.toFixed(1)}%).
                    {!quizResult.passed && ` You need to get at least ${currentSectionData.quiz.passingScore} correct to pass.`}
                  </AlertDescription>
                </Alert>
                
                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={resetQuiz}
                  >
                    Try Again
                  </Button>
                  
                  {quizResult.passed && !isLastSection && (
                    <Button onClick={goToNextSection}>
                      Next Section
                      <ChevronRight className="ml-2" size={16} />
                    </Button>
                  )}
                  
                  {quizResult.passed && isLastSection && (
                    <Button onClick={() => navigate('/learn')}>
                      Complete Course
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {currentSectionData.quiz.questions.map((question, index) => {
                  const questionId = question.questionId || question.id || `q${index}`;
                  return (
                    <div key={questionId} className="border border-border p-4 rounded-md">
                      <h4 className="text-lg font-medium mb-4">
                        {index + 1}. {question.questionText || question.question}
                      </h4>
                      
                      <RadioGroup
                        value={quizAnswers[questionId]}
                        onValueChange={(value) => handleAnswerChange(questionId, value)}
                      >
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-start space-x-2 py-2">
                            <RadioGroupItem id={`${questionId}-${optIndex}`} value={option} />
                            <Label 
                              htmlFor={`${questionId}-${optIndex}`} 
                              className="cursor-pointer font-normal"
                            >
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  );
                })}
                
                <Button 
                  className="w-full" 
                  onClick={handleQuizSubmit}
                  disabled={
                    submittingQuiz || 
                    Object.keys(quizAnswers).length < currentSectionData.quiz.questions.length
                  }
                >
                  {submittingQuiz ? 'Submitting...' : 'Submit Answers'}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8 mb-8">
            {currentSectionData.content.map((item, index) => (
              <Card key={index} className="bg-card/20 border-0">
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-invert max-w-none">
                  {item.type === 'text' || item.type === 'example' ? (
                    <ReactMarkdown>{DOMPurify.sanitize(item.data || item.body)}</ReactMarkdown>
                  ) : (
                    <div className="whitespace-pre-line">
                      {item.body.split('\n').map((paragraph, idx) => (
                        <p key={idx} className="mb-4">{DOMPurify.sanitize(paragraph)}</p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            
            <div className="flex justify-center mt-8">
              {isQuizCompleted ? (
                <div className="text-center">
                  <Alert className="mb-4">
                    <CheckCircle2 className="h-5 w-5" />
                    <AlertTitle>Quiz Completed</AlertTitle>
                    <AlertDescription>
                      You've already completed this section's quiz with a score of {
                        course.userProgress?.quizScores[currentSection.toString()].toFixed(1)
                      }%.
                    </AlertDescription>
                  </Alert>
                  <Button 
                    onClick={startQuiz}
                    variant="outline"
                  >
                    Retake Quiz
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={startQuiz}
                  size="lg"
                >
                  Take Quiz to Continue
                </Button>
              )}
            </div>
          </div>
        )}
        
        {/* Section navigation */}
        <div className="mt-12 mb-8">
          <h3 className="text-xl font-semibold mb-4">Course Sections</h3>
          <div className="space-y-2">
            {course.sections.map((section, index) => {
              const sectionNumber = section.sectionId || index + 1;
              const isCompleted = course.userProgress?.completedSections?.includes(sectionNumber);
              const isCurrent = sectionNumber === currentSection;
              const isLocked = sectionNumber > 1 && 
                !course.userProgress?.completedSections?.includes(sectionNumber - 1) && 
                !course.userProgress?.completedSections?.includes(sectionNumber);
              
              return (
                <div 
                  key={sectionNumber}
                  className={`
                    p-4 rounded-md border border-border flex justify-between items-center
                    ${isCurrent ? 'bg-primary/20' : ''}
                    ${isLocked ? 'opacity-50' : 'cursor-pointer hover:bg-card/30'}
                  `}
                  onClick={() => !isLocked && setCurrentSection(sectionNumber)}
                >
                  <div className="flex items-center gap-3">
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <div className={`w-5 h-5 rounded-full border ${isCurrent ? 'bg-primary border-primary' : 'border-muted-foreground'}`} />
                    )}
                    <span>
                      Section {sectionNumber}: {section.sectionTitle || section.title}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default CourseDetail; 