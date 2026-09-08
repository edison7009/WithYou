export type Pose = 'sit' | 'read' | 'lie' | 'stretch';

export type LakeSettings = {
  pose: Pose;
  agentBusy: boolean;
  companions: boolean;
  lowPower: boolean;
};

export type Companion = {
  id: string;
  name: string;
  color: string;
  x: number;
  z: number;
  pose: Pose;
  busy: boolean;
};

export const companions: Companion[] = [
  { id: 'you', name: '你', color: '#e1a854', x: 0, z: 4.5, pose: 'sit', busy: true },
  { id: 'lin', name: 'Lin', color: '#a3bdad', x: -5.4, z: 3.4, pose: 'read', busy: true },
  { id: 'mika', name: 'Mika', color: '#d08f7e', x: 5.5, z: 4.7, pose: 'sit', busy: false },
  { id: 'noah', name: 'Noah', color: '#94a6bd', x: -11, z: 2.5, pose: 'lie', busy: true },
  { id: 'yuki', name: 'Yuki', color: '#c1afcd', x: 11.8, z: 4.6, pose: 'read', busy: true },
];

export const poseLabels: Record<Pose, string> = {
  sit: '看湖', read: '阅读', lie: '躺一会儿', stretch: '伸个懒腰',
};
