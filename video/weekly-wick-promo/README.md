# Weekly Wick 홍보 영상 (9:16, 30초)

- `index.html`: 장면. `window.DURATION`, `async window.seek(t)`를 노출하며 모든 프레임이 시간 t의 순수 함수입니다.
- `lib/rig.mjs`, `lib/drafts.mjs`: wick-studio의 실제 캐릭터 리그(Candle Buddy) 복사본.
- `fonts/`: Inter(OFL, wick-studio와 동일), Pretendard(OFL, 한글).

```bash
node scripts/render.mjs stills        # out/stills/*.png + out/contact.png
node scripts/render.mjs video         # out/weekly-wick-promo.mp4 (승인 후)
```
