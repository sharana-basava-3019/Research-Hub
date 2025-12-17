/**
 * Plagiarism Checker Service
 * Uses TF-IDF and cosine similarity to detect text similarity between projects
 */

const natural = require('natural');
const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();

/**
 * Stop words to remove from text (common English words)
 */
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
  'to', 'was', 'will', 'with', 'this', 'but', 'they', 'have', 'had',
  'what', 'when', 'where', 'who', 'which', 'why', 'how'
]);

class PlagiarismChecker {
  /**
   * Clean and normalize text for comparison
   * @param {String} text - Raw text to clean
   * @returns {String} - Cleaned text
   */
  static cleanText(text) {
    if (!text) return '';
    
    // Convert to lowercase
    let cleaned = text.toLowerCase();
    
    // Remove special characters and punctuation, keep only alphanumeric and spaces
    cleaned = cleaned.replace(/[^a-z0-9\s]/g, ' ');
    
    // Tokenize
    const tokens = tokenizer.tokenize(cleaned);
    
    // Remove stop words and short words
    const filtered = tokens.filter(token => 
      token.length > 2 && !STOP_WORDS.has(token)
    );
    
    return filtered.join(' ');
  }

  /**
   * Extract text content from a project
   * @param {Object} project - Project document
   * @returns {String} - Combined text content
   */
  static extractProjectText(project) {
    const parts = [];
    
    if (project.title) parts.push(project.title);
    if (project.description) parts.push(project.description);
    if (project.abstract) parts.push(project.abstract);
    if (project.methodology) parts.push(project.methodology);
    
    // Include keywords if available
    if (project.keywords && Array.isArray(project.keywords)) {
      parts.push(project.keywords.join(' '));
    }
    
    return parts.join(' ');
  }

  /**
   * Calculate cosine similarity between two documents using TF-IDF
   * @param {String} text1 - First document text
   * @param {String} text2 - Second document text
   * @returns {Number} - Similarity score between 0 and 1
   */
  static calculateSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;
    
    // Clean texts
    const cleaned1 = this.cleanText(text1);
    const cleaned2 = this.cleanText(text2);
    
    if (!cleaned1 || !cleaned2) return 0;
    
    // Create TF-IDF instance
    const tfidf = new TfIdf();
    tfidf.addDocument(cleaned1);
    tfidf.addDocument(cleaned2);
    
    // Get TF-IDF vectors
    const terms1 = {};
    const terms2 = {};
    
    tfidf.listTerms(0).forEach(item => {
      terms1[item.term] = item.tfidf;
    });
    
    tfidf.listTerms(1).forEach(item => {
      terms2[item.term] = item.tfidf;
    });
    
