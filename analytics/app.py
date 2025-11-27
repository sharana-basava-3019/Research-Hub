"""
RESEARCH-HUB Analytics Service
Flask-based microservice for NLP and analytics
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import time
from services.recommendation_service import RecommendationService
from services.trend_service import TrendService
from services.keyword_service import KeywordService

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize services
recommendation_service = RecommendationService()
trend_service = TrendService()
keyword_service = KeywordService()

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'success',
        'message': 'Analytics service is running',
        'service': 'RESEARCH-HUB Analytics',
        'version': '1.0.0'
    }), 200


# Recommendations endpoint
@app.route('/recommendations', methods=['POST'])
def get_recommendations():
    """
    Get collaborator recommendations based on user's research interests
    
    Request Body:
    {
        "userId": "string",
        "researchInterests": ["interest1", "interest2"],
        "projects": [{"title": "...", "description": "...", "keywords": [...]}]
    }
    """
    try:
        start_time = time.time()
        
        data = request.get_json()
        user_id = data.get('userId')
        research_interests = data.get('researchInterests', [])
        projects = data.get('projects', [])
        
        if not user_id:
            return jsonify({
                'status': 'error',
                'message': 'userId is required'
            }), 400
        
        # Generate recommendations
        recommendations = recommendation_service.generate_recommendations(
            user_id=user_id,
            research_interests=research_interests,
            projects=projects
        )
        
        processing_time = (time.time() - start_time) * 1000  # Convert to ms
        
        return jsonify({
            'status': 'success',
            'recommendations': recommendations,
            'count': len(recommendations),
            'processingTime': round(processing_time, 2),
            'algorithm': 'TF-IDF + Cosine Similarity'
        }), 200
        
    except Exception as e:
        app.logger.error(f'Error generating recommendations: {str(e)}')
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


# Trends endpoint
@app.route('/trends', methods=['POST'])
def get_trends():
    """
    Analyze trending research topics
    
    Request Body:
    {
        "projects": [{"keywords": [...], "researchArea": "..."}]
    }
    """
    try:
        start_time = time.time()
        
        data = request.get_json()
        projects = data.get('projects', [])
        
        if not projects:
            return jsonify({
                'status': 'error',
                'message': 'Projects data is required'
            }), 400
        
        # Analyze trends
        trends = trend_service.analyze_trends(projects)
        
        processing_time = (time.time() - start_time) * 1000
        
        return jsonify({
            'status': 'success',
            'trends': trends,
            'processingTime': round(processing_time, 2),
            'algorithm': 'Frequency Analysis + TF-IDF'
        }), 200
        
    except Exception as e:
        app.logger.error(f'Error analyzing trends: {str(e)}')
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


# Keywords endpoint
@app.route('/keywords', methods=['POST'])
def extract_keywords():
    """
    Extract keywords from project text
    
    Request Body:
    {
        "text": "project description text",
        "projectId": "string"
    }
    """
    try:
        start_time = time.time()
        
        data = request.get_json()
        text = data.get('text', '')
        project_id = data.get('projectId')
        
        if not text:
            return jsonify({
                'status': 'error',
                'message': 'Text is required'
            }), 400
        
        # Extract keywords
        keywords = keyword_service.extract_keywords(text)
        
        processing_time = (time.time() - start_time) * 1000
        
        return jsonify({
            'status': 'success',
            'keywords': keywords,
            'count': len(keywords),
            'processingTime': round(processing_time, 2),
            'algorithm': 'TF-IDF + Noun Phrase Extraction'
        }), 200
        
    except Exception as e:
        app.logger.error(f'Error extracting keywords: {str(e)}')
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


# Similarity endpoint
@app.route('/similarity', methods=['POST'])
def calculate_similarity():
    """
    Calculate similarity between two texts
    
    Request Body:
    {
        "text1": "first text",
        "text2": "second text"
    }
    """
    try:
        data = request.get_json()
        text1 = data.get('text1', '')
        text2 = data.get('text2', '')
        
        if not text1 or not text2:
            return jsonify({
                'status': 'error',
                'message': 'Both text1 and text2 are required'
            }), 400
        
        # Calculate similarity
        similarity_score = keyword_service.calculate_similarity(text1, text2)
        
        return jsonify({
            'status': 'success',
            'similarity': round(similarity_score, 4),
            'percentage': round(similarity_score * 100, 2)
        }), 200
        
    except Exception as e:
        app.logger.error(f'Error calculating similarity: {str(e)}')
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'status': 'error',
        'message': 'Endpoint not found'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'status': 'error',
        'message': 'Internal server error'
    }), 500


# Root endpoint
@app.route('/', methods=['GET'])
def index():
    return jsonify({
        'service': 'RESEARCH-HUB Analytics API',
        'version': '1.0.0',
        'status': 'running',
        'endpoints': {
            '/health': 'Health check',
            '/recommendations': 'Get collaborator recommendations (POST)',
            '/trends': 'Analyze research trends (POST)',
            '/keywords': 'Extract keywords from text (POST)',
            '/similarity': 'Calculate text similarity (POST)'
        }
    }), 200


# Run the app
if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    print('\n' + '='*60)
    print('🐍 RESEARCH-HUB Analytics Service Starting...')
    print('='*60)
    print(f'📡 Port: {port}')
    print(f'🔧 Debug Mode: {debug}')
    print(f'🌐 Endpoints: http://localhost:{port}')
    print('='*60 + '\n')
    
    app.run(host='0.0.0.0', port=port, debug=debug)
