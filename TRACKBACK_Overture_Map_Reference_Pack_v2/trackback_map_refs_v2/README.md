# TRACKBACK Map Reference Pack v2

이 팩은 실제 도로/도시 공간의 **배치·밀도·스케일·도로변 구성**을 참고하기 위한 링크 모음입니다.
이미지를 그대로 복제하기보다, TRACKBACK의 low-poly / rounded 스타일로 재해석하세요.

## 핵심 레퍼런스 그룹

### A. 판교 제2테크노밸리 / 판교 테크노밸리
1. 판교 제2테크노밸리 항공 전경 (성남시 비전성남)
   - https://snvision.seongnam.go.kr/imgdata/snvision/202310/2023100502174595.jpg
   - 참고 포인트: 경부고속도로, 업무시설 군집, 주변 산지/아파트, 연결교량

2. 판교 제2테크노밸리 글로벌비즈센터 (HAEAHN)
   - https://m.haeahn.com/upload/prjctmain/20240110102810834663.jpg
   - 참고 포인트: 도로 폭, 보도, 가로수, 업무시설 파사드 밀도

3. 판교 테크노밸리 항공 전경 (판교TV 공식)
   - https://www.pangyotechnovalley.org/storage/data/upload/20210511/112f60733f6d9abf71e1be0e2e5e0bba.jpg
   - 참고 포인트: 도로-수변-업무시설-고속도로의 레이어

4. 판교 테크노밸리 항공 전경 (전자신문)
   - https://img.etnews.com/photonews/2007/1316716_20200703143005_063_0001.jpg
   - 참고 포인트: 업무지구와 아파트/산지의 원경 스케일

5. 판교 테크노밸리 전경 (아시아경제)
   - https://cphoto.asiae.co.kr/listimglink/1/2021120709103151132_1638835832.jpg
   - 참고 포인트: 고속도로 인터체인지, 업무시설 군집, 녹지와 도시 밀도

6. 판교 아이스퀘어 항공 조감 (아시아경제)
   - https://cphoto.asiae.co.kr/listimglink/1/2021042310153894653_1619140538.jpg
   - 참고 포인트: 복합 업무시설, 보행 브리지, 블록형 배치

7. 판교 테크노밸리 도로 전경 (Mindtrip)
   - https://images.mindtrip.ai/attractions/5bb8/8f53/17be/de17/58b6/f7d5/eef8/d9a6
   - 참고 포인트: 다차선 도로, 중앙 분리, 보행로, 업무시설 배치

8. 판교 도심 도로 전경 (Daum/Brunch)
   - https://img1.daumcdn.net/thumb/R1280x0.fpng/?fname=http%3A%2F%2Ft1.daumcdn.net%2Fbrunch%2Fservice%2Fuser%2F4qUB%2Fimage%2FeZc66ys8ff-ZxFjfilH63ghkqGw.png
   - 참고 포인트: 업무/주거 혼합, 도로표지, 큰 건물과 도로의 근접 배치

### B. 아파트 / 신도시 도로
9. 아파트 대로 전경 (Unsplash)
   - https://images.unsplash.com/photo-1651238216495-50bdd8eecc06?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080
   - 참고 포인트: 도로-가로수-아파트 스케일

10. 위례 신도시 도로 (이코노미조선)
    - https://economychosun.com/site/data/img_dir/2018/07/21/2018072100030_0.jpg
    - 참고 포인트: 넓은 도로, 가로수, 아파트 군집

11. 아파트와 곡선 고가도로 (매일경제/Daum)
    - https://img2.daumcdn.net/thumb/R658x0.q70/?fname=https%3A%2F%2Ft1.daumcdn.net%2Fnews%2F202506%2F03%2Fmk%2F20250603061803477kydz.jpg
    - 참고 포인트: 도로 곡률, 가드레일, 고층 주거 스카이라인

### C. 산길 / 가드레일 / 비도심
12. 산길 가드레일 (금동강건)
    - https://www.kdkk.co.kr/data/file/04_02/thumb-991739153_nYWzFbCc_ad823ca78c84984a9b034c4e3424000fc6da3b4f_800x600.jpg
    - 참고 포인트: 곡선 도로, 산비탈, 가드레일, 노면 마킹

13. 농촌/산길 곡선 도로 (금동강건)
    - https://www.kdkk.co.kr/data/file/cn_04_04/1890405671_Zy6C45To_6.jpg
    - 참고 포인트: 좁은 도로, 수목 밀도, 도로변 안전시설

## 판교 제2테크노밸리 Overture 시작점

OSM 기반 공개 지도에서 제2판교테크노밸리 중심점은 대략:
- latitude: 37.40618
- longitude: 127.08709

초기 샘플용 bbox(정확한 공식 경계가 아니라 Import 테스트용):
- west: 127.076
- south: 37.398
- east: 127.098
- north: 37.415

이 범위는 판교 제2테크노밸리와 인접 도로/고속도로/업무시설을 함께 가져오기 위한 시작값입니다.
실제 구현 전 Overture Explorer에서 범위를 시각적으로 확인하고 조정하세요.

## 사용 원칙
- 이미지 자체는 UI/Texture로 직접 사용하지 말고 공간 구성 참고용으로 사용
- Overture/OSM 데이터는 라이선스/attribution 요구사항 준수
- 실제 도로/건물 Geometry는 Local Game Data로 변환 후 사용
- TRACKBACK의 Signal/Requirement/Fault Logic과 실제 지도 데이터는 분리
