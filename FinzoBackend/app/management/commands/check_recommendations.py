from django.core.management.base import BaseCommand
from app.models import UserRecommendation
import json

class Command(BaseCommand):
    help = "Check the content of UserRecommendation objects in the database"

    def handle(self, *args, **options):
        recommendations = UserRecommendation.objects.all()
        self.stdout.write(f"Found {recommendations.count()} UserRecommendation objects.")
        
        for rec in recommendations:
            self.stdout.write(f"\n{'-'*80}")
            self.stdout.write(f"User: {rec.user.email}")
            self.stdout.write(f"Type: {rec.recommendation_type}")
            self.stdout.write(f"Status: {rec.status}")
            self.stdout.write(f"Last updated: {rec.updated_at}")
            
            if rec.status == 'completed':
                if isinstance(rec.recommendations, list):
                    self.stdout.write(f"Contains {len(rec.recommendations)} recommendations")
                    
                    if rec.recommendations and len(rec.recommendations) > 0:
                        sample = rec.recommendations[0]
                        self.stdout.write(f"Sample recommendation keys: {list(sample.keys())}")
                        
                        if rec.recommendation_type == 'STOCKS' and 'symbol' in sample:
                            self.stdout.write(f"Stock sample: {sample['symbol']}")
                            self.stdout.write(f"Has technical_indicators: {'technical_indicators' in sample}")
                            self.stdout.write(f"Has fundamental_data: {'fundamental_data' in sample}")
                            self.stdout.write(f"Has reasons: {'reasons' in sample}")
                    else:
                        self.stdout.write("WARNING: Recommendations list is empty!")
                elif isinstance(rec.recommendations, dict):
                    self.stdout.write(f"Contains recommendation dictionary with keys: {list(rec.recommendations.keys())}")
                else:
                    self.stdout.write(f"Unexpected recommendations format: {type(rec.recommendations)}")
            else:
                self.stdout.write(f"Error message: {rec.error_message}") 