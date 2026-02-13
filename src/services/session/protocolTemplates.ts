import { ProtocolTemplate, BodyArea } from '../../models/Session';

const PROTOCOLS: ProtocolTemplate[] = [
  {
    id: 'pain_relief',
    name: 'Pain Relief',
    description: 'Gentle pain relief protocol for chronic pain management',
    bodyArea: 'lower_back',
    duration: 20,
    intensity: 5,
    mode: 'guided',
    category: 'pain_relief',
  },
  {
    id: 'recovery',
    name: 'Recovery',
    description: 'Post-exercise recovery protocol for muscle soreness',
    bodyArea: 'lower_back',
    duration: 30,
    intensity: 6,
    mode: 'guided',
    category: 'recovery',
  },
  {
    id: 'acute_injury',
    name: 'Acute Injury',
    description: 'Short low-intensity protocol for acute injuries',
    bodyArea: 'knee_left',
    duration: 15,
    intensity: 4,
    mode: 'guided',
    category: 'acute_injury',
  },
  {
    id: 'performance',
    name: 'Performance Boost',
    description: 'Pre-workout activation protocol',
    bodyArea: 'lower_back',
    duration: 15,
    intensity: 7,
    mode: 'guided',
    category: 'performance',
  },
  {
    id: 'relaxation',
    name: 'Relaxation',
    description: 'Calming relaxation protocol for stress relief',
    bodyArea: 'neck',
    duration: 25,
    intensity: 3,
    mode: 'guided',
    category: 'relaxation',
  },
];

export function getProtocols(bodyArea?: BodyArea): ProtocolTemplate[] {
  if (bodyArea) {
    return PROTOCOLS.filter((p) => p.bodyArea === bodyArea);
  }
  return PROTOCOLS;
}

export function getProtocolById(id: string): ProtocolTemplate | undefined {
  return PROTOCOLS.find((p) => p.id === id);
}

export function getAllProtocols(): ProtocolTemplate[] {
  return PROTOCOLS;
}
