/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EducationModule, EmergencyPlan, Alert } from './types';

export const DISASTER_MODULES: EducationModule[] = [
  {
    id: 'quake-101',
    title: 'Earthquake Safety & Structural Awareness',
    type: 'Earthquake',
    description: 'Learn the life-saving Drop, Cover, and Hold method and how to identify safe zones in a building.',
    content: 'An earthquake is the shaking of the surface of the Earth resulting from a sudden release of energy in the Earth\'s lithosphere that creates seismic waves.',
    steps: [
      'DROP where you are, onto your hands and knees.',
      'COVER your head and neck with your arms.',
      'HOLD ON to your shelter until the shaking stops.',
      'Move away from windows and glass.',
      'Do not use elevators during an quake.'
    ],
    icon: 'Activity'
  },
  {
    id: 'flood-101',
    title: 'Flood Preparedness & Escape Routes',
    type: 'Flood',
    description: 'Understanding flash floods and secondary hazards. Learn how to reach high ground safely.',
    content: 'Flooding is an overflowing of water onto land that is normally dry. Floods can happen during heavy rains, when ocean waves come on shore, when snow melts quickly, or when dams or levees break.',
    steps: [
      'Move to high ground immediately.',
      'Do not walk, swim or drive through flood waters.',
      'Stay off bridges over fast-moving water.',
      'Evacuate if told to do so.',
      'Listen to local alerts.'
    ],
    icon: 'Waves'
  },
  {
    id: 'fire-101',
    title: 'Fire Safety & Evacuation Drills',
    type: 'Fire',
    description: 'Essential knowledge on fire extinguishers, smoke alarms, and building evacuation protocols.',
    content: 'Fire safety is the set of practices intended to reduce the destruction caused by fire. Fire safety measures include those that are intended to prevent ignition of an uncontrolled fire, and those that are used to limit the development and effects of a fire after it starts.',
    steps: [
      'Pull the fire alarm pull station on your way out.',
      'Get out and stay out; never go back inside for anything.',
      'If smoke is present, stay low to the ground.',
      'Use stairs; do not use elevators.',
      'Meet at the designated assembly point.'
    ],
    icon: 'Flame'
  }
];

export const INITIAL_ALERTS: Alert[] = [
  {
    id: 'a1',
    type: 'DRILL',
    title: 'Scheduled Fire Drill',
    message: 'A fire drill will be conducted today at 2:00 PM. Please follow your building\'s evacuation plan.',
    timestamp: new Date().toISOString(),
    sender: 'System Administrator'
  },
  {
    id: 'a2',
    type: 'INFO',
    title: 'New Training Available',
    message: 'The "Chemical Spill Response" module has been added to the curriculum.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    sender: 'Academic Affairs'
  }
];

export const EMERGENCY_PLANS: EmergencyPlan[] = [
  {
    id: 'plan-main-fire',
    title: 'Main Campus Fire Response Plan',
    disasterType: 'Fire',
    lastUpdated: '2026-03-15',
    steps: [
      'Activate fire alarm.',
      'Evacuate via North and South stairwells.',
      'Assemble at the sports field.',
      'Roll call by department heads.',
      'Wait for Fire Department clearance.'
    ],
    assignedRoles: [
      { role: 'Security', action: 'Direct traffic and clear corridors.' },
      { role: 'Faculty', action: 'Lead students to assembly point and account for all individuals.' },
      { role: 'Nurses', action: 'Set up first-aid station at the assembly point.' }
    ]
  }
];
