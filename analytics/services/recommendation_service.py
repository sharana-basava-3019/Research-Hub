"""
Recommendation Service
Generates collaborator recommendations using TF-IDF and cosine similarity
"""

import os
from pymongo import MongoClient
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class RecommendationService:
    def __init__(self):
        """Initialize MongoDB connection"""
        mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/research-hub')
        self.client = MongoClient(mongo_uri)
        self.db = self.client.get_database()
        self.users_collection = self.db['users']
        self.projects_collection = self.db['projects']
        
    def generate_recommendations(self, user_id, research_interests, projects):
        """
        Generate collaborator recommendations based on research interests and projects
        
        Args:
            user_id: Current user's ID
            research_interests: List of user's research interests
            projects: List of user's projects with descriptions
            
        Returns:
            List of recommended users with similarity scores
        """
        try:
            # Get all other users from database
            all_users = list(self.users_collection.find(
                {'_id': {'$ne': user_id}},
                {'firstName': 1, 'lastName': 1, 'institution': 1, 
                 'department': 1, 'researchInterests': 1, 'bio': 1, 
                 'profilePicture': 1, 'designation': 1}
            ))
            
            if not all_users:
                return []
            
            # Build text representation of current user
            current_user_text = self._build_user_text(research_interests, projects)
            
            # Build text representations for all users
            user_texts = []
            for user in all_users:
                user_text = ' '.join([
                    ' '.join(user.get('researchInterests', [])),
                    user.get('bio', ''),
                    user.get('department', '')
                ])
                user_texts.append(user_text)
            
            # Add current user text to the beginning
            all_texts = [current_user_text] + user_texts
            
            # Calculate TF-IDF vectors
            vectorizer = TfidfVectorizer(
                max_features=100,
                stop_words='english',
                ngram_range=(1, 2)
            )
            tfidf_matrix = vectorizer.fit_transform(all_texts)
            
            # Calculate cosine similarity
            similarity_scores = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
            
            # Combine users with their scores
            recommendations = []
            min_score = float(os.getenv('MIN_SIMILARITY_SCORE', 0.1))
            
            for idx, user in enumerate(all_users):
                score = similarity_scores[idx]
                
                if score >= min_score:
                    # Calculate matching interests
                    user_interests = user.get('researchInterests', [])
                    matching_interests = list(set(research_interests) & set(user_interests))
                    
                    recommendations.append({
                        'user': {
                            'id': str(user['_id']),
                            'firstName': user.get('firstName'),
                            'lastName': user.get('lastName'),
                            'institution': user.get('institution'),
                            'department': user.get('department'),
                            'designation': user.get('designation'),
                            'researchInterests': user_interests,
                            'profilePicture': user.get('profilePicture')
                        },
                        'matchScore': round(float(score), 4),
                        'matchPercentage': round(float(score) * 100, 2),
                        'matchingInterests': matching_interests,
                        'matchingInterestsCount': len(matching_interests)
                    })
            
            # Sort by score and limit results
            recommendations.sort(key=lambda x: x['matchScore'], reverse=True)
            max_results = int(os.getenv('MAX_RECOMMENDATIONS', 10))
            
            return recommendations[:max_results]
            
        except Exception as e:
            print(f"Error generating recommendations: {str(e)}")
            return []
    
    def _build_user_text(self, research_interests, projects):
        """Build text representation from user data"""
        text_parts = []
        
        # Add research interests (weighted more heavily)
        if research_interests:
            text_parts.append(' '.join(research_interests) * 3)
        
        # Add project information
        for project in projects:
            if 'title' in project:
                text_parts.append(project['title'])
            if 'description' in project:
                text_parts.append(project['description'])
            if 'keywords' in project:
                text_parts.append(' '.join(project['keywords']))
            if 'researchArea' in project:
                text_parts.append(project['researchArea'] * 2)
        
        return ' '.join(text_parts)
    
    def __del__(self):
        """Close MongoDB connection"""
        if hasattr(self, 'client'):
            self.client.close()
