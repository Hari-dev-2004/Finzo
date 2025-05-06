import os
import json
from datetime import datetime
from django.core.management.base import BaseCommand
from app.models import Course
from django.conf import settings

class Command(BaseCommand):
    help = 'Load courses from JSON files into the database'

    def handle(self, *args, **options):
        # Define courses to load
        courses = [
            {
                'course_id': 'BSM001',
                'file_name': 'basicofstockmarket.json',
                'content_type': 'stock_market'
            },
            {
                'course_id': 'BRM001',
                'file_name': 'baicofriskmanagement.json',
                'content_type': 'risk_management'
            },
            {
                'course_id': 'INV101',
                'file_name': 'basicofinvestment.json',
                'content_type': 'investment'
            }
        ]
        
        for course_info in courses:
            # Load course info from the JSON file
            file_path = os.path.join(settings.BASE_DIR, 'app', course_info['file_name'])
            
            try:
                with open(file_path, 'r') as file:
                    data = json.load(file)
                    
                    # Extract course data based on content type
                    if course_info['content_type'] == 'stock_market':
                        course_data = data
                        title = course_data.get('courseTitle', 'Basics of Stock Market')
                        description = course_data.get('courseDescription', '')
                        sections_count = len(course_data.get('sections', []))
                        estimated_duration = course_data.get('estimatedDuration', '2 hours')
                        author = course_data.get('author', 'Financial Education Team')
                        last_updated_str = course_data.get('lastUpdated', '2025-04-19')
                    elif course_info['content_type'] == 'risk_management':
                        if 'course' in data:
                            course_data = data['course']
                        else:
                            course_data = data
                        title = course_data.get('title', 'Basics of Risk Management')
                        description = course_data.get('description', '')
                        sections_count = len(course_data.get('sections', []))
                        estimated_duration = course_data.get('estimatedCompletionTime', 
                                                      course_data.get('estimatedDuration', '2 hours'))
                        author = course_data.get('author', 'Financial Education Team')
                        last_updated_str = '2025-04-19'  # Default as it may not be in the JSON
                    elif course_info['content_type'] == 'investment':
                        course_data = data
                        title = course_data.get('title', 'Basics of Investment')
                        description = course_data.get('description', '')
                        sections_count = course_data.get('totalSections', len(course_data.get('sections', [])))
                        estimated_duration = course_data.get('estimatedCompletionTime', '4 hours')
                        author = 'Financial Education Team'
                        last_updated_str = '2025-04-19'  # Default as it may not be in the JSON
                    
                    # Parse date string
                    try:
                        last_updated = datetime.strptime(last_updated_str, '%Y-%m-%d').date()
                    except ValueError:
                        last_updated = datetime.now().date()
                    
                    # Create or update course
                    course, created = Course.objects.update_or_create(
                        course_id=course_info['course_id'],
                        defaults={
                            'title': title,
                            'description': description,
                            'total_sections': sections_count,
                            'estimated_duration': estimated_duration,
                            'author': author,
                            'last_updated': last_updated,
                            'content_file': course_info['file_name']
                        }
                    )
                    
                    status = 'Created' if created else 'Updated'
                    self.stdout.write(self.style.SUCCESS(f'{status} course: {course.title}'))
                    
            except FileNotFoundError:
                self.stdout.write(self.style.ERROR(f'File not found: {file_path}'))
            except json.JSONDecodeError:
                self.stdout.write(self.style.ERROR(f'Invalid JSON format in file: {file_path}'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error processing file {file_path}: {str(e)}'))
        
        self.stdout.write(self.style.SUCCESS('Course loading completed!')) 