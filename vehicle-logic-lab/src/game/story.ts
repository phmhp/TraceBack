import { emptySave, loadSave, fingerprint } from '../progress/storage.ts'
import { MISSIONS } from '../content/ready.ts'
import { verify, rating } from '../engine/verification.ts'
import type { Save, StoragePort } from '../progress/storage.ts'
import type { TestResult } from '../engine/types.ts'
export const STORY_KEY = 'vehicle-logic-lab.story.v3'
export const SCENES = ['title','intro','arrival','garage','observe','inside','build','test','reward','map'] as const
export type Scene = typeof SCENES[number]
export interface Story {
  version: 3; lab: Save; scene: Scene; mission: number; lesson: number;
  stickers: string[]; evidence: { mission: string; design: string; order: number; results: TestResult[] }[];
  volume: number; reducedMotion: boolean
}
export function newStory(): Story { return { version: 3, lab: emptySave(), scene: 'intro', mission: 0, lesson: 0, stickers: [], evidence: [], volume: .25, reducedMotion: false } }
export function readStory(storage: StoragePort): { story?: Story; warning?: string } {
  try {
    const raw = storage.getItem(STORY_KEY)
    if (!raw) return {}
    const story = JSON.parse(raw) as Story
    if (story.version !== 3 || !SCENES.includes(story.scene) || !Number.isInteger(story.mission) || story.mission < 0 || story.mission > 2 || !Number.isInteger(story.lesson) || story.lesson < 0 || story.lesson > 3 || !Array.isArray(story.stickers) || !Array.isArray(story.evidence)) throw new Error('shape')
    const lab = loadSave({ getItem: () => JSON.stringify(story.lab), setItem: () => {} })
    if (lab.warning) throw new Error('lab')
    story.lab = lab.save
    for (const m of MISSIONS) {
      const graph = story.lab.graphs[m.id]
      story.lab.grades[m.id] = graph && story.lab.verified[m.id] === fingerprint(graph) ? rating(verify(graph, m)) : 0
    }
    story.stickers = story.stickers.filter(id => (story.lab.grades[id] ?? 0) >= 2)
    const firstLocked = MISSIONS.findIndex(m => (story.lab.grades[m.id] ?? 0) < 2)
    if (firstLocked >= 0 && story.mission > firstLocked) { story.mission = firstLocked; story.lesson = 0; story.scene = 'garage' }
    if (story.scene === 'reward' && (story.lab.grades[MISSIONS[story.mission].id] ?? 0) < 2) story.scene = 'build'
    story.volume = Number.isFinite(story.volume) ? Math.max(0, Math.min(.6, story.volume)) : .25
    story.reducedMotion = story.reducedMotion === true
    return { story }
  } catch { return { warning: '이전 기록을 읽지 못했어요. 기존 기록은 그대로 두었어요. 새 모험을 시작하면 새 기록을 저장합니다.' } }
}
export function award(story: Story, results: TestResult[]): Story {
  const mission = MISSIONS[story.mission], graph = story.lab.graphs[mission.id]
  // Re-run the official suite, not a caller-supplied PASS flag or prediction.
  const official = verify(graph, mission)
  const grade = rating(official)
  const evidence = [...story.evidence, { mission: mission.id, design: fingerprint(graph), order: story.evidence.length + 1, results: official }].slice(-12)
  if (grade < 2 || results.length !== official.length) return { ...story, evidence, scene: 'test' }
  return { ...story, scene: 'reward', evidence,
    stickers: [...new Set([...story.stickers, mission.id])],
    lab: { ...story.lab, grades: { ...story.lab.grades, [mission.id]: grade }, verified: { ...story.lab.verified, [mission.id]: fingerprint(graph) } },
  }
}
