/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for merging tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  institution: string;
}

export type DisasterType = 'Earthquake' | 'Flood' | 'Fire' | 'Chemical Spill' | 'Custom';

export interface EducationModule {
  id: string;
  title: string;
  type: DisasterType;
  description: string;
  content: string;
  steps: string[];
  quizId?: string;
  icon: string;
}

export interface Quiz {
  id: string;
  moduleId: string;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

export interface EmergencyPlan {
  id: string;
  title: string;
  disasterType: DisasterType;
  lastUpdated: string;
  steps: string[];
  assignedRoles: {
    role: string;
    action: string;
  }[];
}

export interface Alert {
  id: string;
  type: 'INFO' | 'WARNING' | 'CRITICAL' | 'DRILL';
  title: string;
  message: string;
  timestamp: string;
  sender: string;
}

export interface ParticipationRecord {
  userId: string;
  moduleId: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED';
  score?: number;
  completedAt?: string;
}
