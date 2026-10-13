# Icone do jogo

Espada atravessada sobre a moeda de ouro, com a moeda vermelha no canto, numa
placa de couro com moldura de bronze. As cores sao as de `src/shared/colors.ts`.

- `icon.svg`: o icone, com cantos arredondados e moldura. Vira
  `public/icon.png` (512) e `public/icon-192.png`
- `icon-maskable.svg`: fundo ate a borda e o desenho nos 70% do meio, para o
  sistema recortar no formato dele (Android). Vira `public/icon-maskable.png`

## Gerar os PNG de novo

No macOS, sem instalar nada:

```bash
cd scripts/icon
qlmanage -t -s 512 -o /tmp icon.svg icon-maskable.svg
cp /tmp/icon.svg.png ../../public/icon.png
cp /tmp/icon-maskable.svg.png ../../public/icon-maskable.png
sips -z 192 192 ../../public/icon.png --out ../../public/icon-192.png
```

Qualquer conversor de SVG para PNG serve no lugar do `qlmanage`.