    // Calculate cosine similarity
    return this.cosineSimilarity(terms1, terms2);
  }

  /**
   * Calculate cosine similarity between two TF-IDF vectors
   * @param {Object} vector1 - First TF-IDF vector
   * @param {Object} vector2 - Second TF-IDF vector
   * @returns {Number} - Cosine similarity (0-1)
   */
  static cosineSimilarity(vector1, vector2) {
    const allTerms = new Set([
      ...Object.keys(vector1),
      ...Object.keys(vector2)
    ]);
    
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;
    
    allTerms.forEach(term => {
      const v1 = vector1[term] || 0;
      const v2 = vector2[term] || 0;
      
      dotProduct += v1 * v2;
      magnitude1 += v1 * v1;
      magnitude2 += v2 * v2;
    });
    
    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);
    
    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    
    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Check a project for plagiarism against all existing projects
   * @param {Object} newProject - The project to check
   * @param {Array} existingProjects - Array of existing projects to compare against
   * @returns {Object} - {plagiarismDetected: Boolean, highestScore: Number, matchedProjectId: String}
   */
  static async checkPlagiarism(newProject, existingProjects, threshold = 0.75) {
    try {
      // Extract text from the new project
      const newProjectText = this.extractProjectText(newProject);
      
      if (!newProjectText || newProjectText.trim().length < 50) {
        return {
          plagiarismDetected: false,
          highestScore: 0,
          matchedProjectId: null,
          message: 'Insufficient text for plagiarism check'
        };
      }
      
      let highestScore = 0;
      let matchedProjectId = null;
      
      // Compare with each existing project
      for (const existingProject of existingProjects) {
        // Skip comparing with itself
        if (existingProject._id.toString() === newProject._id?.toString()) {
          continue;
        }
        
        const existingProjectText = this.extractProjectText(existingProject);
        
        if (!existingProjectText || existingProjectText.trim().length < 50) {
          continue;
        }
        
        // Calculate similarity
        const similarity = this.calculateSimilarity(newProjectText, existingProjectText);
        
        if (similarity > highestScore) {
          highestScore = similarity;
          matchedProjectId = existingProject._id;
        }
      }
      
      // Determine if plagiarism is detected
      const plagiarismDetected = highestScore >= threshold;
      
      return {
        plagiarismDetected,
        highestScore: Math.round(highestScore * 100) / 100, // Round to 2 decimal places
        matchedProjectId: plagiarismDetected ? matchedProjectId : null,
        message: plagiarismDetected 
          ? `High similarity detected (${Math.round(highestScore * 100)}%)`
          : 'No significant plagiarism detected'
      };
    } catch (error) {
      console.error('Error in plagiarism check:', error);
      return {
        plagiarismDetected: false,
        highestScore: 0,
        matchedProjectId: null,
        error: error.message
      };
    }
  }

  /**
   * Simple word overlap ratio calculation (alternative to TF-IDF)
   * @param {String} text1 - First text
   * @param {String} text2 - Second text
   * @returns {Number} - Overlap ratio (0-1)
   */
  static wordOverlapRatio(text1, text2) {
    const cleaned1 = this.cleanText(text1);
    const cleaned2 = this.cleanText(text2);
    
    const words1 = new Set(cleaned1.split(/\s+/));
    const words2 = new Set(cleaned2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Compare a document against a list of existing documents
   * @param {String} documentText - Text content of the document to check
   * @param {Array} existingDocuments - Array of documents with text content
   * @returns {Object} - Comparison results with similarity scores
   */
  static async compareDocument(documentText, existingDocuments) {
    try {
      if (!documentText || documentText.trim().length < 100) {
        return {
          status: 'insufficient_content',
          message: 'Document must contain at least 100 characters for analysis',
          similarityPercentage: 0,
          matches: []
        };
      }

      const matches = [];
      let highestSimilarity = 0;
      let mostSimilarDocument = null;

      // Compare with each existing document
      for (const existingDoc of existingDocuments) {
        const existingText = existingDoc.text || existingDoc.content || '';
        
        if (existingText.trim().length < 100) {
          continue; // Skip documents with insufficient content
        }

        // Calculate similarity using TF-IDF and cosine similarity
        const similarity = this.calculateSimilarity(documentText, existingText);
        const similarityPercentage = Math.round(similarity * 100);

        // Store matches above 10% threshold
        if (similarityPercentage >= 10) {
          matches.push({
            documentId: existingDoc._id || existingDoc.id,
            documentName: existingDoc.filename || existingDoc.name || 'Unknown Document',
            uploadedBy: existingDoc.uploadedBy || null,
            similarityPercentage: similarityPercentage,
            similarityScore: similarity
          });

          // Track highest similarity
          if (similarity > highestSimilarity) {
            highestSimilarity = similarity;
            mostSimilarDocument = existingDoc;
          }
        }
      }

      // Sort matches by similarity (highest first)
      matches.sort((a, b) => b.similarityPercentage - a.similarityPercentage);

      // Determine status based on highest similarity
      let status = 'clear';
      if (highestSimilarity >= 0.75) {
        status = 'high_similarity'; // 75%+ indicates potential plagiarism
      } else if (highestSimilarity >= 0.50) {
        status = 'moderate_similarity'; // 50-74% requires review
      } else if (highestSimilarity >= 0.25) {
        status = 'low_similarity'; // 25-49% slight overlap
      }

      return {
        status,
        message: this.getStatusMessage(status, Math.round(highestSimilarity * 100)),
        similarityPercentage: Math.round(highestSimilarity * 100),
        highestSimilarityScore: highestSimilarity,
        totalDocumentsChecked: existingDocuments.length,
        matches: matches.slice(0, 10), // Return top 10 matches
        mostSimilarDocument: mostSimilarDocument ? {
          id: mostSimilarDocument._id || mostSimilarDocument.id,
          name: mostSimilarDocument.filename || mostSimilarDocument.name,
          similarityPercentage: Math.round(highestSimilarity * 100)
        } : null
      };
    } catch (error) {
      console.error('Error comparing document:', error);
      return {
        status: 'error',
        message: 'An error occurred during plagiarism check',
        error: error.message,
        similarityPercentage: 0,
        matches: []
      };
    }
  }

  /**
   * Get user-friendly status message
   * @param {String} status - Status code
   * @param {Number} percentage - Similarity percentage
   * @returns {String} - Human-readable message
   */
  static getStatusMessage(status, percentage) {
    switch (status) {
      case 'high_similarity':
        return `High similarity detected (${percentage}%). This document may contain plagiarized content.`;
      case 'moderate_similarity':
        return `Moderate similarity detected (${percentage}%). Manual review recommended.`;
      case 'low_similarity':
        return `Low similarity detected (${percentage}%). Some common phrases found.`;
      case 'clear':
        return `Document appears original (${percentage}% similarity). No significant matches found.`;
      case 'insufficient_content':
        return 'Document has insufficient content for accurate analysis.';
      default:
        return 'Plagiarism check completed.';
    }
  }

  /**
   * Generate a detailed similarity report
   * @param {Object} comparisonResult - Result from compareDocument
   * @returns {Object} - Detailed report with interpretation
   */
  static generateReport(comparisonResult) {
    const { status, similarityPercentage, matches } = comparisonResult;

    return {
      summary: {
        status,
        similarityPercentage: `${similarityPercentage}%`,
        interpretation: this.getInterpretation(status),
        recommendation: this.getRecommendation(status)
      },
      details: {
        totalMatches: matches.length,
        topMatches: matches.slice(0, 5),
        disclaimer: 'This is a basic plagiarism check using text similarity algorithms. It may produce false positives for common phrases, quotes, or properly cited material. For accurate academic plagiarism detection, use specialized tools like Turnitin or iThenticate.'
      }
    };
  }

  /**
   * Get interpretation of similarity status
   * @param {String} status - Status code
   * @returns {String} - Interpretation text
   */
  static getInterpretation(status) {
    const interpretations = {
      'high_similarity': 'Significant portions of this document match existing content. This requires immediate attention.',
      'moderate_similarity': 'Notable similarities found. Review the matches to ensure proper attribution and originality.',
      'low_similarity': 'Minor similarities detected, likely common terminology or phrases in the field.',
      'clear': 'Document appears to be original with no significant matches to existing documents.'
    };
    return interpretations[status] || 'Analysis completed.';
  }

  /**
   * Get recommendation based on status
   * @param {String} status - Status code
   * @returns {String} - Recommendation text
   */
  static getRecommendation(status) {
    const recommendations = {
      'high_similarity': 'Do not approve this submission. Contact the author for clarification.',
      'moderate_similarity': 'Manual review required. Check if similarities are from proper citations or references.',
      'low_similarity': 'Document can proceed with standard review process.',
      'clear': 'No action needed. Document passes basic plagiarism screening.'
    };
    return recommendations[status] || 'Review the report details.';
  }
}

module.exports = PlagiarismChecker;
