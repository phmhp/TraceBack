# 고장원인 조사실 학습 설계 근거

## 적용한 학습 원칙

| 연구 근거 | 조사실 적용 |
|---|---|
| 초보자에게 자유 탐색만 주면 작업기억이 문제 해결 절차에 소모될 수 있으며, 초기에는 worked example과 단계적 guidance가 유리하다. 숙련도가 오르면 guidance를 줄여야 한다. | 첫 사건은 4개 장면을 시스템이 순서대로 나누고, 전문 도구는 두 번째 레이어로 둔다. 이후 난이도에서는 안내 문구와 선택지를 줄일 수 있는 구조로 만든다. |
| 절차 학습에서 시스템이 핵심 단계마다 구간을 나누는 방식은 단순 pause control만 주는 것보다 인지부하를 낮추고 절차 구조 파악을 도왔다. | 한 화면에서 메모·아키텍처·시험·보고서를 동시에 보여주지 않고 `사건 → 경계 → 시험 → 결론`으로 구간을 고정한다. |
| 반복해서 읽는 것보다 정보를 직접 회상하고 답을 산출하는 retrieval practice가 지연 회상에 유리했다. | 단서를 연 직후 정답 설명을 보여주지 않고, 먼저 “확실히 말할 수 있는 것”을 선택하게 한다. |
| 좋은 학습자는 worked example의 각 단계가 왜 필요한지 self-explanation을 더 많이 생성했다. | 시험 결과를 본 뒤 `FAIL`을 클릭해 끝내지 않고, 두 결과가 어떤 가설을 왜 지지하는지 설명해야 시험 단서가 저장된다. |
| 진단 추론은 단서 획득, 가설 생성, 증거 평가, 결론의 순환이며 초보자는 초기 가설에 맞지 않는 증거를 무시하기 쉽다. | 정상 근거와 이상 근거를 모두 확보해야 다음 단계가 열린다. 전체 아키텍처를 계속 보이며 한 후보만 조기에 확정하지 못하게 한다. |
| 문제를 먼저 시도하고 이후 설명을 받는 productive failure는 전이 학습을 도울 수 있지만, 문제 범위와 후속 설명이 설계되어야 한다. | 오답을 즉시 game over로 만들지 않고 왜 현재 근거로 확정할 수 없는지 짧게 알려준 뒤 다시 선택하게 한다. |

## 화면 구조

1. **사건 메모** — 메모 4장을 한 번에 한 장만 열고, 현상과 원인을 구분한다.
2. **기능 경계** — 전체 차량 기능 흐름을 고정 표시하고, 인접한 두 경계만 확대해 정상/이상을 찾는다.
3. **구분 시험** — 결과를 보기 전에 예측하고, 조건을 고정한 채 입력만 바꾼다. 결과를 설명해야 증거가 된다.
4. **사건 보고서** — 플레이어가 직접 모은 근거만 놓고 원인 위치와 유형을 선택한 뒤 수리안을 결정한다.

기존 Signal, Interface, Requirement, Test Bench 화면은 삭제하지 않는다. 기본 카드 덱의 `전문 도구 열기`를 통해 접근하는 두 번째 레이어다.

## 참고 연구

- Karpicke, J. D., & Roediger, H. L. (2008). [The Critical Importance of Retrieval for Learning](https://doi.org/10.1126/science.1152408).
- Chi, M. T. H. et al. (1989). [Self-Explanations: How Students Study and Use Examples in Learning to Solve Problems](https://doi.org/10.1207/s15516709cog1302_1).
- Renkl, A., Atkinson, R. K., & Große, C. S. (2004). [How Fading Worked Solution Steps Works](https://doi.org/10.1023/B:TRUC.0000021815.74806.F6).
- Biard, N., Cojean, S., & Jamet, E. (2018). [Effects of segmentation and pacing on procedural learning by video](https://doi.org/10.1016/j.chb.2017.12.002).
- Arocha, J. F., Patel, V. L., & Patel, Y. C. (1993). [Hypothesis Generation and the Coordination of Theory and Evidence in Novice Diagnostic Reasoning](https://doi.org/10.1177/0272989X9301300305).
- Kapur, M. (2008). [Productive Failure](https://doi.org/10.1080/07370000802212669).
