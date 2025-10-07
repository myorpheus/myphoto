#!/usr/bin/env node

/**
 * Gemini API Client for Large Codebase Analysis
 * Using @google/generative-ai SDK with custom Google Cloud project
 */

import fs from 'fs';
import path from 'path';

// Validate environment variables
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

// Initialize Gemini API
let GoogleGenerativeAI, HarmCategory, HarmBlockThreshold;
let genAI;

async function initializeGemini() {
  try {
    const generativeAI = await import('@google/generative-ai');
    ({ GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = generativeAI);
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  } catch (error) {
    console.error('❌ Failed to import @google/generative-ai. Install with: npm install @google/generative-ai');
    console.error(error.message);
    process.exit(1);
  }
}

// Model configuration for prompt enhancement
function getModel() {
  return genAI.getGenerativeModel({ 
  model: "gemini-2.0-flash-exp",
  generationConfig: {
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 2048,
  },
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ],
  });
}

/**
 * Process file inclusion syntax (@file, @dir/)
 */
function processFileInclusions(prompt) {
  const includePattern = /@([^\s]+)/g;
  let matches = prompt.match(includePattern);
  let processedPrompt = prompt;
  let includedContent = '';
  
  if (matches) {
    matches.forEach(match => {
      const filePath = match.substring(1); // Remove @ prefix
      
      try {
        if (fs.statSync(filePath).isDirectory()) {
          // Include directory contents
          const files = getAllFiles(filePath);
          files.forEach(file => {
            if (shouldIncludeFile(file)) {
              const content = fs.readFileSync(file, 'utf8');
              includedContent += `\n\n--- ${file} ---\n${content}`;
            }
          });
        } else if (fs.existsSync(filePath)) {
          // Include single file
          const content = fs.readFileSync(filePath, 'utf8');
          includedContent += `\n\n--- ${filePath} ---\n${content}`;
        } else {
          console.warn(`⚠️  File not found: ${filePath}`);
        }
      } catch (error) {
        console.warn(`⚠️  Error reading ${filePath}: ${error.message}`);
      }
      
      // Remove the @file reference from the prompt
      processedPrompt = processedPrompt.replace(match, '');
    });
  }
  
  return {
    prompt: processedPrompt.trim(),
    content: includedContent
  };
}

/**
 * Get all files recursively from directory
 */
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!shouldIgnoreDirectory(file)) {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      arrayOfFiles.push(fullPath);
    }
  });
  
  return arrayOfFiles;
}

/**
 * Check if file should be included
 */
function shouldIncludeFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const ignoredExts = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.pdf', '.zip', '.tar', '.gz'];
  const ignoredFiles = ['package-lock.json', 'yarn.lock', '.DS_Store'];
  const fileName = path.basename(filePath);
  
  return !ignoredExts.includes(ext) && !ignoredFiles.includes(fileName);
}

/**
 * Check if directory should be ignored
 */
function shouldIgnoreDirectory(dirName) {
  const ignoredDirs = ['node_modules', '.git', '.next', 'dist', 'build', '.cache', 'coverage'];
  return ignoredDirs.includes(dirName);
}

/**
 * Enhance a prompt for AI image generation
 */
async function enhancePrompt(originalPrompt, style = 'professional', gender = 'man') {
  try {
    const model = getModel();
    const enhancementPrompt = `You are an expert at creating highly detailed and effective prompts for AI image generation systems. 

Your task is to enhance the following basic prompt for generating professional headshots using the Astria AI platform.

Original prompt: "${originalPrompt}"
Style: ${style}
Gender: ${gender}

Please create an enhanced, detailed prompt that includes:
1. Specific technical photography details (lighting, camera settings, composition)
2. Style-appropriate details for ${style} photography
3. Professional quality indicators
4. Gender-appropriate styling if relevant
5. Background and setting details
6. Quality and resolution specifications

Guidelines:
- For professional/corporate: Focus on business attire, clean backgrounds, confident poses
- For doctor/medical: Include medical professional elements, clean white coat if appropriate
- For boudoir: Tasteful artistic approach with appropriate styling for ${gender}
- Always maintain professional quality and avoid explicit content
- Include technical photography terms for best AI generation results

Provide only the enhanced prompt, no explanation or additional text.`;

    const result = await model.generateContent(enhancementPrompt);
    const response = await result.response;
    const enhancedPrompt = response.text().trim();
    
    return enhancedPrompt;
  } catch (error) {
    console.error('❌ Error enhancing prompt:', error.message);
    return originalPrompt; // Fallback to original prompt
  }
}

/**
 * Main CLI function
 */
async function main() {
  await initializeGemini();
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log(`
Usage: 
  node gemini-api-client.js "<prompt>"
  node gemini-api-client.js "@file.js <prompt>"
  node gemini-api-client.js "@src/ <prompt>"

Examples:
  node gemini-api-client.js "Analyze this codebase"
  node gemini-api-client.js "@src/App.tsx Explain this component"
  node gemini-api-client.js "@src/ Find all React hooks"
  
Environment Variables Required:
  GEMINI_API_KEY - Your Google AI API key
  GOOGLE_CLOUD_PROJECT - Your Google Cloud project ID (optional)
`);
    process.exit(0);
  }

  const userPrompt = args.join(' ');
  
  try {
    console.log('🔍 Processing request...');
    
    // Check if this is a prompt enhancement request
    if (userPrompt.includes('enhance_prompt:')) {
      const parts = userPrompt.split('enhance_prompt:')[1].split('|');
      const originalPrompt = parts[0]?.trim();
      const style = parts[1]?.trim() || 'professional';
      const gender = parts[2]?.trim() || 'man';
      
      const enhanced = await enhancePrompt(originalPrompt, style, gender);
      console.log('✨ Enhanced Prompt:');
      console.log(enhanced);
      return;
    }
    
    // Process file inclusions
    const { prompt, content } = processFileInclusions(userPrompt);
    const fullPrompt = content ? `${content}\n\n${prompt}` : prompt;
    
    // Track usage
    const startTime = Date.now();
    const inputLength = fullPrompt.length;
    
    console.log(`📊 Input size: ${inputLength} characters`);
    
    // Generate content
    const model = getModel();
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    
    // Calculate usage stats
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    const outputLength = text.length;
    
    console.log(`\n${text}`);
    console.log(`\n📊 Usage Stats:`);
    console.log(`   Duration: ${duration}s`);
    console.log(`   Input: ${inputLength} chars`);
    console.log(`   Output: ${outputLength} chars`);
    console.log(`   Model: gemini-2.0-flash-exp`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Export functions for ES modules
export { enhancePrompt };

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}