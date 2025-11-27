"""
Trend Analysis Service
Analyzes research trends from project data
"""

from collections import Counter
import re

class TrendService:
    def __init__(self):
        """Initialize trend service"""
        pass
    
    def analyze_trends(self, projects):
        """
        Analyze trending topics from projects
        
        Args:
            projects: List of projects with keywords and research areas
            
        Returns:
            Dictionary containing trending keywords and research areas
        """
        try:
            if not projects:
                return {
                    'trendingKeywords': [],
                    'trendingAreas': [],
                    'totalProjects': 0
                }
            
            # Extract all keywords
            all_keywords = []
            all_areas = []
            all_tags = []
            
            for project in projects:
                # Collect keywords
                if 'keywords' in project and project['keywords']:
                    all_keywords.extend([kw.lower().strip() for kw in project['keywords']])
                
                # Collect research areas
                if 'researchArea' in project and project['researchArea']:
                    all_areas.append(project['researchArea'].strip())
                
                # Collect tags
                if 'tags' in project and project['tags']:
                    all_tags.extend([tag.lower().strip() for tag in project['tags']])
            
            # Count frequencies
            keyword_counts = Counter(all_keywords)
            area_counts = Counter(all_areas)
            tag_counts = Counter(all_tags)
            
            # Get top trending items
            trending_keywords = [
                {
                    'keyword': keyword,
                    'count': count,
                    'percentage': round((count / len(projects)) * 100, 2)
                }
                for keyword, count in keyword_counts.most_common(20)
            ]
            
            trending_areas = [
                {
                    'area': area,
                    'count': count,
                    'percentage': round((count / len(projects)) * 100, 2)
                }
                for area, count in area_counts.most_common(10)
            ]
            
            trending_tags = [
                {
                    'tag': tag,
                    'count': count,
                    'percentage': round((count / len(projects)) * 100, 2)
                }
                for tag, count in tag_counts.most_common(15)
            ]
            
            # Calculate trend momentum (simple growth indicator)
            trending_keywords_with_momentum = self._add_momentum(trending_keywords)
            
            return {
                'trendingKeywords': trending_keywords_with_momentum,
                'trendingAreas': trending_areas,
                'trendingTags': trending_tags,
                'totalProjects': len(projects),
                'uniqueKeywords': len(keyword_counts),
                'uniqueAreas': len(area_counts),
                'summary': self._generate_summary(trending_keywords, trending_areas)
            }
            
        except Exception as e:
            print(f"Error analyzing trends: {str(e)}")
            return {
                'trendingKeywords': [],
                'trendingAreas': [],
                'totalProjects': 0,
                'error': str(e)
            }
    
    def _add_momentum(self, trending_items):
        """Add momentum indicators to trending items"""
        if not trending_items:
            return []
        
        # Simple momentum: higher count = higher momentum
        max_count = trending_items[0]['count'] if trending_items else 1
        
        for item in trending_items:
            momentum_score = (item['count'] / max_count) * 100
            
            if momentum_score >= 80:
                item['momentum'] = 'rising-fast'
                item['icon'] = '🚀'
            elif momentum_score >= 50:
                item['momentum'] = 'rising'
                item['icon'] = '📈'
            elif momentum_score >= 30:
                item['momentum'] = 'steady'
                item['icon'] = '➡️'
            else:
                item['momentum'] = 'emerging'
                item['icon'] = '🌱'
        
        return trending_items
    
    def _generate_summary(self, keywords, areas):
        """Generate human-readable summary"""
        summary_parts = []
        
        if keywords:
            top_keyword = keywords[0]['keyword']
            summary_parts.append(f"Most trending keyword: '{top_keyword}'")
        
        if areas:
            top_area = areas[0]['area']
            summary_parts.append(f"Most active research area: '{top_area}'")
        
        if len(keywords) >= 3:
            emerging = [kw['keyword'] for kw in keywords[-3:]]
            summary_parts.append(f"Emerging topics: {', '.join(emerging)}")
        
        return ' | '.join(summary_parts) if summary_parts else 'No trends available'
    
    def get_keyword_associations(self, projects, target_keyword):
        """
        Find keywords that frequently appear with a target keyword
        
        Args:
            projects: List of projects
            target_keyword: The keyword to find associations for
            
        Returns:
            List of associated keywords with co-occurrence counts
        """
        target_keyword = target_keyword.lower().strip()
        associated_keywords = Counter()
        
        for project in projects:
            keywords = [kw.lower().strip() for kw in project.get('keywords', [])]
            
            if target_keyword in keywords:
                for keyword in keywords:
                    if keyword != target_keyword:
                        associated_keywords[keyword] += 1
        
        return [
            {
                'keyword': keyword,
                'coOccurrences': count,
                'strength': 'strong' if count >= 5 else 'moderate' if count >= 3 else 'weak'
            }
            for keyword, count in associated_keywords.most_common(10)
        ]
