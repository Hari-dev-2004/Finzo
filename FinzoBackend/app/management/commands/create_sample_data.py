from django.core.management.base import BaseCommand
from app.models import Event
from datetime import datetime, timedelta

class Command(BaseCommand):
    help = "Create sample data for the application"
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Creating sample data..."))
        
        # Create sample events
        self.create_sample_events()
        
        self.stdout.write(self.style.SUCCESS("Sample data created successfully!"))
    
    def create_sample_events(self):
        """Create sample events for the community"""
        if Event.objects.count() > 0:
            self.stdout.write(self.style.WARNING("Events already exist, skipping..."))
            return
            
        events = [
            {
                "title": "Financial Freedom Webinar",
                "description": "Learn how to achieve financial freedom through smart investing and budgeting.",
                "date": datetime.now() + timedelta(days=14),
                "attendees": 145,
                "image": "https://images.unsplash.com/photo-1611095973763-414019e72400?q=80&w=1471&auto=format&fit=crop"
            },
            {
                "title": "Investing Masterclass",
                "description": "Advanced investing strategies for experienced investors.",
                "date": datetime.now() + timedelta(days=21),
                "attendees": 92,
                "image": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1415&auto=format&fit=crop"
            },
            {
                "title": "Crypto Fundamentals Workshop",
                "description": "Understanding blockchain technology and cryptocurrency investments.",
                "date": datetime.now() + timedelta(days=7),
                "attendees": 78,
                "image": "https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=1587&auto=format&fit=crop"
            },
            {
                "title": "Retirement Planning Seminar",
                "description": "Plan for a comfortable retirement with proven strategies.",
                "date": datetime.now() + timedelta(days=30),
                "attendees": 120,
                "image": "https://images.unsplash.com/photo-1559421238-cdddb39cbb43?q=80&w=1471&auto=format&fit=crop"
            }
        ]
        
        for event_data in events:
            Event.objects.create(**event_data)
            
        self.stdout.write(self.style.SUCCESS(f"Created {len(events)} sample events")) 