"""
Keyword Extraction Service
Extracts keywords and calculates text similarity using TF-IDF and NLP
"""

import re
import nltk
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from collections import Counter

# Download required NLTK data (run once)
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords', quiet=True)

try:
    nltk.data.find('taggers/averaged_perceptron_tagger')
except LookupError:
    nltk.download('averaged_perceptron_tagger', quiet=True)

from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk import pos_tag

class KeywordService:
    def __init__(self):
        """Initialize keyword service"""
        self.stop_words = set(stopwords.words('english'))
        
        # Add domain-specific stop words
        self.stop_words.update([
            'research', 'project', 'study', 'paper', 'work', 
            'using', 'based', 'approach', 'method', 'system'
        ])
    
    def extract_keywords(self, text, max_keywords=15):
        """
        Extract keywords from text using TF-IDF and NLP techniques
        
        Args:
            text: Input text
            max_keywords: Maximum number of keywords to return
            
        Returns:
            List of keywords with scores
        """
        try:
            if not text or len(text.strip()) < 10:
                return []
            
            # Clean and preprocess text
            text = self._clean_text(text)
            
            # Method 1: TF-IDF based extraction
            tfidf_keywords = self._extract_tfidf_keywords(text, max_keywords)
            
            # Method 2: Noun phrase extraction
            noun_phrases = self._extract_noun_phrases(text)
            
            # Method 3: Word frequency (for validation)
            freq_keywords = self._extract_frequency_keywords(text, max_keywords)
            
            # Combine and rank keywords
            combined_keywords = self._combine_keywords(
                tfidf_keywords,
                noun_phrases,
                freq_keywords
            )
            
            # Return top keywords
            return combined_keywords[:max_keywords]
            
        except Exception as e:
            print(f"Error extracting keywords: {str(e)}")
            return []
    
    def _clean_text(self, text):
        """Clean and normalize text"""
        # Convert to lowercase
        text = text.lower()
        
        # Remove URLs
        text = re.sub(r'http\S+|www\S+', '', text)
        
        # Remove special characters but keep spaces and hyphens
        text = re.sub(r'[^a-zA-Z0-9\s\-]', ' ', text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    def _extract_tfidf_keywords(self, text, max_keywords):
        """Extract keywords using TF-IDF"""
        try:
            # Create TF-IDF vectorizer
            vectorizer = TfidfVectorizer(
                max_features=max_keywords * 2,
                stop_words='english',
                ngram_range=(1, 3),  # Unigrams to trigrams
                min_df=1
            )
            
            # Fit and transform
            tfidf_matrix = vectorizer.fit_transform([text])
            feature_names = vectorizer.get_feature_names_out()
            
            # Get scores
            scores = tfidf_matrix.toarray()[0]
            
            # Create keyword-score pairs
            keywords = [
                {
                    'keyword': feature_names[i],
                    'score': round(float(scores[i]), 4),
                    'method': 'tfidf'
                }
                for i in scores.argsort()[::-1]
                if scores[i] > 0
            ]
            
            return keywords[:max_keywords]
            
        except Exception as e:
            print(f"TF-IDF extraction error: {str(e)}")
            return []
    
    def _extract_noun_phrases(self, text):
        """Extract noun phrases using POS tagging"""
        try:
            # Tokenize
            tokens = word_tokenize(text)
            
            # POS tagging
            pos_tags = pos_tag(tokens)
            
            # Extract noun phrases (simplified pattern)
            noun_phrases = []
            current_phrase = []
            
            for word, tag in pos_tags:
                # Check if word is noun or adjective
                if tag.startswith('NN') or tag.startswith('JJ'):
                    current_phrase.append(word)
                else:
                    if len(current_phrase) > 0:
                        phrase = ' '.join(current_phrase)
                        if phrase not in self.stop_words and len(phrase) > 2:
                            noun_phrases.append(phrase)
                        current_phrase = []
            
            # Add last phrase if exists
            if current_phrase:
                phrase = ' '.join(current_phrase)
                if phrase not in self.stop_words:
                    noun_phrases.append(phrase)
            
            # Count phrase frequencies
            phrase_counts = Counter(noun_phrases)
            
            # Return as keyword objects
            keywords = [
                {
                    'keyword': phrase,
                    'score': count / len(noun_phrases) if noun_phrases else 0,
                    'method': 'noun_phrase'
                }
                for phrase, count in phrase_counts.most_common(10)
            ]
            
            return keywords
            
        except Exception as e:
            print(f"Noun phrase extraction error: {str(e)}")
            return []
    
    def _extract_frequency_keywords(self, text, max_keywords):
        """Extract keywords using word frequency"""
        try:
            # Tokenize
            words = word_tokenize(text)
            
            # Filter words
            filtered_words = [
                word for word in words
                if word.lower() not in self.stop_words
                and len(word) > 2
                and word.isalpha()
            ]
            
            # Count frequencies
            word_counts = Counter(filtered_words)
            total_words = len(filtered_words)
            
            # Create keyword objects
            keywords = [
                {
                    'keyword': word.lower(),
                    'score': count / total_words,
                    'method': 'frequency'
                }
                for word, count in word_counts.most_common(max_keywords)
            ]
            
            return keywords
            
        except Exception as e:
            print(f"Frequency extraction error: {str(e)}")
            return []
    
    def _combine_keywords(self, tfidf_kw, noun_kw, freq_kw):
        """Combine keywords from different methods"""
        # Create a dictionary to aggregate scores
        keyword_scores = {}
        
        # Weight different methods
        weights = {
            'tfidf': 0.5,
            'noun_phrase': 0.3,
            'frequency': 0.2
        }
        
        # Combine all keywords
        all_keywords = tfidf_kw + noun_kw + freq_kw
        
        for kw_obj in all_keywords:
            keyword = kw_obj['keyword']
            method = kw_obj['method']
            score = kw_obj['score'] * weights[method]
            
            if keyword in keyword_scores:
                keyword_scores[keyword]['aggregatedScore'] += score
                keyword_scores[keyword]['methods'].append(method)
            else:
                keyword_scores[keyword] = {
                    'keyword': keyword,
                    'aggregatedScore': score,
                    'methods': [method]
                }
        
        # Sort by aggregated score
        combined = sorted(
            keyword_scores.values(),
            key=lambda x: x['aggregatedScore'],
            reverse=True
        )
        
        # Format output
        result = [
            {
                'keyword': kw['keyword'],
                'score': round(kw['aggregatedScore'], 4),
                'confidence': 'high' if len(kw['methods']) >= 2 else 'medium',
                'methods': kw['methods']
            }
            for kw in combined
        ]
        
        return result
    
    def calculate_similarity(self, text1, text2):
        """
        Calculate similarity between two texts using cosine similarity
        
        Args:
            text1: First text
            text2: Second text
            
        Returns:
            Similarity score (0-1)
        """
        try:
            # Clean texts
            text1 = self._clean_text(text1)
            text2 = self._clean_text(text2)
            
            if not text1 or not text2:
                return 0.0
            
            # Create TF-IDF vectors
            vectorizer = TfidfVectorizer(stop_words='english')
            tfidf_matrix = vectorizer.fit_transform([text1, text2])
            
            # Calculate cosine similarity
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            
            return float(similarity)
            
        except Exception as e:
            print(f"Similarity calculation error: {str(e)}")
            return 0.0
