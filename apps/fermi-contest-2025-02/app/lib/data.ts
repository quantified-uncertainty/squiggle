import fs from 'fs';
import path from 'path';
import { Submission, SubmissionEvaluation } from '../../src/evaluator';

// Helper function to read submissions data
export async function getSubmissions(): Promise<Submission[]> {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'submissions.json');
    const fileExists = fs.existsSync(dataPath);
    
    if (!fileExists) {
      return [];
    }
    
    const data = await fs.promises.readFile(dataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading submissions:', error);
    return [];
  }
}

// Helper function to read evaluation results data
export async function getEvaluationResults(): Promise<SubmissionEvaluation[]> {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'evaluation-results.json');
    const fileExists = fs.existsSync(dataPath);
    
    if (!fileExists) {
      return [];
    }
    
    const data = await fs.promises.readFile(dataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading evaluation results:', error);
    return [];
  }
}

// Helper function to read evaluation report markdown
export async function getEvaluationReport(): Promise<string> {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'evaluation-report.md');
    const fileExists = fs.existsSync(dataPath);
    
    if (!fileExists) {
      return 'No evaluation report available yet.';
    }
    
    const data = await fs.promises.readFile(dataPath, 'utf8');
    return data;
  } catch (error) {
    console.error('Error reading evaluation report:', error);
    return 'Error loading evaluation report.';
  }
}

// Get a single submission by ID
export async function getSubmissionById(id: string): Promise<Submission | null> {
  const submissions = await getSubmissions();
  return submissions.find(submission => submission.id === id) || null;
}

// Get evaluation results for a single submission by ID
export async function getEvaluationById(id: string): Promise<SubmissionEvaluation | null> {
  const results = await getEvaluationResults();
  return results.find(result => result.submissionId === id) || null;
}